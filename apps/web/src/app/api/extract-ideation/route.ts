import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

interface ExtractionResult {
  suggestedTitle: string;
  suggestedAudience: string;
  problemStatement: string;
}

async function extractWithAI(rawInput: string): Promise<ExtractionResult> {
  const NV_API_KEY = process.env.NVIDIA_API_KEY;

  if (!NV_API_KEY) {
    throw new Error("NVIDIA_API_KEY not configured");
  }

  const prompt = `Analyze this project idea and extract key information. Return ONLY valid JSON:

{
  "suggestedTitle": "A short, descriptive project name (3-6 words, title case)",
  "suggestedAudience": "Who this is for - be specific about the target users or customers",
  "problemStatement": "The core problem or opportunity in 1-2 sentences"
}

Project idea: "${rawInput}"

Requirements:
- suggestedTitle: Clean, professional title (no brackets, no "Project" prefix, no emojis)
- suggestedAudience: Specific target (e.g., "Small business owners who manage remote teams" not just "businesses")
- problemStatement: Focus on the actual problem or need being addressed

Respond with ONLY valid JSON, no markdown, no explanation.`;

  const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${NV_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.NVIDIA_MODEL || "deepseek-ai/deepseek-v3.1-terminus",
      messages: [
        { role: "system", content: "You are a helpful assistant that extracts information and returns ONLY valid JSON." },
        { role: "user", content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 500,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`NVIDIA API error: ${text}`);
  }

  const json = await response.json();
  const content = json.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("No content in response");
  }

  // Try to parse JSON from the response
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        suggestedTitle: parsed.suggestedTitle || rawInput.slice(0, 50).replace(/[^\w\s]/g, "").trim(),
        suggestedAudience: parsed.suggestedAudience || "Users interested in this solution",
        problemStatement: parsed.problemStatement || rawInput,
      };
    } catch {
      // Fall through to fallback
    }
  }

  throw new Error("Could not parse extraction response");
}

function fallbackExtraction(rawInput: string): ExtractionResult {
  // Simple heuristic-based extraction as fallback
  const words = rawInput.split(/\s+/);
  const title = words.slice(0, 6).join(" ").replace(/^[a-z]/, (c) => c.toUpperCase());

  // Try to find audience patterns
  let audience = "Users interested in this solution";
  const forMatch = rawInput.match(/for\s+([^.!?]+)/i);
  if (forMatch) {
    audience = forMatch[1].trim();
  }

  return {
    suggestedTitle: title,
    suggestedAudience: audience,
    problemStatement: rawInput,
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawInput = body.description || body.rawInput || "";

    if (!rawInput || typeof rawInput !== "string") {
      return NextResponse.json(
        { error: "Description is required" },
        { status: 400 }
      );
    }

    let result: ExtractionResult;

    try {
      result = await extractWithAI(rawInput);
    } catch (err) {
      console.warn("AI extraction failed, using fallback:", err);
      result = fallbackExtraction(rawInput);
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("Extraction error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Extraction failed" },
      { status: 500 }
    );
  }
}
