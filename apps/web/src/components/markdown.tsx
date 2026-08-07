"use client";

import { Streamdown } from "streamdown";
import { useEffect, useState, type ComponentProps } from "react";
import { downgradeUnparseableDiagrams } from "@/lib/mermaid-guard";
import { cn } from "@/lib/utils";

type StreamdownProps = ComponentProps<typeof Streamdown>;

export interface MarkdownProps
  extends Omit<StreamdownProps, "mode" | "children" | "plugins"> {
  /** The markdown source. */
  children: string;
  /**
   * True while tokens are still arriving. Enables incomplete-syntax repair
   * (so a half-emitted `**bo` never flashes literal asterisks), the streaming
   * caret, and deferred re-parsing.
   */
  isStreaming?: boolean;
  /**
   * Render ```mermaid blocks as diagrams. Off by default and loaded on demand -
   * mermaid is a very large dependency and only the document surfaces need it,
   * so chat bubbles must not pull it into their bundle.
   *
   * Each diagram is parsed before it is rendered; one that will not parse is
   * shown as a code block rather than as Mermaid's parse-error banner.
   */
  enableDiagrams?: boolean;
}

/** Lazily load the mermaid plugin, only for surfaces that opt in. */
function useDiagramPlugins(enabled: boolean): StreamdownProps["plugins"] {
  const [plugins, setPlugins] = useState<StreamdownProps["plugins"]>(undefined);

  useEffect(() => {
    if (!enabled) {
      setPlugins(undefined);
      return;
    }
    let cancelled = false;
    import("@streamdown/mermaid")
      .then((mod) => {
        if (!cancelled) setPlugins({ mermaid: mod.mermaid });
      })
      .catch(() => {
        // Diagrams are an enhancement - fall back to the raw code block.
      });
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return plugins;
}

/**
 * Check every diagram with Mermaid's own parser before letting Mermaid render
 * it, downgrading the ones that fail to code blocks.
 *
 * Returns null until the check has run. Diagram rendering stays off until
 * then, so an invalid diagram is never given the chance to paint its
 * parse-error banner - it goes straight from code block to diagram, or stays
 * a code block.
 */
function useCheckedDiagramSource(source: string, enabled: boolean): string | null {
  const [checked, setChecked] = useState<{ source: string; text: string } | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    downgradeUnparseableDiagrams(source)
      .then((text) => {
        if (!cancelled) setChecked({ source, text });
      })
      .catch(() => {
        // Parser unavailable - leave diagrams off and render the source.
      });
    return () => {
      cancelled = true;
    };
  }, [source, enabled]);

  // Keyed on the source it was checked against, so a document that changes
  // never briefly renders the previous document's checked text.
  return enabled && checked?.source === source ? checked.text : null;
}

/**
 * Shared markdown renderer for every agent/LLM output surface.
 *
 * Streamdown is used rather than bare react-markdown because it handles the
 * streaming-specific cases this app hits constantly: unterminated blocks,
 * GFM tables (which the agent prompts explicitly ask for), and memoized
 * block-level re-rendering so a token does not re-parse the whole document.
 */
export function Markdown({
  children,
  isStreaming = false,
  enableDiagrams = false,
  className,
  ...props
}: Readonly<MarkdownProps>) {
  // A half-streamed diagram never parses, so diagrams only turn on once the
  // tokens have stopped arriving.
  const wantDiagrams = enableDiagrams && !isStreaming;
  const checkedSource = useCheckedDiagramSource(children, wantDiagrams);
  const plugins = useDiagramPlugins(wantDiagrams && checkedSource !== null);

  return (
    <Streamdown
      mode={isStreaming ? "streaming" : "static"}
      isAnimating={isStreaming}
      lineNumbers={false}
      plugins={plugins}
      className={cn(
        "space-y-4 text-sm leading-relaxed break-words",
        "[&_h1]:text-xl [&_h1]:font-bold [&_h1]:mt-8 [&_h1]:mb-4",
        "[&_h2]:text-lg [&_h2]:font-bold [&_h2]:mt-6 [&_h2]:mb-3",
        "[&_h3]:text-base [&_h3]:font-medium [&_h3]:mt-4 [&_h3]:mb-2",
        className,
      )}
      {...props}
    >
      {checkedSource ?? children}
    </Streamdown>
  );
}

export default Markdown;
