import { read, write } from "@/lib/store";

/**
 * How one person writes.
 *
 * Onboarding step 3 shows a list of traits — "short sentences", "opens with
 * the point, never a greeting" — and says a draft written for you will sound
 * like this. The list was a hardcoded array of five in public/pulse.js, the
 * same five for everybody, and editing it changed a variable that a reload
 * threw away.
 *
 * It is per person and it persists now: `pulse_user_voice`, keyed by the
 * signed-in member's email (migrations/010).
 *
 * ── What this deliberately does not do ─────────────────────────────────────
 * It does not read anybody's mail. Pulse has no mailbox connection — there is
 * no OAuth flow, no IMAP, nothing in the codebase that has ever seen a sent
 * message — so the onboarding copy claiming "I read your last twenty sent
 * mails" was describing a feature that does not exist. The traits are seeded
 * with five sensible defaults and edited by hand, and the copy now says so.
 *
 * The traits are stored and used: `draftFor` (lib/pulse/autopilot/drafts.ts)
 * calls `traitsFor(email)` and turns the result into the
 * `owner_writing_samples` field the outreach-drafter agent's prompt reads,
 * via `samplesFromTraits` below. Whoever's traits are looked up is whoever's
 * voice the next draft written for that identity sounds like — edit the list
 * in Profile and the next draft reflects it, no redeploy needed.
 */

export type VoiceTrait = {
  trait: string;
  /** True while this is one of the untouched defaults. */
  seeded: boolean;
};

/** The longest a trait may be. Beyond this it is a style guide, not a trait. */
export const MAX_TRAIT_LENGTH = 120;

/**
 * What a person starts with.
 *
 * These are the prototype's five, kept because they are good defaults and
 * because a new person staring at an empty list learns nothing about what the
 * field is for. They are marked `seeded` in the table, so "never touched this"
 * stays distinguishable from "chose exactly these".
 */
export const DEFAULT_TRAITS = [
  "Short sentences",
  "Opens with the point, never a greeting",
  "Says sorry plainly, no hedging",
  "Signs off with just your first name",
  "Never uses exclamation marks",
];

export function normalizeTrait(raw: string): string {
  return raw.replace(/\s+/g, " ").trim().slice(0, MAX_TRAIT_LENGTH);
}

export function isTraitShaped(trait: string): boolean {
  return trait.length >= 2 && trait.length <= MAX_TRAIT_LENGTH;
}

type Row = { trait: string; seeded: number };

/**
 * One person's traits, in the order they put them in.
 *
 * Seeds on first read rather than on sign-up: there is no hook that fires when
 * somebody is invited, and a person who has never opened onboarding should
 * still see a sensible list the first time they do. `INSERT IGNORE` against
 * the unique key makes that safe to race — two tabs opening at once seed the
 * same five and neither ends up with duplicates.
 */
export async function traitsFor(email: string): Promise<VoiceTrait[]> {
  const rows = await read<Row>(
    `SELECT trait, seeded FROM pulse_user_voice
      WHERE member_email = ? ORDER BY position, id`,
    [email],
  );
  if (rows.length) return rows.map((r) => ({ trait: r.trait, seeded: Boolean(r.seeded) }));

  await seed(email);
  const seeded = await read<Row>(
    `SELECT trait, seeded FROM pulse_user_voice
      WHERE member_email = ? ORDER BY position, id`,
    [email],
  );
  return seeded.map((r) => ({ trait: r.trait, seeded: Boolean(r.seeded) }));
}

/**
 * Whether this person has ever changed their list.
 *
 * The onboarding step words itself differently for somebody looking at
 * defaults than for somebody looking at their own answers, and this is how it
 * tells. A row that is present and not seeded is a deliberate choice — adding
 * a trait or removing one clears the flag on what remains.
 */
export async function hasEdited(email: string): Promise<boolean> {
  const rows = await read<{ n: number }>(
    `SELECT COUNT(*) n FROM pulse_user_voice WHERE member_email = ? AND seeded = 0`,
    [email],
  );
  return Number(rows[0]?.n ?? 0) > 0;
}

async function seed(email: string): Promise<void> {
  for (let i = 0; i < DEFAULT_TRAITS.length; i++) {
    const trait = DEFAULT_TRAITS[i];
    await write(
      `INSERT IGNORE INTO pulse_user_voice
         (member_email, trait, trait_key, seeded, position)
       VALUES (?, ?, ?, 1, ?)`,
      [email, trait, trait.toLowerCase(), i],
    );
  }
}

/**
 * Add a trait to the end of somebody's list.
 *
 * Adding one is an edit, so everything that was a default stops being one:
 * from here on this is the person's own list and should not be silently
 * rewritten if the defaults ever change.
 */
export async function addTrait(email: string, raw: string): Promise<VoiceTrait[]> {
  const trait = normalizeTrait(raw);
  const rows = await read<{ p: number | null }>(
    `SELECT MAX(position) p FROM pulse_user_voice WHERE member_email = ?`,
    [email],
  );
  const next = Number(rows[0]?.p ?? -1) + 1;

  await write(
    `INSERT INTO pulse_user_voice (member_email, trait, trait_key, seeded, position)
          VALUES (?, ?, ?, 0, ?)
     ON DUPLICATE KEY UPDATE seeded = 0`,
    [email, trait, trait.toLowerCase(), next],
  );
  await markEdited(email);
  return traitsFor(email);
}

/** Remove a trait. Case-insensitive, like adding one. */
export async function removeTrait(email: string, raw: string): Promise<VoiceTrait[]> {
  await write(`DELETE FROM pulse_user_voice WHERE member_email = ? AND trait_key = ?`, [
    email,
    normalizeTrait(raw).toLowerCase(),
  ]);
  await markEdited(email);
  /* Deleting the last trait re-seeds on the next read, because `traitsFor`
     seeds whenever it finds no rows and there is nowhere else to record that
     the emptiness was deliberate. Left as is rather than given a marker row or
     a second table: five defaults coming back is a small surprise, and the
     alternative shapes were all worse than the problem. Worth revisiting if
     anybody ever wants to say "do not imitate me at all". */
  return traitsFor(email);
}

const markEdited = (email: string) =>
  write(`UPDATE pulse_user_voice SET seeded = 0 WHERE member_email = ?`, [email]);

/**
 * Traits → the prompt field the outreach-drafter agent reads.
 *
 * Plain sentences, not a bullet list — `owner_writing_samples` sits next to
 * `owner_writing_samples: "(no samples yet — write plainly...)"` in the same
 * prompt slot in drafts.ts, so this has to read like a sentence that slot
 * could hold, not a data dump the model has to reinterpret.
 */
export function samplesFromTraits(traits: VoiceTrait[]): string {
  if (!traits.length) return "(no samples yet — write plainly, short sentences, no marketing language)";
  return `Write like this: ${traits.map((t) => t.trait.replace(/\.$/, "")).join("; ")}.`;
}
