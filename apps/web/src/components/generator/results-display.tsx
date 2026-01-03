"use client";

import { useState } from "react";
import { Copy, Check, Download, Save, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  { key: "product_owner", label: "Product Owner", icon: "📋" },
  { key: "architect", label: "Architect", icon: "🏗️" },
  { key: "fullstack_developer", label: "Fullstack Developer", icon: "💻" },
  { key: "developer", label: "Developer", icon: "🛠️" },
  { key: "senior_developer", label: "Senior Developer", icon: "🎯" },
  { key: "designer", label: "Designer", icon: "🎨" },
  { key: "analyst", label: "Analyst", icon: "📊" },
  { key: "tech_writer", label: "Tech Writer", icon: "📝" },
  { key: "tester", label: "Tester", icon: "🧪" },
  { key: "reviewer", label: "Reviewer", icon: "👁️" },
];

export default function ResultsDisplay({
  results,
  onSave,
  onDownloadPdf,
  isSaving = false,
  isDownloading = false,
  hideActions = false,
}: ResultsDisplayProps) {
  const [copiedAgent, setCopiedAgent] = useState<string | null>(null);

  if (!results) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Results</CardTitle>
          <CardDescription>
            Your generated project specifications will appear here
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-96">
          <div className="text-center text-muted-foreground">
            <p className="text-lg mb-2">No results yet</p>
            <p className="text-sm">Fill out the form and click generate to start</p>
          </div>
        </CardContent>
      </Card>
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
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Generated Specifications</CardTitle>
            <CardDescription>
              Review the output from each agent role
            </CardDescription>
          </div>
          {!hideActions && (
            <div className="flex gap-2">
              {onSave && (
                <Button
                  onClick={onSave}
                  variant="outline"
                  size="sm"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Project
                    </>
                  )}
                </Button>
              )}
              {onDownloadPdf && (
                <Button
                  onClick={onDownloadPdf}
                  variant="outline"
                  size="sm"
                  disabled={isDownloading}
                >
                  {isDownloading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Downloading...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Download PDF
                    </>
                  )}
                </Button>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={availableAgents[0]?.key} className="w-full">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-5 gap-1">
            {availableAgents.slice(0, 5).map((agent) => (
              <TabsTrigger key={agent.key} value={agent.key} className="text-xs">
                <span className="mr-1">{agent.icon}</span>
                {agent.label}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {availableAgents.length > 5 && (
            <TabsList className="grid w-full grid-cols-4 gap-1 mt-2">
              {availableAgents.slice(5).map((agent) => (
                <TabsTrigger key={agent.key} value={agent.key} className="text-xs">
                  <span className="mr-1">{agent.icon}</span>
                  {agent.label}
                </TabsTrigger>
              ))}
            </TabsList>
          )}

          {availableAgents.map((agent) => {
            const content = markdown_outputs[agent.key];
            const judgeStatus = getJudgeStatus(agent.key);

            return (
              <TabsContent key={agent.key} value={agent.key} className="mt-4">
                <div className="space-y-4">
                  {/* Agent Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{agent.icon}</span>
                      <div>
                        <h3 className="text-xl font-semibold">{agent.label}</h3>
                        {judgeStatus && (
                          <div className="flex items-center gap-2 mt-1">
                            <Badge
                              variant={judgeStatus.is_approved ? "default" : "destructive"}
                            >
                              {judgeStatus.is_approved ? "Approved" : "Needs Revision"}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              Score: {judgeStatus.score}/10
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(content, agent.key)}
                    >
                      {copiedAgent === agent.key ? (
                        <>
                          <Check className="mr-2 h-4 w-4" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="mr-2 h-4 w-4" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Judge Feedback */}
                  {judgeStatus && judgeStatus.feedback && (
                    <Card className="bg-muted/50">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Judge Feedback</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm">{judgeStatus.feedback}</p>
                        {judgeStatus.recommended_action && (
                          <p className="text-sm text-muted-foreground mt-2">
                            <strong>Recommendation:</strong> {judgeStatus.recommended_action}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Markdown Content */}
                  <div className="prose prose-sm max-w-none dark:prose-invert border rounded-lg p-6 bg-card">
                    <ReactMarkdown
                      components={{
                        h1: ({ children }) => (
                          <h1 className="text-2xl font-bold mb-4">{children}</h1>
                        ),
                        h2: ({ children }) => (
                          <h2 className="text-xl font-semibold mt-6 mb-3">{children}</h2>
                        ),
                        h3: ({ children }) => (
                          <h3 className="text-lg font-semibold mt-4 mb-2">{children}</h3>
                        ),
                        code: ({ children, className }) => {
                          const isInline = !className;
                          return isInline ? (
                            <code className="bg-muted px-1.5 py-0.5 rounded text-sm">
                              {children}
                            </code>
                          ) : (
                            <code className={className}>{children}</code>
                          );
                        },
                        pre: ({ children }) => (
                          <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
                            {children}
                          </pre>
                        ),
                      }}
                    >
                      {content}
                    </ReactMarkdown>
                  </div>
                </div>
              </TabsContent>
            );
          })}
        </Tabs>
      </CardContent>
    </Card>
  );
}
