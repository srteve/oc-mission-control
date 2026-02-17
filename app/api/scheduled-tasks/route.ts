import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL ?? "";
const GATEWAY_URL = "http://localhost:18789";
const GATEWAY_TOKEN = "50fd5e5a6d316beacadd1bb6d55f51905e2887bbbd4f3f94";

function getClient() {
  if (!convexUrl) throw new Error("Convex not configured");
  return new ConvexHttpClient(convexUrl);
}

async function getCronJobsFromGateway() {
  try {
    const res = await fetch(`${GATEWAY_URL}/tools/invoke`, {
      method: "POST",
      headers: { 
        "Authorization": `Bearer ${GATEWAY_TOKEN}`, 
        "Content-Type": "application/json" 
      },
      body: JSON.stringify({ 
        tool: "cron", 
        args: { action: "list", includeDisabled: true }, 
        sessionKey: "main" 
      })
    });
    const data = await res.json();
    const jobs = data?.result?.details?.jobs ?? [];
    
    return jobs.map((job: { id: string; name?: string; enabled?: boolean; state?: { nextRunAtMs?: number }; schedule?: string }) => ({
      _id: job.id,
      title: job.name || "Cron Job",
      type: "cron",
      status: "pending",
      scheduledAt: job.state?.nextRunAtMs ?? Date.now(),
      recurringRule: job.schedule || "Recurring",
    }));
  } catch {
    return [];
  }
}

export async function GET() {
  try {
    const client = getClient();
    const tasks = await client.query(api.scheduledTasks.list, {});
    
    // Also fetch cron jobs from gateway
    const cronTasks = await getCronJobsFromGateway();
    
    // Merge Convex tasks with cron tasks
    const allTasks = [...tasks, ...cronTasks];
    
    return NextResponse.json(allTasks);
  } catch (err) {
    // If Convex fails, try to return just cron tasks
    try {
      const cronTasks = await getCronJobsFromGateway();
      return NextResponse.json(cronTasks);
    } catch {
      return NextResponse.json({ error: String(err) }, { status: 500 });
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, description, scheduledAt, type, status, recurringRule } = body;

    if (!title || !scheduledAt || !type) {
      return NextResponse.json({ error: "title, scheduledAt, type are required" }, { status: 400 });
    }

    const client = getClient();
    const id = await client.mutation(api.scheduledTasks.add, {
      title, description, scheduledAt, type, status, recurringRule,
    });

    return NextResponse.json({ id });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const client = getClient();
    await client.mutation(api.scheduledTasks.remove, { id: id as Id<"scheduled_tasks"> });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
