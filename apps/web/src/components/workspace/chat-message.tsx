"use client";

import type { ChatMessage } from "@/types/workspace";
import { Bot, User } from "lucide-react";
import { Markdown } from "@/components/markdown";

interface ChatMessageProps {
  message: ChatMessage;
}

export function ChatMessageItem({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      <div
        className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-xs ${
          isUser
            ? "bg-primary/10 text-primary"
            : "bg-muted text-muted-foreground"
        }`}
      >
        {isUser ? (
          <User className="h-3.5 w-3.5" />
        ) : (
          <Bot className="h-3.5 w-3.5" />
        )}
      </div>
      <div
        className={`max-w-[85%] rounded-sm px-3 py-2 text-sm ${
          isUser
            ? "bg-primary/10 text-foreground"
            : "bg-muted/50 text-foreground"
        }`}
      >
        {isUser ? (
          // User input is not markdown - render it verbatim.
          <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
        ) : (
          <Markdown>{message.content}</Markdown>
        )}
      </div>
    </div>
  );
}
