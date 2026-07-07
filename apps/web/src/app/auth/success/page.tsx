"use client";

import { useEffect, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import { api } from "@/lib/api";
import { Loader2 } from "lucide-react";

function AuthSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setToken, fetchUser } = useAuthStore();
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    const code = searchParams.get("code");
    
    if (code) {
      initialized.current = true;
      const init = async () => {
        try {
          const { token } = await api.exchangeCode(code);
          setToken(token);
          await fetchUser();
          router.push("/");
        } catch (err) {
          console.error("Exchange code failed", err);
          router.push("/auth/login?error=exchange_failed");
        }
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
        <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-primary/60">Almost there</p>
        <p className="text-xl font-mono font-bold uppercase tracking-tight">Signing you in...</p>
      </div>
    </div>
  );
}

export default function AuthSuccessPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background blueprint-grid">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-primary/60">Loading...</p>
      </div>
    }>
      <AuthSuccessContent />
    </Suspense>
  );
}
