"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { ArchitectureOption } from "@/types";
import { Markdown } from "@/components/markdown";
import OptionChallenge from "./option-challenge";
import { CheckCircle2, Layers, DollarSign, Clock } from "lucide-react";

interface ArchitectureOptionsProps {
  options: ArchitectureOption[];
  selectedOptionId?: string;
  onSelect: (optionId: string) => void;
  /** Enables the per-option adversarial challenge. */
  sessionId?: string;
}

export default function ArchitectureOptions({
  options,
  selectedOptionId,
  onSelect,
  sessionId,
}: ArchitectureOptionsProps) {
  return (
    <div className="grid gap-6">
      {options.map((option) => (
        <Card 
          key={option.id}
          className={`border-2 transition-all ${
            selectedOptionId === option.id
              ? 'border-primary bg-primary/5'
              : 'border-primary/20 hover:border-primary/40'
          }`}
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="font-mono uppercase text-lg flex items-center gap-2">
                {selectedOptionId === option.id && (
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                )}
                {option.name}
              </CardTitle>
              {selectedOptionId !== option.id && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onSelect(option.id)}
                  className="label-xs"
                >
                  Select
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">{option.description}</p>

            {/* Architecture diagram - the generator emits a ```mermaid block,
                which Streamdown renders visually. Previously this field was
                produced by the backend and never displayed at all. */}
            {option.diagram_description && (
              <div className="space-y-2">
                <span className="text-xs font-mono uppercase text-primary/80">Diagram</span>
                <div className="bg-primary/[0.02] p-3 overflow-x-auto">
                  <Markdown enableDiagrams className="max-w-none text-xs">
                    {option.diagram_description}
                  </Markdown>
                </div>
              </div>
            )}

            {/* Components */}
            <div className="space-y-2">
              <span className="text-xs font-mono uppercase text-primary/80">Components</span>
              <div className="flex flex-wrap gap-2">
                {option.components.map((comp, idx) => (
                  <span 
                    key={idx}
                    className="px-2 py-1 bg-primary/5 text-xs font-mono"
                  >
                    {comp}
                  </span>
                ))}
              </div>
            </div>

            {/* Tech Stack */}
            <div className="space-y-2">
              <span className="text-xs font-mono uppercase text-primary/80">Tech Stack</span>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(option.tech_stack || {}).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-2 text-xs">
                    <span className="text-primary/80">{key}:</span>
                    <span className="font-mono">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Pros & Cons */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-xs font-mono uppercase text-tertiary flex items-center gap-1">
                  <Layers className="h-3 w-3" /> Pros
                </span>
                <ul className="mt-1 space-y-1">
                  {option.pros.map((pro, idx) => (
                    <li key={idx} className="text-xs text-tertiary flex items-start gap-1">
                      <span className="text-tertiary">+</span> {pro}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <span className="text-xs font-mono uppercase text-destructive flex items-center gap-1">
                  <Layers className="h-3 w-3" /> Cons
                </span>
                <ul className="mt-1 space-y-1">
                  {option.cons.map((con, idx) => (
                    <li key={idx} className="text-xs text-destructive flex items-start gap-1">
                      <span className="text-destructive">-</span> {con}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Estimates */}
            <div className="flex gap-4 pt-2 border-t border-primary/10">
              {option.estimated_cost && (
                <div className="flex items-center gap-2 text-xs">
                  <DollarSign className="h-3 w-3 text-primary/60" />
                  <span className="text-muted-foreground">{option.estimated_cost}/mo</span>
                </div>
              )}
              {option.estimated_setup_time && (
                <div className="flex items-center gap-2 text-xs">
                  <Clock className="h-3 w-3 text-primary/60" />
                  <span className="text-muted-foreground">{option.estimated_setup_time}</span>
                </div>
              )}
            </div>

            {/* When this is / is not the right call - the shape of the
                judgement, stated so it can be disagreed with. */}
            {(option.best_when || option.avoid_when) && (
              <div className="grid gap-2 sm:grid-cols-2 text-xs">
                {option.best_when && (
                  <div className="accent-note border-tertiary bg-tertiary/5 p-2">
                    <span className="label-xs text-tertiary">Right call when</span>
                    <p className="text-muted-foreground mt-1">{option.best_when}</p>
                  </div>
                )}
                {option.avoid_when && (
                  <div className="accent-note border-destructive bg-destructive/5 p-2">
                    <span className="label-xs text-destructive">Wrong call when</span>
                    <p className="text-muted-foreground mt-1">{option.avoid_when}</p>
                  </div>
                )}
              </div>
            )}

            {sessionId && (
              <OptionChallenge
                sessionId={sessionId}
                optionId={option.id}
                assumptions={option.assumptions}
              />
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
