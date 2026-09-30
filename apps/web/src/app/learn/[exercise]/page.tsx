"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import ProtectedRoute from "@/components/protected-route";
import { ExerciseWorkspace } from "@/components/learn/exercise-workspace";

export default function LearnExercisePage() {
  const params = useParams<{ exercise: string }>();
  return (
    <ProtectedRoute>
      <div className="container mx-auto px-6 py-6 space-y-4">
        <Link href="/learn" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> All exercises
        </Link>
        <ExerciseWorkspace exerciseId={params.exercise} />
      </div>
    </ProtectedRoute>
  );
}
