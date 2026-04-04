import { cookies } from "next/headers";

const API_URL = process.env.API_URL ?? "http://localhost:4000";

export async function GET() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  const upstream = await fetch(`${API_URL}/notifications/stream`, {
    headers: {
      Cookie: cookieHeader,
      Accept: "text/event-stream",
    },
  });

  if (!upstream.ok || !upstream.body) {
    return new Response(upstream.statusText, { status: upstream.status });
  }

  const stream = new ReadableStream({
    async start(controller) {
      const reader = upstream.body!.getReader();
      const encoder = new TextEncoder();

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          controller.enqueue(value);
        }
      } catch {
        // Connection closed
      } finally {
        controller.close();
      }
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

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
