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
import { Download, FileText, FileJson, File, Loader2 } from "lucide-react";
import { downloadProjectPdf } from "@/lib/api";
import { buildSpecMarkdown } from "@/lib/markdown-export";
import { toast } from "sonner";

export function ExportDropdown() {
  const { documentSections, projectTitle } = useWorkspace();
  const [open, setOpen] = useState(false);
  // The PDF is generated server-side, so unlike the local markdown/JSON writes
  // it can take a moment and can fail.
  const [isExporting, setIsExporting] = useState(false);

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
        const md = buildSpecMarkdown(projectTitle, documentSections);
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
        // Was a toast saying PDF "will be available" - followed immediately by
        // a success toast claiming it had downloaded. The endpoint exists; the
        // workspace just never called it.
        const sorted = [...documentSections].sort((a, b) => a.order - b.order);
        const outputs: Record<string, string> = {};
        for (const section of sorted) {
          // Keyed by title, not section id: the generator titles each block
          // from its key, and `sec-overview` prints as "Sec-Overview".
          if (section.content.trim()) outputs[section.title] = section.content;
        }
        if (Object.keys(outputs).length === 0) {
          toast.info("Nothing to export", { description: "Generate document sections first." });
          setOpen(false);
          return;
        }
        setIsExporting(true);
        await downloadProjectPdf(projectTitle || "Specification Document", outputs);
      }
      toast.success("Exported", { description: `Downloaded as ${format.toUpperCase()}` });
      setOpen(false);
    } catch {
      toast.error("Export failed", { description: "Could not export the document" });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 text-xs" disabled={isExporting}>
          {isExporting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Download className="h-3.5 w-3.5" />
          )}
          <span className="hidden sm:inline">{isExporting ? "Exporting..." : "Export"}</span>
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
