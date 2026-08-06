"use client";

import { useEffect, Suspense, useRef } from "react";
import type { Route } from "next";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import { consumeIntendedRoute } from "@/lib/post-login-redirect";
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
          // Was `/` - the marketing page - so every sign-in ended by asking
          // the user to click through to where they had already been going.
          // Cast: the destination is only known at runtime, so typed routes
          // cannot check it. `consumeIntendedRoute` validates it instead.
          router.push(consumeIntendedRoute() as Route);
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
    <div className="flex min-h-full flex-col items-center justify-center gap-6">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <div className="space-y-1 text-center">
        <p className="label-xs text-primary/80">Almost there</p>
        <p className="label-lg text-xl">Signing you in...</p>
      </div>
    </div>
  );
}

export default function AuthSuccessPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-full flex-col items-center justify-center gap-6">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="label-xs text-primary/80">Loading...</p>
      </div>
    }>
      <AuthSuccessContent />
    </Suspense>
  );
}
