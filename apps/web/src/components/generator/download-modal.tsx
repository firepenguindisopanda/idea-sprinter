"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Download,
  FileText,
  Package,
  BookOpen,
  Archive,
  FileJson,
  Loader2,
} from "lucide-react";
import type { GenerateResponse } from "@/types";

interface DownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  results: GenerateResponse | null;
  projectName?: string;
}

type DownloadOption = "prd" | "srs" | "architecture" | "api" | "qa" | "handbook" | "full_package";

const DOWNLOAD_OPTIONS: {
  id: DownloadOption;
  label: string;
  description: string;
  icon: React.ReactNode;
  fileType: string;
}[] = [
  {
    id: "prd",
    label: "Product Requirements Document",
    description: "User stories, features, and acceptance criteria",
    icon: <FileText className="h-5 w-5" />,
    fileType: "PRD.md",
  },
  {
    id: "srs",
    label: "Software Requirements Specification",
    description: "Complete technical specifications",
    icon: <FileText className="h-5 w-5" />,
    fileType: "SRS.md",
  },
  {
    id: "architecture",
    label: "Architecture Specification",
    description: "System design, components, and decisions",
    icon: <FileJson className="h-5 w-5" />,
    fileType: "Architecture.md",
  },
  {
    id: "api",
    label: "API Design Specification",
    description: "Endpoints, schemas, and error handling",
    icon: <FileJson className="h-5 w-5" />,
    fileType: "API_Design.md",
  },
  {
    id: "qa",
    label: "QA Strategy & Test Plan",
    description: "Testing approach, test cases, and coverage",
    icon: <BookOpen className="h-5 w-5" />,
    fileType: "QA_Strategy.md",
  },
  {
    id: "handbook",
    label: "Coder's Implementation Handbook",
    description: "Phase-by-phase implementation guide",
    icon: <BookOpen className="h-5 w-5" />,
    fileType: "Coding_Handbook.md",
  },
];

