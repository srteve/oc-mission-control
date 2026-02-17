import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getActivitiesFromTranscripts } from "@/lib/transcript";

const STATUS_FILE = path.join(process.cwd(), "data", "status.json");

type AgentStatus = {
  state: "idle" | "active" | "running";
  since: number;
  label?: string;
};

function read(): AgentStatus {
  try {
    return JSON.parse(fs.readFileSync(STATUS_FILE, "utf-8"));
  } catch {
    return { state: "idle", since: Date.now() };
  }
}

export async function GET() {
  const status = read();
  
  // Check if we should auto-idle based on file status
  if (status.state !== "idle" && Date.now() - status.since > 5 * 60 * 1000) {
    return NextResponse.json({ ...status, state: "idle" });
  }
  
  // Also check transcript activity - if most recent is < 5 minutes, consider active
  if (status.state === "idle") {
    try {
      const transcriptActivities = getActivitiesFromTranscripts({ limit: 1 });
      if (transcriptActivities.length > 0) {
        const lastTranscriptTime = transcriptActivities[0]._creationTime;
        const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
        if (lastTranscriptTime > fiveMinutesAgo) {
          return NextResponse.json({ state: "active", since: lastTranscriptTime });
        }
      }
    } catch {
      // Ignore transcript errors, fall back to file-based status
    }
  }
  
  return NextResponse.json(status);
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const status: AgentStatus = {
      state: body.state ?? "idle",
      since: Date.now(),
      label: body.label ?? "",
    };
    fs.mkdirSync(path.dirname(STATUS_FILE), { recursive: true });
    fs.writeFileSync(STATUS_FILE, JSON.stringify(status));
    return NextResponse.json(status);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
