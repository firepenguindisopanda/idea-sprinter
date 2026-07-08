"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Save, Key, Cpu, Activity, User, RotateCcw, Database, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

interface AvailableModel {
  id: string;
  supports_tools: boolean;
  supports_structured_output: boolean;
}

export default function ProfileForm() {
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingPrefs, setIsLoadingPrefs] = useState(true);
  const [cacheHealth, setCacheHealth] = useState<{
    status: string;
    keys_tracked: number;
    ttl_seconds: number;
  } | null>(null);
  const [cacheLoading, setCacheLoading] = useState(false);
  const [availableModels, setAvailableModels] = useState<AvailableModel[]>([]);
  const [modelsLoading, setModelsLoading] = useState(true);
  const [modelsError, setModelsError] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    nvidiaApiKey: "",
    langsmithApiKey: "",
    langsmithProject: "specsbeforecode-dev",
    enableTracing: true,
    chatModel: "",
    embeddingModel: "",
    summaryModel: "",
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
        langsmithApiKey: (prefs.langsmithApiKey as string) || "",
        langsmithProject: (prefs.langsmithProject as string) || "specsbeforecode-dev",
        enableTracing: prefs.enableTracing !== false,
        chatModel: (prefs.chatModel as string) || "",
        embeddingModel: (prefs.embeddingModel as string) || "",
        summaryModel: (prefs.summaryModel as string) || "",
      }));
    } catch {
      // Prefs unavailable — use defaults
    } finally {
      setIsLoadingPrefs(false);
    }
  }, []);

  const fetchModels = useCallback(async () => {
    setModelsLoading(true);
    setModelsError(false);
    try {
      const res = await api.getAvailableModels();
      setAvailableModels(res.models ?? []);
    } catch {
      setModelsError(true);
      setAvailableModels([]);
    } finally {
      setModelsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCacheHealth();
    fetchPreferences();
    fetchModels();
  }, [fetchCacheHealth, fetchPreferences, fetchModels]);

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
        langsmithApiKey: formData.langsmithApiKey,
        langsmithProject: formData.langsmithProject,
        enableTracing: formData.enableTracing,
        chatModel: formData.chatModel || null,
        embeddingModel: formData.embeddingModel || null,
        summaryModel: formData.summaryModel || null,
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
            <div className="h-full w-full flex items-center justify-center text-3xl font-mono font-bold text-primary/40">
              {user?.full_name?.[0] || "?"}
            </div>
          )}
        </div>
        <div className="space-y-1">
          <div className="text-[10px] font-mono text-primary/60 uppercase tracking-widest leading-none">Account</div>
          <h2 className="text-3xl font-mono font-bold uppercase tracking-tighter">{user?.full_name}</h2>
          <p className="text-sm font-mono text-muted-foreground uppercase opacity-70">{user?.email}</p>
        </div>
      </div>

      <Tabs defaultValue="api-keys" className="w-full">
        <TabsList className="grid w-full grid-cols-4 h-12 bg-primary/5 rounded-none border-2 border-primary/10 p-1">
          <TabsTrigger value="api-keys" className="rounded-none font-mono uppercase text-[10px] tracking-widest data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Key className="mr-2 h-3.5 w-3.5" />
            API Keys
          </TabsTrigger>
          <TabsTrigger value="persona" className="rounded-none font-mono uppercase text-[10px] tracking-widest data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <User className="mr-2 h-3.5 w-3.5" />
            Persona
          </TabsTrigger>
          <TabsTrigger value="models" className="rounded-none font-mono uppercase text-[10px] tracking-widest data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Cpu className="mr-2 h-3.5 w-3.5" />
            Models
          </TabsTrigger>
          <TabsTrigger value="observability" className="rounded-none font-mono uppercase text-[10px] tracking-widest data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Activity className="mr-2 h-3.5 w-3.5" />
            Telemetry
          </TabsTrigger>
        </TabsList>

        {/* API Keys Section */}
        <TabsContent value="api-keys" className="mt-6">
          <Card className="rounded-none border-2 border-primary/20 bg-background/50">
            <CardHeader className="border-b border-primary/10 pb-4">
              <CardTitle className="font-mono uppercase tracking-widest text-sm">API Keys</CardTitle>
              <CardDescription className="font-sans italic text-xs">
                Manage your API keys for accessing AI services.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="space-y-3">
                <Label htmlFor="nvidia-key" className="text-[10px] font-mono uppercase tracking-widest text-primary/70">NVIDIA API Key</Label>
                <Input
                  id="nvidia-key"
                  type="password"
                  placeholder="Enter your NVIDIA API key"
                  value={formData.nvidiaApiKey}
                  onChange={(e) => setFormData({ ...formData, nvidiaApiKey: e.target.value })}
                  className="rounded-none border-primary/20 bg-background font-mono text-sm focus-visible:ring-primary/30 h-10"
                />
                <p className="text-[10px] italic font-sans text-muted-foreground">
                  Your personal NVIDIA NIM API key for AI model access.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Persona Section */}
        <TabsContent value="persona" className="mt-6">
          <Card className="rounded-none border-2 border-primary/20 bg-background/50">
            <CardHeader className="border-b border-primary/10 pb-4">
              <CardTitle className="font-mono uppercase tracking-widest text-sm">Your Persona</CardTitle>
              <CardDescription className="font-sans italic text-xs">
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

        {/* Models Section */}
        <TabsContent value="models" className="mt-6">
          <Card className="rounded-none border-2 border-primary/20 bg-background/50">
            <CardHeader className="border-b border-primary/10 pb-4">
              <CardTitle className="font-mono uppercase tracking-widest text-sm">Model Configuration</CardTitle>
              <CardDescription className="font-sans italic text-xs">
                Choose which AI models to use for each task. Models are fetched from NVIDIA NIM.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              {modelsLoading ? (
                <div className="flex items-center gap-3 p-4 border border-primary/10 bg-primary/5">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Loading available models...</span>
                </div>
              ) : modelsError ? (
                <div className="flex items-center gap-3 p-4 border border-amber-500/30 bg-amber-500/5">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <span className="text-[10px] font-mono uppercase tracking-widest text-amber-600">Could not fetch models. Using cached list.</span>
                </div>
              ) : null}

              {!modelsLoading && (
                <>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="chat-model" className="text-[10px] font-mono uppercase tracking-widest text-primary/70">Chat Model</Label>
                      <span className="text-[9px] font-mono text-muted-foreground">{availableModels.length} available</span>
                    </div>
                    <Select
                      value={formData.chatModel || "__default__"}
                      onValueChange={(value) => setFormData({ ...formData, chatModel: value === "__default__" ? "" : value })}
                    >
                      <SelectTrigger id="chat-model" className="rounded-none border-primary/20 bg-background font-mono text-xs h-10">
                        <SelectValue placeholder="Use backend default" />
                      </SelectTrigger>
                      <SelectContent className="rounded-none border-primary/20 max-h-60">
                        <SelectItem value="__default__" className="font-mono text-[11px] italic text-muted-foreground">Backend default</SelectItem>
                        {availableModels.map((model) => (
                          <SelectItem key={model.id} value={model.id} className="font-mono text-[11px]">
                            {model.id}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-[10px] italic font-sans text-muted-foreground font-medium">
                      Used for code generation and multi-agent tasks.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="summary-model" className="text-[10px] font-mono uppercase tracking-widest text-primary/70">Summary Model</Label>
                    <Select
                      value={formData.summaryModel || "__default__"}
                      onValueChange={(value) => setFormData({ ...formData, summaryModel: value === "__default__" ? "" : value })}
                    >
                      <SelectTrigger id="summary-model" className="rounded-none border-primary/20 bg-background font-mono text-xs h-10">
                        <SelectValue placeholder="Use backend default" />
                      </SelectTrigger>
                      <SelectContent className="rounded-none border-primary/20 max-h-60">
                        <SelectItem value="__default__" className="font-mono text-[11px] italic text-muted-foreground">Backend default</SelectItem>
                        {availableModels.filter((m) => m.supports_tools !== false).map((model) => (
                          <SelectItem key={model.id} value={model.id} className="font-mono text-[11px]">
                            {model.id}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="embedding-model" className="text-[10px] font-mono uppercase tracking-widest text-primary/70">Embedding Model</Label>
                    <Select
                      value={formData.embeddingModel || "__default__"}
                      onValueChange={(value) => setFormData({ ...formData, embeddingModel: value === "__default__" ? "" : value })}
                    >
                      <SelectTrigger id="embedding-model" className="rounded-none border-primary/20 bg-background font-mono text-xs h-10">
                        <SelectValue placeholder="Use backend default" />
                      </SelectTrigger>
                      <SelectContent className="rounded-none border-primary/20 max-h-60">
                        <SelectItem value="__default__" className="font-mono text-[11px] italic text-muted-foreground">Backend default</SelectItem>
                        {availableModels.filter((m) => m.id.includes("embed")).map((model) => (
                          <SelectItem key={model.id} value={model.id} className="font-mono text-[11px]">
                            {model.id}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Observability Section */}
        <TabsContent value="observability" className="mt-6">
          <Card className="rounded-none border-2 border-primary/20 bg-background/50">
            <CardHeader className="border-b border-primary/10 pb-4">
              <CardTitle className="font-mono uppercase tracking-widest text-sm">LangSmith Tracing</CardTitle>
              <CardDescription className="font-sans italic text-xs">
                Configure LangSmith for monitoring and debugging.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="flex items-center justify-between p-4 border border-primary/10 bg-primary/5">
                <Label htmlFor="tracing-enabled" className="flex flex-col space-y-1 cursor-pointer">
                  <span className="font-mono uppercase text-[11px] font-bold tracking-widest">Enable Tracing</span>
                  <span className="font-normal text-[10px] text-muted-foreground uppercase">
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
                <Label htmlFor="langsmith-key" className="text-[10px] font-mono uppercase tracking-widest text-primary/70">LangSmith API Key</Label>
                <Input
                  id="langsmith-key"
                  type="password"
                  placeholder="Enter LangSmith API key"
                  value={formData.langsmithApiKey}
                  onChange={(e) => setFormData({ ...formData, langsmithApiKey: e.target.value })}
                  disabled={!formData.enableTracing}
                  className="rounded-none border-primary/20 bg-background font-mono text-sm focus-visible:ring-primary/30 h-10"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="project-name" className="text-[10px] font-mono uppercase tracking-widest text-primary/70">Project Name</Label>
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
                <CardTitle className="font-mono uppercase tracking-widest text-sm">Cache &amp; Data</CardTitle>
                <CardDescription className="font-sans italic text-xs">
                  Monitor and manage the observability data cache.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                {/* Health indicator row */}
                <div className="flex items-center justify-between p-4 border border-primary/10 bg-primary/5">
                  <div className="flex items-center gap-3">
                    <Database className="h-4 w-4 text-primary/60" />
                    <div className="flex flex-col">
                      <span className="font-mono uppercase text-[11px] font-bold tracking-widest">Cache Health</span>
                      {cacheHealth ? (
                        <span className="text-[10px] text-muted-foreground uppercase">
                          {cacheHealth.keys_tracked} key{cacheHealth.keys_tracked !== 1 ? "s" : ""} tracked &middot; {cacheHealth.ttl_seconds}s TTL
                        </span>
                      ) : (
                        <span className="text-[10px] text-muted-foreground uppercase">Checking...</span>
                      )}
                    </div>
                  </div>
                  {cacheHealth ? (
                    <Badge
                      variant="outline"
                      className={`rounded-none font-mono text-[10px] uppercase tracking-wider ${
                        cacheHealth.status === "ok"
                          ? "border-green-500/50 text-green-600 bg-green-500/5"
                          : "border-amber-500/50 text-amber-600 bg-amber-500/5"
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
                  className="w-full rounded-none border-primary/20 font-mono text-[10px] uppercase tracking-widest h-10"
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
          className="rounded-none font-mono uppercase text-[11px] tracking-[0.2em] px-10 py-6 border-2 border-primary/50 bg-primary text-primary-foreground hover:bg-primary/90 transition-all"
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
