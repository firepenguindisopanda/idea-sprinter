"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Save, Activity, User, RotateCcw, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useAuthStore } from "@/lib/auth-store";
import { api } from "@/lib/api";
import { PersonaSelector } from "@/components/persona/persona-selector";

export default function ProfileForm() {
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [cacheHealth, setCacheHealth] = useState<{
    status: string;
    keys_tracked: number;
    ttl_seconds: number;
  } | null>(null);
  const [cacheLoading, setCacheLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    langsmithProject: "specsbeforecode-dev",
    enableTracing: true,
  });

  const fetchCacheHealth = useCallback(async () => {
    try {
      const health = await api.getCacheHealth();
      setCacheHealth(health);
    } catch {
      setCacheHealth({ status: "degraded", keys_tracked: 0, ttl_seconds: 300 });
    }
  }, []);

  const fetchPreferences = useCallback(async () => {
    try {
      const res = await api.getPreferences();
      const prefs = res.preferences ?? {};
      setFormData((prev) => ({
        ...prev,
        langsmithProject: (prefs.langsmithProject as string) || "specsbeforecode-dev",
        enableTracing: prefs.enableTracing !== false,
      }));
    } catch {
      // Prefs unavailable - use defaults
    }
  }, []);

  useEffect(() => {
    fetchCacheHealth();
    fetchPreferences();
  }, [fetchCacheHealth, fetchPreferences]);

  const handleRefreshCache = async () => {
    setCacheLoading(true);
    try {
      const result = await api.invalidateUserCache();
      toast.success("Cache cleared", {
        description: `Invalidated ${result.keys_cleared} cached entries.`,
      });
      await fetchCacheHealth();
    } catch {
      toast.error("Failed to clear cache", {
        description: "Could not connect to the cache service.",
      });
    } finally {
      setCacheLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await api.updatePreferences({
        langsmithProject: formData.langsmithProject,
        enableTracing: formData.enableTracing,
      });

      toast.success("Settings saved", {
        description: "Your preferences have been updated.",
      });

      await api.invalidateUserCache();
    } catch {
      toast.error("Save failed", {
        description: "Could not save preferences. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-8">
      <div className="flex items-center gap-6 p-6 border-2 border-primary/10 bg-primary/[0.02]">
        <div className="h-24 w-24 overflow-hidden bg-muted border-2 border-primary/30 rounded-none relative">
          <div className="absolute inset-0 border-2 border-background z-10" />
          {user?.profile_picture ? (
            <Image
              src={user.profile_picture}
              alt={user.full_name || "User"}
              width={96}
              height={96}
              className="h-full w-full object-cover grayscale opacity-80"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-3xl font-mono font-bold text-primary/80">
              {user?.full_name?.[0] || "?"}
            </div>
          )}
        </div>
        <div className="space-y-1">
          <div className="label-xs text-primary/80">Account</div>
          <h2 className="text-3xl font-bold tracking-[-0.03em]">{user?.full_name}</h2>
          <p className="text-sm font-mono text-muted-foreground uppercase opacity-70">{user?.email}</p>
        </div>
      </div>

      <Tabs defaultValue="persona" className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-12 bg-primary/5 rounded-none border-2 border-primary/10 p-1">
          <TabsTrigger value="persona" className="label-xs rounded-none data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <User className="mr-2 h-3.5 w-3.5" />
            Persona
          </TabsTrigger>
          <TabsTrigger value="observability" className="label-xs rounded-none data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Activity className="mr-2 h-3.5 w-3.5" />
            Telemetry
          </TabsTrigger>
        </TabsList>

        {/* Persona Section */}
        <TabsContent value="persona" className="mt-6">
          <Card className="rounded-none border-2 border-primary/20 bg-background/50">
            <CardHeader className="border-b border-primary/10 pb-4">
              <CardTitle className="label-sm">Your Persona</CardTitle>
              <CardDescription className="font-sans text-xs">
                Choose how the PRD agent interacts with you. This affects the types of questions asked.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <PersonaSelector 
                currentPersona={user?.persona}
                onSelect={() => {
                  toast.success("Persona updated", {
                    description: "Your persona preference has been saved.",
                  });
                }}
              />
              <p className="text-xs text-muted-foreground mt-4">
                You can also change your persona when starting a new PRD session. 
                Your choice here becomes the default for all new sessions.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Observability Section */}
        <TabsContent value="observability" className="mt-6">
          <Card className="rounded-none border-2 border-primary/20 bg-background/50">
            <CardHeader className="border-b border-primary/10 pb-4">
              <CardTitle className="label-sm">LangSmith Tracing</CardTitle>
              <CardDescription className="font-sans text-xs">
                Configure LangSmith for monitoring and debugging.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="flex items-center justify-between p-4 bg-primary/5">
                <Label htmlFor="tracing-enabled" className="flex flex-col space-y-1 cursor-pointer">
                  <span className="label-sm">Enable Tracing</span>
                  <span className="font-normal text-xs text-muted-foreground uppercase">
                    Enable LangSmith monitoring
                  </span>
                </Label>
                <Switch
                  id="tracing-enabled"
                  checked={formData.enableTracing}
                  onCheckedChange={(checked) => setFormData({ ...formData, enableTracing: checked })}
                  className="data-[state=checked]:bg-primary"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="project-name" className="label-xs text-primary/80">Project Name</Label>
                <Input
                  id="project-name"
                  placeholder="e.g. my-specs-project"
                  value={formData.langsmithProject}
                  onChange={(e) => setFormData({ ...formData, langsmithProject: e.target.value })}
                  disabled={!formData.enableTracing}
                  className="rounded-none border-primary/20 bg-background font-mono text-sm focus-visible:ring-primary/30 h-10"
                />
              </div>
            </CardContent>
          </Card>

          <div className="mt-6">
            <Card className="rounded-none border-2 border-primary/20 bg-background/50">
              <CardHeader className="border-b border-primary/10 pb-4">
                <CardTitle className="label-sm">Cache &amp; Data</CardTitle>
                <CardDescription className="font-sans text-xs">
                  Monitor and manage the observability data cache.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                {/* Health indicator row */}
                <div className="flex items-center justify-between p-4 bg-primary/5">
                  <div className="flex items-center gap-3">
                    <Database className="h-4 w-4 text-primary/60" />
                    <div className="flex flex-col">
                      <span className="label-sm">Cache Health</span>
                      {cacheHealth ? (
                        <span className="text-xs text-muted-foreground uppercase">
                          {cacheHealth.keys_tracked} key{cacheHealth.keys_tracked !== 1 ? "s" : ""} tracked &middot; {cacheHealth.ttl_seconds}s TTL
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground uppercase">Checking...</span>
                      )}
                    </div>
                  </div>
                  {cacheHealth ? (
                    <Badge
                      variant="outline"
                      className={`label-xs rounded-none ${
                        cacheHealth.status === "ok"
                          ? "border-tertiary/50 text-tertiary bg-tertiary/5"
                          : "border-warning/50 text-warning bg-warning/5"
                      }`}
                    >
                      {cacheHealth.status === "ok" ? "Connected" : "Degraded"}
                    </Badge>
                  ) : (
                    <Skeleton className="h-5 w-20 rounded-none" />
                  )}
                </div>

                {/* Refresh button */}
                <Button
                  type="button"
                  variant="outline"
                  disabled={cacheLoading}
                  onClick={handleRefreshCache}
                  className="label-xs w-full rounded-none border-primary/20 h-10"
                >
                  <RotateCcw className={`mr-2 h-3.5 w-3.5 ${cacheLoading ? "animate-spin" : ""}`} />
                  {cacheLoading ? "Clearing..." : "Refresh Data"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end pt-4">
        <Button 
          type="submit" 
          disabled={isLoading}
          size="xl"
          className="px-10 py-6"
        >
          {isLoading ? (
            <>Saving...</>
          ) : (
            <>
              <Save className="mr-2 h-3.5 w-3.5" />
              Save Settings
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
