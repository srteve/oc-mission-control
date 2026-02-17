import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");

function readJSON<T>(file: string): T[] {
  try {
    const raw = fs.readFileSync(path.join(DATA_DIR, file), "utf-8");
    return JSON.parse(raw) as T[];
  } catch {
    return [];
  }
}

type Activity = {
  _id: string;
  _creationTime: number;
  type: string;
  title: string;
  description?: string;
};

export async function GET() {
  const all = readJSON<Activity>("activities.json");
  
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  
  // Get 7 days ago (start of day)
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);
  const sevenDaysAgoMs = sevenDaysAgo.getTime();

  // Count document_created in last 7 days
  const lastWeekActivities = all.filter(
    (a) => a._creationTime >= sevenDaysAgoMs
  );
  const playsThisWeek = lastWeekActivities.filter(
    (a) => a.type === "document_created"
  ).length;

  // Build week days (Mon-Sun)
  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const weekDays: { date: string; day: string; count: number; hasActivity: boolean }[] = [];
  
  // Get the start of the current week (Monday)
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay() + 1);
  startOfWeek.setHours(0, 0, 0, 0);

  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    d.setHours(0, 0, 0, 0);
    const dayStart = d.getTime();
    const dayEnd = dayStart + 24 * 60 * 60 * 1000;
    
    const dayActivities = all.filter(
      (a) => a._creationTime >= dayStart && a._creationTime < dayEnd
    );
    
    weekDays.push({
      date: d.toISOString().split("T")[0],
      day: dayNames[i],
      count: dayActivities.length,
      hasActivity: dayActivities.length > 0,
    });
  }

  // Calculate streak (consecutive days with activity ending today or yesterday)
  let streak = 0;
  // Reuse 'now' from above (already declared at line 24)
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const todayEnd = todayStart + 24 * 60 * 60 * 1000;
  
  // Check if today has activity
  const hasActivityToday = all.some(
    (a) => a._creationTime >= todayStart && a._creationTime < todayEnd
  );
  
  // Start from today if there's activity today, otherwise start from yesterday
  const checkDate = new Date(now);
  if (!hasActivityToday) {
    checkDate.setDate(checkDate.getDate() - 1);
  }
  checkDate.setHours(0, 0, 0, 0);
  
  while (true) {
    const dayStart = checkDate.getTime();
    const dayEnd = dayStart + 24 * 60 * 60 * 1000;
    const hasActivity = all.some(
      (a) => a._creationTime >= dayStart && a._creationTime < dayEnd
    );
    
    if (hasActivity) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return NextResponse.json({
    weekDays,
    streak,
    playsThisWeek,
  });
}
