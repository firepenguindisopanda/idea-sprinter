"use client";

import { useEffect, useRef } from "react";
import { useWorkspace } from "@/hooks/use-workspace";
import { ChatMessageItem } from "./chat-message";

export function WorkspaceChatFeed() {
  const { chatMessages } = useWorkspace();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  if (chatMessages.length === 0) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className="space-y-4 overflow-y-auto max-h-[60vh] pr-2"
    >
      {chatMessages.map((msg) => (
        <ChatMessageItem key={msg.id} message={msg} />
      ))}
    </div>
  );
}
