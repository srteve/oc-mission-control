import { NextResponse } from "next/server";
import { tasks } from "@/lib/store";

export async function GET() {
  return NextResponse.json({ count: tasks.upcomingCount() });
}
