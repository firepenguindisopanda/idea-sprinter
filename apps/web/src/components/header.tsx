"use client";
import Link from "next/link";
import Image from "next/image";
import type { Route } from "next";
import { Menu } from "lucide-react";
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useLayoutEffect, useState } from "react";

export default function Header() {
  const { user, logout, initAuth } = useAuthStore();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (to: string) =>
    to === "/" ? pathname === "/" : pathname === to || pathname?.startsWith(`${to}/`);

  useLayoutEffect(() => {
    initAuth();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, [initAuth]);

  const links: { to: Route; label: string }[] = [
    { to: "/" as Route, label: "Home" },
    ...(user ? [
      { to: "/workspace" as Route, label: "Workshop" },
      { to: "/learn" as Route, label: "Learn" },
      { to: "/architecture" as Route, label: "Architecture" },
      { to: "/dashboard" as Route, label: "Dashboard" },
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
      <div className="flex h-16 items-center px-4 sm:px-6 container mx-auto">
        {/* Mobile hamburger menu */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="sm" className="md:hidden mr-2 p-2">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Open menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <SheetHeader className="p-6 border-b border-primary/10">
              <SheetTitle className="label-lg text-sm">
                specs<span className="text-primary">:</span>before<span className="text-primary">:</span>code
              </SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col py-4">
              {links.map(({ to, label }) => (
                <Link
                  key={to}
                  href={to}
                  onClick={() => setMobileOpen(false)}
                  aria-current={isActive(to) ? "page" : undefined}
                  className={cn(
                    "label-sm border-l-2 px-6 py-3 transition-colors",
                    isActive(to)
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-transparent text-muted-foreground hover:bg-primary/5 hover:text-primary",
                  )}
                >
                  [{label}]
                </Link>
              ))}
              {user && (
                <>
                  <div className="h-px bg-primary/10 my-2 mx-6" />
                  <Link
                    href="/profile"
                    onClick={() => setMobileOpen(false)}
                    aria-current={isActive("/profile") ? "page" : undefined}
                    className={cn(
                      "label-sm border-l-2 px-6 py-3 transition-colors",
                      isActive("/profile")
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-transparent text-muted-foreground hover:bg-primary/5 hover:text-primary",
                    )}
                  >
                    [Profile]
                  </Link>
                  <button
                    onClick={() => { setMobileOpen(false); logout(); }}
                    className="label-sm border-l-2 border-transparent px-6 py-3 transition-colors hover:bg-destructive/5 text-destructive text-left"
                  >
                    [Logout]
                  </button>
                </>
              )}
              {!user && (
                <>
                  <div className="h-px bg-primary/10 my-2 mx-6" />
                  <Link
                    href="/auth/login"
                    onClick={() => setMobileOpen(false)}
                    aria-current={isActive("/auth/login") ? "page" : undefined}
                    className={cn(
                      "label-sm border-l-2 px-6 py-3 transition-colors",
                      isActive("/auth/login")
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-transparent text-muted-foreground hover:bg-primary/5 hover:text-primary",
                    )}
                  >
                    [Log In]
                  </Link>
                </>
              )}
            </nav>
          </SheetContent>
        </Sheet>

        {/* The two mr-8s space the wordmark from the nav links, which only
            show from md; below it they were 64px of nothing on a 375px
            phone. Below sm the wordmark alone carries the brand (the logo
            mark's 32px is what lets it fit whole at 375px). min-w-0 and
            truncate let it give way on narrower screens instead of widening
            the page. */}
        <div className="mr-2 md:mr-8 flex min-w-0 items-center">
          <Link href="/" className="md:mr-8 flex min-w-0 items-center space-x-2">
            <Image
              src="/favicon.ico"
              alt="Logo"
              width={24}
              height={24}
              className="hidden sm:block h-6 w-6 shrink-0 object-contain"
            />
            <span className="label-lg text-base sm:text-lg truncate">
              specs<span className="text-primary">:</span>before<span className="text-primary">:</span>code
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 self-stretch">
            {links.map(({ to, label }) => (
              <Link
                key={to}
                href={to}
                aria-current={isActive(to) ? "page" : undefined}
                className={cn(
                  "label-sm flex items-center border-b-2 transition-colors",
                  isActive(to)
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-primary",
                )}
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
                  <span className="label-xs text-muted-foreground">Signed In</span>
                  <span className="text-xs font-mono font-bold leading-none">{user.full_name || user.email.split('@')[0]}</span>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      className="relative h-9 w-9 rounded-none border border-primary/20 p-0 overflow-hidden hover:bg-primary/10"
                      aria-label="User menu"
                    >
                      {user.profile_picture ? (
                        <Image
                          src={user.profile_picture}
                          alt={user.full_name || "User"}
                          width={36}
                          height={36}
                          className="h-full w-full object-cover grayscale contrast-125"
                          referrerPolicy="no-referrer"
                        />) : (
                        <div className="flex h-full w-full items-center justify-center bg-primary/10 font-mono text-primary group-hover:bg-primary/20">
                          {user.full_name?.[0] || user.email[0]}
                        </div>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 rounded-none border-2 p-0" align="end" forceMount>
                    <DropdownMenuLabel className="font-mono bg-primary/5 p-4 border-b">
                      <div className="flex flex-col space-y-1">
                        <p className="label-lg text-xs leading-none">{user.full_name}</p>
                        <p className="text-xs leading-none text-muted-foreground font-mono">
                          {user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="m-0" />
                    <DropdownMenuItem asChild className="rounded-none cursor-pointer focus:bg-primary/10 font-mono text-xs uppercase p-3">
                      <Link href="/dashboard">Dashboard</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="rounded-none cursor-pointer focus:bg-primary/10 font-mono text-xs uppercase p-3">
                      <Link href="/profile">Profile</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="m-0" />
                    <DropdownMenuItem
                      onClick={() => logout()}
                      className="rounded-none cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive font-mono text-xs uppercase p-3"
                    >
                      Log Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <Button asChild variant="outline" size="sm" className="label-lg rounded-none border-2">
                <Link href="/auth/login">Log In</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
