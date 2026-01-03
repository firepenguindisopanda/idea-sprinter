"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Copy, Loader2 } from "lucide-react";
import type { PreGenerationRequest } from "@/types";
import { useGenerateExamples, type ExampleItem } from "@/hooks/useGenerateExamples";

interface ExamplesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request?: PreGenerationRequest | null;
  isLoading?: boolean;
  items?: ExampleItem[];
  onSelect: (text: string) => void;
  onRegenerate?: () => void;
}

export default function ExamplesModal({ open, onOpenChange, request = null, isLoading = false, items = [], onSelect, onRegenerate }: Readonly<ExamplesModalProps>) {
  const gen = useGenerateExamples();
  const [useStream, setUseStream] = useState(false);
  const displayItems = items.length ? items : gen.examples ?? [];
  const requestKey = useMemo(() => (request ? JSON.stringify(request) : null), [request]);
  const generatedKeyRef = useRef<string | null>(null);

  useEffect(() => {
    // Reset cached examples when request changes
    if (requestKey && generatedKeyRef.current !== requestKey) {
      generatedKeyRef.current = null;
      if (!items.length) gen.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestKey]);

  useEffect(() => {
    // If consumer provided items, skip fetching.
    if (!open) return;
    if (!request) return;
    if (items.length) return;
    if (generatedKeyRef.current === requestKey && gen.examples?.length) return;
    gen.generate(request, { stream: useStream });
    generatedKeyRef.current = requestKey;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, request, items.length, useStream]);

  const buildExampleText = (ex: ExampleItem) => {
    const parts: string[] = [];
    if (ex.title) parts.push(ex.title);
    if (ex.one_line) parts.push(ex.one_line);
    if (ex.scope_bullets && ex.scope_bullets.length) parts.push(ex.scope_bullets.map((b) => `- ${b}`).join("\n"));
    if (ex.full_text) parts.push(ex.full_text);
    return parts.join("\n\n");
  };

  const handleSelect = (text: string) => {
    onSelect(text);
    onOpenChange(false);
  };

  const handleCopy = async (text: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(text);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent id="gen-ex-modal" className="w-[90vw] max-w-[86rem] max-h-[85vh] overflow-y-auto rounded-xl">
        <DialogHeader>
          <DialogTitle>Generated Examples</DialogTitle>
          <DialogDescription>
            Choose an example to populate the project description. You can copy or select any example.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <Switch aria-label="Stream" id="stream-mode" checked={useStream} onCheckedChange={(v) => setUseStream(Boolean(v))} />
            <Label htmlFor="stream-mode" className="text-xs text-muted-foreground">Stream</Label>
            {useStream && gen.isLoading && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground ml-1">
                <Loader2 className="h-3 w-3 animate-spin" /> Streaming
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              className="font-semibold"
              onClick={() => {
                generatedKeyRef.current = null;
                gen.reset();
                if (onRegenerate) {
                  onRegenerate();
                  return;
                }
                if (request && !items.length) {
                  gen.generate(request, { stream: useStream });
                  generatedKeyRef.current = requestKey;
                }
              }}
              disabled={isLoading || gen.isLoading}
            >
              Regenerate
            </Button>
            <DialogClose asChild>
              <Button variant="outline" size="sm">Close</Button>
            </DialogClose>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4 auto-rows-fr">
          {(isLoading || gen.isLoading) && (
            <div className="md:col-span-2 text-sm text-muted-foreground whitespace-pre-wrap">
              {gen.streamText || "Generating..."}
            </div>
          )}

          {gen.error && (
            <div className="md:col-span-2 text-sm text-red-500 whitespace-pre-wrap">{gen.error}</div>
          )}

          {displayItems.length > 0 ? (
            displayItems.map((ex, idx) => (
              <Card key={ex.id ?? `example-${idx}`} className="h-full flex flex-col border shadow-sm">
                <CardHeader>
                  <CardTitle>{ex.title}</CardTitle>
                  <CardDescription className="text-sm">{ex.one_line}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 space-y-3 overflow-hidden">
                  <ul className="text-sm list-disc pl-5 space-y-1 break-words">
                    {(ex.scope_bullets ?? []).map((b, idx) => (
                      <li key={`${ex.id}-${idx}`}>{b}</li>
                    ))}
                  </ul>
                  {ex.full_text && (
                    <div className="text-sm text-muted-foreground border rounded-md p-3 bg-muted/40 whitespace-pre-wrap break-words max-h-48 overflow-y-auto">
                      {ex.full_text}
                    </div>
                  )}
                </CardContent>
                <CardFooter className="justify-between items-center gap-3">
                  <div className="flex gap-2 flex-wrap">
                    <Button size="sm" className="font-semibold" onClick={() => handleSelect(buildExampleText(ex))}>Select</Button>
                    <Button size="sm" variant="ghost" onClick={() => handleCopy(buildExampleText(ex))}>
                      <Copy className="mr-2 h-3 w-3" /> Copy
                    </Button>
                  </div>
                  <div className="text-xs text-muted-foreground text-right">{(ex.tags ?? []).join(", ")}</div>
                </CardFooter>
              </Card>
            ))
          ) : (
            !gen.isLoading && !gen.error && (
              <div className="md:col-span-2 text-sm text-muted-foreground">
                No examples returned. Try regenerating or adjust the input values.
              </div>
            )
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
