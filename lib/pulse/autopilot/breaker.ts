import { read, write } from "@/lib/store";

/**
 * Circuit breakers.
 *
 * The prototype tells this story as a warning: a config change at 08:58 made a
 * rule fire 41 times in an hour when normal was four, and the breaker caught it
 * at 09:02. A runaway automation that writes to 400 customers is the failure
 * mode that ends trust permanently — not a bug anyone forgives.
 *
 * So this does not warn. It **stops**, and it stays stopped until a person
 * looks at it. Reporting a runaway while continuing to run is the same as not
 * having a breaker.
 *
 * A tripped breaker is stored as a policy row, which means it survives a
 * restart, appears in the decision log with everything else, and can only be
 * cleared deliberately.
 */

/** Decisions per hour, per agent, above which something is wrong. */
const LIMITS: Record<string, number> = {
  "signup-triage": 60,
  "outreach-drafter": 40,
  "account-review": 300,
  "portfolio-digest": 12,
};

const DEFAULT_LIMIT = 60;

export type BreakerState = {
  agent: string;
  tripped: boolean;
  reason: string | null;
  at: string | null;
  count: number;
  limit: number;
};

const key = (agent: string) => `breaker.${agent}`;

const parse = (v: unknown): Record<string, unknown> => {
  if (v == null) return {};
  if (typeof v === "string") {
    try {
      return JSON.parse(v) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  return v as Record<string, unknown>;
};

/**
 * May this agent run?
 *
 * Checked before the work, not after: a breaker that trips on the way out has
 * already let the damage through.
 */
export async function check(agent: string): Promise<BreakerState> {
  const limit = LIMITS[agent] ?? DEFAULT_LIMIT;

  const rows = await read<{ body: unknown }>(
    `SELECT body FROM pulse_policy WHERE policy_key = ? AND state = 'active'`,
    [key(agent)],
  );
  const stored = rows[0] ? parse(rows[0].body) : {};
  if (stored.tripped) {
    return {
      agent,
      tripped: true,
      reason: (stored.reason as string) ?? "tripped",
      at: (stored.at as string) ?? null,
      count: Number(stored.count ?? 0),
      limit,
    };
  }

  // Count only what happened *since the last reset*. Without this, clearing a
  // breaker while the burst is still inside the hour window re-trips it
  // immediately, and the person who just looked at it cannot get any work done.
  // Acknowledging a burst means it stops counting against you.
  const since = (stored.reset_at as string) ?? null;
  const counted = since
    ? await read<{ n: number }>(
        `SELECT COUNT(*) n FROM pulse_decision
          WHERE agent = ? AND at >= DATE_SUB(NOW(), INTERVAL 1 HOUR) AND at > ?`,
        [agent, since],
      )
    : await read<{ n: number }>(
        `SELECT COUNT(*) n FROM pulse_decision
          WHERE agent = ? AND at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)`,
        [agent],
      );
  const count = Number(counted[0]?.n ?? 0);

  if (count >= limit) {
    const reason = `${count} decisions in an hour, against a limit of ${limit}`;
    await trip(agent, reason, count);
    return { agent, tripped: true, reason, at: new Date().toISOString(), count, limit };
  }

  return { agent, tripped: false, reason: null, at: null, count, limit };
}

/**
 * Stop an agent, and record it where a person will see it.
 *
 * The decision row matters as much as the stop: a system that silently refuses
 * to work looks broken, and someone will spend an afternoon finding out why.
 */
export async function trip(agent: string, reason: string, count: number): Promise<void> {
  await write(
    `INSERT INTO pulse_policy (version, policy_key, kind, body, note, state, source)
     VALUES ('v1', ?, 'switch', ?, ?, 'active', 'learned')
     ON DUPLICATE KEY UPDATE body = VALUES(body), note = VALUES(note), state = 'active'`,
    [
      key(agent),
      JSON.stringify({ tripped: true, reason, count, at: new Date().toISOString() }),
      `tripped automatically: ${reason}`,
    ],
  );

  await write(
    `INSERT INTO pulse_decision
       (signal_key, agent, input_digest, verdict, action_taken, held, hold_reason, error_code)
     VALUES (?, 'system', SHA2(?, 256), 'stopped', 'agent paused itself', 1, ?, 'CIRCUIT_BREAKER')
     ON DUPLICATE KEY UPDATE at = NOW(), hold_reason = VALUES(hold_reason)`,
    [`breaker:${agent}:${new Date().toISOString().slice(0, 13)}`, `breaker:${agent}`, reason.slice(0, 120)],
  );
}

/**
 * Let it run again.
 *
 * Deliberate and attributed. A breaker that resets itself after an hour would
 * let the same runaway through twelve times a day, and nobody would learn what
 * caused it.
 */
export async function reset(agent: string, actor: string): Promise<boolean> {
  const res = await write(
    `UPDATE pulse_policy
        SET body = JSON_OBJECT('tripped', false, 'reset_at', NOW(), 'reset_by', ?), note = ?
      WHERE policy_key = ? AND state = 'active'`,
    [actor, `reset by ${actor}`, key(agent)],
  );
  if (res.affectedRows) {
    await write(
      `INSERT INTO pulse_decision
         (signal_key, agent, input_digest, verdict, action_taken, actor_admin_id, acted_at)
       VALUES (?, 'human', SHA2(?, 256), 'resumed', 'a person cleared the breaker', ?, NOW())
       ON DUPLICATE KEY UPDATE acted_at = NOW(), actor_admin_id = VALUES(actor_admin_id)`,
      [`breaker-reset:${agent}:${Date.now()}`, `reset:${agent}`, actor],
    );
  }
  return res.affectedRows > 0;
}

/**
 * Every breaker, for the Rules tab and the alerts.
 *
 * The four built-in agents are always checked, whether or not they have
 * tripped yet. Custom automations only get a bucket once one exists — each is
 * keyed `rule-worker:<automation key>` (see automation-runner.ts) — so those
 * are found by scanning for policy rows already carrying `tripped: true`
 * rather than by a fixed list, which would need editing every time somebody
 * wrote a new rule.
 */
export async function all(): Promise<BreakerState[]> {
  const builtIn = await Promise.all(Object.keys(LIMITS).map((a) => check(a)));

  const rows = await read<{ policy_key: string; body: unknown }>(
    `SELECT policy_key, body FROM pulse_policy
      WHERE policy_key LIKE 'breaker.rule-worker:%' AND state = 'active'`,
  );
  const dynamic: BreakerState[] = [];
  for (const r of rows) {
    const body = parse(r.body);
    if (!body.tripped) continue;
    const agent = r.policy_key.slice("breaker.".length);
    dynamic.push({
      agent,
      tripped: true,
      reason: (body.reason as string) ?? "tripped",
      at: (body.at as string) ?? null,
      count: Number(body.count ?? 0),
      limit: LIMITS[agent] ?? DEFAULT_LIMIT,
    });
  }

  return [...builtIn, ...dynamic];
}
