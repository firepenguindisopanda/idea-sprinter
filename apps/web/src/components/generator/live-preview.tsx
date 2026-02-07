"use client";

import { useState, useEffect, useRef } from "react";
import { FileText, Code, Database, Lock, Shield, Layout, TestTube, Server, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PreviewSection {
  id: string;
  label: string;
  icon: React.ReactNode;
  content: string;
}

export interface LivePreviewProps {
  streamingContent: string;
  activeAgent: string | null;
  currentPhase: number;
  sections?: PreviewSection[];
  isGenerating: boolean;
}

export function LivePreview({
  streamingContent,
  activeAgent,
  currentPhase,
  sections = [],
  isGenerating,
}: Readonly<LivePreviewProps>) {
  const [activeTab, setActiveTab] = useState<string>(sections[0]?.id || 'preview');
  const contentRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);

  // Auto-scroll to bottom when new content arrives
  useEffect(() => {
    if (contentRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      
      if (isNearBottom || isGenerating) {
        contentRef.current.scrollTop = scrollHeight;
      }
      
      setShowScrollButton(scrollHeight > clientHeight && scrollTop < scrollHeight - clientHeight);
    }
  }, [streamingContent, isGenerating]);

  // Get icon for agent
  const getAgentIcon = (agent: string | null) => {
    if (!agent) return <FileText className="h-4 w-4" />;
    
    const agentLower = agent.toLowerCase();
    
    if (agentLower.includes('product')) return <FileText className="h-4 w-4" />;
    if (agentLower.includes('business')) return <FileText className="h-4 w-4" />;
    if (agentLower.includes('architect')) return <Layout className="h-4 w-4" />;
    if (agentLower.includes('data')) return <Database className="h-4 w-4" />;
    if (agentLower.includes('security')) return <Lock className="h-4 w-4" />;
    if (agentLower.includes('api')) return <Code className="h-4 w-4" />;
    if (agentLower.includes('qa') || agentLower.includes('test')) return <TestTube className="h-4 w-4" />;
    if (agentLower.includes('devops')) return <Server className="h-4 w-4" />;
    if (agentLower.includes('environment')) return <Settings className="h-4 w-4" />;
    if (agentLower.includes('technical') || agentLower.includes('writer')) return <FileText className="h-4 w-4" />;
    
    return <FileText className="h-4 w-4" />;
  };

  // Format agent name for display
  const formatAgentName = (agent: string | null): string => {
    if (!agent) return 'Waiting...';
    return agent
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Default preview tabs if none provided
  const defaultTabs: PreviewSection[] = [
    {
      id: 'preview',
      label: 'Live Preview',
      icon: <FileText className="h-4 w-4" />,
      content: streamingContent,
    },
    {
      id: 'raw',
      label: 'Raw Output',
      icon: <Code className="h-4 w-4" />,
      content: streamingContent,
    },
  ];

  const displayTabs = sections.length > 0 ? sections : defaultTabs;
  const activeSection = displayTabs.find(tab => tab.id === activeTab) || displayTabs[0];

  return (
    <div className="bg-background border-2 border-primary/20 p-6 rounded-none space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getAgentIcon(activeAgent)}
          <span className="text-[10px] font-mono text-primary uppercase tracking-widest">
            Live Preview
          </span>
        </div>
        
        {/* Active Agent Badge */}
        {isGenerating && (
          <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full">
            <span className="h-2 w-2 bg-primary rounded-full animate-pulse" />
            <span className="text-[10px] font-mono text-primary uppercase">
              {formatAgentName(activeAgent)}
            </span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-primary/10 pb-2">
        {displayTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 text-[10px] font-mono uppercase transition-all",
              activeTab === tab.id
                ? "text-primary border-b-2 border-primary -mb-[2px]"
                : "text-muted-foreground hover:text-primary/80"
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="relative">
        {/* Scroll to bottom button */}
        {showScrollButton && (
          <button
            onClick={() => {
              if (contentRef.current) {
                contentRef.current.scrollTop = contentRef.current.scrollHeight;
              }
            }}
            className="absolute bottom-2 right-2 z-10 px-3 py-1 bg-primary/80 text-white text-[10px] font-mono uppercase rounded-full hover:bg-primary transition-colors"
          >
            ↓ Scroll to bottom
          </button>
        )}

        {/* Content */}
        <div
          ref={contentRef}
          className={cn(
            "h-64 overflow-y-auto font-mono text-xs",
            "bg-primary/5 border border-primary/10 rounded p-4",
            "scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent"
          )}
        >
          {activeSection.content ? (
            <div className="whitespace-pre-wrap">{activeSection.content}</div>
          ) : (
            <div className="text-muted-foreground/50 italic">
              {isGenerating ? (
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 bg-primary rounded-full animate-bounce" />
                  Waiting for agent output...
                </span>
              ) : (
                "Submit a project description to start generation"
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground uppercase">
        <span>
          Phase {currentPhase > 0 ? currentPhase : '-'}
        </span>
        <span className="flex items-center gap-2">
          <span className={cn(
            "h-2 w-2 rounded-full",
            isGenerating ? "bg-primary animate-pulse" : "bg-muted-foreground/30"
          )} />
          {isGenerating ? 'Generating...' : 'Ready'}
        </span>
      </div>
    </div>
  );
}
