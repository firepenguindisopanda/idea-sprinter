"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { PreGenerationRequest } from "@/types";

/**
 * 
 * add the pre-generation fields (title, audience, techStack, scope seeds, exampleCount) and a disabled `Generate examples` button that validates required fields.
 */

interface PreGenerationFormProps {
  value: PreGenerationRequest;
  onChange: (value: PreGenerationRequest) => void;
  onSubmit: (data: PreGenerationRequest) => void;
  isLoading?: boolean;
}

export default function PreGenerationForm({ value, onChange, onSubmit, isLoading = false }: Readonly<PreGenerationFormProps>) {
  const requiredValid = !!(
    value.title.trim() &&
    value.audience.trim() &&
    value.scopeSeeds.length > 0
  );

  const toggleScopeSeed = (seed: string) => {
    const next = value.scopeSeeds.includes(seed)
      ? value.scopeSeeds.filter((s) => s !== seed)
      : [...value.scopeSeeds, seed];
    onChange({ ...value, scopeSeeds: next });
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!requiredValid) return;

    onSubmit({
      ...value,
      title: value.title.trim(),
      audience: value.audience.trim(),
      techStack: value.techStack?.trim() || undefined,
      constraints: value.constraints?.trim() || undefined,
      desiredTone: value.desiredTone?.trim() || undefined,
      timeBudget: value.timeBudget?.trim() || undefined,
      nonGoals: value.nonGoals?.trim() || undefined,
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-2">
          <Label htmlFor="pre-title" className="text-[10px] font-mono uppercase tracking-widest text-primary/70">Project_Title *</Label>
          <Input
            id="pre-title"
            value={value.title}
            onChange={(e) => onChange({ ...value, title: e.target.value })}
            placeholder="e.g. My SaaS Dashboard"
            disabled={isLoading}
            className="rounded-none border-primary/20 bg-background/50 font-mono text-sm focus-visible:ring-primary/30"
          />
        </div>

        <div className="md:col-span-1 space-y-2">
          <Label htmlFor="pre-audience" className="text-[10px] font-mono uppercase tracking-widest text-primary/70">Target_Audience *</Label>
          <Input
            id="pre-audience"
            value={value.audience}
            onChange={(e) => onChange({ ...value, audience: e.target.value })}
            placeholder="e.g. Technical Administrators"
            disabled={isLoading}
            className="rounded-none border-primary/20 bg-background/50 font-mono text-sm focus-visible:ring-primary/30"
          />
        </div>

        <div className="md:col-span-1 space-y-2">
          <Label htmlFor="pre-tech" className="text-[10px] font-mono uppercase tracking-widest text-primary/70">Tech_Stack (Opt)</Label>
          <Input
            id="pre-tech"
            value={value.techStack ?? ""}
            onChange={(e) => onChange({ ...value, techStack: e.target.value })}
            placeholder="e.g. React, PostgreSQL"
            disabled={isLoading}
            className="rounded-none border-primary/20 bg-background/50 font-mono text-sm focus-visible:ring-primary/30"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <Label className="text-[10px] font-mono uppercase tracking-widest text-primary/70">Scope_Seeds *</Label>
          <div className="flex gap-4 pt-1">
            {["MVP", "Intermediate", "Full"].map((seed) => (
              <label key={seed} className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={value.scopeSeeds.includes(seed)}
                  onChange={() => toggleScopeSeed(seed)}
                  disabled={isLoading}
                  className="appearance-none h-4 w-4 border-2 border-primary/30 checked:bg-primary checked:border-primary transition-all rounded-none cursor-pointer"
                />
                <span className="text-[10px] font-mono uppercase tracking-tighter group-hover:text-primary transition-colors">
                  {seed}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="pre-examples" className="text-[10px] font-mono uppercase tracking-widest text-primary/70">Iter_Count</Label>
          <Select
            value={String(value.exampleCount)}
            onValueChange={(v) => onChange({ ...value, exampleCount: Number(v) })}
            disabled={isLoading}
          >
            <SelectTrigger id="pre-examples" className="rounded-none border-primary/20 bg-background/50 font-mono focus:ring-primary/30 h-10">
              <SelectValue placeholder="3" />
            </SelectTrigger>
            <SelectContent className="rounded-none border-primary/20">
              <SelectItem value="1">01</SelectItem>
              <SelectItem value="2">02</SelectItem>
              <SelectItem value="3">03</SelectItem>
              <SelectItem value="4">04</SelectItem>
              <SelectItem value="5">05</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="pre-tone" className="text-[10px] font-mono uppercase tracking-widest text-primary/70">Tone_Profile</Label>
          <Input
            id="pre-tone"
            value={value.desiredTone ?? ""}
            onChange={(e) => onChange({ ...value, desiredTone: e.target.value })}
            placeholder="e.g. Professional & Detailed"
            disabled={isLoading}
            className="rounded-none border-primary/20 bg-background/50 font-mono text-sm focus-visible:ring-primary/30"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="pre-constraints" className="text-[10px] font-mono uppercase tracking-widest text-primary/70">Operational_Constraints</Label>
          <Textarea
            id="pre-constraints"
            value={value.constraints ?? ""}
            onChange={(e) => onChange({ ...value, constraints: e.target.value })}
            placeholder="e.g. Must support offline usage, sub-100ms latency"
            rows={2}
            disabled={isLoading}
            className="rounded-none border-primary/20 bg-background/50 font-mono text-sm focus-visible:ring-primary/30 min-h-[80px]"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="pre-timebudget" className="text-[10px] font-mono uppercase tracking-widest text-primary/70">Resource_Allocation</Label>
          <Input
            id="pre-timebudget"
            value={value.timeBudget ?? ""}
            onChange={(e) => onChange({ ...value, timeBudget: e.target.value })}
            placeholder="e.g. 3-month development cycle"
            disabled={isLoading}
            className="rounded-none border-primary/20 bg-background/50 font-mono text-sm focus-visible:ring-primary/30"
          />
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button
          type="button"
          onClick={() => handleSubmit()}
          disabled={!requiredValid || isLoading}
          className="rounded-none font-mono uppercase text-[12px] tracking-widest px-8 py-6 border-2 border-primary/50 group transition-all hover:bg-primary hover:text-primary-foreground"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Compiling_Mockups...
            </>
          ) : (
            <>
              Initialize_Concepts
              <span className="ml-2 group-hover:translate-x-1 transition-transform">
                {">"}
              </span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
}