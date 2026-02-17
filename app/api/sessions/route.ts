import { NextRequest, NextResponse } from "next/server";
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
    usage?: { cost?: { total?: number } };
  };
  usage?: { cost?: { total?: number } };
};

type ParsedMessage = {
  role: string;
  text: string;
  timestamp?: number;
  cost?: number;
};

function parseJSONL(filePath: string): RawLine[] {
  try {
    const lines = fs.readFileSync(filePath, "utf-8").split("\n").filter(Boolean);
    return lines.map((l) => JSON.parse(l));
  } catch {
    return [];
  }
}

function extractText(content: unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    const parts = content
      .filter((p: unknown) => (p as { type?: string }).type === "text")
      .map((p: unknown) => (p as { text?: string }).text ?? "");
    return parts.join(" ");
  }
  return "";
}

function stripMetadataBlock(text: string): string {
  // Strip the metadata block: remove from start up to and including closing ``` of JSON block
  const metadataPattern = /^Conversation info \(untrusted metadata\):\n```json\n[\s\S]*?```\n*/;
  return text.replace(metadataPattern, '');
}

function extractPreview(messages: ParsedMessage[]): string {
  // Find first user message that has meaningful content
  const userMsgs = messages.filter((m) => m.role === "user");
  
  for (const msg of userMsgs) {
    // Strip metadata block first
    const cleaned = stripMetadataBlock(msg.text);
    // Check if we have enough content after stripping
    if (cleaned.trim().length >= 5) {
      return cleaned.slice(0, 120).replace(/\n/g, " ").trim();
    }
  }
  
  // If no suitable user message, try assistant messages
  const assistantMsgs = messages.filter((m) => m.role === "assistant");
  for (const msg of assistantMsgs) {
    const cleaned = stripMetadataBlock(msg.text);
    if (cleaned.trim().length >= 5) {
      return cleaned.slice(0, 120).replace(/\n/g, " ").trim();
    }
  }
  
  return "";
}

function getSessionsDir() {
  if (fs.existsSync(SESSIONS_DIR)) return SESSIONS_DIR;
  return WORKSPACE;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("id");

  const dir = getSessionsDir();
  const jsonlFiles = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".jsonl") && !f.includes("config-audit"))
    .map((f) => path.join(dir, f));

  if (sessionId) {
    const file = jsonlFiles.find((f) => f.includes(sessionId));
    if (!file) return NextResponse.json({ error: "not found" }, { status: 404 });

    const lines = parseJSONL(file);
    const messages: ParsedMessage[] = lines
      .filter((l) => l.type === "message" && l.message?.role && l.message.role !== "toolResult")
      .map((l) => ({
        role: l.message!.role,
        text: extractText(l.message!.content),
        timestamp: l.message!.timestamp ?? (l.timestamp ? new Date(l.timestamp).getTime() : undefined),
        cost: l.usage?.cost?.total,
      }))
      .filter((m) => m.text.trim().length > 0);

    return NextResponse.json({ id: sessionId, messages });
  }

  // List sessions
  const sessions = jsonlFiles
    .map((f) => {
      const lines = parseJSONL(f);
      if (lines.length === 0) return null;

      const sessionMeta = lines.find((l) => l.type === "session");
      const msgLines = lines.filter(
        (l) => l.type === "message" && l.message?.role && l.message.role !== "toolResult"
      );

      if (msgLines.length === 0) return null;

      const timestamps = msgLines
        .map((l) => l.message?.timestamp ?? (l.timestamp ? new Date(l.timestamp).getTime() : 0))
        .filter(Boolean) as number[];

      const firstTs = timestamps[0] ?? 0;
      const lastTs = timestamps[timestamps.length - 1] ?? firstTs;

      const userMsgs = msgLines.filter((l) => l.message?.role === "user");
      const assistantMsgs = msgLines.filter((l) => l.message?.role === "assistant");

      // First real user message (skip heartbeats)
      const firstUser = userMsgs.find((l) => {
        const text = extractText(l.message?.content);
        return text.length > 10 && !text.startsWith("Read HEARTBEAT");
      });
      const preview = firstUser ? extractPreview([{ role: "user", text: extractText(firstUser.message?.content) }]) : "";

      const id = path.basename(f, ".jsonl");

      // Calculate total cost from usage lines and messages with cost
      let totalCost = 0;
      lines.forEach((l) => {
        if (l.type === "usage" && l.usage?.cost?.total) {
          totalCost += l.usage.cost.total;
        }
        // Also check for cost in message entries
        if (l.message?.usage?.cost?.total) {
          totalCost += l.message.usage.cost.total;
        }
      });

      return {
        id,
        startedAt: firstTs,
        lastActiveAt: lastTs,
        messageCount: msgLines.length,
        userMessages: userMsgs.length,
        assistantMessages: assistantMsgs.length,
        totalCost,
        preview: preview.replace(/\n/g, " ").trim(),
        sessionMeta: sessionMeta?.timestamp,
      };
    })
    .filter(Boolean)
    .sort((a, b) => (b!.lastActiveAt ?? 0) - (a!.lastActiveAt ?? 0));

  return NextResponse.json(sessions);
}
