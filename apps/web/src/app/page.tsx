"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/auth-store";
import { PersonaSelector } from "@/components/persona/persona-selector";
import { ArrowRight, User } from "lucide-react";
import DraftBanner from "@/components/landing/draft-banner";

export default function Home() {
  const { user } = useAuthStore();
  const [showPersonaSelector, setShowPersonaSelector] = useState(false);

  return (
    <div className="relative flex flex-col min-h-full">
      <DraftBanner />

      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center lg:p-24">
        {/* Decorative technical elements */}
        <div className="absolute top-8 left-8 hidden lg:block pointer-events-none overflow-hidden h-24 w-24 border-l border-t border-primary/40 opacity-50">
          <span className="absolute top-1 left-2 text-[10px] font-mono text-primary/60">X: 00.00</span>
          <span className="absolute top-5 left-2 text-[10px] font-mono text-primary/60">Y: 00.00</span>
        </div>
        <div className="absolute bottom-8 right-8 hidden lg:block pointer-events-none overflow-hidden h-24 w-24 border-r border-b border-primary/40 opacity-50">
          <span className="absolute bottom-1 right-2 text-[10px] font-mono text-primary/60">REV: 2.0.0</span>
        </div>

        <div className="max-w-4xl space-y-12 z-10">
          <div className="space-y-6">
            <div className="inline-block px-3 py-1 border border-primary/30 bg-primary/5 rounded-sm mb-4">
              <span className="text-xs font-mono font-bold tracking-widest text-primary uppercase">Workshop Studio</span>
            </div>
            <h1 className="text-5xl font-bold tracking-tighter sm:text-6xl md:text-7xl lg:text-8xl font-mono uppercase">
              specs<br />before<br /><span className="text-primary underline decoration-primary/30 underline-offset-8">code</span>
            </h1>
            <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl/relaxed lg:text-2xl/relaxed font-sans leading-relaxed">
              Co-create software specifications with AI. Refine your idea through guided clarification, then generate a complete spec — all in one workspace.
            </p>
          </div>

          {/* Persona Selector */}
          {user && !showPersonaSelector && (
            <div className="flex items-center justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPersonaSelector(true)}
                className="font-mono uppercase text-[10px] tracking-widest rounded-none"
              >
                <User className="h-3 w-3 mr-2" />
                Role: {user.persona || "Set your role"}
              </Button>
            </div>
          )}

          {showPersonaSelector && user && (
            <div className="max-w-2xl mx-auto">
              <div className="text-[10px] font-mono text-primary/60 uppercase tracking-[0.3em] mb-4 text-center">
                Select Your Role
              </div>
              <PersonaSelector
                currentPersona={user.persona}
                onSelect={() => setShowPersonaSelector(false)}
              />
              <div className="mt-4 flex justify-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPersonaSelector(false)}
                  className="font-mono uppercase text-[10px]"
                >
                  Close
                </Button>
              </div>
            </div>
          )}

          {/* Primary CTA */}
          <div className="pt-4">
            <Link href={{ pathname: user ? "/workspace" : "/auth/login" }}>
              <Button size="xl" className="font-mono uppercase tracking-widest rounded-none h-14 px-12 gap-3 text-base">
                Start Workshop
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <p className="text-xs text-muted-foreground mt-3 font-mono">
              {user ? "Open the Workshop Studio" : "Sign in to start building"}
            </p>
          </div>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-primary/20 bg-background/50 backdrop-blur-sm">
            <div className="p-8 border-b md:border-b-0 md:border-r border-primary/20 space-y-4 hover:bg-primary/5 transition-colors group">
              <div className="text-xs font-mono text-primary/60 group-hover:text-primary transition-colors">[01]</div>
              <h3 className="font-mono font-bold text-xl uppercase tracking-tight">Agent Swarm</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Domain-specific AI agents collaborate on technical architecture and product requirements.
              </p>
            </div>
            <div className="p-8 border-b md:border-b-0 md:border-r border-primary/20 space-y-4 hover:bg-primary/5 transition-colors group">
              <div className="text-xs font-mono text-primary/60 group-hover:text-primary transition-colors">[02]</div>
              <h3 className="font-mono font-bold text-xl uppercase tracking-tight">System Specs</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Auto-generate PRDs, ERDs, and Open API documentation with production-ready precision.
              </p>
            </div>
            <div className="p-8 space-y-4 hover:bg-primary/5 transition-colors group">
              <div className="text-xs font-mono text-primary/60 group-hover:text-primary transition-colors">[03]</div>
              <h3 className="font-mono font-bold text-xl uppercase tracking-tight">Binary Logic</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Minimize technical debt by establishing clear specifications before committing to code.
              </p>
            </div>
          </div>

          {/* Secondary CTA for non-authenticated users */}
          {!user && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button asChild size="xl" className="font-mono uppercase tracking-widest rounded-none h-14 px-8">
                <Link href="/auth/login" className="gap-2">
                  Deploy Agent <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="xl" asChild className="font-mono uppercase tracking-widest rounded-none h-14 px-8 border-2 border-primary/20 hover:bg-primary/5 hover:text-primary">
                <Link href="https://github.com/firepenguindisopanda/idea-sprinter" target="_blank">
                  Source Repo [v2]
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
