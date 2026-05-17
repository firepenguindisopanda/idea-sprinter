// src/components/workspace/export-dropdown.tsx
"use client";

import { useState } from "react";
import { useWorkspace } from "@/hooks/use-workspace";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileText, FileJson, File } from "lucide-react";
import { toast } from "sonner";

export function ExportDropdown() {
  const { documentSections, projectTitle } = useWorkspace();
  const [open, setOpen] = useState(false);

  const buildMarkdown = (): string => {
    const sorted = [...documentSections].sort((a, b) => a.order - b.order);
    const lines: string[] = [`# ${projectTitle || "Specification Document"}\n`];
    for (const section of sorted) {
      if (section.content) {
        lines.push(`## ${section.title}\n`);
        lines.push(`${section.content}\n`);
      }
    }
    return lines.join("\n");
  };

  const buildJson = (): string => {
    const sorted = [...documentSections].sort((a, b) => a.order - b.order);
    const data = {
      title: projectTitle || "Specification Document",
      sections: sorted.map((s) => ({
        title: s.title,
        content: s.content,
        order: s.order,
      })),
    };
    return JSON.stringify(data, null, 2);
  };

  const handleExport = async (format: "markdown" | "pdf" | "json") => {
    try {
      if (format === "markdown") {
        const md = buildMarkdown();
        const blob = new Blob([md], { type: "text/markdown" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${projectTitle || "specification"}.md`;
        a.click();
        URL.revokeObjectURL(url);
      } else if (format === "json") {
        const json = buildJson();
        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${projectTitle || "specification"}.json`;
        a.click();
        URL.revokeObjectURL(url);
      } else if (format === "pdf") {
        toast.info("PDF export", {
          description: "PDF export will be available via the existing download utilities.",
        });
      }
      toast.success("Exported", { description: `Downloaded as ${format.toUpperCase()}` });
      setOpen(false);
    } catch {
      toast.error("Export failed", { description: "Could not export the document" });
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 text-xs">
          <Download className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Export</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem onClick={() => handleExport("markdown")} className="gap-2 text-xs">
          <FileText className="h-3.5 w-3.5" />
          Markdown
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport("pdf")} className="gap-2 text-xs">
          <File className="h-3.5 w-3.5" />
          PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport("json")} className="gap-2 text-xs">
          <FileJson className="h-3.5 w-3.5" />
          JSON
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
