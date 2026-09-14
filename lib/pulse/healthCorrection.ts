import { write } from "@/lib/store";

/**
 * A rep flagging a health score as wrong — see migrations/031_health_correction.sql.
 *
 * This records disagreement; it does not change the score itself. Correcting
 * the formula or the agent's judgment is a separate, bigger decision than
 * what a single flag should trigger.
 */
export type HealthCorrectionInput = {
  accountPid: string;
  shownScore: number;
  shownBand: string;
  decidedBy: "ai" | "formula";
  note: string | null;
  raisedBy: string;
};

export async function flagHealthScore(input: HealthCorrectionInput): Promise<void> {
  await write(
    `INSERT INTO pulse_health_correction
       (account_pid, shown_score, shown_band, decided_by, note, raised_by)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      input.accountPid,
      input.shownScore,
      input.shownBand,
      input.decidedBy,
      input.note,
      input.raisedBy,
    ],
  );
}
