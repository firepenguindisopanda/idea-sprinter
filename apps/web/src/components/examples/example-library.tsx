"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import {
  SYSTEM_DESIGN_CATEGORIES,
  SYSTEM_DESIGN_EXAMPLES,
  type SystemDesignCategory,
  type SystemDesignExample,
} from "@/lib/system-design-examples";

interface ExampleLibraryProps {
  readonly onSelect: (example: SystemDesignExample) => void;
  /** Copy for the action on each card - differs between generate and architecture. */
  readonly actionLabel?: string;
  readonly className?: string;
}

/**
 * Browsable list of the system design starters.
 *
 * The card leads with the twist rather than the system name, because the twist
 * is the part that makes the exercise worth doing - everyone already knows what
 * Bitly is. The `+` marker is doing real work: it marks the feature that is not
 * in the original, which is the one thing a reader needs to spot.
 */
export default function ExampleLibrary({
  onSelect,
  actionLabel = "Use this",
  className = "",
}: ExampleLibraryProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<SystemDesignCategory | "All">("All");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return SYSTEM_DESIGN_EXAMPLES.filter((example) => {
      if (category !== "All" && example.category !== category) return false;
      if (!q) return true;
      return (
        example.name.toLowerCase().includes(q) ||
        example.twist.toLowerCase().includes(q) ||
        example.premise.toLowerCase().includes(q) ||
        example.category.toLowerCase().includes(q)
      );
    });
  }, [query, category]);

  return (
    <div className={className}>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1 md:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-primary/40" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search starters"
            aria-label="Search starters"
            className="w-full border border-primary/20 bg-background py-2 pl-9 pr-3 font-mono text-xs focus:border-primary focus:outline-none"
          />
        </div>
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          {visible.length} of {SYSTEM_DESIGN_EXAMPLES.length}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Filter by category">
        {(["All", ...SYSTEM_DESIGN_CATEGORIES] as const).map((option) => {
          const active = category === option;
          return (
            <button
              key={option}
              type="button"
              onClick={() => setCategory(option)}
              aria-pressed={active}
              className={`border px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest transition-colors ${
                active
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-primary/15 text-muted-foreground hover:border-primary/40 hover:text-primary"
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>

      {visible.length === 0 ? (
        <p className="mt-10 border border-dashed border-primary/20 p-8 text-center font-mono text-xs text-muted-foreground">
          No starter matches “{query}”. Clear the search or pick another category.
        </p>
      ) : (
        <ul className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((example) => (
            <li key={example.id}>
              <button
                type="button"
                onClick={() => onSelect(example)}
                className="group flex h-full w-full flex-col border border-primary/20 bg-background/60 p-4 text-left transition-colors hover:border-primary focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                <span className="font-mono text-[9px] uppercase tracking-widest text-primary/50">
                  {example.category}
                </span>
                <span className="mt-1 font-mono text-base font-bold uppercase tracking-tighter">
                  {example.name}
                </span>
                <span className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {example.premise}
                </span>

                <span className="my-3 block h-px bg-primary/15" />

                <span className="flex gap-2 text-xs leading-relaxed">
                  <span aria-hidden className="font-mono font-bold text-primary">
                    +
                  </span>
                  <span className="text-foreground">{example.twist}</span>
                </span>

                <span className="mt-3 block text-[11px] leading-relaxed text-muted-foreground/80">
                  {example.tension}
                </span>

                <span className="mt-4 inline-flex font-mono text-[10px] uppercase tracking-widest text-primary/60 transition-colors group-hover:text-primary">
                  [{actionLabel}]
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
