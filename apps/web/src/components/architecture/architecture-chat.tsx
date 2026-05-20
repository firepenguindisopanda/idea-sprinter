"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { ArchitectureSession } from "@/types";
import { Send, Loader2, User, Bot } from "lucide-react";

interface ArchitectureChatProps {
  session: ArchitectureSession;
  onGenerate: () => void;
  isGenerating: boolean;
}

export default function ArchitectureChat({
  session,
  onGenerate: _onGenerate,
  isGenerating
}: ArchitectureChatProps) {
  const [message, setMessage] = useState("");
  const [isRefining, setIsRefining] = useState(false);

  const handleRefine = async () => {
    if (!message.trim() || !session.selected_option_id) return;

    setIsRefining(true);
    try {
      // This would call the refine API
      // TODO: Implement refine API call
    } catch (error) {
      console.error("Failed to refine:", error);
    } finally {
      setIsRefining(false);
      setMessage("");
    }
  };

  return (
    <div className="space-y-4">
      {/* Chat Messages */}
      <div className="space-y-4 min-h-[300px] max-h-[400px] overflow-y-auto p-4 border border-primary/10 bg-background/50">
        {session.messages.length === 0 && !session.options.length && (
          <div className="flex items-center gap-3 text-muted-foreground p-4">
            <Bot className="h-5 w-5" />
            <p className="text-sm">
              Ready to generate architecture options. Click &quot;Generate Options&quot; to get started.
            </p>
          </div>
        )}
        
        {session.messages.map((msg, idx) => (
          <div 
            key={idx} 
            className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div className={`p-2 rounded-full ${msg.role === 'user' ? 'bg-primary/10' : 'bg-amber-500/10'}`}>
              {msg.role === 'user' ? (
                <User className="h-4 w-4 text-primary" />
              ) : (
                <Bot className="h-4 w-4 text-amber-500" />
              )}
            </div>
            <div className={`flex-1 p-3 ${msg.role === 'user' ? 'bg-primary/5 text-right' : 'bg-amber-500/5'} border border-primary/10`}>
              <p className="text-sm">{msg.content}</p>
            </div>
          </div>
        ))}

        {isGenerating && (
          <div className="flex items-center gap-3 text-muted-foreground p-4">
            <Loader2 className="h-4 w-4 animate-spin" />
            <p className="text-sm">Generating architecture options...</p>
          </div>
        )}
      </div>

      {/* Input Area */}
      {session.selected_option_id && (
        <div className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Refine the selected architecture (e.g., 'Make it more cost-effective')"
            className="flex-1 p-3 border border-primary/20 bg-background focus:border-primary focus:outline-none font-mono text-sm"
            onKeyDown={(e) => e.key === 'Enter' && handleRefine()}
          />
          <Button 
            onClick={handleRefine}
            disabled={isRefining || !message.trim()}
            className="font-mono uppercase text-[10px]"
          >
            {isRefining ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      )}
    </div>
  );
}
