import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const WORKSPACE = "/Users/quinn/.openclaw/workspace";

function statSafe(p: string) {
  try { return fs.statSync(p); } catch { return null; }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const file = searchParams.get("file"); // e.g. "MEMORY.md" or "memory/2026-02-15.md"

  if (file) {
    const filePath = path.join(WORKSPACE, file);
    // security: only allow files within workspace
    if (!filePath.startsWith(WORKSPACE)) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    try {
      const content = fs.readFileSync(filePath, "utf-8");
      const stat = fs.statSync(filePath);
      return NextResponse.json({ content, updatedAt: stat.mtimeMs });
    } catch {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }
  }

  // List available memory files
  const files: { name: string; path: string; updatedAt: number; size: number }[] = [];

  // Core workspace files
  const coreFiles = ["MEMORY.md", "SOUL.md", "USER.md", "AGENTS.md", "TOOLS.md", "IDENTITY.md"];
  for (const f of coreFiles) {
    const fp = path.join(WORKSPACE, f);
    const s = statSafe(fp);
    if (s) files.push({ name: f, path: f, updatedAt: s.mtimeMs, size: s.size });
  }

  // Daily memory files
  const memDir = path.join(WORKSPACE, "memory");
  if (fs.existsSync(memDir)) {
    const daily = fs.readdirSync(memDir)
      .filter((f) => f.endsWith(".md") && !f.startsWith("heartbeat"))
      .sort()
      .reverse();
    for (const f of daily) {
      const fp = path.join(memDir, f);
      const s = statSafe(fp);
      if (s) files.push({ name: f, path: `memory/${f}`, updatedAt: s.mtimeMs, size: s.size });
    }
  }

  return NextResponse.json(files);
}

export async function PUT(req: NextRequest) {
  try {
    const { file, content } = await req.json();

    if (!file || typeof content !== "string") {
      return NextResponse.json({ error: "invalid payload" }, { status: 400 });
    }

    // Only allow .md files
    if (!file.endsWith(".md")) {
      return NextResponse.json({ error: "only .md files allowed" }, { status: 400 });
    }

    const filePath = path.join(WORKSPACE, file);

    // Security: only allow files within workspace
    if (!filePath.startsWith(WORKSPACE)) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    // Write the content
    fs.writeFileSync(filePath, content, "utf-8");

    return NextResponse.json({ ok: true, updatedAt: Date.now() });
  } catch (e) {
    return NextResponse.json({ error: "server error" }, { status: 500 });
  }
}
