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
    if (ex.scope_bullets?.length) parts.push(ex.scope_bullets.map((b) => `- ${b}`).join("\n"));
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
      <DialogContent
        id="gen-ex-modal"
        className="w-[90vw] max-w-6xl max-h-[85vh] overflow-y-auto rounded-none border border-primary/25 bg-popover/95 backdrop-blur-xl"
        onEscapeKeyDown={() => onOpenChange(false)}
      >
        <DialogHeader className="border-b border-primary/10 pb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="h-2 w-2 bg-primary animate-pulse" />
            <DialogTitle className="label-lg text-xl">Generated_Mockups</DialogTitle>
          </div>
          <DialogDescription className="font-sans text-muted-foreground">
            Select an architectural template to initialize the project specification. 
            All mockups are AI-generated based on current system parameters.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-center justify-between gap-6 py-4 border-b border-primary/5">
          <div className="flex items-center gap-4 bg-primary/5 px-4 py-2">
            <div className="flex items-center gap-2">
              <Switch aria-label="Stream" id="stream-mode" checked={useStream} onCheckedChange={(v) => setUseStream(Boolean(v))} className="data-[state=checked]:bg-primary" />
              <Label htmlFor="stream-mode" className="label-xs cursor-pointer">Live_Stream</Label>
            </div>
            {useStream && gen.isLoading && (
              <span className="label-xs flex items-center gap-1.5 text-primary animate-pulse">
                <Loader2 className="h-3 w-3 animate-spin" /> Receiving_Packets...
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="plate"
              size="sm"
              className="label-xs"
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
              Regenerate_Database
            </Button>
            <DialogClose asChild>
              <Button variant="ghost" size="sm" className="label-xs rounded-none">Abort_View</Button>
            </DialogClose>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 auto-rows-fr pb-8">
          {(isLoading || gen.isLoading) && (
            <div className="md:col-span-2 font-mono text-xs uppercase text-primary/80 p-12 border-2 border-dashed border-primary/20 flex flex-col items-center justify-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin" />
              <div className="text-center max-w-md">
                {gen.examples && gen.examples.length > 0 ? (
                  <div className="space-y-1">
                    <p className="label-xs text-primary/80">
                      Parsed concepts received: {gen.examples.length}
                    </p>
                    <ul className="text-xs font-mono text-muted-foreground text-left">
                      {gen.examples.slice(0, 3).map((ex) => (
                        <li key={ex.id}>• {ex.title}</li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  gen.streamText || "Initializing_Neural_Constructs..."
                )}
              </div>
            </div>
          )}

          {gen.error && (
            <div className="md:col-span-2 font-mono text-xs uppercase text-destructive border-2 border-destructive/20 p-8 bg-destructive/5">
              [SYSTEM_ERROR]: {gen.error}
            </div>
          )}

          {!gen.isLoading && displayItems.length > 0 ? (
            displayItems.map((ex, idx) => (
              <Card key={ex.id ?? `example-${idx}`} className="stamp-hover rounded-none bg-background/40 border border-primary/20 hover:border-primary/40 flex flex-col group relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-100 transition-opacity">
                   <span className="label-xs text-primary font-bold">ENTITY_0{idx + 1}</span>
                </div>
                <CardHeader className="bg-primary/[0.02]">
                  <CardTitle className="label-lg text-lg line-clamp-1">{ex.title}</CardTitle>
                  <CardDescription className="label-xs text-primary/80 line-clamp-1">Ref: {ex.one_line}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 space-y-4 p-6 font-sans">
                  <ul className="text-xs space-y-2 text-muted-foreground ">
                    {(ex.scope_bullets ?? []).slice(0, 3).map((b, idx) => (
                      <li key={`${ex.id}-${idx}`} className="flex items-start gap-2">
                        <span className="text-primary mt-1">»</span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                  {ex.full_text && (
                    <div className="text-xs font-mono leading-relaxed text-primary/80 p-4 bg-primary/[0.03] max-h-32 overflow-y-auto scrollbar-thin scrollbar-thumb-primary/20">
                      {ex.full_text}
                    </div>
                  )}
                </CardContent>
                <CardFooter className="p-4 pt-0 border-t border-primary/5 bg-primary/[0.01] flex justify-between items-center gap-4">
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      className="label-xs rounded-none px-4 h-8 bg-primary/20 text-primary hover:bg-primary hover:text-primary-foreground transition-all border border-primary/30" 
                      onClick={() => handleSelect(buildExampleText(ex))}
                    >
                      Initialize_Node
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="label-xs rounded-none px-4 h-8" 
                      onClick={() => handleCopy(buildExampleText(ex))}
                    >
                      <Copy className="mr-2 h-3 w-3" /> Copy_Data
                    </Button>
                  </div>
                  <div className="flex gap-1 overflow-hidden">
                    {(ex.tags ?? []).slice(0, 2).map(tag => (
                      <span key={tag} className="label-xs bg-primary/10 px-1 py-0.5 text-primary/80">{tag}</span>
                    ))}
                  </div>
                </CardFooter>
              </Card>
            ))
          ) : (
            !gen.isLoading && !gen.error && !isLoading && (
              <div className="md:col-span-2 font-mono text-xs uppercase text-muted-foreground text-center py-20 border-2 border-dashed border-primary/10">
                No_Data_Packets_Found. Please execute REGENERATE command.
              </div>
            )
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
