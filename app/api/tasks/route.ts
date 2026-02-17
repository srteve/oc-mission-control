import { NextRequest, NextResponse } from "next/server";
import { tasks } from "@/lib/store";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? undefined;
  return NextResponse.json(tasks.list(status));
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, description, scheduledAt, type, status, recurringRule } = body;
    if (!title || !scheduledAt || !type) {
      return NextResponse.json({ error: "title, scheduledAt, type are required" }, { status: 400 });
    }
    const entry = tasks.add({ title, description, scheduledAt, type, status: status ?? "pending", recurringRule });
    return NextResponse.json(entry);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
