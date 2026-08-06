"use client";

import { useState, useLayoutEffect, useRef } from "react";
import { FileText, Code, Database, Lock, Layout, TestTube, Server, Settings } from "lucide-react";
import { Markdown } from "@/components/markdown";
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

  // Auto-scroll to bottom when new content arrives - but only when the user is
  // already near the bottom. Previously this force-scrolled on every token while
  // `isGenerating`, which made it impossible to scroll up and read earlier output
  // mid-generation.
  useLayoutEffect(() => {
    if (contentRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;

      if (isNearBottom) {
        contentRef.current.scrollTop = scrollHeight;
      }

      // eslint-disable-next-line react-hooks/set-state-in-effect
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
    <div className="flex flex-col h-full min-h-0 bg-background border-2 border-primary/20 p-6 rounded-none space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getAgentIcon(activeAgent)}
          <span className="label-xs text-primary">
            Live Preview
          </span>
        </div>
        
        {/* Active Agent Badge */}
        {isGenerating && (
          <div className="flex items-center gap-2 border border-primary/25 bg-primary/10 px-2 py-1">
            <span className="h-2 w-2 bg-primary rounded-full animate-pulse" />
            <span className="label-xs text-primary">
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
              "label-xs flex items-center gap-2 px-4 py-2 transition-all",
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
      <div className="relative flex-1 min-h-0 flex flex-col">
        {/* Scroll to bottom button */}
        {showScrollButton && (
          <button
            onClick={() => {
              if (contentRef.current) {
                contentRef.current.scrollTop = contentRef.current.scrollHeight;
              }
            }}
            className="label-xs absolute bottom-2 right-2 z-10 rounded-xs bg-primary/85 px-2 py-1 text-primary-foreground transition-colors hover:bg-primary"
          >
            ↓ Scroll to bottom
          </button>
        )}

        {/* Content */}
        <div
          ref={contentRef}
          className={cn(
            "flex-1 min-h-64 overflow-y-auto",
            "bg-primary/5 rounded p-4",
            "scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent"
          )}
        >
          {activeSection.content ? (
            activeTab === 'preview' ? (
              <Markdown
                isStreaming={isGenerating}
                enableDiagrams
                className="max-w-none [&_h1]:font-mono [&_h1]:text-primary [&_h2]:font-mono [&_h2]:text-primary [&_h3]:font-mono [&_h3]:text-primary [&_a]:text-primary [&_strong]:text-primary/90"
              >
                {activeSection.content}
              </Markdown>
            ) : (
              <pre className="whitespace-pre-wrap font-mono text-xs text-muted-foreground">{activeSection.content}</pre>
            )
          ) : (

            <div className="text-muted-foreground ">
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
      <div className="label-xs flex items-center justify-between text-muted-foreground">
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
