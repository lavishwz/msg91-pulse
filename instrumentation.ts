/**
 * Runs once when the server starts, before the first request.
 *
 * The deploy platform has no release phase, so this is where Pulse's own schema
 * is brought up. A fresh deploy against an empty database creates the nine
 * tables and seeds the policy; an existing one skips everything and costs a few
 * milliseconds.
 *
 * A failure here is logged and the server still starts. A schema problem should
 * make the data routes say what is wrong — which they already do — rather than
 * take down the whole app, including the pages that do not need the store.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if ((process.env.PULSE_SKIP_MIGRATE ?? "").toLowerCase() === "true") {
    console.log("[pulse] migrations skipped (PULSE_SKIP_MIGRATE=true)");
    return;
  }

  try {
    const { migrate } = await import("@/lib/migrate");
    const res = await migrate();

    if (res.error) console.warn("[pulse] migrations:", res.error);
    if (res.applied.length) console.log("[pulse] migrations applied:", res.applied.join(", "));
    if (res.changed.length) {
      // Not fatal, but somebody needs to know: a file that was edited after it
      // ran means this database and another one no longer match.
      console.warn(
        "[pulse] migrations changed after they were applied:",
        res.changed.join(", "),
        "— this database may differ from others.",
      );
    }
    if (!res.applied.length && !res.error) {
      console.log(`[pulse] schema up to date (${res.skipped.length} migrations)`);
    }
  } catch (err) {
    console.warn("[pulse] migrations could not run:", (err as Error).message);
  }
}
