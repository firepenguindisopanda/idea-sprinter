"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import type { PRDChatResponse, PRDStartResponse } from "@/types";

interface Message {
  id: string;
  author: "user" | "agent";
  text: string;
  isComplete?: boolean;
}

interface PrdChatProps {
  initialSessionId?: string | null;
  onPhaseChange?: (phase: string, isComplete: boolean) => void;
  onSessionReady?: (sessionId: string) => void;
}

export default function PrdChat({ initialSessionId, onPhaseChange, onSessionReady }: PrdChatProps) {
  const search = useSearchParams();
  const router = useRouter();
  const prefill = search.get("prefill") || undefined;
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const autoStartAttempted = useRef(false);
  const { user } = useAuthStore();  // Get user from auth store

  const [sessionId, setSessionId] = useState<string | null>(initialSessionId ?? null);
  const [hasStarted, setHasStarted] = useState(!!initialSessionId);
  const [isAutoStarting, setIsAutoStarting] = useState(false);
  const [input, setInput] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [generatedPrd, setGeneratedPrd] = useState<string | null>(null);

  useEffect(() => {
    if (prefill) {
      setInput(prefill);
    }
  }, [prefill]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (onPhaseChange) {
      onPhaseChange(hasStarted ? (isComplete ? "complete" : "chatting") : "idle", isComplete);
    }
  }, [hasStarted, isComplete, onPhaseChange]);

  const append = (m: Message) => setMessages((s) => [...s, m]);

  const handleAutoStart = async () => {
    if (!prefill || hasStarted || isAutoStarting || messages.length > 0 || autoStartAttempted.current) return;
    
    autoStartAttempted.current = true;
    setIsAutoStarting(true);
    const userMsg: Message = { id: `u-${Date.now()}`, author: "user", text: prefill };
    append(userMsg);

    try {
      const startResp = await api.startPrdSession(prefill, user?.id) as PRDStartResponse;
      const newSessionId = startResp.session_id;
      setSessionId(newSessionId);
      setHasStarted(true);
      onSessionReady?.(newSessionId);

      router.replace(`/prd?session_id=${encodeURIComponent(newSessionId)}`);

      const agentMsg: Message = {
        id: `a-${Date.now()}`,
        author: "agent",
        text: startResp.message || "PRD session started. Let me know more about your product.",
      };
      append(agentMsg);

    } catch {
      append({ id: `a-err-${Date.now()}`, author: "agent", text: "Failed to start PRD session." });
    } finally {
      setIsAutoStarting(false);
    }
  };

  useEffect(() => {
    if (prefill && !hasStarted && !isAutoStarting && messages.length === 0 && !autoStartAttempted.current) {
      handleAutoStart();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefill, hasStarted, isAutoStarting]);

  const handleStart = async () => {
    if (!input.trim()) return;
    
    setIsSending(true);
    const userMsg: Message = { id: `u-${Date.now()}`, author: "user", text: input };
    append(userMsg);

    try {
      const startResp = await api.startPrdSession(input, user?.id) as PRDStartResponse;
      const newSessionId = startResp.session_id;
      setSessionId(newSessionId);
      setHasStarted(true);

      router.replace(`/prd?session_id=${encodeURIComponent(newSessionId)}`);

      const agentMsg: Message = {
        id: `a-${Date.now()}`,
        author: "agent",
        text: startResp.message || "PRD session started. Let me know more about your product.",
      };
      append(agentMsg);

      setInput("");
    } catch {
      append({ id: `a-err-${Date.now()}`, author: "agent", text: "Failed to start PRD session." });
    } finally {
      setIsSending(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !sessionId) return;

    const userMsg: Message = { id: `u-${Date.now()}`, author: "user", text: input };
    append(userMsg);
    setIsSending(true);

    try {
      const resp = await api.prdChat(sessionId, input) as PRDChatResponse;

      const agentMsg: Message = {
        id: `a-${Date.now()}`,
        author: "agent",
        text: resp.agent_response || "(no response)",
        isComplete: resp.phase === "complete",
      };
      append(agentMsg);

      if (resp.phase === "complete" && resp.generated_prd) {
        setIsComplete(true);
        setGeneratedPrd(resp.generated_prd);
      }

      if (resp.phase === "complete" && resp.generated_prd) {
        router.replace(`/prd?session_id=${encodeURIComponent(sessionId)}&complete=true`);
      } else {
        router.replace(`/prd?session_id=${encodeURIComponent(sessionId)}`);
      }

      setInput("");
    } catch {
      append({ id: `a-err-${Date.now()}`, author: "agent", text: "Failed to contact PRD agent." });
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      if (hasStarted) {
        handleSend();
      } else {
        handleStart();
      }
    }
  };

  const isLoading = isAutoStarting || isSending;

  return (
    <div className="space-y-4">
      <div className="bg-background border-2 border-primary/10 p-4 rounded-none max-h-[500px] overflow-auto space-y-3">
        {messages.length === 0 && !prefill && (
          <div className="text-xs text-muted-foreground space-y-2">
            <p>Describe your product idea to start building a PRD.</p>
            <p className="text-[10px]">Press Ctrl/Cmd+Enter to submit</p>
          </div>
        )}

        {isAutoStarting && (
          <div className="text-xs text-muted-foreground space-y-2">
            <p>Analyzing your input and preparing questions...</p>
          </div>
        )}

        {messages.map((m) => (
          <div key={m.id} className={`p-3 rounded ${m.author === "user" ? "bg-primary/5 self-end" : "bg-amber-500/5"}`}>
            <div className="text-[11px] font-mono uppercase text-primary/60 mb-1">
              {m.author === "user" ? "You" : "PRD Agent"}
            </div>
            <div className="whitespace-pre-wrap text-sm">{m.text}</div>
            {m.isComplete && (
              <div className="mt-2 text-[10px] font-mono text-green-500">✓ PRD Complete</div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex gap-2 items-start">
        <textarea
          aria-label="prd-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={4}
          className="flex-1 resize-none p-3 border-2 border-primary/10"
          placeholder={hasStarted ? "Answer the agent's questions..." : "Describe your product idea..."}
          disabled={isLoading || !!(prefill && !hasStarted)}
        />
        <div className="flex flex-col gap-2">
          <Button 
            onClick={hasStarted ? handleSend : handleStart} 
            disabled={isLoading || input.trim() === "" || !!(prefill && !hasStarted)} 
            className="rounded-none h-10 px-4"
          >
            {isLoading ? 'Processing...' : hasStarted ? 'Send' : 'Start PRD'}
          </Button>
        </div>
      </div>

      {isComplete && generatedPrd && (
        <div className="bg-green-500/10 border border-green-500/20 p-4">
          <div className="text-xs font-mono uppercase text-green-600 mb-2">PRD Generated!</div>
          <p className="text-xs text-muted-foreground">
            The PRD is complete. You can download it or send it to the pipeline from the sidebar.
          </p>
        </div>
      )}
    </div>
  );
}
