"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWorkspace } from "@/hooks/use-workspace";

interface HybridChatInputProps {
  onSend?: (message: string) => void;
  placeholder?: string;
}

export function HybridChatInput({
  onSend,
  placeholder = "Ask a question or add context...",
}: HybridChatInputProps) {
  const { addChatMessage } = useWorkspace();
  const [input, setInput] = useState("");

  const handleSubmit = () => {
    if (!input.trim()) return;

    addChatMessage({ role: "user", content: input.trim() });

    if (onSend) {
      onSend(input.trim());
    }

    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex gap-2 items-end">
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={1}
        className="flex-1 resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring min-h-[36px] max-h-[120px]"
      />
      <Button
        onClick={handleSubmit}
        disabled={!input.trim()}
        size="sm"
        className="h-9 w-9 p-0 shrink-0"
      >
        <Send className="h-4 w-4" />
      </Button>
    </div>
  );
}
