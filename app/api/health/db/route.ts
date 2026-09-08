import { NextResponse } from "next/server";
import { dbStatus } from "@/lib/db";

/** GET /api/health/db — is the MySQL connection live? */
export async function GET() {
  const status = await dbStatus();
  return NextResponse.json(status, { status: status.ok ? 200 : 503 });
}

// Never cache a health check.
export const dynamic = "force-dynamic";
