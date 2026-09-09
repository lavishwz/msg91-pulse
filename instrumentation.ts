/**
 * Runs once when the server starts, before the first request.
 *
 * The deploy platform has no release phase, so this is where Pulse's own schema
 * is brought up. The work lives in instrumentation-node.ts and is imported only
 * on the Node runtime: `process.env.NEXT_RUNTIME` is inlined at build time, so
 * the Edge bundle — which middleware.ts brings into existence, and which has no
 * mysql2 and no node:fs — prunes the import entirely rather than failing to
 * resolve it.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { boot } = await import("./instrumentation-node");
    await boot();
  }
}
