/**
 * The per-automation key that authenticates its cron-job.org webhook.
 *
 * Every dynamically-built automation gets a cron-job.org job whose URL Pulse
 * hands over once and which that service then calls forever. Until now that
 * URL carried `?secret=AUTOPILOT_TICK_SECRET` — the single secret that also
 * guards /tick, /run, /monthly, /store/migrate and the nightly digest. Every
 * job in a third party's dashboard held the key to every machine endpoint in
 * the product, and rotating it meant rewriting every job at once.
 *
 * This replaces it with a value derived per automation:
 *
 *     key = HMAC-SHA256(AUTOPILOT_TICK_SECRET, "automation-webhook:" + key)
 *
 * Derived rather than stored, which is what makes it cheap to adopt: there is
 * no column to migrate, no value to generate at build time and lose if a save
 * fails, and the key for an automation created months ago can be recomputed
 * from its name alone — so repointing the existing jobs needs nothing but the
 * list of automations.
 *
 * What it buys:
 *
 *   · a key that leaks — from a browser history, a support screenshot of the
 *     cron-job.org dashboard, a log line — is one automation's key. It cannot
 *     be run backwards to AUTOPILOT_TICK_SECRET, and it opens no other
 *     automation and no other endpoint.
 *   · the blast radius of that leak is "this one rule can be made to run",
 *     which is the least interesting thing an attacker could already do by
 *     waiting five minutes.
 *
 * What it does not buy: rotation of one automation's key independently. That
 * needs a stored value, and is not worth a migration for a key whose worst
 * case is an early run of a rule that was going to run anyway.
 *
 * The label in the HMAC input is domain separation — it stops a value derived
 * here from ever being mistaken for, or colliding with, a key derived from the
 * same secret for some other purpose later.
 */

import { createHmac, timingSafeEqual } from "node:crypto";

const LABEL = "automation-webhook:";

export function webhookKeyFor(automationKey: string): string {
  const secret = (process.env.AUTOPILOT_TICK_SECRET ?? "").trim();
  if (!secret) {
    throw new Error(
      "AUTOPILOT_TICK_SECRET is not set, so an automation webhook cannot be authenticated.",
    );
  }
  return createHmac("sha256", secret).update(LABEL + automationKey).digest("hex").slice(0, 32);
}

/**
 * Constant-time comparison, so the handler cannot be used as an oracle that
 * reveals a correct key one character at a time by how fast it says no.
 */
export function webhookKeyMatches(automationKey: string, presented: string | null): boolean {
  if (!presented) return false;
  let expected: string;
  try {
    expected = webhookKeyFor(automationKey);
  } catch {
    return false;
  }
  const a = Buffer.from(expected);
  const b = Buffer.from(presented);
  /* timingSafeEqual throws on a length mismatch, which is itself a signal —
     but the length of a hex digest is not secret, so answering early here
     leaks nothing a reader could not work out from this file. */
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
