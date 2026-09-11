/**
 * Nightly health-band-movement digest.
 *
 * Deliberately NOT a `pulse_automation` row: automation-runner.ts's find_sql
 * only ever queries MSG91's schema (lib/db.ts, read-only), and account health
 * bands live in Pulse's own store (`pulse_account_health`, written by
 * lib/pulse/healthCron.ts) — a completely different connection. There is no
 * single SELECT that can join the two, so this is hand-written instead of
 * fitting the one-query automation shape.
 *
 * Reports two things, both real:
 *   - company-wide: how many accounts' bands moved up or down
 *   - the default rep's own book (lib/pulse/team.ts's `resolveMe()`): the
 *     same, narrowed to accounts that rep owns
 *
 * Not "team", on purpose — see auto.nightly.signup_digest (020) for why:
 * every other scope in this app already treats "team" and "company" as the
 * same unrestricted account list, so a separate "team" number here would be
 * the company number wearing a different label.
 *
 * Movement is read from whatever the last 24 hours of the health-scoring pass
 * actually reached — that pass covers a few dozen accounts an hour, not the
 * whole customer base in one night (see healthCron.ts), so a quiet night is
 * the expected common case, not evidence nothing happened. The judging agent
 * is told this explicitly, in the same spirit as every other automation in
 * this product: a plausible-looking wrong number is worse than an honest one.
 */

import { createHash, randomUUID } from "node:crypto";
import { read, write, acquireLock, releaseLock } from "@/lib/store";
import { query } from "@/lib/db";
import { resolveMe } from "../team";
import { judgeRow } from "../agents";

export type HealthDigestRun = {
  ran: boolean;
  companyUp: number;
  companyDown: number;
  myUp: number;
  myDown: number;
  alerted: boolean;
  skipped?: string;
  error?: string;
};

const SIGNAL_KEY = "auto:health-digest:portfolio";

export async function runHealthDigest(): Promise<HealthDigestRun> {
  const holder = randomUUID();
  const got = await acquireLock("health-digest", holder, 120);
  if (!got) {
    return { ran: false, companyUp: 0, companyDown: 0, myUp: 0, myDown: 0, alerted: false, skipped: "already running" };
  }

  try {
    const moved = await read<{ account_id: number; moved: "up" | "down" }>(
      `SELECT account_id, moved FROM pulse_account_health
        WHERE moved IS NOT NULL AND computed_at >= NOW() - INTERVAL 1 DAY`,
    );
    const companyUp = moved.filter((r) => r.moved === "up").length;
    const companyDown = moved.filter((r) => r.moved === "down").length;

    const me = await resolveMe();
    let myUp = 0;
    let myDown = 0;
    if (me && moved.length) {
      const owned = await query<{ user_id: number }>(
        `SELECT user_id FROM user_handled_by WHERE admin_id = ?`,
        [me.id],
      );
      const ownedIds = new Set(owned.map((r) => Number(r.user_id)));
      for (const r of moved) {
        if (!ownedIds.has(Number(r.account_id))) continue;
        if (r.moved === "up") myUp++;
        else if (r.moved === "down") myDown++;
      }
    }

    const row = {
      company_climbed: companyUp,
      company_slipped: companyDown,
      default_rep: me ? me.name : null,
      default_rep_climbed: myUp,
      default_rep_slipped: myDown,
      coverage_note:
        "these counts reflect only the accounts the hourly scoring pass reached in the last 24 hours, " +
        "not the whole customer base — a full lap over the relevant accounts takes several days",
    };

    const call = await judgeRow(
      "Every night, tell me which accounts' health bands moved overnight, company-wide and for the default rep's own book.",
      "Decide whether last night's health-band movement is worth flagging — a real judgment call, not a " +
        "forced report. The scoring pass only reaches a few dozen accounts an hour and does not cover the " +
        "whole customer base every night, so small numbers are normal and not by themselves a sign that " +
        "nothing happened. Consider the ratio of slipped-to-climbed rather than the raw counts alone. If " +
        "nothing stands out, set should_alert to false and say briefly why. When you do alert, report the " +
        "company-wide movement and the default rep's own book as two separate facts, not one blended number.",
      row,
    );

    const data = call.data;
    const alerted = Boolean(data.should_alert && data.headline);

    if (alerted) {
      await write(
        `INSERT INTO pulse_signal (signal_key, kind, subject_type, subject_id, source, state, evidence)
           VALUES (?, 'automation', 'portfolio', NULL, 'agent', 'open', ?)
         ON DUPLICATE KEY UPDATE evidence = VALUES(evidence), updated_at = NOW()`,
        [
          SIGNAL_KEY,
          JSON.stringify({
            automation: "health-digest",
            headline: data.headline,
            detail: data.detail,
            reasons: data.reasons,
            confidence: data.confidence,
          }),
        ],
      );
    }

    await write(
      `INSERT INTO pulse_decision
          (signal_key, agent, agent_id, model, policy_version, input_digest, input_json,
           output_json, verdict, confidence, action_taken, held, hold_reason, error_code, usage_json)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE
          output_json = VALUES(output_json), verdict = VALUES(verdict),
          confidence = VALUES(confidence), action_taken = VALUES(action_taken), usage_json = VALUES(usage_json)`,
      [
        SIGNAL_KEY,
        "rule-worker:health-digest",
        call.agentId,
        call.model,
        "health-digest-v1",
        createHash("sha256").update(JSON.stringify(row)).digest("hex"),
        JSON.stringify({ rule: "nightly health-band digest", ...row }),
        JSON.stringify(data),
        alerted ? "alert" : "quiet",
        data.confidence,
        alerted ? "alerted" : "none",
        0,
        null,
        null,
        JSON.stringify(call.usage ?? {}),
      ],
    );

    return { ran: true, companyUp, companyDown, myUp, myDown, alerted };
  } catch (err) {
    return {
      ran: false, companyUp: 0, companyDown: 0, myUp: 0, myDown: 0, alerted: false,
      error: (err as Error).message,
    };
  } finally {
    await releaseLock("health-digest", holder);
  }
}
