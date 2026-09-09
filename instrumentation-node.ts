/**
 * The boot work itself, in a module of its own.
 *
 * Split out from instrumentation.ts so the Edge bundle never sees it. Next
 * compiles instrumentation for both runtimes, and everything below reaches
 * mysql2 and node:fs — neither of which exists on the Edge runtime, and both of
 * which broke the build outright once middleware.ts made that bundle real.
 */
export async function boot() {
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
