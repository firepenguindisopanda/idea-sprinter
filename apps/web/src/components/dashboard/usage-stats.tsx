"use client";

import { TrendingUp, Zap, DollarSign, Activity } from "lucide-react";

interface UsageStats {
  readonly specsbeforecode_tokens_used_monthly?: number;
  readonly specsbeforecode_budget_remaining?: number;
  readonly specsbeforecode_cost_estimate_total?: number;
  readonly specsbeforecode_requests_total?: number;
  // Legacy format support
  readonly monthly_tokens_used?: number;
  readonly budget_remaining?: number;
  readonly total_cost_estimate?: number;
  readonly requests_total?: number;
}

interface UsageStatsProps {
  readonly stats: UsageStats | null;
  readonly isLoading?: boolean;
}

export default function UsageStats({ stats, isLoading = false }: UsageStatsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-primary/5 animate-pulse border-2 border-primary/10" />
        ))}
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  // Support both API formats
  const requestsTotal = stats.specsbeforecode_requests_total ?? stats.requests_total ?? 0;
  const tokensUsed = stats.specsbeforecode_tokens_used_monthly ?? stats.monthly_tokens_used ?? 0;
  const costEstimate = stats.specsbeforecode_cost_estimate_total ?? stats.total_cost_estimate ?? 0;
  const budgetRemaining = stats.specsbeforecode_budget_remaining ?? stats.budget_remaining ?? 0;

  const budgetUsedPercentage = budgetRemaining > 0
    ? ((1000000 - budgetRemaining) / 1000000) * 100
    : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="border-2 border-primary/20 bg-background/50 p-4 relative group hover:border-primary/40 transition-colors">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-primary/60">SYS_TICKS</span>
          <Activity className="h-3 w-3 text-primary/40" />
        </div>
        <div className="text-2xl font-mono font-bold">{requestsTotal.toLocaleString()}</div>
        <div className="mt-1 text-[9px] font-mono text-muted-foreground uppercase">TOTAL_REQUEST_LOAD</div>
      </div>

      <div className="border-2 border-primary/20 bg-background/50 p-4 relative group hover:border-primary/40 transition-colors">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-primary/60">DATA_VOL</span>
          <Zap className="h-3 w-3 text-primary/40" />
        </div>
        <div className="text-2xl font-mono font-bold">{tokensUsed.toLocaleString()}</div>
        <div className="mt-1 text-[9px] font-mono text-muted-foreground uppercase">TOKEN_EXCHANGE_VOL</div>
      </div>

      <div className="border-2 border-primary/20 bg-background/50 p-4 relative group hover:border-primary/40 transition-colors">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-primary/60">RES_ALLOC</span>
          <DollarSign className="h-3 w-3 text-primary/40" />
        </div>
        <div className="text-2xl font-mono font-bold">${costEstimate.toFixed(2)}</div>
        <div className="mt-1 text-[9px] font-mono text-muted-foreground uppercase">CREDIT_EXPENDITURE</div>
      </div>

      <div className="border-2 border-primary/20 bg-background/50 p-4 relative group hover:border-primary/40 transition-colors">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-primary/60">CAP_RESERVE</span>
          <TrendingUp className="h-3 w-3 text-primary/40" />
        </div>
        <div className="space-y-2">
          <div className="text-lg font-mono font-bold">{budgetUsedPercentage.toFixed(1)}% <span className="text-[10px] text-muted-foreground uppercase font-normal">CAPACITY</span></div>
          <div className="w-full h-1 bg-primary/10 rounded-none overflow-hidden">
            <div className="h-full bg-primary" style={{ width: `${budgetUsedPercentage}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}
