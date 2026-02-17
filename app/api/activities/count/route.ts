import { NextRequest, NextResponse } from "next/server";
import { getActivitiesFromTranscripts } from "@/lib/transcript";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sinceParam = searchParams.get("since");
  
  // Parse since param (e.g., "7d", "30d")
  let sinceMs: number | undefined;
  if (sinceParam) {
    const match = sinceParam.match(/^(\d+)d$/);
    if (match) {
      const days = parseInt(match[1], 10);
      sinceMs = Date.now() - days * 24 * 60 * 60 * 1000;
    }
  }
  
  const activities = getActivitiesFromTranscripts({ since: sinceMs });
  
  return NextResponse.json({ count: activities.length });
}
