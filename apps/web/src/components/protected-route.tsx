"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: Readonly<ProtectedRouteProps>) {
  // Use individual selectors to keep snapshots stable and avoid infinite re-render loops
  const token = useAuthStore((state) => state.token);
  const isLoading = useAuthStore((state) => state.isLoading);
  const initAuth = useAuthStore((state) => state.initAuth);
  const router = useRouter();

  useEffect(() => {
    // Run initAuth once per mount
    initAuth();
  }, [initAuth]);

  useEffect(() => {
    if (!isLoading && !token) {
      router.push("/auth/login");
    }
  }, [isLoading, token, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!token) {
    // Navigation to login is already enqueued; avoid rendering children to prevent loops
    return null;
  }

  return <>{children}</>;
}
