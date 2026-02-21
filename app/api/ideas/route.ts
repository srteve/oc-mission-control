import { NextRequest, NextResponse } from "next/server";
import { ideas } from "@/lib/store";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? undefined;
  const owner = searchParams.get("owner") ?? undefined;
  const q = searchParams.get("q") ?? undefined;
  return NextResponse.json(ideas.list({ status, owner, q }));
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, summary, status, tags, link, owner } = body;
    if (!title) {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }
    const entry = ideas.add({
      title,
      summary,
      status: status ?? "Exploring",
      tags: Array.isArray(tags) ? tags : [],
      link,
      owner: owner ?? "Quinn",
    });
    return NextResponse.json(entry);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, patch } = body;
    if (!id || !patch) {
      return NextResponse.json({ error: "id and patch are required" }, { status: 400 });
    }
    const entry = ideas.update(id, patch);
    if (!entry) return NextResponse.json({ error: "not found" }, { status: 404 });
    return NextResponse.json(entry);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { id } = body;
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const ok = ideas.remove(id);
    return NextResponse.json({ ok });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
