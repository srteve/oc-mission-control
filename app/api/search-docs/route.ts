import { NextRequest, NextResponse } from "next/server";
import { activities } from "@/lib/store";
import { getActivitiesFromTranscripts } from "@/lib/transcript";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";
  if (!q.trim()) return NextResponse.json([]);
  
  const queryLower = q.toLowerCase();
  
  // Get manual activities from store
  const manualResults = activities.search(q);
  
  // Get transcript activities (no time limit, limit to 5000)
  const transcriptActivities = getActivitiesFromTranscripts({ 
    limit: 5000,
  });
  
  // Filter transcript activities by query match
  const transcriptResults = transcriptActivities.filter((a) => 
    a.title.toLowerCase().includes(queryLower) ||
    (a.description?.toLowerCase().includes(queryLower) ?? false)
  );
  
  // Merge and deduplicate by _id
  const manualIds = new Set(manualResults.map(a => a._id));
  const filteredTranscript = transcriptResults.filter(t => !manualIds.has(t._id));
  
  const combined = [...manualResults, ...filteredTranscript];
  
  // Sort by _creationTime descending
  combined.sort((a, b) => b._creationTime - a._creationTime);
  
  // Return top 50
  return NextResponse.json(combined.slice(0, 50));
}
