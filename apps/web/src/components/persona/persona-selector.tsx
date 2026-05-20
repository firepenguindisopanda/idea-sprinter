"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import type { UserPersona, UserPersonaInfo } from "@/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface PersonaSelectorProps {
  onSelect?: (persona: UserPersona) => void;
  currentPersona?: UserPersona | null;
  showOnly?: boolean;
}

export function PersonaSelector({ 
  onSelect, 
  currentPersona,
  showOnly = false 
}: PersonaSelectorProps) {
  const { user, updatePersona } = useAuthStore();
  const [personas, setPersonas] = useState<UserPersonaInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState<UserPersona | null>(
    currentPersona || user?.persona || null
  );

  useEffect(() => {
    async function loadPersonas() {
      try {
        const response = await api.getPersonaOptions();
        setPersonas(response.personas);
      } catch (error) {
        console.error("Failed to load personas:", error);
      } finally {
        setLoading(false);
      }
    }
    loadPersonas();
  }, []);

  const handleSelect = async (personaId: UserPersona) => {
    setSelectedPersona(personaId);
    
    // If we have a user, also save to backend
    if (user && !showOnly) {
      setSaving(true);
      try {
        await updatePersona(personaId);
      } catch (error) {
        console.error("Failed to save persona:", error);
      } finally {
        setSaving(false);
      }
    }
    
    onSelect?.(personaId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        {personas.map((persona) => (
          <Card
            key={persona.id}
            className={`p-4 cursor-pointer transition-all hover:border-primary ${
              selectedPersona === persona.id
                ? "border-primary ring-2 ring-primary/20"
                : ""
            }`}
            onClick={() => handleSelect(persona.id)}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl">{persona.icon}</span>
              <div className="space-y-1">
                <h3 className="font-semibold leading-none tracking-tight">
                  {persona.name}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {persona.description}
                </p>
              </div>
            </div>
            {selectedPersona === persona.id && (
              <div className="mt-3 flex items-center gap-2">
                <span className="text-xs text-primary font-medium">
                  {saving ? "Saving..." : "Selected"}
                </span>
              </div>
            )}
          </Card>
        ))}
      </div>
      
      {selectedPersona && onSelect && (
        <div className="flex justify-end pt-2">
          <Button onClick={() => onSelect(selectedPersona)} disabled={saving}>
            {saving ? "Saving..." : "Continue"}
          </Button>
        </div>
      )}
    </div>
  );
}

// Helper component to display the current persona with edit option
export function CurrentPersonaBadge({ 
  onEditClick 
}: { 
  onEditClick?: () => void 
}) {
  const { user } = useAuthStore();
  const [personaName, setPersonaName] = useState<string>("");

  useEffect(() => {
    async function loadPersonaName() {
      if (user?.persona) {
        try {
          const response = await api.getPersonaOptions();
          const persona = response.personas.find(p => p.id === user.persona);
          setPersonaName(persona?.name || user.persona);
        } catch {
          setPersonaName(user.persona);
        }
      }
    }
    loadPersonaName();
  }, [user?.persona]);

  if (!user?.persona) return null;

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-muted-foreground">Persona:</span>
      <span className="font-medium">{personaName}</span>
      {onEditClick && (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onEditClick}
          className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
        >
          Change
        </Button>
      )}
    </div>
  );
}
