"use client";

import { FileQuestion, Plus } from "lucide-react";
import { IconTile } from "@/components/ui/icon-tile";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface EmptyStateProps {
  readonly title: string;
  readonly description: string;
}

export default function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center border border-dashed border-primary/25 bg-primary/[0.02] px-4 py-24 text-center">
      <IconTile size="lg" className="mb-6">
        <FileQuestion />
      </IconTile>

      <h3 className="mb-2 text-xl font-bold tracking-tight">{title}</h3>
      <p className="mb-10 max-w-md text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>

      <Link href="/workspace">
        <Button size="xl">
          <Plus className="mr-2 h-4 w-4" />
          Start a draft
        </Button>
      </Link>
    </div>
  );
}
