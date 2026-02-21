import { NextRequest, NextResponse } from "next/server";
import { reviews } from "@/lib/store";

export async function GET() {
  return NextResponse.json(reviews.list());
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { ideaId, clarity, usefulness, doneness, notes } = body;
    if ([clarity, usefulness, doneness].some((v) => typeof v !== "number")) {
      return NextResponse.json({ error: "clarity, usefulness, doneness are required" }, { status: 400 });
    }
    const entry = reviews.add({ ideaId, clarity, usefulness, doneness, notes });
    return NextResponse.json(entry);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
