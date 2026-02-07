"use client";

import { CheckCircle2, Loader2, Circle, Clock, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AgentStatusIndicatorProps {
  agent: string;
  label: string;
  status: 'completed' | 'active' | 'pending' | 'failed' | 'skipped';
  isActive?: boolean;
  retryCount?: number;
  startTime?: Date;
  className?: string;
}

export function AgentStatusIndicator({
  agent,
  label,
  status,
  isActive = false,
  retryCount = 0,
  startTime,
  className,
}: Readonly<AgentStatusIndicatorProps>) {
  const getStatusIcon = () => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-3 w-3 text-green-500" />;
      case 'active':
        return <Loader2 className="h-3 w-3 text-primary animate-spin" />;
      case 'failed':
        return <AlertTriangle className="h-3 w-3 text-destructive" />;
      case 'skipped':
        return <Circle className="h-3 w-3 text-muted-foreground/50" />;
      default:
        return <Circle className="h-3 w-3 text-muted-foreground/30" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'completed':
        return 'text-green-500';
      case 'active':
        return 'text-primary';
      case 'failed':
        return 'text-destructive';
      case 'skipped':
        return 'text-muted-foreground/50';
      default:
        return 'text-muted-foreground/30';
    }
  };

  const formatDuration = () => {
    if (!startTime) return null;
    const now = new Date();
    const duration = Math.floor((now.getTime() - startTime.getTime()) / 1000);
    
    if (duration < 60) {
      return `${duration}s`;
    } else if (duration < 3600) {
      const minutes = Math.floor(duration / 60);
      const seconds = duration % 60;
      return `${minutes}m ${seconds}s`;
    } else {
      const hours = Math.floor(duration / 3600);
      const minutes = Math.floor((duration % 3600) / 60);
      return `${hours}h ${minutes}m`;
    }
  };

  return (
    <div
      className={cn(
        "flex items-center gap-2 text-[10px] font-mono uppercase transition-all duration-300",
        status === 'active' && "animate-pulse",
        status === 'completed' && "opacity-60",
        status === 'pending' && "opacity-40",
        status === 'failed' && "opacity-80",
        className
      )}
    >
      {/* Status Icon */}
      <div className="flex-shrink-0">
        {getStatusIcon()}
      </div>

      {/* Agent Label */}
      <span className={cn("flex-1", getStatusColor())}>
        {label}
      </span>

      {/* Additional Status Info */}
      <div className="flex items-center gap-2">
        {/* Retry Count */}
        {retryCount > 0 && (
          <span className="flex items-center gap-1 text-amber-500">
            <Clock className="h-3 w-3" />
            <span>retry {retryCount}</span>
          </span>
        )}

        {/* Duration */}
        {status === 'active' && formatDuration() && (
          <span className="text-muted-foreground/50">
            {formatDuration()}
          </span>
        )}
      </div>
    </div>
  );
}
