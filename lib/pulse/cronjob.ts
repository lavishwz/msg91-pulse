/**
 * cron-job.org client — the external scheduler for cron-mode automations.
 *
 * Each automation with mode="cron" gets its own job here, pointed at
 * /api/pulse/autopilot/webhook/[key]. cron-job.org calls that URL on
 * schedule; the webhook runs the automation the same way the internal tick
 * runs the built-in ones.
 *
 * Docs: https://docs.cron-job.org/rest-api.html
 */

const BASE_URL = "https://api.cron-job.org";

export class CronJobError extends Error {
  readonly status: number | null;
  constructor(message: string, status: number | null = null) {
    super(message);
    this.name = "CronJobError";
    this.status = status;
  }
}

function apiKey(): string {
  const key = (process.env.CRONJOB_API_KEY ?? "").trim();
  if (!key) {
    throw new CronJobError("CRONJOB_API_KEY is not set. Add it to .env.local.");
  }
  return key;
}

async function call(
  method: "GET" | "PUT" | "PATCH" | "DELETE",
  path: string,
  body?: unknown,
): Promise<Record<string, unknown>> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: { authorization: `Bearer ${apiKey()}`, "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const raw = await res.text();
  let parsed: unknown;
  try {
    parsed = raw ? JSON.parse(raw) : {};
  } catch {
    throw new CronJobError(`cron-job.org returned non-JSON (${res.status}): ${raw.slice(0, 200)}`, res.status);
  }
  if (!res.ok) {
    throw new CronJobError(
      `cron-job.org error (${res.status}) on ${method} ${path}: ${JSON.stringify(parsed)}`,
      res.status,
    );
  }
  return parsed as Record<string, unknown>;
}

/**
 * A cron(5) expression, as five fields, turned into the { minutes, hours,
 * mdays, months, wdays } arrays cron-job.org's API wants. "*" becomes [-1],
 * their convention for "every value" in that field.
 */
export function parseCronExpression(expr: string): {
  minutes: number[];
  hours: number[];
  mdays: number[];
  months: number[];
  wdays: number[];
} {
  const fields = expr.trim().split(/\s+/);
  if (fields.length !== 5) {
    throw new CronJobError(`"${expr}" is not a 5-field cron expression`);
  }
  const [minute, hour, mday, month, wday] = fields;

  const parseField = (field: string, min: number, max: number): number[] => {
    if (field === "*") return [-1];
    const out: number[] = [];
    for (const part of field.split(",")) {
      const stepMatch = /^(\*|\d+(?:-\d+)?)\/(\d+)$/.exec(part);
      if (stepMatch) {
        const [, range, stepStr] = stepMatch;
        const step = Number(stepStr);
        const [lo, hi] = range === "*" ? [min, max] : range.split("-").map(Number);
        for (let v = lo; v <= (hi ?? max); v += step) out.push(v);
        continue;
      }
      const rangeMatch = /^(\d+)-(\d+)$/.exec(part);
      if (rangeMatch) {
        const [, lo, hi] = rangeMatch;
        for (let v = Number(lo); v <= Number(hi); v++) out.push(v);
        continue;
      }
      out.push(Number(part));
    }
    return out;
  };

  return {
    minutes: parseField(minute, 0, 59),
    hours: parseField(hour, 0, 23),
    mdays: parseField(mday, 1, 31),
    months: parseField(month, 1, 12),
    wdays: parseField(wday, 0, 6),
  };
}

/** Register a new job. Returns the cron-job.org job id. */
export async function createCronJob(
  title: string,
  url: string,
  cronExpression: string,
): Promise<string> {
  const schedule = parseCronExpression(cronExpression);
  const res = await call("PUT", "/jobs", {
    job: {
      title,
      url,
      enabled: true,
      saveResponses: true,
      requestMethod: 1, // POST
      schedule: { timezone: "Etc/UTC", ...schedule },
    },
  });
  const jobId = res.jobId;
  if (jobId === undefined || jobId === null) {
    throw new CronJobError(`cron-job.org did not return a jobId: ${JSON.stringify(res)}`);
  }
  return String(jobId);
}

export async function deleteCronJob(jobId: string): Promise<void> {
  await call("DELETE", `/jobs/${jobId}`);
}

export async function setCronJobEnabled(jobId: string, enabled: boolean): Promise<void> {
  await call("PATCH", `/jobs/${jobId}`, { job: { enabled } });
}

export type CronJobSummary = { jobId: string; title: string; url: string; enabled: boolean };

/**
 * Every job on the account.
 *
 * Needed because a job's URL embeds PUBLIC_BASE_URL at the moment it was
 * created (see build.ts) — so moving the app to a new address leaves every
 * existing job calling the old one. cron-job.org keeps firing them and gets
 * a connection error, which nothing in Pulse ever sees: the automation just
 * silently stops running. Listing them is the only way to find that out.
 */
export async function listCronJobs(): Promise<CronJobSummary[]> {
  const res = await call("GET", "/jobs");
  const jobs = Array.isArray(res.jobs) ? res.jobs : [];
  return (jobs as Record<string, unknown>[]).map((j) => ({
    jobId: String(j.jobId ?? ""),
    title: String(j.title ?? ""),
    url: String(j.url ?? ""),
    enabled: Boolean(j.enabled),
  }));
}

/** Re-point one job at a new URL, leaving its schedule and title alone. */
export async function setCronJobUrl(jobId: string, url: string): Promise<void> {
  await call("PATCH", `/jobs/${jobId}`, { job: { url } });
}
