import { query } from "@/lib/db";
import { write, read, activePolicy } from "@/lib/store";
import { rulesByMotion, evaluate, type MotionRule, type Motion } from "./rules";

/**
 * The daily pass — rules that watch accounts rather than signups.
 *
 * A signup rule fires on something that happened. These fire on something that
 * *did not* happen: twelve days went by and no message was ever sent. Handover
 * §10 is blunt about why that matters — event triggers only see what happened,
 * but most customer loss is a thing that stopped happening.
 *
 * Same shape as triage: SQL assembles the facts, the rules decide in code, and
 * every decision is written down. No agent is involved at all — there is nothing
 * here to judge or to write, only a condition to check.
 */

/** How many accounts one pass may consider. */
const SCAN_CAP = 300;

type AccountFacts = {
  user_pid: string;
  company_name: string | null;
  motion: string;
  entity: string | null;
  days_since_signup: number;
  messages_sent: number;
  days_since_payment: number | null;
  owner_auto_assigned: boolean;
};

/**
 * Accounts young enough to still be finding their feet.
 *
 * Bounded to the first ninety days: after that, "has never sent a message" is
 * not a first-value problem any more, it is a dead account, and a different
 * scanner's business.
 */
async function facts(): Promise<AccountFacts[]> {
  const rows = await query<{
    id: number;
    name: string | null;
    parent: number | null;
    currency: string | null;
    age_days: number;
    admin_id: number | null;
    sent: number;
    last_paid: Date | null;
  }>(
    `SELECT u.user_pid AS id, u.user_fname AS name, u.user_userid AS parent,
            d.currency, DATEDIFF(NOW(), u.user_date) AS age_days, h.admin_id,
            COALESCE(c.sent, 0) AS sent, p.last_paid
       FROM ms_user u
       LEFT JOIN default_destination_country d ON d.u_id = u.user_pid
       LEFT JOIN user_handled_by h ON h.user_id = u.user_pid
       LEFT JOIN (
         SELECT trans_tuserid id, COUNT(*) sent
           FROM ms_trans WHERE trans_type = 2
            AND trans_date >= DATE_SUB(NOW(), INTERVAL 120 DAY)
          GROUP BY trans_tuserid
       ) c ON c.id = u.user_pid
       LEFT JOIN (
         SELECT trans_tuserid id, MAX(trans_date) last_paid
           FROM ms_trans WHERE trans_type = 1 AND payment_mode = 2
          GROUP BY trans_tuserid
       ) p ON p.id = u.user_pid
      WHERE u.user_type = 3
        AND u.user_date < DATE_SUB(NOW(), INTERVAL 7 DAY)
        AND u.user_date > DATE_SUB(NOW(), INTERVAL 90 DAY)
      ORDER BY u.user_date DESC
      LIMIT ?`,
    [SCAN_CAP],
  );

  return rows.map((r) => ({
    user_pid: String(r.id),
    company_name: r.name?.trim() || null,
    // A parent that is not MSG91 itself means a partner brought them in, and
    // the motion decides which set of rules applies at all.
    motion: r.parent === 2 ? "direct" : `partner:${r.parent ?? "unknown"}`,
    entity: r.currency,
    days_since_signup: Number(r.age_days),
    messages_sent: Number(r.sent),
    days_since_payment: r.last_paid
      ? Math.floor((Date.now() - new Date(r.last_paid).getTime()) / 86_400_000)
      : null,
    owner_auto_assigned: r.admin_id !== null,
  }));
}

export type DailyResult = {
  scanned: number;
  raised: number;
  skipped: number;
  notes: string[];
};

/**
 * Which motion's rules apply to an account.
 *
 * A partner's customer is governed by the partner rules whatever else is true —
 * that is the one classification that changes what MSG91 may do, rather than
 * only how it does it.
 */
function motionOf(f: AccountFacts): Motion {
  if (f.motion.startsWith("partner")) return "partner";
  // Everything else that arrived on its own is treated as startup for the
  // first-value rules. Outbound needs a prospect list Pulse does not have.
  return "startup";
}

const signalKey = (pid: string, rule: string) => `daily:${rule}:${pid}`;

/**
 * One daily pass.
 *
 * Idempotent by signal key: the same account failing the same rule tomorrow
 * updates one row rather than raising a second card. A first-value problem that
 * lasts three weeks is one problem, not twenty-one.
 */
