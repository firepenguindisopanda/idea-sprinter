"use client";

import { Activity, AlertTriangle, DollarSign, Timer, Zap } from "lucide-react";
import type { UsageStatsResponse } from "@/types";

interface UsageStatsProps {
  readonly stats: UsageStatsResponse | null;
  readonly isLoading?: boolean;
}

function Tile({
  label,
  value,
  caption,
  icon,
  muted = false,
}: {
  readonly label: string;
  readonly value: string;
  readonly caption: string;
  readonly icon: React.ReactNode;
  readonly muted?: boolean;
}) {
  return (
    <div className="stamp-hover group relative border border-primary/20 bg-card/50 p-4 hover:border-primary/40">
      <div className="mb-3 flex items-center justify-between">
        <span className="label-xs text-primary/80">{label}</span>
        {icon}
      </div>
      <div
        className={`font-mono text-2xl font-bold tabular-nums ${muted ? "text-muted-foreground" : ""}`}
      >
        {value}
      </div>
      <div className="label-xs mt-2 leading-relaxed text-muted-foreground">{caption}</div>
    </div>
  );
}

/**
 * Usage tiles.
 *
 * Each figure names its source, because two sources with different coverage feed
 * this panel: LangSmith holds the full run history, while cost is computed at
 * call time and stored locally - LangSmith has no price map for the
 * NVIDIA-hosted models, so its own cost total is always zero.
 *
 * The previous version read `/health/metrics`, whose counters live in process
 * memory and reset on every restart, so it showed near-zeros regardless of
 * activity. Its "budget used" bar was computed against a hardcoded 1,000,000
 * denominator. Both are gone.
 */
export default function UsageStats({ stats, isLoading = false }: UsageStatsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 animate-pulse bg-primary/5" />
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const { langsmith, recorded, window_days: windowDays } = stats;
  const nf = new Intl.NumberFormat();
  const successRate =
    langsmith !== null ? `${((1 - langsmith.error_rate) * 100).toFixed(1)}%` : "-";

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Tile
          label="LLM calls"
          value={langsmith ? nf.format(langsmith.llm_calls) : "-"}
          caption={langsmith ? `Last ${windowDays} days` : "LangSmith unavailable"}
          icon={<Activity className="h-3 w-3 text-primary/40" />}
          muted={!langsmith}
        />
        <Tile
          label="Tokens"
          value={nf.format(langsmith ? langsmith.total_tokens : recorded.total_tokens)}
          caption={langsmith ? `Last ${windowDays} days` : "Recorded locally"}
          icon={<Zap className="h-3 w-3 text-primary/40" />}
        />
        <Tile
          label="Cost"
          value={`$${recorded.cost_usd.toFixed(4)}`}
          caption={
            recorded.operations === 0
              ? "No calls recorded yet"
              : `Est. over ${nf.format(recorded.operations)} recorded call${recorded.operations === 1 ? "" : "s"}`
          }
          icon={<DollarSign className="h-3 w-3 text-primary/40" />}
        />
        <Tile
          label="Success"
          value={successRate}
          caption={
            langsmith
              ? `p50 ${langsmith.latency_p50_s.toFixed(2)}s · p99 ${langsmith.latency_p99_s.toFixed(0)}s`
              : "LangSmith unavailable"
          }
          icon={
            langsmith && langsmith.error_rate > 0.1 ? (
              <AlertTriangle className="h-3 w-3 text-destructive/60" />
            ) : (
              <Timer className="h-3 w-3 text-primary/40" />
            )
          }
          muted={!langsmith}
        />
      </div>

      <p className="label-xs leading-relaxed text-muted-foreground">
        {langsmith
          ? `Model calls and tokens from LangSmith${stats.langsmith_project ? ` · ${stats.langsmith_project}` : ""} · cost estimated at call time`
          : "LangSmith unreachable - showing locally recorded figures only"}
      </p>
    </div>
  );
}
