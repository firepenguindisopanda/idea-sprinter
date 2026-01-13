"use client";

import { useState } from "react";
import { Save, Key, Cpu, Activity } from "lucide-react";
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
import { toast } from "sonner";
import { useAuthStore } from "@/lib/auth-store";

const CHAT_MODELS = [
  { value: "meta/llama3-70b-instruct", label: "Meta Llama 3 70B" },
  { value: "meta/llama3-8b-instruct", label: "Meta Llama 3 8B" },
  { value: "mistralai/mixtral-8x22b-instruct-v0.1", label: "Mistral Mixtral 8x22B" },
  { value: "mistralai/mixtral-8x7b-instruct-v0.1", label: "Mistral Mixtral 8x7B" },
  { value: "google/gemma-7b", label: "Google Gemma 7B" },
  { value: "google/gemma-2b", label: "Google Gemma 2B" },
  { value: "microsoft/phi-3-mini-128k-instruct", label: "Microsoft Phi-3 Mini" },
  { value: "microsoft/phi-3-medium-4k-instruct", label: "Microsoft Phi-3 Medium" },
  { value: "snowflake/arctic", label: "Snowflake Arctic" },
  { value: "databricks/dbrx-instruct", label: "Databricks DBRX" },
  { value: "nvidia/nemotron-4-340b-instruct", label: "NVIDIA Nemotron-4 340B" },
];

const EMBEDDING_MODELS = [
  { value: "nvidia/nv-embed-qa-v1", label: "NVIDIA NV-Embed QA v1" },
  { value: "snowflake/arctic-embed-l", label: "Snowflake Arctic Embed L" },
  { value: "baai/bge-m3", label: "BAAI BGE-M3" },
];

