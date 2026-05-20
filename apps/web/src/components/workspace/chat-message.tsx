"use client";

import type { ChatMessage } from "@/types/workspace";
import { Bot, User } from "lucide-react";

interface ChatMessageProps {
  message: ChatMessage;
}

export function ChatMessageItem({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      <div
        className={`flex-shrink-0 h-7 w-7 rounded-full flex items-center justify-center ${
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
        className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
          isUser
            ? "bg-primary/10 text-foreground"
            : "bg-muted/50 text-foreground"
        }`}
      >
        <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
      </div>
    </div>
  );
}
