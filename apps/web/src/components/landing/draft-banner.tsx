"use client";

import Link from "next/link";
import { Clock, ArrowRight, FileText, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMostRecentDraft, useDraftStore } from "@/lib/draft-store";
import { getTimeAgo } from "@/lib/time-utils";

/**
 * DraftBanner - Shows when user has an in-progress draft (ideation or generation)
 * Appears at the top of the landing page to help users resume their work
 */
export default function DraftBanner() {
  const draftSummary = useMostRecentDraft();
  const { clearIdeationDraft, clearGenerationDraft } = useDraftStore();

  // Don't render if no draft exists
  if (!draftSummary.type || !draftSummary.updatedAt) {
    return null;
  }

  const isIdeation = draftSummary.type === 'ideation';
  const timeAgo = getTimeAgo(draftSummary.updatedAt);
  
  const handleDismiss = () => {
    if (isIdeation) {
      clearIdeationDraft();
    } else {
      clearGenerationDraft();
    }
  };

  return (
    <div className="w-full bg-primary/5 border-b border-primary/20 animate-in slide-in-from-top-2 duration-300">
      <div className="max-w-6xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Icon and Message */}
          <div className="flex items-center gap-3">
            <div className={`
              p-2 rounded-none border 
              ${isIdeation 
                ? 'bg-warning/10 border-warning/30 text-warning' 
                : 'bg-primary/10 border-primary/30 text-primary'
              }
            `}>
              {isIdeation ? (
                <Sparkles className="h-4 w-4" />
              ) : (
                <FileText className="h-4 w-4" />
              )}
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
              <span className="label-lg text-sm">
                {isIdeation ? 'Ideation Draft' : 'Generation In Progress'}
              </span>
              <span className="label-xs flex items-center gap-1.5 text-muted-foreground">
                <Clock className="h-3 w-3" />
                {timeAgo}
              </span>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            <Button
              asChild
              size="sm"
              className="label-xs rounded-none h-8 px-4"
            >
              <Link 
                href={isIdeation ? '/ideation' : '/generate'} 
                className="flex items-center gap-2"
              >
                Resume
                <ArrowRight className="h-3 w-3" />
              </Link>
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="label-xs rounded-none h-8 px-2 text-muted-foreground hover:text-destructive"
              title="Discard draft"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
