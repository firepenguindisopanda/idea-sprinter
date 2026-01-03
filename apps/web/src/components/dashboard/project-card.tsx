"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Trash2, Download, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import type { Project } from "@/types";

interface ProjectCardProps {
  readonly project: Project;
  readonly onDelete: (id: number) => void;
  readonly onDownloadPdf: (project: Project) => void;
}

export default function ProjectCard({ project, onDelete, onDownloadPdf }: ProjectCardProps) {
  const router = useRouter();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleView = () => {
    router.push(`/dashboard/${project.id}` as const);
  };

  const handleDelete = () => {
    onDelete(project.id);
    setIsDeleteDialogOpen(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const agentCount = Object.keys(project.artifacts).length;

  return (
    <>
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-start justify-between">
            <CardTitle className="text-xl line-clamp-2">{project.title}</CardTitle>
            <Badge variant="secondary" className="ml-2 shrink-0">
              {agentCount} agents
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-3">
            {project.description && (
              <p className="text-sm text-muted-foreground line-clamp-3">
                {project.description}
              </p>
            )}
            
            <div className="flex items-center text-xs text-muted-foreground">
              <Calendar className="mr-1 h-3 w-3" />
              Created {formatDate(project.created_at)}
            </div>

            <div className="flex flex-wrap gap-1">
              {Object.keys(project.artifacts).slice(0, 5).map((agentRole) => (
                <Badge key={agentRole} variant="outline" className="text-xs">
                  {agentRole.replaceAll('_', ' ')}
                </Badge>
              ))}
              {Object.keys(project.artifacts).length > 5 && (
                <Badge variant="outline" className="text-xs">
                  +{Object.keys(project.artifacts).length - 5} more
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between gap-2">
          <Button
            variant="default"
            size="sm"
            onClick={handleView}
            className="flex-1"
          >
            <Eye className="mr-1 h-4 w-4" />
            View
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDownloadPdf(project)}
          >
            <Download className="h-4 w-4" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsDeleteDialogOpen(true)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &quot;{project.title}&quot; and all its generated specifications.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete Project
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
