"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import { Loader2 } from "lucide-react";

function AuthSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setToken, fetchUser } = useAuthStore();

  useEffect(() => {
    const token = searchParams.get("token");
    
    if (token) {
      const init = async () => {
        setToken(token);
        await fetchUser();
        router.push("/generator");
      };
      init();
    } else {
      router.push("/auth/login");
    }
  }, [searchParams, setToken, fetchUser, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background blueprint-grid">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <div className="space-y-1 text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-primary/60">Finalizing_Handshake</p>
        <p className="text-xl font-mono font-bold uppercase tracking-tight">Syncing_Credentials...</p>
      </div>
    </div>
  );
}

export default function AuthSuccessPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background blueprint-grid">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-primary/60">Loading_System_Runtime</p>
      </div>
    }>
      <AuthSuccessContent />
    </Suspense>
  );
}
