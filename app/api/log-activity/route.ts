import { NextRequest, NextResponse } from "next/server";
import { activities } from "@/lib/store";
import { getActivitiesFromTranscripts } from "@/lib/transcript";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") ?? undefined;
  const limit = searchParams.get("limit") ? Number(searchParams.get("limit")) : undefined;
  
  // Get ALL manual activities from store (no limit yet)
  const manualActivities = activities.list(type);
  
  // Get transcript activities (allow more to ensure we get enough for merging)
  const transcriptLimit = (limit ?? 50) + manualActivities.length;
  const transcriptActivities = getActivitiesFromTranscripts({ 
    limit: transcriptLimit,
    types: type ? [type] : undefined 
  });
  
  // Merge: manual activities (act_*) + transcript activities (tc_*)
  // Manual activities take priority for dedup
  const manualIds = new Set(manualActivities.map((a) => a._id));
  const filteredTranscript = transcriptActivities.filter((t) => !manualIds.has(t._id));
  
  // Combine and sort by time descending
  const combined = [...manualActivities, ...filteredTranscript].sort(
    (a, b) => b._creationTime - a._creationTime
  );
  
  // Apply limit if specified
  const result = limit ? combined.slice(0, limit) : combined;
  
  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, title, description, metadata } = body;
    if (!type || !title) {
      return NextResponse.json({ error: "type and title are required" }, { status: 400 });
    }
    const entry = activities.add({ type, title, description, metadata });
    return NextResponse.json(entry);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
