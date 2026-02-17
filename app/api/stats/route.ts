import { NextResponse } from "next/server";
import { tasks } from "@/lib/store";
import { getActivitiesFromTranscripts } from "@/lib/transcript";

export async function GET() {
  // Get start of today
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const startOfDayMs = startOfDay.getTime();
  
  // Get today's activities from transcripts
  const todayActivities = getActivitiesFromTranscripts({ since: startOfDayMs });
  
  // Get all activities (for total count) - use a larger limit
  const allActivities = getActivitiesFromTranscripts({ limit: 10000 });
  
  // Get recent activities (last 10, all time)
  const recentActivities = getActivitiesFromTranscripts({ limit: 10 });
  
  // Count by type
  const countByType = (type: string) => 
    todayActivities.filter((a) => a.type === type).length;
  
  return NextResponse.json({
    today: {
      total: todayActivities.length,
      messages: countByType("message_sent"),
      searches: countByType("web_search"),
      files: countByType("file_write") + countByType("file_read"),
      memory: countByType("memory_updated"),
      tasks: countByType("task_completed"),
    },
    total: allActivities.length,
    upcomingTasks: tasks.upcomingCount(),
    recentActivities,
  });
}
