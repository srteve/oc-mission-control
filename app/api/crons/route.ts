import { NextRequest, NextResponse } from "next/server";

const GATEWAY_URL = "http://localhost:18789";
const GATEWAY_TOKEN = "50fd5e5a6d316beacadd1bb6d55f51905e2887bbbd4f3f94";

type CronJob = {
  id: string;
  name: string;
  schedule: string;
  scheduleRaw?: unknown;
  payload?: unknown;
  enabled: boolean;
  nextRun?: number;
  lastRun?: number;
};

async function gatewayInvoke(tool: string, args: Record<string, unknown>) {
  try {
    const res = await fetch(`${GATEWAY_URL}/tools/invoke`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GATEWAY_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ tool, args, sessionKey: "main" }),
    });
    if (!res.ok) {
      console.error(`Gateway error: ${res.status} ${res.statusText}`);
      return null;
    }
    const data = await res.json();
    return data;
  } catch (err) {
    console.error("Gateway invoke error:", err);
    return null;
  }
}

function describeSchedule(schedule: Record<string, unknown>): string {
  if (!schedule) return "Unknown";
  if (schedule.kind === "cron") return `Cron: ${schedule.expr}`;
  if (schedule.kind === "every") {
    const ms = schedule.everyMs as number;
    const mins = Math.round(ms / 60000);
    const hours = Math.round(ms / 3600000);
    const days = Math.round(ms / 86400000);
    if (days >= 1 && ms % 86400000 === 0) return `Every ${days} day${days > 1 ? "s" : ""}`;
    if (hours >= 1 && ms % 3600000 === 0) return `Every ${hours} hour${hours > 1 ? "s" : ""}`;
    return `Every ${mins} minute${mins > 1 ? "s" : ""}`;
  }
  if (schedule.kind === "at") return `Once at ${new Date(schedule.at as string).toLocaleString()}`;
  return JSON.stringify(schedule);
}

export async function GET() {
  const result = await gatewayInvoke("cron", { action: "list", includeDisabled: true });

  if (!result?.ok) {
    return NextResponse.json({ jobs: [] });
  }

  // The gateway wraps tool output: result.result.details has the parsed data
  const rawJobs: Record<string, unknown>[] =
    result?.result?.details?.jobs ??
    result?.result?.jobs ??
    [];

  const jobs: CronJob[] = rawJobs.map((job) => ({
    id: job.id as string,
    name: (job.name as string) || "Unnamed job",
    schedule: describeSchedule(job.schedule as Record<string, unknown>),
    scheduleRaw: job.schedule,
    payload: job.payload,
    enabled: job.enabled as boolean,
    nextRun: (job.state as Record<string, unknown>)?.nextRunAtMs as number | undefined,
    lastRun: (job.state as Record<string, unknown>)?.lastRunAtMs as number | undefined,
  }));

  return NextResponse.json({ jobs });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, jobId } = body;

    if (action === "run" && jobId) {
      const result = await gatewayInvoke("cron", { action: "run", jobId });
      return NextResponse.json({ success: true, result });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
