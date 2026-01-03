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
    <div className="space-y-4" role="group">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-1 space-y-1">
          <Label htmlFor="pre-title">Project title *</Label>
          <Input
            id="pre-title"
            value={value.title}
            onChange={(e) => onChange({ ...value, title: e.target.value })}
            placeholder="Short project title"
            disabled={isLoading}
          />
        </div>

        <div className="md:col-span-1 space-y-1">
          <Label htmlFor="pre-audience">Target audience *</Label>
          <Input
            id="pre-audience"
            value={value.audience}
            onChange={(e) => onChange({ ...value, audience: e.target.value })}
            placeholder="e.g. Small businesses, Students, Enterprise"
            disabled={isLoading}
          />
        </div>

        <div className="md:col-span-1 space-y-1">
          <Label htmlFor="pre-tech">Primary tech stack (optional)</Label>
          <Input
            id="pre-tech"
            value={value.techStack ?? ""}
            onChange={(e) => onChange({ ...value, techStack: e.target.value })}
            placeholder="React + Next.js, Postgres"
            disabled={isLoading}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-1">
          <Label>Scope seeds *</Label>
          <div className="flex gap-3">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={value.scopeSeeds.includes("MVP")}
                onChange={() => toggleScopeSeed("MVP")}
                disabled={isLoading}
                className="checkbox h-4 w-4"
              />
              <span className="text-sm">MVP</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={value.scopeSeeds.includes("Intermediate")}
                onChange={() => toggleScopeSeed("Intermediate")}
                disabled={isLoading}
                className="checkbox h-4 w-4"
              />
              <span className="text-sm">Intermediate</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={value.scopeSeeds.includes("Full")}
                onChange={() => toggleScopeSeed("Full")}
                disabled={isLoading}
                className="checkbox h-4 w-4"
              />
              <span className="text-sm">Full</span>
            </label>
          </div>
        </div>

        <div className="space-y-1">
          <Label htmlFor="pre-examples">Number of examples</Label>
          <Select
            value={String(value.exampleCount)}
            onValueChange={(v) => onChange({ ...value, exampleCount: Number(v) })}
            disabled={isLoading}
          >
            <SelectTrigger id="pre-examples">
              <SelectValue placeholder="3" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1</SelectItem>
              <SelectItem value="2">2</SelectItem>
              <SelectItem value="3">3</SelectItem>
              <SelectItem value="4">4</SelectItem>
              <SelectItem value="5">5</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label htmlFor="pre-tone">Desired tone (optional)</Label>
          <Input
            id="pre-tone"
            value={value.desiredTone ?? ""}
            onChange={(e) => onChange({ ...value, desiredTone: e.target.value })}
            placeholder="Professional, Casual, Concise"
            disabled={isLoading}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="pre-constraints">Constraints (optional)</Label>
          <Textarea
            id="pre-constraints"
            value={value.constraints ?? ""}
            onChange={(e) => onChange({ ...value, constraints: e.target.value })}
            placeholder="Time, budget, compliance or feature constraints"
            rows={2}
            disabled={isLoading}
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="pre-timebudget">Time / Budget (optional)</Label>
          <Input
            id="pre-timebudget"
            value={value.timeBudget ?? ""}
            onChange={(e) => onChange({ ...value, timeBudget: e.target.value })}
            placeholder="e.g. 3 months / $25k"
            disabled={isLoading}
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          type="button"
          onClick={() => handleSubmit()}
          disabled={!requiredValid || isLoading}
          size="default"
          className="font-semibold"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating examples...
            </>
          ) : (
            "Generate examples"
          )}
        </Button>
      </div>
    </div>
  );
}