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
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="rounded-full bg-muted p-6 mb-4">
        <FileQuestion className="h-12 w-12 text-muted-foreground" />
      </div>
      
      <h3 className="text-2xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground mb-6 max-w-md">
        {description}
      </p>
      
      <Link href="/generator">
        <Button size="lg">
          <Plus className="mr-2 h-5 w-5" />
          Create Your First Project
        </Button>
      </Link>
    </div>
  );
}
