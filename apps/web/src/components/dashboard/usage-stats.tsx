"use client";

import { TrendingUp, Zap, DollarSign, Activity } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface UsageStats {
  readonly ideasprinter_tokens_used_monthly?: number;
  readonly ideasprinter_budget_remaining?: number;
  readonly ideasprinter_cost_estimate_total?: number;
  readonly ideasprinter_requests_total?: number;
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
      <Card>
        <CardHeader>
          <CardTitle>Usage Statistics</CardTitle>
          <CardDescription>Loading your usage data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return null;
  }

  // Support both API formats
  const requestsTotal = stats.ideasprinter_requests_total ?? stats.requests_total ?? 0;
  const tokensUsed = stats.ideasprinter_tokens_used_monthly ?? stats.monthly_tokens_used ?? 0;
  const costEstimate = stats.ideasprinter_cost_estimate_total ?? stats.total_cost_estimate ?? 0;
  const budgetRemaining = stats.ideasprinter_budget_remaining ?? stats.budget_remaining ?? 0;

  const budgetUsedPercentage = budgetRemaining > 0
    ? ((1000000 - budgetRemaining) / 1000000) * 100
    : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{requestsTotal.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            API calls this month
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tokens Used</CardTitle>
          <Zap className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{tokensUsed.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            This month
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Estimated Cost</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${costEstimate.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">
            Total spend
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Budget Status</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{budgetUsedPercentage.toFixed(1)}%</div>
          <Progress value={budgetUsedPercentage} className="mt-2" />
          <p className="text-xs text-muted-foreground mt-2">
            {budgetRemaining.toLocaleString()} tokens remaining
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
