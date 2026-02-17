import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const SESSIONS_DIR = "/Users/quinn/.openclaw/agents/main/sessions";
const WORKSPACE = "/Users/quinn/.openclaw/workspace";

type RawLine = {
  type: string;
  timestamp?: string;
  message?: {
    role: string;
    content: unknown;
    timestamp?: number;
    usage?: {
      cost?: {
        total?: number;
        input?: number;
        output?: number;
        cacheRead?: number;
        cacheWrite?: number;
      };
    };
  };
  usage?: {
    cost?: {
      total?: number;
      input?: number;
      output?: number;
      cacheRead?: number;
      cacheWrite?: number;
    };
  };
};

function parseJSONL(filePath: string): RawLine[] {
  try {
    const lines = fs.readFileSync(filePath, "utf-8").split("\n").filter(Boolean);
    return lines.map((l) => JSON.parse(l));
  } catch {
    return [];
  }
}

function getSessionsDir() {
  if (fs.existsSync(SESSIONS_DIR)) return SESSIONS_DIR;
  return WORKSPACE;
}

export async function GET() {
  const dir = getSessionsDir();
  
  let jsonlFiles: string[] = [];
  try {
    jsonlFiles = fs
      .readdirSync(dir)
      .filter((f) => f.endsWith(".jsonl") && !f.includes("config-audit"))
      .map((f) => path.join(dir, f));
  } catch {
    // Directory doesn't exist
    jsonlFiles = [];
  }

  const sessions: {
    id: string;
    startedAt: number;
    totalCost: number;
    inputCost: number;
    outputCost: number;
    cacheReadCost: number;
    cacheWriteCost: number;
    preview: string;
  }[] = [];

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const startOfWeekMs = startOfWeek.getTime();

  // Track costs by day (for 14-day view)
  const byDayMap = new Map<string, { total: number; sessions: number }>();

  jsonlFiles.forEach((file) => {
    const lines = parseJSONL(file);
    if (lines.length === 0) return;

    const id = path.basename(file, ".jsonl");
    
    // Find session start time from first message
    const msgLines = lines.filter((l) => l.type === "message" && l.message?.timestamp);
    const timestamps = msgLines.map((l) => l.message!.timestamp ?? 0).filter(Boolean) as number[];
    const firstTs = timestamps[0] ?? 0;
    
    // Calculate costs
    let totalCost = 0;
    let inputCost = 0;
    let outputCost = 0;
    let cacheReadCost = 0;
    let cacheWriteCost = 0;

    lines.forEach((l) => {
      // Check usage lines
      if (l.type === "usage" && l.usage?.cost) {
        if (l.usage.cost.total) totalCost += l.usage.cost.total;
        if (l.usage.cost.input) inputCost += l.usage.cost.input;
        if (l.usage.cost.output) outputCost += l.usage.cost.output;
        if (l.usage.cost.cacheRead) cacheReadCost += l.usage.cost.cacheRead;
        if (l.usage.cost.cacheWrite) cacheWriteCost += l.usage.cost.cacheWrite;
      }
      // Check for cost in message entries
      if (l.message?.usage?.cost) {
        if (l.message.usage.cost.total) totalCost += l.message.usage.cost.total;
        if (l.message.usage.cost.input) inputCost += l.message.usage.cost.input;
        if (l.message.usage.cost.output) outputCost += l.message.usage.cost.output;
        if (l.message.usage.cost.cacheRead) cacheReadCost += l.message.usage.cost.cacheRead;
        if (l.message.usage.cost.cacheWrite) cacheWriteCost += l.message.usage.cost.cacheWrite;
      }
    });

    // Get preview from first user message
    const userMsgs = lines.filter(
      (l) => l.type === "message" && l.message?.role === "user"
    );
    let preview = "";
    if (userMsgs.length > 0) {
      const content = userMsgs[0].message?.content;
      if (typeof content === "string") {
        preview = content.slice(0, 120);
      } else if (Array.isArray(content)) {
        const textParts = content
          .filter((p: unknown) => (p as { type?: string }).type === "text")
          .map((p: unknown) => (p as { text?: string }).text ?? "");
        preview = textParts.join(" ").slice(0, 120);
      }
      preview = preview.replace(/\n/g, " ").trim();
    }

    sessions.push({
      id,
      startedAt: firstTs,
      totalCost,
      inputCost,
      outputCost,
      cacheReadCost,
      cacheWriteCost,
      preview,
    });

    // Add to day aggregation
    if (firstTs > 0 && totalCost > 0) {
      const dayStart = new Date(firstTs);
      dayStart.setHours(0, 0, 0, 0);
      const dayKey = dayStart.toISOString().split("T")[0];
      const existing = byDayMap.get(dayKey) || { total: 0, sessions: 0 };
      existing.total += totalCost;
      existing.sessions += 1;
      byDayMap.set(dayKey, existing);
    }
  });

  // Calculate totals
  let todayTotal = 0;
  let todaySessions = 0;
  let thisWeekTotal = 0;
  let thisWeekSessions = 0;
  let allTimeTotal = 0;

  sessions.forEach((s) => {
    allTimeTotal += s.totalCost;
    
    if (s.startedAt >= startOfToday) {
      todayTotal += s.totalCost;
      todaySessions++;
    }
    if (s.startedAt >= startOfWeekMs) {
      thisWeekTotal += s.totalCost;
      thisWeekSessions++;
    }
  });

  // Get top 10 sessions by cost
  const topSessions = [...sessions]
    .filter((s) => s.totalCost > 0)
    .sort((a, b) => b.totalCost - a.totalCost)
    .slice(0, 10)
    .map((s) => ({
      id: s.id,
      preview: s.preview,
      cost: s.totalCost,
      startedAt: s.startedAt,
    }));

  // Build 14-day array
  const byDay: { date: string; total: number; sessions: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const dayKey = d.toISOString().split("T")[0];
    const dayData = byDayMap.get(dayKey) || { total: 0, sessions: 0 };
    byDay.push({
      date: dayKey,
      total: dayData.total,
      sessions: dayData.sessions,
    });
  }

  // Breakdown totals
  const breakdown = {
    input: sessions.reduce((sum, s) => sum + s.inputCost, 0),
    output: sessions.reduce((sum, s) => sum + s.outputCost, 0),
    cacheRead: sessions.reduce((sum, s) => sum + s.cacheReadCost, 0),
    cacheWrite: sessions.reduce((sum, s) => sum + s.cacheWriteCost, 0),
  };

  return NextResponse.json({
    today: { total: todayTotal, sessions: todaySessions },
    thisWeek: { total: thisWeekTotal, sessions: thisWeekSessions },
    allTime: { total: allTimeTotal, sessions: sessions.length },
    byDay,
    topSessions,
    breakdown,
  });
}
