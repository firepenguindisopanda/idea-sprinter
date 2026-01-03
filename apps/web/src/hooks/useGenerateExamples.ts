"use client";

import { useCallback, useMemo, useState } from "react";
import type { PreGenerationRequest } from "@/types";

export type ExampleItem = {
  id: string;
  title: string;
  one_line: string;
  full_text: string;
  scope_bullets?: string[];
  tags?: string[];
};

type GenerateExamplesResult = {
  examples: ExampleItem[];
  mock?: boolean;
};

function decodeEscapedNewlines(s: string) {
  return s.replaceAll(String.raw`\n`, "\n");
}

function isJsonResponse(res: Response) {
  return res.headers.get("content-type")?.includes("application/json") ?? false;
}

async function postJson(url: string, body: unknown) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const msg = await res.text();
    throw new Error(msg || `Request failed (${res.status})`);
  }

  return res;
}

type ParsedSseEvent = {
  event: string;
  data: string;
};

function splitSseBuffer(buffer: string) {
  const parts = buffer.split("\n\n");
  const rest = parts.pop() ?? "";
  return { parts, rest };
}

function parseSsePart(part: string): ParsedSseEvent | null {
  const lines = part.split("\n");
  const eventLine = lines.find((l) => l.startsWith("event:"));
  const dataLine = lines.find((l) => l.startsWith("data:"));
  if (!eventLine || !dataLine) return null;

  return {
    event: eventLine.slice("event:".length).trim(),
    data: dataLine.slice("data:".length).trim(),
  };
}

function dispatchSseEvent(
  parsed: ParsedSseEvent,
  handlers: {
    onChunk: (text: string) => void;
    onDone: (result: GenerateExamplesResult) => void;
  }
) {
  if (parsed.event === "chunk") {
    handlers.onChunk(decodeEscapedNewlines(parsed.data));
  }
  if (parsed.event === "done") {
    handlers.onDone(JSON.parse(parsed.data) as GenerateExamplesResult);
  }
}

async function consumeSSE(
  res: Response,
  handlers: {
    onChunk: (text: string) => void;
    onDone: (result: GenerateExamplesResult) => void;
  }
) {
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
      const parsed = parseSsePart(part);
      if (!parsed) continue;
      dispatchSseEvent(parsed, handlers);
    }
  }
}

export function useGenerateExamples() {
  const [isLoading, setIsLoading] = useState(false);
  const [streamText, setStreamText] = useState("");
  const [examples, setExamples] = useState<ExampleItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setIsLoading(false);
    setStreamText("");
    setExamples(null);
    setError(null);
  }, []);

  const generate = useCallback(async (req: PreGenerationRequest, opts?: { stream?: boolean }) => {
    setIsLoading(true);
    setStreamText("");
    setExamples(null);
    setError(null);

    const stream = opts?.stream !== false;
    const url = stream ? "/api/generate-examples?stream=1" : "/api/generate-examples";

    try {
      const res = await postJson(url, req);

      // Non-streaming JSON (or server chose to respond with JSON)
      if (!stream || !res.body || isJsonResponse(res)) {
        const json = (await res.json()) as GenerateExamplesResult;
        setExamples(json.examples);
        return;
      }

      await consumeSSE(res, {
        onChunk: (text) => setStreamText((prev) => prev + text),
        onDone: (result) => setExamples(result.examples),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate examples");
    } finally {
      setIsLoading(false);
    }
  }, []);

  return useMemo(
    () => ({ isLoading, streamText, examples, error, generate, reset }),
    [isLoading, streamText, examples, error, generate, reset]
  );
}
