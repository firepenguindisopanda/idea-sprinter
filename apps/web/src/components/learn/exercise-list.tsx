"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { ArrowRight, Loader2 } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import type { LearningExercise } from "@/types/learning";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * The curated exercises. Each shows the problem - premise and twist - and not
 * the decision it forces: finding that is the exercise.
 */
export function ExerciseList() {
  const [exercises, setExercises] = useState<LearningExercise[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .learningExercises()
      .then(setExercises)
      .catch((e: unknown) => setError(e instanceof ApiError ? e.message : "Could not load the exercises."));
  }, []);

  if (error) {
    return <p role="alert" className="text-destructive text-sm">{error}</p>;
  }
  if (!exercises) {
    return (
      <p className="flex items-center gap-2 text-muted-foreground text-sm">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading exercises
      </p>
    );
  }
  return (
    <ul className="grid gap-4 md:grid-cols-2">
      {exercises.map((exercise) => (
        <li key={exercise.id}>
          <Link
            href={`/learn/${exercise.id}` as Route}
            className="group block h-full rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Card className="h-full transition-colors group-hover:border-primary/60">
              <CardHeader>
                <CardTitle className="flex items-center justify-between gap-2">
                  {exercise.exercise}
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-primary" aria-hidden />
                </CardTitle>
                <CardDescription>{exercise.premise}</CardDescription>
              </CardHeader>
              <CardContent className="text-sm">
                <span className="font-medium">Twist: </span>
                {exercise.twist}
              </CardContent>
            </Card>
          </Link>
        </li>
      ))}
    </ul>
  );
}
