import { NextResponse } from "next/server";
import { storeStatus } from "@/lib/store";

/**
 * GET /api/health/store — is the writable half reachable?
 *
 * Separate from /api/health/db, which answers for MSG91's read-only schema.
 * The two fail independently and for different reasons: MSG91 is IP-bound, so
 * it drops out when the app runs somewhere unexpected, while the store drops
 * out when PULSE_STORE_* is unset or points somewhere it may not write. A
 * single health check could not say which had gone.
 *
 * `tables` is the useful part. A connection that resolves but reports zero
 * tables means the schema never migrated — the app will start, Autopilot will
 * decide nothing, and the Rules tab will quietly fall back to sample data. That
 * is a different problem from being unable to connect, and the indicator in the
 * header distinguishes them.
 */
export async function GET() {
  const status = await storeStatus();
  return NextResponse.json(status, { status: status.ok ? 200 : 503 });
}

// Never cache a health check.
export const dynamic = "force-dynamic";
