import { read, write } from "@/lib/store";

/**
 * The manifest — what Autopilot may do without asking, and what always needs a
 * person.
 *
 * It was a hardcoded array in the prototype, which meant the most important
 * statement in the product could only be changed by a deploy. It is now rows in
 * `pulse_policy`, and this file is how a person edits them.
 *
 * ── Editing never overwrites ───────────────────────────────────────────────
 * Handover §7.5: "every save is a new version, nothing is overwritten". A
 * decision cites the policy version in force when it was made, so editing a
 * rule in place would make every past decision unexplainable. An edit therefore
 * retires the old row and writes a new one at the next version; a delete only
 * retires. Nothing is ever removed from the table.
 */

export type ManifestItem = {
  key: string;
  text: string;
  side: "yes" | "no";
  version: string;
  note: string | null;
  source: "seed" | "human" | "learned";
  enforcedIn: string | null;
};

type Raw = {
  policy_key: string;
  kind: string;
  body: unknown;
  note: string | null;
  version: string;
  source: string;
};

const parse = (v: unknown): Record<string, string> => {
  if (v == null) return {};
  if (typeof v === "string") {
    try {
      return JSON.parse(v) as Record<string, string>;
    } catch {
      return {};
    }
  }
  return v as Record<string, string>;
};

const shape = (r: Raw): ManifestItem => {
  const body = parse(r.body);
  return {
    key: r.policy_key,
    text: body.text ?? "",
    side: r.kind === "manifest_yes" ? "yes" : "no",
    version: r.version,
    note: r.note,
    source: (r.source as ManifestItem["source"]) ?? "seed",
    // Some rules are also enforced in code. Saying which is the difference
    // between a promise and a control, and a reader deserves to know.
    enforcedIn: body.enforced_in ?? null,
  };
};

export async function manifest(): Promise<{ yes: ManifestItem[]; no: ManifestItem[] }> {
  // Order by when the rule *first* appeared, not by the id of its current
  // version. Editing writes a new row, and ordering by that id would send an
  // edited rule to the bottom of the list — the reader would lose their place
  // for no reason they could see.
  const rows = await read<Raw>(
    `SELECT p.policy_key, p.kind, p.body, p.note, p.version, p.source
       FROM pulse_policy p
       JOIN (SELECT policy_key, MIN(id) first_id FROM pulse_policy GROUP BY policy_key) f
         ON f.policy_key = p.policy_key
      WHERE p.state = 'active' AND p.kind IN ('manifest_yes','manifest_no')
      ORDER BY p.kind, f.first_id`,
  );
  const items = rows.map(shape);
  return {
    yes: items.filter((i) => i.side === "yes"),
    no: items.filter((i) => i.side === "no"),
  };
}

/** v3 → v4. Versions are per rule, so one edit does not renumber the rest. */
function nextVersion(current: string): string {
  const n = Number((current ?? "v1").replace(/^v/, "")) || 1;
  return `v${n + 1}`;
}

const slug = (text: string) =>
  text.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, 60) || "rule";

/**
 * Add a rule to either side of the manifest.
 *
 * A new rule starts at v1 with `source: 'human'`, which is what lets the Rules
 * tab show which rules MSG91 wrote and which shipped with Pulse.
 */
export async function addRule(side: "yes" | "no", text: string, actor: string): Promise<ManifestItem> {
  const kind = side === "yes" ? "manifest_yes" : "manifest_no";
  const key = `manifest.${side}.${slug(text)}`;

  await write(
    `INSERT INTO pulse_policy (version, policy_key, kind, body, note, state, source)
          VALUES ('v1', ?, ?, JSON_OBJECT('text', ?), ?, 'active', 'human')
     ON DUPLICATE KEY UPDATE body = VALUES(body), state = 'active', note = VALUES(note)`,
    [key, kind, text, `added by ${actor}`],
  );

  return { key, text, side, version: "v1", note: `added by ${actor}`, source: "human", enforcedIn: null };
}

/**
 * Change a rule's wording.
 *
 * The old row is retired, not updated, and the new one carries the next
 * version. Both stay in the table: a decision made yesterday still resolves to
 * the exact words that were in force when it was made.
 */
export async function editRule(key: string, text: string, actor: string): Promise<ManifestItem | null> {
  const rows = await read<Raw>(
    `SELECT policy_key, kind, body, note, version, source
       FROM pulse_policy WHERE policy_key = ? AND state = 'active' LIMIT 1`,
    [key],
  );
  const current = rows[0];
  if (!current) return null;

  const version = nextVersion(current.version);
  const body = parse(current.body);

  await write(
    `UPDATE pulse_policy SET state = 'retired', retired_at = NOW()
      WHERE policy_key = ? AND state = 'active'`,
    [key],
  );

  await write(
    `INSERT INTO pulse_policy (version, policy_key, kind, body, note, state, source)
     VALUES (?, ?, ?, ?, ?, 'active', 'human')`,
    [
      version,
      key,
      current.kind,
      // enforced_in survives an edit: it describes where the code check lives,
      // which is not something a wording change should silently drop.
      JSON.stringify(body.enforced_in ? { text, enforced_in: body.enforced_in } : { text }),
      `edited by ${actor}`,
    ],
  );

  return {
    key,
    text,
    side: current.kind === "manifest_yes" ? "yes" : "no",
    version,
    note: `edited by ${actor}`,
    source: "human",
    enforcedIn: body.enforced_in ?? null,
  };
}

/**
 * Retire a rule.
 *
 * Not a delete. The row stays, marked retired with a timestamp, because a
 * decision from last month may cite it and "this rule no longer exists" is a
 * worse answer than "this rule was retired on the 8th".
 */
export async function retireRule(key: string, actor: string): Promise<boolean> {
  const res = await write(
    `UPDATE pulse_policy SET state = 'retired', retired_at = NOW(), note = ?
      WHERE policy_key = ? AND state = 'active'`,
    [`retired by ${actor}`, key],
  );
  return res.affectedRows > 0;
}

/** Bring a retired rule back, at the next version. */
export async function restoreRule(key: string, actor: string): Promise<boolean> {
  const rows = await read<Raw>(
    `SELECT policy_key, kind, body, note, version, source
       FROM pulse_policy WHERE policy_key = ? ORDER BY id DESC LIMIT 1`,
    [key],
  );
  const last = rows[0];
  if (!last) return false;

  await write(
    `INSERT INTO pulse_policy (version, policy_key, kind, body, note, state, source)
     VALUES (?, ?, ?, ?, ?, 'active', 'human')
     ON DUPLICATE KEY UPDATE state = 'active', note = VALUES(note)`,
    [nextVersion(last.version), last.policy_key, last.kind, JSON.stringify(parse(last.body)), `restored by ${actor}`],
  );
  return true;
}

/** Every version a rule has ever had — what the Rules tab shows on click. */
export async function ruleHistory(key: string) {
  const rows = await read<Raw & { state: string; created_at: Date; retired_at: Date | null }>(
    `SELECT policy_key, kind, body, note, version, source, state, created_at, retired_at
       FROM pulse_policy WHERE policy_key = ? ORDER BY id DESC`,
    [key],
  );
  return rows.map((r) => ({
    ...shape(r),
    state: r.state,
    createdAt: r.created_at.toISOString(),
    retiredAt: r.retired_at ? r.retired_at.toISOString() : null,
  }));
}