export default function ProfileForm() {
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    nvidiaApiKey: "",
    langsmithApiKey: "",
    langsmithProject: "specsbeforecode-dev",
    enableTracing: true,
    chatModel: "nvidia/llama3-70b-instruct",
    embeddingModel: "nvidia/nv-embed-qa-v1",
    summaryModel: "nvidia/mixtral-8x22b-instruct",
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    toast.info("Coming Soon", {
      description: "Custom API keys and model configuration will be available in the next update. Your settings have been saved locally for this session.",
    });

    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSave} className="space-y-8">
      <div className="flex items-center gap-6 p-6 border-2 border-primary/10 bg-primary/[0.02]">
        <div className="h-24 w-24 overflow-hidden bg-muted border-2 border-primary/30 rounded-none relative">
          <div className="absolute inset-0 border-2 border-background z-10" />
          {user?.profile_picture ? (
            <img
              src={user.profile_picture}
              alt={user.full_name || "User"}
              className="h-full w-full object-cover grayscale opacity-80"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-3xl font-mono font-bold text-primary/40">
              {user?.full_name?.[0] || "?"}
            </div>
          )}
        </div>
        <div className="space-y-1">
          <div className="text-[10px] font-mono text-primary/60 uppercase tracking-widest leading-none">Verified_Operator</div>
          <h2 className="text-3xl font-mono font-bold uppercase tracking-tighter">{user?.full_name}</h2>
          <p className="text-sm font-mono text-muted-foreground uppercase opacity-70">Hash: {user?.email}</p>
        </div>
      </div>

      <Tabs defaultValue="api-keys" className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-12 bg-primary/5 rounded-none border-2 border-primary/10 p-1">
          <TabsTrigger value="api-keys" className="rounded-none font-mono uppercase text-[10px] tracking-widest data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Key className="mr-2 h-3.5 w-3.5" />
            Auth_Keys
          </TabsTrigger>
          <TabsTrigger value="models" className="rounded-none font-mono uppercase text-[10px] tracking-widest data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            <Cpu className="mr-2 h-3.5 w-3.5" />
            Neural_Core
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
              <CardTitle className="font-mono uppercase tracking-widest text-sm">Security_Encryption_Keys</CardTitle>
              <CardDescription className="font-sans italic text-xs">
                Manage personal credentials for accessing LLM subnetworks.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="space-y-3">
                <Label htmlFor="nvidia-key" className="text-[10px] font-mono uppercase tracking-widest text-primary/70">NVIDIA_NIM_MASTER_KEY</Label>
                <Input
                  id="nvidia-key"
                  type="password"
                  placeholder="Enter your NVIDIA API key"
                  value={formData.nvidiaApiKey}
                  onChange={(e) => setFormData({ ...formData, nvidiaApiKey: e.target.value })}
                  className="rounded-none border-primary/20 bg-background font-mono text-sm focus-visible:ring-primary/30 h-10"
                />
                <p className="text-[10px] italic font-sans text-muted-foreground">
                  Grant permission to utilize NVIDIA high-compute optimized nodes.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Models Section */}
        <TabsContent value="models" className="mt-6">
          <Card className="rounded-none border-2 border-primary/20 bg-background/50">
            <CardHeader className="border-b border-primary/10 pb-4">
              <CardTitle className="font-mono uppercase tracking-widest text-sm">Logic_Processor_Mapping</CardTitle>
              <CardDescription className="font-sans italic text-xs">
                Assign specific neural architectures for each procedural operation.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-3">
                <Label htmlFor="chat-model" className="text-[10px] font-mono uppercase tracking-widest text-primary/70">Agent_Communication_Core</Label>
                <Select
                  value={formData.chatModel}
                  onValueChange={(value) => setFormData({ ...formData, chatModel: value })}
                >
                  <SelectTrigger id="chat-model" className="rounded-none border-primary/20 bg-background font-mono text-xs h-10">
                    <SelectValue placeholder="Select Model" />
                  </SelectTrigger>
                  <SelectContent className="rounded-none border-primary/20">
                    {CHAT_MODELS.map((model) => (
                      <SelectItem key={model.value} value={model.value} className="font-mono text-[11px] uppercase">
                        {model.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[10px] italic font-sans text-muted-foreground font-medium">
                  Protocol: Code generation and multi-agent synergy.
                </p>
              </div>

              <div className="space-y-3">
                <Label htmlFor="summary-model" className="text-[10px] font-mono uppercase tracking-widest text-primary/70">Data_Distillation_Core</Label>
                <Select
                  value={formData.summaryModel}
                  onValueChange={(value) => setFormData({ ...formData, summaryModel: value })}
                >
                  <SelectTrigger id="summary-model" className="rounded-none border-primary/20 bg-background font-mono text-xs h-10">
                    <SelectValue placeholder="Select Model" />
                  </SelectTrigger>
                  <SelectContent className="rounded-none border-primary/20">
                    {CHAT_MODELS.map((model) => (
                      <SelectItem key={model.value} value={model.value} className="font-mono text-[11px] uppercase">
                        {model.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label htmlFor="embedding-model" className="text-[10px] font-mono uppercase tracking-widest text-primary/70">Semantic_Vector_Base</Label>
                <Select
                  value={formData.embeddingModel}
                  onValueChange={(value) => setFormData({ ...formData, embeddingModel: value })}
                >
                  <SelectTrigger id="embedding-model" className="rounded-none border-primary/20 bg-background font-mono text-xs h-10">
                    <SelectValue placeholder="Select Model" />
                  </SelectTrigger>
                  <SelectContent className="rounded-none border-primary/20">
                    {EMBEDDING_MODELS.map((model) => (
                      <SelectItem key={model.value} value={model.value} className="font-mono text-[11px] uppercase">
                        {model.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Observability Section */}
        <TabsContent value="observability" className="mt-6">
          <Card className="rounded-none border-2 border-primary/20 bg-background/50">
            <CardHeader className="border-b border-primary/10 pb-4">
              <CardTitle className="font-mono uppercase tracking-widest text-sm">Realtime_Tracing_Relay</CardTitle>
              <CardDescription className="font-sans italic text-xs">
                Configure LangSmith telemetry for advanced session auditing.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="flex items-center justify-between p-4 border border-primary/10 bg-primary/5">
                <Label htmlFor="tracing-enabled" className="flex flex-col space-y-1 cursor-pointer">
                  <span className="font-mono uppercase text-[11px] font-bold tracking-widest">Enable_Tracing_Relay</span>
                  <span className="font-normal text-[10px] text-muted-foreground uppercase">
                    Initialize LangChain_V2 monitoring
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
                <Label htmlFor="langsmith-key" className="text-[10px] font-mono uppercase tracking-widest text-primary/70">LangSmith_API_Auth</Label>
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
                <Label htmlFor="project-name" className="text-[10px] font-mono uppercase tracking-widest text-primary/70">Project_Telemetry_ID</Label>
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
        </TabsContent>
      </Tabs>

      <div className="flex justify-end pt-4">
        <Button 
          type="submit" 
          disabled={isLoading}
          className="rounded-none font-mono uppercase text-[11px] tracking-[0.2em] px-10 py-6 border-2 border-primary/50 bg-primary text-primary-foreground hover:bg-primary/90 transition-all"
        >
          {isLoading ? (
            <>Uploading_Params...</>
          ) : (
            <>
              <Save className="mr-2 h-3.5 w-3.5" />
              Commit_Global_Changes
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
