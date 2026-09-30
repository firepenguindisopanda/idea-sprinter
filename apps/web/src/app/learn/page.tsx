"use client";

import ProtectedRoute from "@/components/protected-route";
import { ExerciseList } from "@/components/learn/exercise-list";

export default function LearnPage() {
  return (
    <ProtectedRoute>
      <div className="container mx-auto max-w-5xl px-6 py-8 space-y-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold tracking-[-0.03em]">
            Practise <span className="text-primary">system design</span>
          </h1>
          <p className="text-muted-foreground max-w-2xl">
            Pick an exercise and design it yourself. Your draft is graded against a key of the
            decisions a strong design makes; you get hints for what is missing, and the answers and
            a reference design when you ask for them.
          </p>
        </header>
        <ExerciseList />
      </div>
    </ProtectedRoute>
  );
}