export async function runDaily(): Promise<DailyResult> {
  const out: DailyResult = { scanned: 0, raised: 0, skipped: 0, notes: [] };
  const policy = await activePolicy();
  const rules = await rulesByMotion();

  const live = [...rules.startup, ...rules.partner, ...rules.outbound, ...rules.inbound].filter(
    (r) => r.live && r.when === "daily",
  );
  if (!live.length) {
    out.notes.push("no daily rules are running");
    return out;
  }

  const accounts = await facts();
  out.scanned = accounts.length;

  // What already has an open card, so a rule that keeps being true does not
  // keep raising cards. Card fatigue is the number one way this product dies.
  const open = new Set(
    (
      await read<{ signal_key: string }>(
        `SELECT signal_key FROM pulse_signal WHERE state = 'open' AND kind = 'daily'`,
      )
    ).map((r) => r.signal_key),
  );

  // Accounts triage already filtered out. "Has sent no messages in twelve days"
  // is true of every junk signup ever made, so without this the first-value
  // rule quietly becomes a machine for resurrecting the things Autopilot was
  // asked to suppress.
  // Accounts triage has actually looked at and kept. Anything older than
  // Autopilot itself has never been assessed, and a rule should not invent an
  // opinion about a company nobody has ever evaluated.
  const assessed = new Set(
    (
      await read<{ subject_id: string }>(
        `SELECT DISTINCT s.subject_id
           FROM pulse_signal s
           JOIN pulse_decision d ON d.signal_key = s.signal_key
          WHERE s.subject_id IS NOT NULL AND d.verdict IN ('human_now','nurture')`,
      )
    ).map((r) => String(r.subject_id)),
  );

  const suppressed = new Set(
    (
      await read<{ subject_id: string }>(
        `SELECT subject_id FROM pulse_signal
          WHERE state = 'suppressed' AND subject_id IS NOT NULL`,
      )
    ).map((r) => String(r.subject_id)),
  );

  for (const f of accounts) {
    if (suppressed.has(f.user_pid)) { out.skipped += 1; continue; }

    // An account that has never paid and never sent anything is not a
    // first-value problem — it is a signup that went nowhere. Ownership is not
    // the test: in this database almost everything has an owner assigned, so
    // using that as the filter lets every abandoned test account through.
    //
    // The test is whether Pulse has any basis for an opinion. Either money has
    // moved, or triage looked at it and did not suppress it. Without one of
    // those, raising a card is asking a person to care about a row.
    if (f.days_since_payment === null && f.messages_sent === 0 && !assessed.has(f.user_pid)) {
      out.skipped += 1;
      continue;
    }

    const applicable = live.filter((r) => r.motion === motionOf(f));
    if (!applicable.length) continue;

    const match = evaluate(applicable as MotionRule[], "daily", f as unknown as Record<string, unknown>);
    if (!match) continue;

    const key = signalKey(f.user_pid, match.rule.key.split(".").pop() ?? "rule");
    if (open.has(key)) { out.skipped += 1; continue; }

    const name = f.company_name ?? `Account ${f.user_pid}`;
    const evidence = [
      `${f.days_since_signup} days since they signed up.`,
      f.messages_sent === 0 ? "No messages sent yet." : `${f.messages_sent} messages sent.`,
      f.owner_auto_assigned ? "Somebody owns this account." : "Nobody owns this account.",
    ];

    await write(
      `INSERT INTO pulse_signal (signal_key, kind, subject_type, subject_id, source, evidence, state)
            VALUES (?, 'daily', 'account', ?, 'scanner', ?, 'open')
       ON DUPLICATE KEY UPDATE evidence = VALUES(evidence), state = 'open'`,
      [key, f.user_pid, JSON.stringify(evidence)],
    );

    await write(
      `INSERT INTO pulse_decision
         (signal_key, agent, policy_version, input_digest, input_json, output_json,
          verdict, action_taken, held)
       VALUES (?, 'rules', ?, SHA2(?, 256), ?, ?, ?, ?, 0)
       ON DUPLICATE KEY UPDATE output_json = VALUES(output_json), at = NOW()`,
      [
        key,
        policy.version,
        `${key}:${match.rule.version}`,
        JSON.stringify(f),
        JSON.stringify({ rule: match.rule.key, english: match.rule.english, reasons: evidence }),
        match.action.do === "raise_card" ? "human_now" : match.action.do,
        match.action.act === "card" ? "card raised" : "acted",
      ],
    );

    out.raised += 1;
    out.notes.push(`${name}: ${match.rule.english}`);
    if (out.raised >= 20) {
      out.notes.push("stopped at 20 cards — the rest are picked up tomorrow");
      break;
    }
  }

  return out;
}
