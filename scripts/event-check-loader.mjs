/**
 * Resolve the app's own import style for plain node: the "@/…" alias from
 * tsconfig, and extensionless relative imports. Used only by
 * scripts/check-events.mjs, so that diagnostic can import the real modules
 * the app runs rather than a copy of their logic.
 */
import { existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = pathToFileURL(process.cwd() + "/").href;

function withExtension(url) {
  const path = fileURLToPath(url);
  if (existsSync(path) && !path.endsWith("/")) return url;
  for (const ext of [".ts", ".tsx", ".mjs", ".js", "/index.ts", "/index.js"]) {
    if (existsSync(path + ext)) return url + ext;
  }
  return url;
}

export function resolve(specifier, context, next) {
  if (specifier.startsWith("@/")) {
    return next(withExtension(new URL(specifier.slice(2), ROOT).href), context);
  }
  if ((specifier.startsWith("./") || specifier.startsWith("../")) && context.parentURL?.startsWith("file:")) {
    return next(withExtension(new URL(specifier, context.parentURL).href), context);
  }
  return next(specifier, context);
}
