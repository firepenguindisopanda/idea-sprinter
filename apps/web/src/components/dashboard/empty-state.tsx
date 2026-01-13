"use client";

import { FileQuestion, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface EmptyStateProps {
  readonly title: string;
  readonly description: string;
}

export default function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-4 text-center border-2 border-dashed border-primary/20 bg-primary/[0.02]">
      <div className="border border-primary/20 p-6 mb-6 rotate-45 group hover:rotate-90 transition-transform duration-500">
        <FileQuestion className="h-10 w-10 text-primary/40 -rotate-45 group-hover:-rotate-90 transition-transform duration-500" />
      </div>
      
      <h3 className="text-xl font-mono font-bold uppercase mb-2 tracking-tight">{title}</h3>
      <p className="text-muted-foreground mb-10 max-w-md text-sm font-sans italic">
        {description}
      </p>
      
      <Link href="/generator">
        <Button size="xl" className="font-mono uppercase tracking-widest rounded-none border-2 border-primary/40 bg-background text-foreground hover:bg-primary hover:text-primary-foreground transition-all">
          <Plus className="mr-2 h-5 w-5" />
          Initialize First Entity
        </Button>
      </Link>
    </div>
  );
}
