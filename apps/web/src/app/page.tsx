"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/lib/auth-store";
import { ArrowRight, Sparkles } from "lucide-react";

export default function Home() {
  const { user } = useAuthStore();

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] p-4 text-center">
      <div className="max-w-3xl space-y-8">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
            Generate Software Specs with <span className="text-primary">AI Agents</span>
          </h1>
          <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
            IdeaSprinter uses a team of specialized AI agents to turn your idea into a comprehensive software specification document, complete with architecture, database schema, and implementation plan.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {user ? (
            <Button asChild size="lg" className="gap-2">
              <Link href="/generator">
                Start Generating <Sparkles className="h-4 w-4" />
              </Link>
            </Button>
          ) : (
            <Button asChild size="lg" className="gap-2">
              <Link href="/auth/login">
                Get Started <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          )}
          <Button variant="outline" size="lg" asChild>
            <Link href="https://github.com/your-repo" target="_blank">
              View on GitHub
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12 text-left">
          <div className="space-y-2">
            <h3 className="font-bold text-xl">Multi-Agent System</h3>
            <p className="text-muted-foreground">
              Product Owner, Architect, Tech Lead, and more work together to refine your idea.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-bold text-xl">Comprehensive Docs</h3>
            <p className="text-muted-foreground">
              Get PRDs, database schemas, API specs, and implementation guides in minutes.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-bold text-xl">Export to PDF</h3>
            <p className="text-muted-foreground">
              Download a professional PDF report of your project specifications to share with your team.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
