"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { ArchitectureComparison, ArchitectureScore } from "@/types";
import { CheckCircle2, Star, AlertTriangle } from "lucide-react";

interface ArchitectureComparisonViewProps {
  comparison: ArchitectureComparison;
  selectedOptionId?: string;
  onSelect: (optionId: string) => void;
}

const SCORE_LABELS: Record<keyof ArchitectureScore, string> = {
  scalability: "Scalability",
  development_speed: "Dev Speed",
  cost_initial: "Initial Cost",
  cost_ongoing: "Ongoing Cost",
  security: "Security",
  operational_complexity: "Complexity",
  vendor_lockin: "Vendor Lock-in",
  performance: "Performance",
};

const SCORE_WEIGHTS: Record<keyof ArchitectureScore, number> = {
  scalability: 1.0,
  development_speed: 1.0,
  cost_initial: 1.5,
  cost_ongoing: 1.5,
  security: 2.0,
  operational_complexity: 1.0,
  vendor_lockin: 0.5,
  performance: 1.0,
};

function getScoreColor(score: number): string {
  if (score >= 8) return "text-green-600 bg-green-50";
  if (score >= 5) return "text-amber-600 bg-amber-50";
  return "text-red-600 bg-red-50";
}

export default function ArchitectureComparisonView({ 
  comparison, 
  selectedOptionId,
  onSelect 
}: ArchitectureComparisonViewProps) {
  const scoreKeys = Object.keys(SCORE_LABELS) as (keyof ArchitectureScore)[];
  
  // Calculate weighted scores
  const weightedScores = Object.entries(comparison.scores).map(([optionId, scores]) => {
    const weightedScore = scoreKeys.reduce((sum, key) => {
      return sum + (scores[key] * SCORE_WEIGHTS[key]);
    }, 0);
    const totalWeight = Object.values(SCORE_WEIGHTS).reduce((a, b) => a + b, 0);
    return { optionId, weightedScore: weightedScore / totalWeight };
  });
  
  const bestOption = weightedScores.reduce((best, current) => 
    current.weightedScore > best.weightedScore ? current : best
  );

  return (
    <div className="space-y-6">
      {/* Recommendation Banner */}
      <Card className="border-amber-500/30 bg-amber-500/10">
        <CardContent className="py-4">
          <div className="flex items-center gap-3">
            <Star className="h-5 w-5 text-amber-500" />
            <div>
              <p className="font-mono text-sm uppercase">{comparison.recommendation}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comparison Matrix */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-primary/20">
              <th className="text-left p-3 font-mono text-xs uppercase text-primary/60">Dimension</th>
              {comparison.options.map(option => (
                <th 
                  key={option.id}
                  className={`text-left p-3 font-mono text-xs uppercase ${
                    option.id === bestOption.optionId ? 'text-amber-500' : 'text-primary/60'
                  }`}
                >
                  {option.name}
                  {option.id === bestOption.optionId && (
                    <Star className="inline-block h-3 w-3 ml-1 text-amber-500" />
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {scoreKeys.map(key => (
              <tr key={key} className="border-b border-primary/10">
                <td className="p-3 text-sm font-mono uppercase text-primary/60">
                  {SCORE_LABELS[key]}
                  {SCORE_WEIGHTS[key] > 1 && (
                    <span className="ml-1 text-[10px] text-amber-500">×{SCORE_WEIGHTS[key]}</span>
                  )}
                </td>
                {comparison.options.map(option => {
                  const score = comparison.scores[option.id]?.[key] || 0;
                  return (
                    <td key={option.id} className="p-3">
                      <div className={`inline-flex items-center justify-center px-2 py-1 rounded text-sm font-mono ${getScoreColor(score)}`}>
                        {score.toFixed(1)}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
            {/* Weighted Total Row */}
            <tr className="border-b-2 border-primary/20 bg-primary/5">
              <td className="p-3 font-mono text-sm uppercase font-bold">Weighted Score</td>
              {comparison.options.map(option => {
                const ws = weightedScores.find(w => w.optionId === option.id);
                return (
                  <td key={option.id} className="p-3">
                    <span className={`text-lg font-bold font-mono ${
                      option.id === bestOption.optionId ? 'text-amber-600' : 'text-primary'
                    }`}>
                      {ws?.weightedScore.toFixed(1) || '0.0'}
                    </span>
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Trade-offs */}
      {comparison.trade_offs.length > 0 && (
        <Card className="border-primary/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-mono uppercase text-primary/60 flex items-center gap-2">
              <AlertTriangle className="h-3 w-3" />
              Key Trade-offs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {comparison.trade_offs.map((tradeOff, idx) => (
                <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-amber-500">•</span>
                  {tradeOff}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Selection Buttons */}
      <div className="flex gap-4 justify-center">
        {comparison.options.map(option => (
          <Button
            key={option.id}
            onClick={() => onSelect(option.id)}
            disabled={selectedOptionId === option.id}
            variant={selectedOptionId === option.id ? 'default' : 'outline'}
            className="font-mono uppercase text-[10px]"
          >
            {selectedOptionId === option.id ? (
              <>
                <CheckCircle2 className="h-3 w-3 mr-2" />
                Selected
              </>
            ) : (
              `Select ${option.name}`
            )}
          </Button>
        ))}
      </div>
    </div>
  );
}
