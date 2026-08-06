"use client";

import { useState, useEffect } from "react";
import { Loader2, Lightbulb, Check, Settings2, ChevronDown, ChevronUp, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  FRONTEND_OPTIONS,
  BACKEND_OPTIONS,
  DATABASE_OPTIONS,
  AUTH_SERVICE_OPTIONS,
  PACKAGE_MANAGER_OPTIONS,
  PACKAGE_MANAGER_OPTIONS_NODE,
  PACKAGE_MANAGER_OPTIONS_PYTHON,
  PACKAGE_MANAGER_OPTIONS_JAVA,
  PACKAGE_MANAGER_OPTIONS_GO,
  ORM_OPTIONS,
  RUNTIME_OPTIONS,
  type TechOption,
} from "@/lib/tech-options";
import type { ProjectRequest } from "@/types";
import ExampleLibrary from "@/components/examples/example-library";
import {
  briefForGenerate,
  type SystemDesignExample,
} from "@/lib/system-design-examples";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ProjectFormProps {
  onSubmit: (data: ProjectRequest) => void;
  isLoading?: boolean;
  initialDescription?: string;
}


export default function ProjectForm({ onSubmit, isLoading = false, initialDescription = "" }: Readonly<ProjectFormProps>) {
  const [formData, setFormData] = useState<ProjectRequest>({
    description: "",
    frontend_framework: null,
    backend_framework: null,
    database: null,
    auth_service: null,
    payment_gateway: null,
    package_manager: null,
    orm: null,
    runtime: null,
    include_docker: false,
    include_cicd: false,
  });

  const [errors, setErrors] = useState<{ description?: string }>({});
  const [isExampleLoaded, setIsExampleLoaded] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [isAdvancedMode, setIsAdvancedMode] = useState(false);

  // Dynamic Options State
  const [availableRuntimes, setAvailableRuntimes] = useState<TechOption[]>(RUNTIME_OPTIONS);
  const [, setAvailableOrms] = useState<TechOption[]>(ORM_OPTIONS);
const [availablePackageManagers, setAvailablePackageManagers] = useState<TechOption[]>(PACKAGE_MANAGER_OPTIONS);

  const updateField = <K extends keyof ProjectRequest>(
    field: K,
    value: ProjectRequest[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Update description when initialDescription changes
  useEffect(() => {
    if (initialDescription) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      updateField("description", initialDescription);
    }
  }, [initialDescription]);

  // Effect to filter Runtimes based on Backend
  useEffect(() => {
    if (!formData.backend_framework) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAvailableRuntimes(RUNTIME_OPTIONS);
      return;
    }

    const backend = formData.backend_framework;
    let filteredRuntimes = RUNTIME_OPTIONS;

    if (["nodejs", "express", "nestjs"].includes(backend)) {
      filteredRuntimes = RUNTIME_OPTIONS.filter(r => ["nodejs", "bun", "deno"].includes(r.value));
    } else if (["fastapi", "flask", "django"].includes(backend)) {
      filteredRuntimes = RUNTIME_OPTIONS.filter(r => r.value.startsWith("python"));
    } else if (backend === "spring") {
      filteredRuntimes = RUNTIME_OPTIONS.filter(r => r.value.startsWith("java"));
    } else if (backend === "go") {
      filteredRuntimes = RUNTIME_OPTIONS.filter(r => r.value.startsWith("go"));
    }

     
    setAvailableRuntimes(filteredRuntimes);
    
    // Reset runtime if current selection is invalid
    if (formData.runtime && !filteredRuntimes.some(r => r.value === formData.runtime)) {
       
      updateField("runtime", null);
    }
  }, [formData.backend_framework]); // eslint-disable-line react-hooks/exhaustive-deps

  // Effect to filter Package Managers based on Backend
  useEffect(() => {
    if (!formData.backend_framework) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAvailablePackageManagers(PACKAGE_MANAGER_OPTIONS);
      // If current selection doesn't match default options, reset it
      if (formData.package_manager && !PACKAGE_MANAGER_OPTIONS.some(p => p.value === formData.package_manager)) {
         
        updateField("package_manager", null);
      }
      return;
    }

    const backend = formData.backend_framework;
    let filtered = PACKAGE_MANAGER_OPTIONS;

    if (["nodejs", "express", "nestjs"].includes(backend)) {
      filtered = PACKAGE_MANAGER_OPTIONS_NODE;
    } else if (["fastapi", "flask", "django"].includes(backend)) {
      filtered = PACKAGE_MANAGER_OPTIONS_PYTHON;
    } else if (backend === "spring") {
      filtered = PACKAGE_MANAGER_OPTIONS_JAVA;
    } else if (backend === "go") {
      filtered = PACKAGE_MANAGER_OPTIONS_GO;
    }

    setAvailablePackageManagers(filtered);

    // Reset package manager if current selection is invalid
    if (formData.package_manager && !filtered.some(p => p.value === formData.package_manager)) {
       
      updateField("package_manager", null);
    }
  }, [formData.backend_framework]); // eslint-disable-line react-hooks/exhaustive-deps

  // Effect to filter ORMs based on Database and Backend
  useEffect(() => {
    let filteredOrms = ORM_OPTIONS;
    const db = formData.database;
    const backend = formData.backend_framework;

    if (db) {
      if (db === "mongodb") {
        filteredOrms = ORM_OPTIONS.filter(o => ["mongoose", "prisma"].includes(o.value));
      } else if (["postgresql", "mysql", "sqlite", "planetscale", "supabase"].includes(db)) {
        // SQL Databases
        if (backend && ["fastapi", "flask", "django"].includes(backend)) {
           filteredOrms = ORM_OPTIONS.filter(o => ["sqlalchemy", "tortoise", "django_orm", "prisma"].includes(o.value));
        } else if (backend && ["nodejs", "express", "nestjs"].includes(backend)) {
           filteredOrms = ORM_OPTIONS.filter(o => ["prisma", "typeorm", "sequelize", "drizzle"].includes(o.value));
        } else if (backend === "go") {
           filteredOrms = ORM_OPTIONS.filter(o => ["gorm", "prisma"].includes(o.value));
        } else {
           // Generic SQL ORMs if no backend selected or other backend
           filteredOrms = ORM_OPTIONS.filter(o => !["mongoose"].includes(o.value));
        }
      }
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAvailableOrms(filteredOrms);

    // Reset ORM if current selection is invalid
    if (formData.orm && !filteredOrms.some(o => o.value === formData.orm)) {
      updateField("orm", null);
    }
  }, [formData.database, formData.backend_framework]); // eslint-disable-line react-hooks/exhaustive-deps


  const submitForm = () => {
    if (!formData.description.trim()) {
      setErrors({ description: "Project description is required" });
      return;
    }

    setErrors({});
    onSubmit(formData);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitForm();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
        if (!isLoading) {
          submitForm();
        }
    }
  };

  const handlePickExample = (example: SystemDesignExample) => {
    updateField("description", briefForGenerate(example));
    setPickerOpen(false);
    setIsExampleLoaded(true);
    setTimeout(() => setIsExampleLoaded(false), 2000);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-12">

      {/* Project Description */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-primary/10 pb-2">
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 bg-primary rounded-full animate-pulse" />
            <Label htmlFor="description" className="label-xs text-primary/80">
              Project Description *
            </Label>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setPickerOpen(true)}
            className="label-xs h-7 text-primary/80 hover:text-primary transition-colors"
          >
            {isExampleLoaded ? (
              <>
                <Check className="mr-1.5 h-3 w-3" />
                Starter Loaded
              </>
            ) : (
              <>
                <Lightbulb className="mr-1.5 h-3 w-3" />
                Browse Starters
              </>
            )}
          </Button>
        </div>
        <Textarea
          id="description"
          placeholder="Describe your project here... (e.g. 'Build a high-performance e-commerce engine with real-time inventory tracking')"
          value={formData.description}
          onChange={(e) => updateField("description", e.target.value)}
          onKeyDown={handleKeyDown}
          rows={10}
          className={`${errors.description ? "border-destructive" : "border-primary/20"} min-h-[260px] rounded-none bg-background/50 font-mono text-sm focus-visible:ring-primary/30 p-6 leading-relaxed`}
          disabled={isLoading}
        />
        <div className="label-xs flex justify-between items-center text-muted-foreground">
          {errors.description ? (
            <p className="text-destructive font-bold">{errors.description}</p>
          ) : (
            <div className="flex items-center gap-2">
              <span className="h-1 w-1 bg-muted-foreground rounded-full" />
              <span>Required field</span>
            </div>
          )}
          <span className="bg-primary/5 px-2 py-0.5 tabular-nums">{formData.description.length} characters</span>
        </div>
      </div>

      {/* Advanced Configuration Toggle */}
      <div className="border-t border-b border-primary/10 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-2 ${!isAdvancedMode ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <h3 className="label-sm">
                {!isAdvancedMode ? "AI Selects Stack" : "Manual Configuration"}
              </h3>
              <p className="text-xs text-muted-foreground font-mono mt-1 max-w-[500px]">
                {!isAdvancedMode 
                  ? "Our AI agents will analyze your requirements and autonomously select the optimal technology stack and infrastructure for your project." 
                  : "You have taken control. Manually specify your preferred frameworks, databases, and infrastructure components."}
              </p>
            </div>
          </div>
          
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsAdvancedMode(!isAdvancedMode)}
            className={`label-xs border-primary/20 hover:bg-primary/5 ${isAdvancedMode ? 'bg-primary/5 text-primary' : 'text-muted-foreground'}`}
          >
            <Settings2 className="mr-2 h-3 w-3" />
            {isAdvancedMode ? "Hide Options" : "Show Options"}
            {isAdvancedMode ? <ChevronUp className="ml-2 h-3 w-3" /> : <ChevronDown className="ml-2 h-3 w-3" />}
          </Button>
        </div>
      </div>

      {/* Tech Stack Selection - Conditional Render */}
      {isAdvancedMode && (
        <div className="space-y-12 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <h3 className="label-xs text-primary pr-2 font-bold">Technology Stack</h3>
              <div className="h-px bg-primary/20 flex-1" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Frontend Framework */}
              <div className="space-y-2">
                <Label htmlFor="frontend" className="label-xs text-primary/80">Frontend</Label>
                <Select
                  value={formData.frontend_framework || ""}
                  onValueChange={(value) =>
                    updateField("frontend_framework", value || null)
                  }
                  disabled={isLoading}
                >
                  <SelectTrigger id="frontend" className="rounded-none border-primary/20 bg-background/50 font-mono text-xs h-10">
                    <SelectValue placeholder="Auto-Detect" />
                  </SelectTrigger>
                  <SelectContent className="rounded-none border-primary/20">
                    {FRONTEND_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value} className="text-xs font-mono">
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Backend Framework */}
              <div className="space-y-2">
                <Label htmlFor="backend" className="label-xs text-primary/80">Backend</Label>
                <Select
                  value={formData.backend_framework || ""}
                  onValueChange={(value) =>
                    updateField("backend_framework", value || null)
                  }
                  disabled={isLoading}
                >
                  <SelectTrigger id="backend" className="rounded-none border-primary/20 bg-background/50 font-mono text-xs h-10">
                    <SelectValue placeholder="Auto-Detect" />
                  </SelectTrigger>
                  <SelectContent className="rounded-none border-primary/20">
                    {BACKEND_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value} className="text-xs font-mono">
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Database */}
              <div className="space-y-2">
                <Label htmlFor="database" className="label-xs text-primary/80">Database</Label>
                <Select
                  value={formData.database || ""}
                  onValueChange={(value) => updateField("database", value || null)}
                  disabled={isLoading}
                >
                  <SelectTrigger id="database" className="rounded-none border-primary/20 bg-background/50 font-mono text-xs h-10">
                    <SelectValue placeholder="Auto-Detect" />
                  </SelectTrigger>
                  <SelectContent className="rounded-none border-primary/20">
                    {DATABASE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value} className="text-xs font-mono">
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Auth Service */}
              <div className="space-y-2">
                <Label htmlFor="auth" className="label-xs text-primary/80">Authentication</Label>
                <Select
                  value={formData.auth_service || ""}
                  onValueChange={(value) =>
                    updateField("auth_service", value || null)
                  }
                  disabled={isLoading}
                >
                  <SelectTrigger id="auth" className="rounded-none border-primary/20 bg-background/50 font-mono text-xs h-10">
                    <SelectValue placeholder="Auto-Detect" />
                  </SelectTrigger>
                  <SelectContent className="rounded-none border-primary/20">
                    {AUTH_SERVICE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value} className="text-xs font-mono">
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Runtime */}
              <div className="space-y-2">
                <Label htmlFor="runtime" className="label-xs text-primary/80">Runtime</Label>
                <Select
                  value={formData.runtime || ""}
                  onValueChange={(value) => updateField("runtime", value || null)}
                  disabled={isLoading}
                >
                  <SelectTrigger id="runtime" className="rounded-none border-primary/20 bg-background/50 font-mono text-xs h-10">
                    <SelectValue placeholder="Auto-Detect" />
                  </SelectTrigger>
                  <SelectContent className="rounded-none border-primary/20">
                    {availableRuntimes.map((option) => (
                      <SelectItem key={option.value} value={option.value} className="text-xs font-mono">
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Package Manager */}
              <div className="space-y-2">
                <Label htmlFor="package-manager" className="label-xs text-primary/80">Package Manager</Label>
                <Select
                  value={formData.package_manager || ""}
                  onValueChange={(value) =>
                    updateField("package_manager", value || null)
                  }
                  disabled={isLoading}
                >
                  <SelectTrigger id="package-manager" className="rounded-none border-primary/20 bg-background/50 font-mono text-xs h-10">
                    <SelectValue placeholder="Auto-Detect" />
                  </SelectTrigger>
                  <SelectContent className="rounded-none border-primary/20">
                    {availablePackageManagers.map((option) => (
                      <SelectItem key={option.value} value={option.value} className="text-xs font-mono">
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Additional Options */}
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <h3 className="label-xs text-primary pr-2 font-bold">Infrastructure</h3>
              <div className="h-px bg-primary/20 flex-1" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex items-center justify-between p-4 bg-primary/5">
                <div className="space-y-1">
                  <Label htmlFor="docker" className="label-sm">Docker</Label>
                  <p className="label-xs text-muted-foreground">
                    Include Dockerfile and docker-compose
                  </p>
                </div>
                <Switch
                  id="docker"
                  checked={formData.include_docker}
                  onCheckedChange={(checked) => updateField("include_docker", checked)}
                  disabled={isLoading}
                  className="data-[state=checked]:bg-primary"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-primary/5">
                <div className="space-y-1">
                  <Label htmlFor="cicd" className="label-sm">Pipeline: CI/CD</Label>
                  <p className="label-xs text-muted-foreground">
                    Include CI/CD workflow files
                  </p>
                </div>
                <Switch
                  id="cicd"
                  checked={formData.include_cicd}
                  onCheckedChange={(checked) => updateField("include_cicd", checked)}
                  disabled={isLoading}
                  className="data-[state=checked]:bg-primary"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <Button
        type="submit"
        size="xl"
        className="w-full py-10 text-lg group"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-3 h-6 w-6 animate-spin" />
            Generating...
          </>
        ) : (
          <div className="flex items-center gap-4">
            <span>
              {!isAdvancedMode ? "Generate Specifications" : "Generate with Custom Stack"}
            </span>
            <span className="opacity-40 group-hover:translate-x-2 transition-transform">{">>>"}</span>
          </div>
        )}
      </Button>

      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="max-h-[85vh] max-w-6xl overflow-y-auto rounded-none border-2">
          <DialogHeader>
            <DialogTitle className="label-lg text-sm">
              Pick a starter
            </DialogTitle>
            <DialogDescription className="text-xs">
              Well-known systems, each with one feature the original does not have. The
              extra feature is what makes the design decisions non-obvious.
            </DialogDescription>
          </DialogHeader>
          <ExampleLibrary onSelect={handlePickExample} actionLabel="Use this brief" />
        </DialogContent>
      </Dialog>
    </form>
  );
}
