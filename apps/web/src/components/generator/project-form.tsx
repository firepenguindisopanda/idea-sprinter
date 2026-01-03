"use client";

import { useState, useEffect } from "react";
import { Loader2, Lightbulb, Check } from "lucide-react";
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
  PAYMENT_GATEWAY_OPTIONS,
  PACKAGE_MANAGER_OPTIONS,
  PACKAGE_MANAGER_OPTIONS_NODE,
  PACKAGE_MANAGER_OPTIONS_PYTHON,
  PACKAGE_MANAGER_OPTIONS_JAVA,
  PACKAGE_MANAGER_OPTIONS_GO,
  PACKAGE_MANAGER_OPTIONS_DOTNET,
  ORM_OPTIONS,
  RUNTIME_OPTIONS,
  type TechOption,
} from "@/lib/tech-options";
import type { ProjectRequest } from "@/types";

interface ProjectFormProps {
  onSubmit: (data: ProjectRequest) => void;
  isLoading?: boolean;
  initialDescription?: string;
}

const EXAMPLE_DESCRIPTION = `Offline-first, mobile-first practice-testing app for university courses. A mobile-first, offline-capable app that lets students take course-specific practice tests, track progress, and compare performance on per-course leaderboards. Lecturers can author and manage questions, monitor student performance with detailed metrics, and sync data to a central server when reliable connectivity is available, addressing the university's unreliable Wi-Fi. This project is an offline-first mobile application designed to support student practice and formative assessment in environments with unreliable campus Wi-Fi. Students register, enroll the courses they take, and download practice question sets for offline completion. Each attempt records timestamps, answers, scores and metadata locally; when connectivity is available the app securely synchronizes attempts and updates a central server. Students can view personal progress and course leaderboards (updated after sync) to compare relative performance. Lecturers register separately, create and manage course content (questions, correct answers, explanations, metadata such as difficulty and tags), and access per-course dashboards with leaderboards plus additional metrics (engagement, time-on-question, mastery over topics, attempt distributions). The app prioritizes low bandwidth, progressive synchronization, conflict-safe merges, and data privacy suitable for academic use.`;

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

  // Dynamic Options State
  const [availableRuntimes, setAvailableRuntimes] = useState<TechOption[]>(RUNTIME_OPTIONS);
  const [availableOrms, setAvailableOrms] = useState<TechOption[]>(ORM_OPTIONS);
  const [availablePackageManagers, setAvailablePackageManagers] = useState<TechOption[]>(PACKAGE_MANAGER_OPTIONS);

  // Update description when initialDescription changes
  useEffect(() => {
    if (initialDescription) {
      updateField("description", initialDescription);
    }
  }, [initialDescription]);

  // Effect to filter Runtimes based on Backend
  useEffect(() => {
    if (!formData.backend_framework) {
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
  }, [formData.backend_framework]);

  // Effect to filter Package Managers based on Backend
  useEffect(() => {
    if (!formData.backend_framework) {
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
  }, [formData.backend_framework]);

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

    setAvailableOrms(filteredOrms);

    // Reset ORM if current selection is invalid
    if (formData.orm && !filteredOrms.some(o => o.value === formData.orm)) {
      updateField("orm", null);
    }
  }, [formData.database, formData.backend_framework]);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate
    if (!formData.description.trim()) {
      setErrors({ description: "Project description is required" });
      return;
    }
    
    setErrors({});
    onSubmit(formData);
  };

  const updateField = <K extends keyof ProjectRequest>(
    field: K,
    value: ProjectRequest[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleLoadExample = () => {
    updateField("description", EXAMPLE_DESCRIPTION);
    setIsExampleLoaded(true);
    setTimeout(() => setIsExampleLoaded(false), 2000);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* Project Description */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="description" className="text-base font-semibold">
            Project Description *
          </Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleLoadExample}
            className="h-8 text-xs"
          >
            {isExampleLoaded ? (
              <>
                <Check className="mr-1 h-3 w-3" />
                Loaded!
              </>
            ) : (
              <>
                <Lightbulb className="mr-1 h-3 w-3" />
                Load Example
              </>
            )}
          </Button>
        </div>
        <Textarea
          id="description"
          placeholder="Describe your project idea in detail. What does it do? Who is it for? What are the main features?"
          value={formData.description}
          onChange={(e) => updateField("description", e.target.value)}
          rows={10}
          className={`${errors.description ? "border-red-500" : ""} min-h-[220px]`}
          disabled={isLoading}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          {errors.description && (
            <p className="text-red-500">{errors.description}</p>
          )}
          <span className="ml-auto">{formData.description.length} characters</span>
        </div>
      </div>

      {/* Tech Stack Selection */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Tech Stack (Optional)</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Frontend Framework */}
          <div className="space-y-2">
            <Label htmlFor="frontend">Frontend Framework</Label>
            <Select
              value={formData.frontend_framework || ""}
              onValueChange={(value) =>
                updateField("frontend_framework", value || null)
              }
              disabled={isLoading}
            >
              <SelectTrigger id="frontend">
                <SelectValue placeholder="Select framework" />
              </SelectTrigger>
              <SelectContent>
                {FRONTEND_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Backend Framework */}
          <div className="space-y-2">
            <Label htmlFor="backend">Backend Framework</Label>
            <Select
              value={formData.backend_framework || ""}
              onValueChange={(value) =>
                updateField("backend_framework", value || null)
              }
              disabled={isLoading}
            >
              <SelectTrigger id="backend">
                <SelectValue placeholder="Select framework" />
              </SelectTrigger>
              <SelectContent>
                {BACKEND_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Database */}
          <div className="space-y-2">
            <Label htmlFor="database">Database</Label>
            <Select
              value={formData.database || ""}
              onValueChange={(value) => updateField("database", value || null)}
              disabled={isLoading}
            >
              <SelectTrigger id="database">
                <SelectValue placeholder="Select database" />
              </SelectTrigger>
              <SelectContent>
                {DATABASE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Auth Service */}
          <div className="space-y-2">
            <Label htmlFor="auth">Authentication</Label>
            <Select
              value={formData.auth_service || ""}
              onValueChange={(value) =>
                updateField("auth_service", value || null)
              }
              disabled={isLoading}
            >
              <SelectTrigger id="auth">
                <SelectValue placeholder="Select auth service" />
              </SelectTrigger>
              <SelectContent>
                {AUTH_SERVICE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Payment Gateway */}
          <div className="space-y-2">
            <Label htmlFor="payment">Payment Gateway</Label>
            <Select
              value={formData.payment_gateway || ""}
              onValueChange={(value) =>
                updateField("payment_gateway", value || null)
              }
              disabled={isLoading}
            >
              <SelectTrigger id="payment">
                <SelectValue placeholder="Select payment gateway" />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_GATEWAY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Package Manager */}
          <div className="space-y-2">
            <Label htmlFor="package-manager">Package Manager</Label>
            <Select
              value={formData.package_manager || ""}
              onValueChange={(value) =>
                updateField("package_manager", value || null)
              }
              disabled={isLoading}
            >
              <SelectTrigger id="package-manager">
                <SelectValue placeholder="Select package manager" />
              </SelectTrigger>
              <SelectContent>
                {availablePackageManagers.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* ORM */}
          <div className="space-y-2">
            <Label htmlFor="orm">ORM/Database Library</Label>
            <Select
              value={formData.orm || ""}
              onValueChange={(value) => updateField("orm", value || null)}
              disabled={isLoading}
            >
              <SelectTrigger id="orm">
                <SelectValue placeholder="Select ORM" />
              </SelectTrigger>
              <SelectContent>
                {availableOrms.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Runtime */}
          <div className="space-y-2">
            <Label htmlFor="runtime">Runtime</Label>
            <Select
              value={formData.runtime || ""}
              onValueChange={(value) => updateField("runtime", value || null)}
              disabled={isLoading}
            >
              <SelectTrigger id="runtime">
                <SelectValue placeholder="Select runtime" />
              </SelectTrigger>
              <SelectContent>
                {availableRuntimes.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Additional Options */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Additional Options</h3>
        
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="docker" className="text-base">Include Docker</Label>
            <p className="text-sm text-muted-foreground">
              Add Dockerfile and docker-compose configuration
            </p>
          </div>
          <Switch
            id="docker"
            checked={formData.include_docker}
            onCheckedChange={(checked) => updateField("include_docker", checked)}
            disabled={isLoading}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="cicd" className="text-base">Include CI/CD</Label>
            <p className="text-sm text-muted-foreground">
              Add GitHub Actions workflow configuration
            </p>
          </div>
          <Switch
            id="cicd"
            checked={formData.include_cicd}
            onCheckedChange={(checked) => updateField("include_cicd", checked)}
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        className="w-full"
        size="lg"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Generating Project...
          </>
        ) : (
          "Generate Project Specification"
        )}
      </Button>
    </form>
  );
}
