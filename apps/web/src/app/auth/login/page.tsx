"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    try {
      setIsLoading(true);
      const { url } = await api.getLoginUrl();
      globalThis.location.href = url;
    } catch (error) {
      console.error("Failed to get login URL", error);
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 relative blueprint-grid">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background pointer-events-none" />
      
      <Card className="w-full max-w-md rounded-none border-2 border-primary/20 bg-background/80 backdrop-blur-md relative z-10">
        <div className="absolute -top-3 -left-3 h-6 w-6 border-l-2 border-t-2 border-primary" />
        <div className="absolute -bottom-3 -right-3 h-6 w-6 border-r-2 border-b-2 border-primary" />
        
        <CardHeader className="text-center pb-8 border-b border-primary/10">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="h-1.5 w-1.5 bg-primary rounded-full animate-pulse" />
            <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-primary/60">Secure_Access_Point</span>
          </div>
          <CardTitle className="text-3xl font-mono font-bold uppercase tracking-tight">System_Login</CardTitle>
          <CardDescription className="font-sans italic text-sm mt-2">
            Authenticate session to access specs before code architectural protocols.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="flex flex-col gap-6 pt-8">
          <Button 
            className="w-full rounded-none h-14 font-mono uppercase tracking-widest border-2 border-primary/50 bg-primary text-primary-foreground hover:bg-primary/90 transition-all group" 
            onClick={handleLogin} 
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <div className="flex items-center">
                <svg className="mr-3 h-4 w-4 fill-current" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                <span>Authorize_Google</span>
              </div>
            )}
            <span className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity"> {">"} </span>
          </Button>
          
          <div className="text-center">
            <p className="text-[10px] font-mono uppercase text-muted-foreground tracking-tighter">
              By accessing this terminal, you agree to procedural guidelines.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
