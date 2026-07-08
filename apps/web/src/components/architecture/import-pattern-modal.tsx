"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import type { ArchitectureOption } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, FileDown, X, Search } from "lucide-react";

interface ImportPatternModalProps {
  sessionId: string;
  onClose: () => void;
  onImported: () => void;
}

export default function ImportPatternModal({
  sessionId,
  onClose,
  onImported,
}: ImportPatternModalProps) {
  const [patterns, setPatterns] = useState<ArchitectureOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [importingId, setImportingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadPatterns();
  }, []);

  const loadPatterns = async () => {
    setIsLoading(true);
    try {
      const data = await api.listArchitecturePatterns();
      setPatterns(data.patterns || []);
    } catch {
      setPatterns([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async (patternId: string) => {
    setImportingId(patternId);
    try {
      await api.importPatternToSession(sessionId, patternId);
      onImported();
      onClose();
    } catch {
      // Error handled by caller
    } finally {
      setImportingId(null);
    }
  };

  const filtered = search
    ? patterns.filter(
        (p) =>
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.description.toLowerCase().includes(search.toLowerCase()),
      )
    : patterns;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-background border border-primary/20 rounded-xl w-full max-w-3xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-primary/10">
          <div>
            <h2 className="text-lg font-mono font-bold uppercase tracking-tighter">
              Pattern Library
            </h2>
            <p className="text-sm text-muted-foreground">
              Browse and import architecture patterns into your session.
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-4 border-b border-primary/10">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search patterns..."
              className="w-full pl-10 p-2 border border-primary/20 bg-background focus:border-primary focus:outline-none font-mono text-sm"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-16 text-sm font-mono">
              {search ? "No matching patterns found." : "No patterns available."}
            </p>
          ) : (
            filtered.map((pattern) => (
              <Card key={pattern.id} className="border-primary/20">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="font-mono uppercase text-sm">
                      {pattern.name}
                    </CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleImport(pattern.id)}
                      disabled={importingId === pattern.id}
                      className="font-mono uppercase text-[10px]"
                    >
                      {importingId === pattern.id ? (
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      ) : (
                        <FileDown className="h-3 w-3 mr-1" />
                      )}
                      Import
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-xs text-muted-foreground">{pattern.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {pattern.components.slice(0, 5).map((comp, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 bg-primary/5 border border-primary/20 text-[10px] font-mono"
                      >
                        {comp}
                      </span>
                    ))}
                    {pattern.components.length > 5 && (
                      <span className="text-[10px] text-muted-foreground">
                        +{pattern.components.length - 5} more
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
