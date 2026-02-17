import fs from "fs";
import path from "path";

const SESSIONS_DIR = "/Users/quinn/.openclaw/agents/main/sessions";

export type TranscriptActivity = {
  _id: string;
  _creationTime: number;
  type: string;
  title: string;
  description?: string;
  sessionId: string;
};

const TOOL_MAP: Record<string, { type: string; label: (args: Record<string, unknown>) => string }> = {
  web_search: { type: "web_search", label: (a) => `Searched: ${String(a.query ?? "").slice(0, 80)}` },
  write: { type: "file_write", label: (a) => `Wrote: ${String(a.path ?? a.file_path ?? "").split("/").pop()}` },
  edit: { type: "file_write", label: (a) => `Edited: ${String(a.path ?? a.file_path ?? "").split("/").pop()}` },
  Read: { type: "file_read", label: (a) => `Read: ${String(a.path ?? "").split("/").pop()}` },
  read: { type: "file_read", label: (a) => `Read: ${String(a.path ?? a.file_path ?? "").split("/").pop()}` },
  message: { type: "message_sent", label: (_) => "Sent message" },
  memory_search: { type: "memory_updated", label: (a) => `Memory search: ${String(a.query ?? "").slice(0, 60)}` },
  memory_get: { type: "file_read", label: (a) => `Memory read: ${String(a.path ?? "").split("/").pop()}` },
  browser: { type: "tool_use", label: (a) => `Browser: ${String(a.action ?? "")}` },
  exec: { type: "build", label: (a) => `Exec: ${String(a.command ?? "").slice(0, 60)}` },
  sessions_spawn: { type: "tool_use", label: (_) => "Spawned sub-agent" },
  sessions_list: { type: "tool_use", label: (_) => "Listed sessions" },
  cron: { type: "tool_use", label: (a) => `Cron: ${String(a.action ?? "")}` },
  tts: { type: "tool_use", label: (_) => "Text to speech" },
  image: { type: "tool_use", label: (_) => "Image analysis" },
};

const SKIP_TOOLS = new Set([
  "sessions_history",
  "process",
  "nodes",
  "gateway",
  "agents_list",
  "session_status",
]);

interface JsonLine {
  type: string;
  id?: string;
  timestamp?: string;
  message?: {
    role: string;
    content?: Array<{
      type: string;
      name?: string;
      id?: string;
      arguments?: Record<string, unknown>;
    }>;
  };
}

function getSessionFilesSince(sinceMs: number): string[] {
  try {
    const files = fs.readdirSync(SESSIONS_DIR);
    return files
      .filter((f) => f.endsWith(".jsonl"))
      .map((f) => ({
        name: f,
        mtime: fs.statSync(path.join(SESSIONS_DIR, f)).mtimeMs,
      }))
      .filter((f) => f.mtime >= sinceMs)
      .map((f) => path.join(SESSIONS_DIR, f.name));
  } catch {
    return [];
  }
}

export function getActivitiesFromTranscripts(opts?: {
  since?: number;
  limit?: number;
  types?: string[];
}): TranscriptActivity[] {
  const activities: TranscriptActivity[] = [];
  
  // Default: last 30 days if no since specified
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const since = opts?.since ?? thirtyDaysAgo;
  
  const files = getSessionFilesSince(since);
  
  for (const filePath of files) {
    try {
      const content = fs.readFileSync(filePath, "utf-8");
      const lines = content.split("\n").filter((l) => l.trim());
      
      const sessionId = path.basename(filePath).replace(".jsonl", "").slice(0, 8);
      
      for (const line of lines) {
        try {
          const parsed: JsonLine = JSON.parse(line);
          
          if (parsed.type !== "message") continue;
          if (parsed.message?.role !== "assistant") continue;
          if (!parsed.timestamp) continue;
          
          const timestamp = new Date(parsed.timestamp).getTime();
          if (timestamp < since) continue;
          
          const toolCalls = parsed.message.content?.filter(
            (c) => c.type === "toolCall" && c.name
          ) ?? [];
          
          for (const tc of toolCalls) {
            if (!tc.name) continue;
            if (SKIP_TOOLS.has(tc.name)) continue;
            
            const mapped = TOOL_MAP[tc.name];
            if (!mapped) continue;

            // Skip noisy exec patterns
            if (tc.name === 'exec') {
              const cmd = String(tc.arguments?.command ?? '');
              if (cmd.startsWith('curl -s http://localhost') || 
                  cmd.startsWith('curl -s "http://localhost') ||
                  cmd.startsWith('curl --') ||
                  /^(ls|wc|cat|echo|sleep|chmod|which|brew list)/.test(cmd.trim())) {
                continue;
              }
            }
            
            if (opts?.types && !opts.types.includes(mapped.type)) continue;
            
            const activity: TranscriptActivity = {
              _id: `tc_${sessionId}_${tc.id?.slice(-6) ?? Date.now()}`,
              _creationTime: timestamp,
              type: mapped.type,
              title: mapped.label(tc.arguments ?? {}),
              sessionId,
            };
            
            activities.push(activity);
          }
        } catch {
          // Skip malformed lines
        }
      }
    } catch {
      // Skip unreadable files
    }
  }
  
  // Sort by time descending (newest first)
  activities.sort((a, b) => b._creationTime - a._creationTime);
  
  if (opts?.limit) {
    return activities.slice(0, opts.limit);
  }
  
  return activities;
}
