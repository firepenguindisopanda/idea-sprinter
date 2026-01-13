"use client";
import Link from "next/link";
import { ModeToggle } from "./mode-toggle";
import { useAuthStore } from "@/lib/auth-store";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useEffect, useState } from "react";

export default function Header() {
  const { user, logout, initAuth } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    initAuth();
    setMounted(true);
  }, [initAuth]);

  const links = [
    { to: "/" as any, label: "Home" },
    ...(user ? [
      { to: "/generator" as any, label: "Generator" },
      { to: "/dashboard" as any, label: "Dashboard" }
    ] : [])
  ];

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <header className="border-b">
        <div className="flex h-16 items-center px-4 container mx-auto">
          <div className="mr-4 hidden md:flex">
            <Link href="/" className="mr-6 flex items-center space-x-2">
              <span className="hidden font-bold sm:inline-block">
                specs before code
              </span>
            </Link>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-50">
      <div className="flex h-16 items-center px-6 container mx-auto">
        <div className="mr-8 flex items-center">
          <Link href="/" className="mr-8 flex items-center space-x-2">
            <div className="h-6 w-6 border-2 border-primary rotate-45 flex items-center justify-center">
              <div className="h-4 w-4 bg-primary/20 -rotate-45" />
            </div>
            <span className="font-mono font-bold tracking-tighter text-lg uppercase">
              specs<span className="text-primary">:</span>before<span className="text-primary">:</span>code
            </span>
          </Link>
          <nav className="hidden md:flex items-center space-x-8">
            {links.map(({ to, label }) => (
              <Link
                key={to}
                href={to}
                className="font-mono text-xs uppercase tracking-widest transition-colors hover:text-primary text-muted-foreground"
              >
                [{label}]
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <div className="flex items-center gap-4">
            <ModeToggle />
            {user ? (
              <div className="flex items-center gap-3 pl-4 border-l border-primary/10">
                <div className="hidden lg:flex flex-col items-end">
                  <span className="text-[10px] font-mono leading-none text-muted-foreground uppercase">Authorized Agent</span>
                  <span className="text-xs font-mono font-bold leading-none">{user.full_name || user.email.split('@')[0]}</span>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-9 w-9 rounded-none border border-primary/20 p-0 overflow-hidden hover:bg-primary/10">
                      {user.profile_picture ? (
                        <img
                          src={user.profile_picture}
                          alt={user.full_name || "User"}
                          className="h-full w-full object-cover grayscale contrast-125"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-primary/10 font-mono text-primary group-hover:bg-primary/20">
                          {user.full_name?.[0] || user.email[0]}
                        </div>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 rounded-none border-2 p-0" align="end" forceMount>
                    <DropdownMenuLabel className="font-mono bg-primary/5 p-4 border-b">
                      <div className="flex flex-col space-y-1">
                        <p className="text-xs font-bold leading-none uppercase tracking-tighter">{user.full_name}</p>
                        <p className="text-[10px] leading-none text-muted-foreground font-mono">
                          {user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="m-0" />
                    <DropdownMenuItem asChild className="rounded-none cursor-pointer focus:bg-primary/10 font-mono text-xs uppercase p-3">
                      <Link href="/dashboard">System Dashboard</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="rounded-none cursor-pointer focus:bg-primary/10 font-mono text-xs uppercase p-3">
                      <Link href="/profile">Agent Profile</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="m-0" />
                    <DropdownMenuItem
                      onClick={() => logout()}
                      className="rounded-none cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive font-mono text-xs uppercase p-3"
                    >
                      Terminate Session
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <Button asChild variant="outline" size="sm" className="font-mono uppercase tracking-tighter rounded-none border-2">
                <Link href="/auth/login">Access System</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
