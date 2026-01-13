"use client";

import { useState } from "react";
import { Copy, Check, Download, Save, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import type { GenerateResponse, JudgeResult } from "@/types";

interface ResultsDisplayProps {
  results: GenerateResponse | null;
  onSave?: () => void;
  onDownloadPdf?: () => void;
  isSaving?: boolean;
  isDownloading?: boolean;
  hideActions?: boolean;
}

const AGENT_ROLES = [
  { key: "product_owner", label: "PRODUCT_OWNER", id: "PO-01" },
  { key: "architect", label: "SYSTEM_ARCHITECT", id: "AR-02" },
  { key: "fullstack_developer", label: "FULLSTACK_ENGINEER", id: "FE-03" },
  { key: "developer", label: "DEV_CORE", id: "DC-04" },
  { key: "senior_developer", label: "SR_ENGINEER", id: "SE-05" },
  { key: "designer", label: "UI_UX_DESIGNER", id: "UD-06" },
  { key: "analyst", label: "DATA_ANALYST", id: "DA-07" },
  { key: "tech_writer", label: "DOC_SPECIALIST", id: "DS-08" },
  { key: "tester", label: "QA_ENGINEER", id: "QA-09" },
  { key: "reviewer", label: "CODE_REVIEWER", id: "CR-10" },
];

export default function ResultsDisplay({
  results,
  onSave,
  onDownloadPdf,
  isSaving = false,
  isDownloading = false,
  hideActions = false,
}: Readonly<ResultsDisplayProps>) {
  const [copiedAgent, setCopiedAgent] = useState<string | null>(null);

  if (!results) {
    return (
      <div className="h-full border-2 border-primary/20 bg-background/50 flex flex-col">
        <div className="p-6 border-b border-primary/20 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-mono font-bold uppercase">Artifacts</h3>
            <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
              System output pending initialization
            </p>
          </div>
          <div className="h-8 w-8 border border-primary/10 flex items-center justify-center">
             <div className="h-2 w-2 bg-primary/20 animate-pulse" />
          </div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center opacity-50">
          <div className="h-20 w-20 border border-dashed border-primary/30 rounded-full flex items-center justify-center mb-4">
             <span className="text-2xl font-mono">?</span>
          </div>
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Waiting for Agent Swarm...</p>
        </div>
      </div>
    );
  }

  const { markdown_outputs, judge_results } = results;
  
  const availableAgents = AGENT_ROLES.filter(
    (agent) => markdown_outputs[agent.key]
  );

  const copyToClipboard = async (text: string, agentKey: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedAgent(agentKey);
      setTimeout(() => setCopiedAgent(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const getJudgeStatus = (agentKey: string): JudgeResult | undefined => {
    return judge_results?.[agentKey];
  };

  return (
    <div className="h-full border-2 border-primary/20 bg-background/80 backdrop-blur-sm flex flex-col shadow-[4px_4px_0px_0px_rgba(var(--primary),0.05)] overflow-hidden">
      <div className="p-6 border-b-2 border-primary/20 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-mono font-bold uppercase tracking-tighter">Generated <span className="text-primary">Dossier</span></h3>
          <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-[0.2em]">
            Multi-Agent output documentation // v1.0
          </p>
        </div>
        {!hideActions && (
          <div className="flex gap-2">
            {onSave && (
              <Button
                onClick={onSave}
                variant="outline"
                size="sm"
                disabled={isSaving}
                className="font-mono uppercase text-[10px] tracking-widest rounded-none border-2 border-primary/20"
              >
                {isSaving ? (
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                ) : (
                  <Save className="mr-2 h-3 w-3" />
                )}
                Commit
              </Button>
            )}
            {onDownloadPdf && (
              <Button
                onClick={onDownloadPdf}
                variant="outline"
                size="sm"
                disabled={isDownloading}
                className="font-mono uppercase text-[10px] tracking-widest rounded-none border-2 border-primary/20"
              >
                {isDownloading ? (
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                ) : (
                  <Download className="mr-2 h-3 w-3" />
                )}
                Export PDF
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        <Tabs defaultValue={availableAgents[0]?.key} className="flex-1 flex flex-col overflow-hidden">
          <div className="border-b border-primary/10 bg-primary/5">
            <TabsList className="h-auto w-full justify-start rounded-none bg-transparent p-0 flex-wrap">
              {availableAgents.map((agent) => (
                <TabsTrigger
                  key={agent.key}
                  value={agent.key}
                  className="rounded-none border-r border-primary/10 px-4 py-3 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-b-primary font-mono text-[9px] uppercase tracking-wider h-auto"
                >
                  <span className="opacity-50 mr-1.5">{agent.id}</span>
                  {agent.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto">
            {availableAgents.map((agent) => {
              const content = markdown_outputs[agent.key];
              const judgeStatus = getJudgeStatus(agent.key);

              return (
                <TabsContent
                  key={agent.key}
                  value={agent.key}
                  className="m-0 p-0 h-full"
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-8 border-b border-primary/5 pb-4">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 border border-primary/20 flex items-center justify-center font-mono text-primary bg-primary/5">
                          {agent.id}
                        </div>
                        <div>
                          <h4 className="font-mono font-bold text-sm uppercase tracking-widest">{agent.label} AGENT_LOG</h4>
                          <div className="flex gap-2 mt-1">
                            {judgeStatus && (
                              <div className={`text-[8px] font-mono px-1.5 py-0.5 border ${
                                judgeStatus.score >= 8 
                                  ? 'bg-green-500/10 text-green-500 border-green-500/20' 
                                  : judgeStatus.score >= 5 
                                    ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' 
                                    : 'bg-red-500/10 text-red-500 border-red-500/20'
                              }`}>
                                QA_SCORE: {judgeStatus.score}/10
                              </div>
                            )}
                            <div className="text-[8px] font-mono px-1.5 py-0.5 border bg-primary/5 text-primary/60 border-primary/10 uppercase">
                              Encrypted_Transmission
                            </div>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(content || "", agent.key)}
                        className="font-mono text-[9px] uppercase tracking-tighter h-8 rounded-none border border-primary/5 hover:bg-primary/5"
                      >
                        {copiedAgent === agent.key ? (
                          <>
                            <Check className="mr-1 h-3 w-3 text-green-500" />
                            Synchronized
                          </>
                        ) : (
                          <>
                            <Copy className="mr-1 h-3 w-3" />
                            Clone Buffer
                          </>
                        )}
                      </Button>
                    </div>

                    <div className="prose prose-sm dark:prose-invert max-w-none font-sans leading-relaxed text-muted-foreground/90
                      prose-headings:font-mono prose-headings:uppercase prose-headings:tracking-tighter prose-headings:border-l-4 prose-headings:border-primary/20 prose-headings:pl-3
                      prose-th:font-mono prose-th:text-[10px] prose-th:uppercase prose-th:bg-primary/5 prose-th:p-2
                      prose-td:p-2 prose-td:border-b prose-td:border-primary/5">
                      <ReactMarkdown>{content || ""}</ReactMarkdown>
                    </div>
                    
                    {judgeStatus?.feedback && (
                        <div className="mt-8 border-t border-primary/10 pt-4">
                             <div className="text-[10px] font-mono text-primary uppercase mb-2">Internal_Agent_Feedback:</div>
                            <p className="text-xs font-mono italic text-muted-foreground opacity-80 mb-2">
                                "{judgeStatus.feedback}"
                            </p>
                            {judgeStatus.recommended_action && (
                                <p className="text-[10px] font-mono text-muted-foreground">
                                    <span className="text-primary font-bold">REC_ACTION:</span> {judgeStatus.recommended_action}
                                </p>
                            )}
                        </div>
                    )}
                  </div>
                </TabsContent>
              );
            })}
          </div>
        </Tabs>
      </div>
    </div>
  );
}
