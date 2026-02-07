import { NextRequest } from "next/server";
import type { PreGenerationRequest } from "@/types";

export const runtime = "edge";

type ExampleItem = {
  id: string;
  title: string;
  one_line: string;
  full_text: string;
  scope_bullets?: string[];
  tags?: string[];
};

type StreamHandlers = {
  onChunk: (text: string) => void;
  onDone: () => void;
};

function tryParseExamplesFromContent(content: string): ExampleItem[] | null {
  const fenced = content.match(/```json\s*([\s\S]*?)```/i) ?? content.match(/```\s*([\s\S]*?)```/i);
  const jsonText = fenced ? fenced[1] : content;

  try {
    const parsed = JSON.parse(jsonText.trim());
    if (Array.isArray(parsed)) return parsed as ExampleItem[];
    if (parsed && Array.isArray((parsed as any).examples)) return (parsed as any).examples as ExampleItem[];
  } catch (err) {
    // ignore parsing errors and fall back
  }

  return null;
}

function tryExtractExamplesFromChoicePayload(payload: any): ExampleItem[] | null {
  const content = payload?.choices?.[0]?.message?.content;
  if (!content || typeof content !== "string") return null;
  return tryParseExamplesFromContent(content);
}

function buildMockExamples(req: PreGenerationRequest): ExampleItem[] {
  const seeds = ["MVP", "Medium", "Ambitious"];
  const count = Math.max(1, Math.min(req.exampleCount ?? 3, 5));
  const items: ExampleItem[] = [];

  for (let i = 0; i < count; i++) {
    const complexity = seeds[i % seeds.length] ?? "Intermediate";
    const title = `${req.title} - ${complexity}`;
    const techDisplay = req.techStack ? ` using ${req.techStack}` : "";
    const oneLine = `${req.title}: ${complexity} ${req.audience} focused solution${techDisplay}`;
    const bullets = [`${complexity} scope item 1`, `${complexity} scope item 2`, `${complexity} scope item 3`];
    const constraints = [req.constraints].filter(Boolean).join(" | ");
    const mustHave = (req.mustHaveFeatures ?? []).slice(0, 3).map((item) => `- ${item}`).join("\n");
    const domain = req.domain ? `Domain: ${req.domain}\n` : "";
    const problem = req.problemStatement ? `Problem: ${req.problemStatement}\n\n` : "";

    items.push({
      id: `${i}`,
      title,
      one_line: oneLine,
      full_text:
        `# ${req.title} (${complexity})\n\n` +
        `${oneLine}\n\n` +
        `${domain}` +
        `${problem}` +
        `Scope:\n- ${bullets[0]}\n- ${bullets[1]}\n- ${bullets[2]}\n\n` +
        `Must-have:\n${mustHave || "(none specified)"}\n\n` +
        `Tone: ${req.desiredTone || "(not specified)"}\n` +
        `Constraints: ${constraints || "(none)"}\n`,
      scope_bullets: bullets,
      tags: [complexity],
    });
  }

  return items;
}

function validateBody(body: any): asserts body is PreGenerationRequest {
  if (!body || typeof body !== "object") throw new Error("Invalid body");
  if (!body.title || !body.audience) throw new Error("Missing required fields");
  if (!body.problemStatement) throw new Error("Missing required fields");
  if (typeof body.exampleCount !== "number") body.exampleCount = 3;
}

function splitSseBuffer(buffer: string) {
  const parts = buffer.split(/\r?\n\r?\n/);
  const rest = parts.pop() ?? "";
  return { parts, rest };
}

function parseSseDataLines(part: string): string[] {
  return part
    .split(/\r?\n/)
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice("data:".length).trim());
}

async function consumeUpstreamSse(res: Response, handlers: StreamHandlers) {
  if (!res.body) throw new Error("Streaming response missing body");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const { parts, rest } = splitSseBuffer(buffer);
    buffer = rest;

    for (const part of parts) {
      const dataLines = parseSseDataLines(part);
      for (const data of dataLines) {
        if (!data) continue;
        if (data === "[DONE]") {
          handlers.onDone();
          return;
        }

        try {
          const payload = JSON.parse(data);
          const delta = payload?.choices?.[0]?.delta?.content;
          if (typeof delta === "string" && delta.length > 0) {
            handlers.onChunk(delta);
          }
        } catch (err) {
          // Ignore malformed JSON chunks and keep streaming
        }
      }
    }
  }

  handlers.onDone();
}

