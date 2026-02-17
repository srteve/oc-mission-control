import { NextRequest, NextResponse } from "next/server";

const GATEWAY_URL = "http://localhost:18789";
const GATEWAY_TOKEN = "50fd5e5a6d316beacadd1bb6d55f51905e2887bbbd4f3f94";

async function gatewayInvoke(tool: string, args: Record<string, unknown>) {
  try {
    const res = await fetch(`${GATEWAY_URL}/tools/invoke`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GATEWAY_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ tool, args, sessionKey: "main" }),
    });
    if (!res.ok) {
      console.error(`Gateway error: ${res.status} ${res.statusText}`);
      return null;
    }
    const data = await res.json();
    return data;
  } catch (err) {
    console.error("Gateway invoke error:", err);
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message } = body;

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // Send wake event with the message via cron tool
    const result = await gatewayInvoke("cron", { 
      action: "wake", 
      text: "[Workshop] " + message.trim(),
      mode: "now"
    });

    if (!result) {
      return NextResponse.json({ 
        error: "Failed to send message to Quinn. Gateway may be unavailable." 
      }, { status: 502 });
    }

    return NextResponse.json({ 
      success: true, 
      message: message.trim(),
      result 
    });
  } catch (err) {
    console.error("Workshop send error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