export default function DownloadModal({
  isOpen,
  onClose,
  results,
  projectName,
}: DownloadModalProps) {
  const [selectedOptions, setSelectedOptions] = useState<Set<DownloadOption>>(
    new Set(["full_package"])
  );
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadedType, setDownloadedType] = useState<string | null>(null);

  const toggleOption = (optionId: DownloadOption) => {
    const newSelected = new Set(selectedOptions);
    if (newSelected.has(optionId)) {
      newSelected.delete(optionId);
    } else {
      newSelected.add(optionId);
    }
    setSelectedOptions(newSelected);
  };

  const handleDownload = async (optionId: DownloadOption) => {
    if (!results) return;

    setIsDownloading(true);
    setDownloadedType(optionId);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
      const endpointMap: Record<DownloadOption, string> = {
        prd: `${API_URL}/api/download/markdown/prd`,
        srs: `${API_URL}/api/download/markdown/srs`,
        architecture: `${API_URL}/api/download/markdown/architecture`,
        api: `${API_URL}/api/download/markdown/api`,
        qa: `${API_URL}/api/download/markdown/qa`,
        handbook: `${API_URL}/api/download/markdown/handbook`,
        full_package: `${API_URL}/api/download/markdown/package`,
      };

      const endpoint = endpointMap[optionId];

      // Build request body based on option type
      let body: Record<string, unknown>;
      let filename: string;

      if (optionId === "full_package") {
        body = {
          project_description: results.project_description || "",
          project_name: projectName || "project",
          markdown_outputs: results.markdown_outputs || {},
          version: "1.0.0",
        };
        filename = `${projectName || "project"}_spec_package.zip`;
      } else {
        const contentMap: Record<DownloadOption, string> = {
          prd: results.markdown_outputs?.product_owner || "",
          srs: results.markdown_outputs?.spec_coordinator || "",
          architecture: results.markdown_outputs?.solution_architect || "",
          api: results.markdown_outputs?.api_designer || "",
          qa: results.markdown_outputs?.qa_strategist || "",
          handbook: "", // Generated on server
          full_package: "",
        };

        body = {
          project_description: results.project_description || "",
          project_name: projectName || "project",
          content: contentMap[optionId] || results.markdown_outputs?.spec_coordinator || "",
          version: "1.0.0",
          document_type: optionId,
        };

        const extension = optionId === "handbook" ? "md" : "md";
        const prefix = optionId === "handbook" ? "Coding_Handbook" : optionId.toUpperCase();
        filename = `${prefix}_${projectName || "project"}.${extension}`;
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`Download failed: ${response.statusText}`);
      }

      // Get content type to determine how to handle response
      const contentType = response.headers.get("Content-Type") || "";
      const blob = await response.blob();

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error("Download failed:", error);
      alert("Download failed. Please try again.");
    } finally {
      setIsDownloading(false);
      setDownloadedType(null);
    }
  };

  const handleDownloadAll = async () => {
    // For full package, just download that
    if (selectedOptions.has("full_package")) {
      await handleDownload("full_package");
      return;
    }

    // Download selected items one by one
    for (const option of Array.from(selectedOptions)) {
      await handleDownload(option);
      // Small delay between downloads
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-mono uppercase tracking-wider">
            <Download className="h-5 w-5" />
            Download Specifications
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Quick Options */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="font-mono text-sm uppercase tracking-wider">
                Quick Download
              </Label>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {/* Full Package */}
              <button
                onClick={() => handleDownload("full_package")}
                disabled={isDownloading}
                className={`flex items-center gap-4 p-4 border-2 rounded-none transition-colors ${
                  selectedOptions.has("full_package")
                    ? "border-primary bg-primary/5"
                    : "border-primary/20 hover:border-primary/40"
                }`}
              >
                <div className="h-12 w-12 bg-primary/10 flex items-center justify-center">
                  <Package className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-mono font-bold uppercase text-sm tracking-wider">
                    Complete Package
                  </div>
                  <div className="text-xs text-muted-foreground">
                    ZIP with all documents + Coding Handbook
                  </div>
                </div>
                <div className="text-xs font-mono text-primary uppercase">
                  .zip
                </div>
                {isDownloading && downloadedType === "full_package" && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
              </button>

              {/* Coding Handbook */}
              <button
                onClick={() => handleDownload("handbook")}
                disabled={isDownloading}
                className="flex items-center gap-4 p-4 border-2 border-primary/20 rounded-none hover:border-primary/40 transition-colors"
              >
                <div className="h-12 w-12 bg-primary/10 flex items-center justify-center">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-mono font-bold uppercase text-sm tracking-wider">
                    Coder&apos;s Handbook
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Implementation guide for agent coders
                  </div>
                </div>
                <div className="text-xs font-mono text-primary uppercase">.md</div>
                {isDownloading && downloadedType === "handbook" && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
              </button>
            </div>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-primary/10" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or download individual documents
              </span>
            </div>
          </div>

          {/* Individual Documents */}
          <div className="space-y-3">
            <Label className="font-mono text-sm uppercase tracking-wider">
              Individual Documents
            </Label>
            <div className="grid grid-cols-1 gap-2">
              {DOWNLOAD_OPTIONS.filter(
                (opt) => opt.id !== "handbook" && opt.id !== "full_package"
              ).map((option) => (
                <div
                  key={option.id}
                  role="button"
                  tabIndex={isDownloading ? -1 : 0}
                  onClick={() => {
                    if (!isDownloading) {
                      handleDownload(option.id);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (isDownloading) return;
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleDownload(option.id);
                    }
                  }}
                  aria-disabled={isDownloading}
                  className={`flex items-center gap-3 p-3 border border-primary/10 rounded-none transition-colors text-left ${
                    isDownloading ? "opacity-50 pointer-events-none" : "hover:border-primary/30"
                  }`}
                >
                  <Checkbox
                    checked={selectedOptions.has(option.id)}
                    onCheckedChange={() => toggleOption(option.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="h-8 w-8 bg-primary/5 flex items-center justify-center text-primary/60">
                    {option.icon}
                  </div>
                  <div className="flex-1">
                    <div className="font-mono text-xs uppercase tracking-wider">
                      {option.label}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {option.description}
                    </div>
                  </div>
                  <div className="text-[10px] font-mono text-muted-foreground">
                    {option.fileType}
                  </div>
                  {isDownloading && downloadedType === option.id && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-primary/5 border border-primary/10 p-4 space-y-2">
            <div className="font-mono text-xs uppercase tracking-wider text-primary font-bold">
              What&apos;s in the package?
            </div>
            <ul className="text-[10px] font-mono text-muted-foreground space-y-1">
              <li>• PRD.md - Product Requirements Document</li>
              <li>• SRS.md - Complete Software Requirements</li>
              <li>• Individual section files (Architecture, API, QA, etc.)</li>
              <li>• Coding Handbook - Implementation guide for coders</li>
              <li>• All files include YAML frontmatter for versioning</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="font-mono text-xs uppercase tracking-wider rounded-none"
            >
              Close
            </Button>
            {selectedOptions.size > 0 && !selectedOptions.has("full_package") && (
              <Button
                onClick={handleDownloadAll}
                disabled={isDownloading}
                className="font-mono text-xs uppercase tracking-wider rounded-none bg-primary"
              >
                {isDownloading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Downloading...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Download Selected ({selectedOptions.size})
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