export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  const stream = url.searchParams.get("stream") === "1";

  let body: any;
  try {
    body = await req.json();
    validateBody(body);
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Invalid request" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // If NVIDIA key is present, forward to the NVIDIA Integrate endpoint
  const NV_API_KEY = process.env.NVIDIA_API_KEY;
  if (NV_API_KEY) {
    try {
      const nvPayload = buildNvidiaPayload(body, stream);
      const upstream = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${NV_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(nvPayload),
      });

      if (!upstream.ok) {
        const text = await upstream.text();
        throw new Error(text || `NVIDIA request failed (${upstream.status})`);
      }

      // If upstream is streaming, just pipe the body to the client
      if (stream && upstream.body) {
        const encoder = new TextEncoder();
        const streamText = new TransformStream<Uint8Array, Uint8Array>();
        const writer = streamText.writable.getWriter();
        const send = (event: string, data: string) => {
          const escaped = data.replaceAll("\n", String.raw`\n`);
          writer.write(encoder.encode(`event: ${event}\ndata: ${escaped}\n\n`));
        };

        let fullText = "";
        consumeUpstreamSse(upstream, {
          onChunk: (text) => {
            fullText += text;
            send("chunk", text);
          },
          onDone: () => {
            const parsed = tryParseExamplesFromContent(fullText);
            if (parsed) {
              send("done", JSON.stringify({ examples: parsed, vendor: "nvidia" }));
            } else {
              const fallback = buildMockExamples(body);
              send("done", JSON.stringify({ examples: fallback, mock: true, vendor: "nvidia", parseError: true }));
            }
            writer.close();
          },
        }).catch(() => {
          const fallback = buildMockExamples(body);
          send("done", JSON.stringify({ examples: fallback, mock: true, vendor: "nvidia", parseError: true }));
          writer.close();
        });

        return new Response(streamText.readable, {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
          },
        });
      }

      // Otherwise return an examples array (attempt to parse model text as JSON array)
      const json = await upstream.json();

      // If it already has the examples property, return as-is
      if ((json as any).examples) {
        return new Response(JSON.stringify(json), {
          headers: { "Content-Type": "application/json" },
        });
      }

      // Try to parse examples from the first choice message content (OpenAI-style payload)
      const choiceExamples = tryExtractExamplesFromChoicePayload(json);
      if (choiceExamples) {
        return new Response(JSON.stringify({ examples: choiceExamples, vendor: "nvidia" }), {
          headers: { "Content-Type": "application/json" },
        });
      }

      // Try to find a JSON array anywhere in the upstream response text as a loose fallback
      const asString = JSON.stringify(json);
      const arrayMatch = asString.match(/(\[[\s\S]*\])/);
      if (arrayMatch) {
        try {
          const arr = JSON.parse(arrayMatch[1]);
          if (Array.isArray(arr)) {
            return new Response(JSON.stringify({ examples: arr, vendor: "nvidia" }), {
              headers: { "Content-Type": "application/json" },
            });
          }
        } catch (err) {
          // fallthrough
        }
      }

      // As a last fallback, return mock examples for a consistent UI experience
      console.warn("Could not parse NVIDIA response into examples; returning mock.");
      // continue to fallback to mock below
    } catch (err) {
      // Fall back to mock if NVIDIA fails
      console.error("NVIDIA request failed:", err);
    }
  }

  const examples = buildMockExamples(body);

  if (!stream) {
    return new Response(JSON.stringify({ examples, mock: true }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const encoder = new TextEncoder();
  const chunks = [
    "Contacting generator...\n",
    "Drafting options...\n",
    "Finalizing examples...\n",
  ];

  const sseStream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: string, data: string) => {
        const escaped = data.replaceAll("\n", String.raw`\n`);
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${escaped}\n\n`));
      };

      for (const c of chunks) {
        send("chunk", c);
        await new Promise((r) => setTimeout(r, 150));
      }

      send("done", JSON.stringify({ examples, mock: true }));
      controller.close();
    },
  });

  return new Response(sseStream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

function buildNvidiaPayload(req: PreGenerationRequest, stream: boolean) {
  const prompt = `Generate ${req.exampleCount ?? 3} distinct project descriptions for a project titled: "${req.title}".
For each example, include: a 1-line summary, 3 short bullet scope points, constraints, suggested timeline, and one-sentence acceptance criteria. Vary complexity across examples: one MVP, one medium, one ambitious. Return JSON array with fields: id, one_line, full_text, scope_bullets, constraints, timeline, acceptance_criteria, tags. Use the following context:\n\nTitle: ${req.title}\nAudience: ${req.audience}\nProblem: ${req.problemStatement}\nDomain: ${req.domain || "(unspecified)"}\nMust-have features: ${(req.mustHaveFeatures ?? []).join(", ") || "(none)"}\nTech Stack: ${req.techStack || "(unspecified)"}\nTone: ${req.desiredTone || "(not specified)"}\nConstraints: ${req.constraints || "(none)"}`;

  const messages = [
    { role: "system", content: "You are a helpful assistant that returns structured JSON output." },
    { role: "user", content: prompt },
  ];

  return {
    model: process.env.NVIDIA_MODEL || "deepseek-ai/deepseek-v3.1-terminus",
    messages,
    temperature: 0.2,
    top_p: 0.7,
    max_tokens: 1000,
    stream,
  };
}
