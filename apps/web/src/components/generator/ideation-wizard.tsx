"use client";

import { useState, useEffect } from "react";
import { Sparkles, ChevronRight, ChevronLeft, RotateCcw, Lightbulb, Target, Users, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { PreGenerationRequest } from "@/types";

interface IdeationWizardProps {
  value: PreGenerationRequest;
  onChange: (value: PreGenerationRequest) => void;
  onSubmit: (data: PreGenerationRequest) => void;
  isLoading?: boolean;
}

type WizardStep = "problem" | "refine" | "context" | "generate";

const PROMPT_SUGGESTIONS = [
  "I need a way to [do something] for [audience]",
  "We spend too much time [activity] - want to automate it",
  "My team struggles with [pain point] - need a solution",
  "I want to build something that helps [goal]",
  "There's no good tool for [problem area]",
];

interface ExtractedInfo {
  title?: string;
  audience?: string;
  problemStatement?: string;
  suggestedTitle?: string;
  suggestedAudience?: string;
}

export default function IdeationWizard({ value, onChange, onSubmit, isLoading }: Readonly<IdeationWizardProps>) {
  const [step, setStep] = useState<WizardStep>("problem");
  const [rawInput, setRawInput] = useState(value.problemStatement || "");
  const [extracted, setExtracted] = useState<ExtractedInfo>({});
  const [isExtracting, setIsExtracting] = useState(false);
  const [charCount, setCharCount] = useState(0);

  useEffect(() => {
    setCharCount(rawInput.length);
  }, [rawInput]);

  useEffect(() => {
    if (step === "refine" && !extracted.suggestedTitle && !isExtracting) {
      handleExtractInfo();
    }
  }, [step]);

  const handleExtractInfo = async () => {
    if (!rawInput.trim()) return;

    setIsExtracting(true);

    try {
      const res = await fetch("/api/extract-ideation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: rawInput }),
      });

      if (res.ok) {
        const data = await res.json();
        setExtracted({
          suggestedTitle: data.suggestedTitle || "",
          suggestedAudience: data.suggestedAudience || "",
          problemStatement: data.problemStatement || rawInput,
        });
      } else {
        throw new Error("Extraction failed");
      }
    } catch {
      // Fallback to simple extraction
      setExtracted({
        suggestedTitle: rawInput.slice(0, 50).replace(/[^\w\s]/g, "").trim() || rawInput.slice(0, 30),
        suggestedAudience: "Users with this problem",
        problemStatement: rawInput,
      });
    } finally {
      setIsExtracting(false);
    }
  };

  const handleApplyAndContinue = () => {
    onChange({
      ...value,
      title: extracted.suggestedTitle || value.title,
      audience: extracted.suggestedAudience || value.audience,
      problemStatement: extracted.problemStatement || value.problemStatement || rawInput,
    });
    setStep("context");
  };

  const handleNext = () => {
    if (step === "problem") {
      if (!rawInput.trim()) return;
      onChange({ ...value, problemStatement: rawInput });
      setStep("refine");
    } else if (step === "refine") {
      handleApplyAndContinue();
      setStep("context");
    } else if (step === "context") {
      setStep("generate");
    } else {
      onSubmit(value);
    }
  };

  const handleBack = () => {
    if (step === "refine") setStep("problem");
    else if (step === "context") setStep("refine");
    else if (step === "generate") setStep("context");
  };

  const steps = [
    { id: "problem", label: "What's your problem?", icon: Target },
    { id: "refine", label: "Refine details", icon: Lightbulb },
    { id: "context", label: "Add context", icon: Users },
    { id: "generate", label: "Generate ideas", icon: Sparkles },
  ] as const;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        {steps.map((s, i) => {
          const Icon = s.icon;
          const isActive = s.id === step;
          const isCompleted = steps.findIndex((x) => x.id === step) > i;

          return (
            <div key={s.id} className="flex items-center">
              <div className="flex items-center gap-2">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                    isActive
                      ? "border-amber-500 bg-amber-500 text-white"
                      : isCompleted
                      ? "border-green-500 bg-green-500 text-white"
                      : "border-muted bg-muted/30 text-muted-foreground"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span
                  className={`text-sm font-mono uppercase tracking-wider ${
                    isActive ? "text-amber-500" : isCompleted ? "text-green-500" : "text-muted-foreground"
                  }`}
                >
                  {s.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <ChevronRight className="w-6 h-6 mx-4 text-muted-foreground/30" />
              )}
            </div>
          );
        })}
      </div>

      {step === "problem" && (
        <Card className="border-amber-500/20">
          <CardHeader>
            <CardTitle className="text-xl font-mono uppercase flex items-center gap-2">
              <Target className="w-5 h-5 text-amber-500" />
              Describe your problem or idea
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                Don't worry about structure - just describe what you're thinking
              </Label>
              <Textarea
                value={rawInput}
                onChange={(e) => setRawInput(e.target.value)}
                placeholder="Example: I wish there was a way to quickly summarize PDF contracts without reading through all the legal jargon..."
                className="min-h-[180px] rounded-none border-primary/20 bg-background/50 font-mono text-sm"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{charCount} characters</span>
                <span className="text-amber-500/60">No title needed - just describe!</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                Stuck? Try one of these:
              </Label>
              <div className="flex flex-wrap gap-2">
                {PROMPT_SUGGESTIONS.map((suggestion, i) => (
                  <Badge
                    key={i}
                    variant="outline"
                    className="cursor-pointer rounded-none border-dashed border-amber-500/30 hover:bg-amber-500/10 text-xs font-mono"
                    onClick={() => setRawInput(suggestion)}
                  >
                    {suggestion.slice(0, 35)}...
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {step === "refine" && (
        <Card className="border-amber-500/20">
          <CardHeader>
            <CardTitle className="text-xl font-mono uppercase flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-amber-500" />
              {isExtracting ? "Analyzing your idea..." : "We extracted this from your description"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-amber-500/5 border border-amber-500/20 p-4 rounded-md">
              <p className="text-xs font-mono uppercase text-amber-500 mb-2">Original description:</p>
              <p className="text-sm italic text-muted-foreground">"{rawInput.slice(0, 200)}{rawInput.length > 200 ? "..." : ""}"</p>
            </div>

            {isExtracting ? (
              <div className="flex items-center justify-center py-8">
                <div className="flex flex-col items-center gap-3">
                  <RotateCcw className="w-8 h-8 text-amber-500 animate-spin" />
                  <p className="text-xs font-mono text-muted-foreground">Extracting suggestions...</p>
                </div>
              </div>
            ) : (
              <>
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-mono uppercase tracking-widest">Suggested Title</Label>
                    <Input
                      value={extracted.suggestedTitle || ""}
                      onChange={(e) => setExtracted({ ...extracted, suggestedTitle: e.target.value })}
                      placeholder="Enter a project title..."
                      className="rounded-none border-primary/20"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-mono uppercase tracking-widest">Target Audience</Label>
                    <Input
                      value={extracted.suggestedAudience || ""}
                      onChange={(e) => setExtracted({ ...extracted, suggestedAudience: e.target.value })}
                      placeholder="Who is this for?"
                      className="rounded-none border-primary/20"
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={handleApplyAndContinue}
                    className="rounded-none font-mono uppercase text-xs tracking-widest"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Apply & Continue
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setExtracted({})}
                    className="rounded-none font-mono uppercase text-xs tracking-widest"
                  >
                    Start Fresh
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {step === "context" && (
        <Card className="border-amber-500/20">
          <CardHeader>
            <CardTitle className="text-xl font-mono uppercase flex items-center gap-2">
              <Settings className="w-5 h-5 text-amber-500" />
              Additional context (optional)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                  Tech Stack (optional)
                </Label>
                <Input
                  value={value.techStack || ""}
                  onChange={(e) => onChange({ ...value, techStack: e.target.value })}
                  placeholder="React, Python, PostgreSQL..."
                  className="rounded-none border-primary/20"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                  Domain / Industry (optional)
                </Label>
                <Input
                  value={value.domain || ""}
                  onChange={(e) => onChange({ ...value, domain: e.target.value })}
                  placeholder="Healthcare, Finance, Education..."
                  className="rounded-none border-primary/20"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                Must-have features (optional)
              </Label>
              <Textarea
                value={(value.mustHaveFeatures || []).join("\n")}
                onChange={(e) =>
                  onChange({
                    ...value,
                    mustHaveFeatures: e.target.value.split("\n").map((x) => x.trim()).filter(Boolean),
                  })
                }
                placeholder="One per line&#10;User authentication&#10;Export to PDF..."
                rows={3}
                className="rounded-none border-primary/20"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                Constraints (optional)
              </Label>
              <Input
                value={value.constraints || ""}
                onChange={(e) => onChange({ ...value, constraints: e.target.value })}
                placeholder="Offline support, sub-100ms latency, etc."
                className="rounded-none border-primary/20"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {step === "generate" && (
        <Card className="border-amber-500/20">
          <CardHeader>
            <CardTitle className="text-xl font-mono uppercase flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              Ready to generate concepts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-amber-500/5 border border-amber-500/20 p-4 rounded-md">
              <div className="grid gap-2 text-sm">
                {value.title && (
                  <div className="flex gap-2">
                    <span className="font-mono text-xs uppercase text-muted-foreground w-24">Title:</span>
                    <span>{value.title}</span>
                  </div>
                )}
                {value.audience && (
                  <div className="flex gap-2">
                    <span className="font-mono text-xs uppercase text-muted-foreground w-24">Audience:</span>
                    <span>{value.audience}</span>
                  </div>
                )}
                {value.techStack && (
                  <div className="flex gap-2">
                    <span className="font-mono text-xs uppercase text-muted-foreground w-24">Tech:</span>
                    <span>{value.techStack}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-between items-center">
              <Button
                variant="outline"
                onClick={() => setStep("context")}
                className="rounded-none font-mono uppercase text-xs tracking-widest"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back
              </Button>

              <Button
                onClick={() => onSubmit(value)}
                disabled={isLoading}
                className="rounded-none font-mono uppercase text-xs tracking-widest px-8 py-6 bg-amber-500 hover:bg-amber-600"
              >
                {isLoading ? (
                  <>
                    <RotateCcw className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Concepts
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step !== "generate" && (
        <div className="flex justify-end">
          <Button
            onClick={handleNext}
            disabled={(step === "problem" && !rawInput.trim()) || isLoading}
            className="rounded-none font-mono uppercase text-xs tracking-widest px-8"
          >
            {step === "context" ? "Review" : "Continue"}
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
}
