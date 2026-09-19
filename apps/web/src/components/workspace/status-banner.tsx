import { AlertCircle, Info, X } from "lucide-react";

export type StatusTone = "error" | "notice";

/**
 * The workspace's message strip, as an accent note: the tone lives in the bar
 * and the icon, and the message is body text. It used
 * `text-destructive-foreground`, which is for text on a solid destructive fill;
 * over a 10% tint it was #690005 on near-black in dark mode and white on pale
 * pink in light. A notice (a refine that came back unchanged) is not a failure,
 * so it takes the warning accent and is announced politely.
 */
const TONES: Record<StatusTone, { role: "alert" | "status"; accent: string; icon: string }> = {
  error: { role: "alert", accent: "border-destructive bg-destructive/10", icon: "text-destructive" },
  notice: { role: "status", accent: "border-warning bg-warning/10", icon: "text-warning" },
};

export function StatusBanner({
  message,
  tone,
  onDismiss,
}: {
  message: string;
  tone: StatusTone;
  onDismiss: () => void;
}) {
  const { role, accent, icon } = TONES[tone];
  const Icon = tone === "error" ? AlertCircle : Info;
  return (
    <div
      role={role}
      className={`accent-note flex items-center justify-between gap-3 px-6 py-3 border-b border-b-border text-sm ${accent}`}
    >
      <div className="flex items-center gap-2 min-w-0">
        <Icon className={`h-4 w-4 shrink-0 ${icon}`} aria-hidden="true" />
        <span className="text-foreground truncate">{message}</span>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Dismiss message"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
