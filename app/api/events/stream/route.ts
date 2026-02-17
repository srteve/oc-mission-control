import { activities } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const encoder = new TextEncoder();
  let lastId = "";

  const stream = new ReadableStream({
    start(controller) {
      const send = (event: string, data: unknown) => {
        try {
          controller.enqueue(
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
          );
        } catch {
          // client disconnected
        }
      };

      send("connected", { ts: Date.now() });

      // Seed lastId with current latest
      const initial = activities.list(undefined, 1);
      if (initial.length > 0) lastId = initial[0]._id;

      const interval = setInterval(() => {
        try {
          const latest = activities.list(undefined, 5);
          const newOnes = lastId
            ? latest.filter((a) => a._id !== lastId && a._creationTime > (latest.find(x => x._id === lastId)?._creationTime ?? 0))
            : latest.slice(0, 1);

          if (latest.length > 0 && latest[0]._id !== lastId) {
            lastId = latest[0]._id;
            send("activity", latest[0]);
          }

          send("heartbeat", { ts: Date.now() });
        } catch {
          clearInterval(interval);
        }
      }, 2000);

      // cleanup handled by client disconnect
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
