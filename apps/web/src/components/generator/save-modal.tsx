"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

interface SaveModalProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly onSave: (title: string, description: string) => void;
  readonly isSaving?: boolean;
  readonly defaultTitle?: string;
  readonly defaultDescription?: string;
}

export default function SaveModal({
  open,
  onClose,
  onSave,
  isSaving = false,
  defaultTitle = "",
  defaultDescription = "",
}: SaveModalProps) {
  const [title, setTitle] = useState(defaultTitle);
  const [description, setDescription] = useState(defaultDescription);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      setError("Project title is required");
      return;
    }
    
    setError("");
    onSave(title, description);
  };

  const handleClose = () => {
    if (!isSaving) {
      setTitle("");
      setDescription("");
      setError("");
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="rounded-none border-2 border-primary/20 bg-background/95 backdrop-blur-xl"
        onEscapeKeyDown={(event) => {
          event.preventDefault();
          handleClose();
        }}
      >
        <form onSubmit={handleSubmit}>
          <DialogHeader className="border-b border-primary/10 pb-4">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 bg-primary" />
              <DialogTitle className="font-mono uppercase tracking-widest">Save Project</DialogTitle>
            </div>
            <DialogDescription className="font-sans italic text-sm">
              Give your project a name and save it to your dashboard.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-8">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-[10px] font-mono uppercase tracking-widest text-primary/70">Project Name *</Label>
              <Input
                id="title"
                placeholder="My Project"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isSaving}
                className={`rounded-none border-primary/20 bg-background/50 font-mono text-sm focus-visible:ring-primary/30 h-11 ${error ? "border-destructive focus-visible:ring-destructive/30" : ""}`}
              />
              {error && <p className="text-[10px] font-mono text-destructive uppercase tracking-tighter">{error}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description" className="text-[10px] font-mono uppercase tracking-widest text-primary/70">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Add a brief description..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isSaving}
                rows={3}
                className="rounded-none border-primary/20 bg-background/50 font-mono text-sm focus-visible:ring-primary/30 min-h-[100px]"
              />
            </div>
          </div>
          
          <DialogFooter className="border-t border-primary/10 pt-6">
            <Button
              type="button"
              variant="ghost"
              onClick={handleClose}
              disabled={isSaving}
              className="rounded-none font-mono uppercase text-[10px] tracking-widest"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSaving}
              className="rounded-none font-mono uppercase text-[10px] tracking-[0.2em] bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-6 border-2 border-primary/50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Project"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
