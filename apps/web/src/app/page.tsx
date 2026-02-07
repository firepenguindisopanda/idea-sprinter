"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/auth-store";
import { ArrowRight, Sparkles, FileCode, Lightbulb, Rocket } from "lucide-react";
import DraftBanner from "@/components/landing/draft-banner";

export default function Home() {
  const { user } = useAuthStore();

  return (
    <div className="relative flex flex-col min-h-full">
      {/* Draft Banner - shows if user has in-progress work */}
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

        <div className="max-w-5xl space-y-12 z-10">
          <div className="space-y-6">
            <div className="inline-block px-3 py-1 border border-primary/30 bg-primary/5 rounded-sm mb-4">
              <span className="text-xs font-mono font-bold tracking-widest text-primary uppercase">Project Initialization Engine</span>
            </div>
            <h1 className="text-5xl font-bold tracking-tighter sm:text-6xl md:text-7xl lg:text-8xl font-mono uppercase">
              specs<br />before<br /><span className="text-primary underline decoration-primary/30 underline-offset-8">code</span>
            </h1>
            <p className="mx-auto max-w-[800px] text-muted-foreground md:text-xl/relaxed lg:text-2xl/relaxed font-sans leading-relaxed">
              A multi-agent system designed to architect your entire software project PRDs, API schemas, and technical stacks before you write a single line of implementation logic.
            </p>
          </div>
          
          {/* Two-Path Entry Section */}
          <div className="pt-8">
            <div className="text-[10px] font-mono text-primary/60 uppercase tracking-[0.3em] mb-6">
              Select Your Entry Point
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              {/* Path 1: Ideation (I have an idea) */}
              <Link 
                href={user ? "/ideation" : "/auth/login"}
                className="group relative"
              >
                <div className="h-full border-2 border-primary/20 bg-background/50 p-8 hover:border-primary/40 hover:bg-primary/5 transition-all duration-300">
                  {/* Corner accents */}
                  <div className="absolute -top-1 -left-1 h-3 w-3 border-l-2 border-t-2 border-primary/40 group-hover:border-primary transition-colors" />
                  <div className="absolute -bottom-1 -right-1 h-3 w-3 border-r-2 border-b-2 border-primary/40 group-hover:border-primary transition-colors" />
                  
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-amber-500/10 border border-amber-500/30 text-amber-500 group-hover:bg-amber-500/20 transition-colors">
                      <Lightbulb className="h-6 w-6" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="text-[10px] font-mono text-primary/50 uppercase tracking-widest mb-1">Path_01</div>
                      <h3 className="font-mono font-bold text-lg uppercase tracking-tight mb-2 group-hover:text-primary transition-colors">
                        I Have an Idea
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Brainstorm and refine your concept with AI assistance before generating specifications.
                      </p>
                      <div className="mt-4 flex items-center text-[10px] font-mono uppercase tracking-widest text-primary/60 group-hover:text-primary transition-colors">
                        <Sparkles className="h-3 w-3 mr-2" />
                        Start Ideation
                        <ArrowRight className="h-3 w-3 ml-2 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>

              {/* Path 2: Generation (I know what to build) */}
              <Link 
                href={user ? "/generate" : "/auth/login"}
                className="group relative"
              >
                <div className="h-full border-2 border-primary/20 bg-background/50 p-8 hover:border-primary/40 hover:bg-primary/5 transition-all duration-300">
                  {/* Corner accents */}
                  <div className="absolute -top-1 -left-1 h-3 w-3 border-l-2 border-t-2 border-primary/40 group-hover:border-primary transition-colors" />
                  <div className="absolute -bottom-1 -right-1 h-3 w-3 border-r-2 border-b-2 border-primary/40 group-hover:border-primary transition-colors" />
                  
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-primary/10 border border-primary/30 text-primary group-hover:bg-primary/20 transition-colors">
                      <FileCode className="h-6 w-6" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="text-[10px] font-mono text-primary/50 uppercase tracking-widest mb-1">Path_02</div>
                      <h3 className="font-mono font-bold text-lg uppercase tracking-tight mb-2 group-hover:text-primary transition-colors">
                        I Know What to Build
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Jump straight into specification generation with your project description.
                      </p>
                      <div className="mt-4 flex items-center text-[10px] font-mono uppercase tracking-widest text-primary/60 group-hover:text-primary transition-colors">
                        <Rocket className="h-3 w-3 mr-2" />
                        Generate Specs
                        <ArrowRight className="h-3 w-3 ml-2 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </div>

            {/* Legacy generator link for authenticated users */}
            {user && (
              <div className="mt-6 text-center">
                <Link 
                  href="/generator" 
                  className="text-[10px] font-mono text-muted-foreground hover:text-primary uppercase tracking-widest transition-colors"
                >
                  Or use legacy generator →
                </Link>
              </div>
            )}
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

          {/* Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 mt-16 border border-primary/20 bg-background/50 backdrop-blur-sm">
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
        </div>
      </div>
    </div>
  );
}
