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
  CardFooter,
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
    langsmithProject: "ideasprinter-dev",
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
    <form onSubmit={handleSave} className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <div className="h-20 w-20 rounded-full overflow-hidden bg-muted border-2 border-primary/10">
          {user?.profile_picture ? (
            <img
              src={user.profile_picture}
              alt={user.full_name || "User"}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-2xl font-bold text-muted-foreground">
              {user?.full_name?.[0] || "U"}
            </div>
          )}
        </div>
        <div>
          <h2 className="text-2xl font-bold">{user?.full_name}</h2>
          <p className="text-muted-foreground">{user?.email}</p>
        </div>
      </div>

      <Tabs defaultValue="api-keys" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="api-keys">
            <Key className="mr-2 h-4 w-4" />
            API Keys
          </TabsTrigger>
          <TabsTrigger value="models">
            <Cpu className="mr-2 h-4 w-4" />
            Models
          </TabsTrigger>
          <TabsTrigger value="observability">
            <Activity className="mr-2 h-4 w-4" />
            Observability
          </TabsTrigger>
        </TabsList>

        {/* API Keys Section */}
        <TabsContent value="api-keys">
          <Card>
            <CardHeader>
              <CardTitle>API Configuration</CardTitle>
              <CardDescription>
                Manage your personal API keys for NVIDIA NIM and other services.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nvidia-key">NVIDIA NIM API Key</Label>
                <div className="relative">
                  <Input
                    id="nvidia-key"
                    type="password"
                    placeholder="nvapi-..."
                    value={formData.nvidiaApiKey}
                    onChange={(e) => setFormData({ ...formData, nvidiaApiKey: e.target.value })}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Required for accessing NVIDIA's hosted models.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Models Section */}
        <TabsContent value="models">
          <Card>
            <CardHeader>
              <CardTitle>Model Selection</CardTitle>
              <CardDescription>
                Choose the AI models used for different generation tasks.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="chat-model">Primary Chat Model</Label>
                <Select
                  value={formData.chatModel}
                  onValueChange={(value) => setFormData({ ...formData, chatModel: value })}
                >
                  <SelectTrigger id="chat-model">
                    <SelectValue placeholder="Select model" />
                  </SelectTrigger>
                  <SelectContent>
                    {CHAT_MODELS.map((model) => (
                      <SelectItem key={model.value} value={model.value}>
                        {model.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Used for agent interactions and code generation.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="summary-model">Summarization Model</Label>
                <Select
                  value={formData.summaryModel}
                  onValueChange={(value) => setFormData({ ...formData, summaryModel: value })}
                >
                  <SelectTrigger id="summary-model">
                    <SelectValue placeholder="Select model" />
                  </SelectTrigger>
                  <SelectContent>
                    {CHAT_MODELS.map((model) => (
                      <SelectItem key={model.value} value={model.value}>
                        {model.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Optimized for condensing large context windows.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="embedding-model">Embedding Model</Label>
                <Select
                  value={formData.embeddingModel}
                  onValueChange={(value) => setFormData({ ...formData, embeddingModel: value })}
                >
                  <SelectTrigger id="embedding-model">
                    <SelectValue placeholder="Select model" />
                  </SelectTrigger>
                  <SelectContent>
                    {EMBEDDING_MODELS.map((model) => (
                      <SelectItem key={model.value} value={model.value}>
                        {model.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Used for RAG and semantic search.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Observability Section */}
        <TabsContent value="observability">
          <Card>
            <CardHeader>
              <CardTitle>LangSmith Integration</CardTitle>
              <CardDescription>
                Configure tracing and monitoring for your agent runs.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="tracing-enabled" className="flex flex-col space-y-1">
                  <span>Enable Tracing</span>
                  <span className="font-normal text-xs text-muted-foreground">
                    Send run traces to LangSmith
                  </span>
                </Label>
                <Switch
                  id="tracing-enabled"
                  checked={formData.enableTracing}
                  onCheckedChange={(checked) => setFormData({ ...formData, enableTracing: checked })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="langsmith-key">LangSmith API Key</Label>
                <Input
                  id="langsmith-key"
                  type="password"
                  placeholder="lsv2-..."
                  value={formData.langsmithApiKey}
                  onChange={(e) => setFormData({ ...formData, langsmithApiKey: e.target.value })}
                  disabled={!formData.enableTracing}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="project-name">Project Name</Label>
                <Input
                  id="project-name"
                  placeholder="default"
                  value={formData.langsmithProject}
                  onChange={(e) => setFormData({ ...formData, langsmithProject: e.target.value })}
                  disabled={!formData.enableTracing}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>Saving...</>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
