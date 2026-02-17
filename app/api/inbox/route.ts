import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const SESSIONS_DIR = "/Users/quinn/.openclaw/agents/main/sessions";
const WORKSPACE = "/Users/quinn/.openclaw/workspace";

type RawLine = {
  type: string;
  timestamp?: string;
  channel?: string;
  message?: {
    role: string;
    content: unknown;
    timestamp?: number;
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

function stripMetadataPrefix(text: string): string {
  // Check for the metadata block pattern at the start
  const metadataPattern = /^Conversation info \(untrusted metadata\):\n```json\n[\s\S]*?```\n*/;
  const stripped = text.replace(metadataPattern, '');
  return stripped;
}

function shouldFilterMessage(text: string): boolean {
  const trimmed = text.trim();
  
  // Filter out empty or very short messages
  if (trimmed.length < 3) return true;
  
  // Filter out metadata prefix messages
  if (trimmed.startsWith("Conversation info (untrusted metadata)")) return true;
  
  // Filter out cron notification messages (e.g., [Tue, [Mon, etc.)
  if (/^\[(Mon|Tue|Wed|Thu|Fri|Sat|Sun)/.test(trimmed)) return true;
  
  // Filter out internal system instructions
  if (trimmed.includes("Summarize this naturally for the user")) return true;
  
  return false;
}

function getSessionsDir() {
  if (fs.existsSync(SESSIONS_DIR)) return SESSIONS_DIR;
  return WORKSPACE;
}

export async function GET(req: NextRequest) {
  const dir = getSessionsDir();
  
  // Get all jsonl files, sorted by modification time
  const jsonlFiles = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".jsonl") && !f.includes("config-audit") && !f.includes(".deleted.") && !f.includes(".reset."))
    .map((f) => ({
      name: f,
      path: path.join(dir, f),
      mtime: fs.statSync(path.join(dir, f)).mtimeMs,
    }))
    .sort((a, b) => b.mtime - a.mtime);

  const allMessages: Array<{
    role: "user" | "assistant";
    text: string;
    timestamp: number;
    sessionId: string;
    channel?: string;
  }> = [];

  for (const file of jsonlFiles) {
    const lines = parseJSONL(file.path);
    const sessionId = file.name.replace(".jsonl", "");
    
    // Check for session metadata to find channel
    const sessionMeta = lines.find((l) => l.type === "session");
    const channel = sessionMeta?.channel || "telegram"; // default to telegram if not specified

    const messages = lines
      .filter((l) => l.type === "message" && (l.message?.role === "user" || l.message?.role === "assistant"))
      .map((l) => ({
        role: l.message!.role as "user" | "assistant",
        text: extractText(l.message!.content),
        timestamp: l.message!.timestamp ?? (l.timestamp ? new Date(l.timestamp).getTime() : Date.now()),
        sessionId,
        channel: l.channel || channel,
      }))
      .filter((m) => {
        // Filter out empty messages
        if (!m.text.trim()) return false;
        // Filter out heartbeat messages
        if (m.text.startsWith("Read HEARTBEAT")) return false;
        // Filter out tool result messages
        if (m.text.includes("tool result for") || m.text.includes("Tool result:")) return false;
        // Filter out system/metadata messages (new filters)
        if (shouldFilterMessage(m.text)) return false;
        return true;
      })
      .map((m) => ({
        ...m,
        // Strip metadata prefix from user messages
        text: m.role === "user" ? stripMetadataPrefix(m.text) : m.text,
      }));

    allMessages.push(...messages);
  }

  // Sort all messages chronologically and take last 50
  const sortedMessages = allMessages
    .sort((a, b) => a.timestamp - b.timestamp)
    .slice(-50);

  // Calculate last active time
  const lastActiveAt = sortedMessages.length > 0 
    ? sortedMessages[sortedMessages.length - 1].timestamp 
    : Date.now();

  return NextResponse.json({
    messages: sortedMessages,
    lastActiveAt,
  });
}
