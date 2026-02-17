import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const TUNNEL_FILE = path.join(process.cwd(), "data", "tunnel.json");

export async function GET() {
  try {
    const raw = fs.readFileSync(TUNNEL_FILE, "utf-8");
    const data = JSON.parse(raw);
    return NextResponse.json({ url: data.url, startedAt: data.startedAt, active: true });
  } catch {
    return NextResponse.json({ url: null, active: false });
  }
}
