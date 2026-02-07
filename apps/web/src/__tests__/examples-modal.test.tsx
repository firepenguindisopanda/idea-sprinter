import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ExamplesModal from "@/components/generator/examples-modal";

describe("ExamplesModal", () => {
  it("renders items and calls onSelect + closes on Select", () => {
    const onOpenChange = vi.fn();
    const onSelect = vi.fn();

    render(
      <ExamplesModal
        open={true}
        onOpenChange={onOpenChange}
        request={null}
        items={[
          {
            id: "1",
            title: "Example 1",
            one_line: "One line",
            full_text: "Full text",
            scope_bullets: ["a", "b", "c"],
            tags: ["MVP"],
          },
        ]}
        onSelect={onSelect}
      />
    );

    expect(screen.getByText("Example 1")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Initialize_Node"));

    const expectedText = [
      "Example 1",
      "One line",
      ["a", "b", "c"].map(b => `- ${b}`).join("\n"),
      "Full text",
    ].join("\n\n");

    expect(onSelect).toHaveBeenCalledWith(expectedText);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('shows the stream switch and toggles', () => {
    const onOpenChange = vi.fn();
    const onSelect = vi.fn();
    
    render(
      <ExamplesModal open={true} onOpenChange={onOpenChange} request={null} items={[]} onSelect={onSelect} />
    );

    // The switch is actually a button with role="switch" and aria-label="Stream"
    const streamSwitch = screen.getByRole('switch', { name: /Stream/i });
    expect(streamSwitch).toBeInTheDocument();
    expect(streamSwitch).toHaveAttribute('aria-checked', 'false');
    fireEvent.click(streamSwitch);
    expect(streamSwitch).toHaveAttribute('aria-checked', 'true');
  });

  it('renders items missing scope_bullets and tags without crashing', () => {
    const onOpenChange = vi.fn();
    const onSelect = vi.fn();

    render(
      <ExamplesModal
        open={true}
        onOpenChange={onOpenChange}
        request={null}
        items={[
          {
            id: "2",
            title: "Example without bullets",
            one_line: "One line",
            full_text: "Full text"
          } as any,
        ]}
        onSelect={onSelect}
      />
    );

    // Check that the title and one_line are rendered (one_line is in CardDescription)
    expect(screen.getByText("Example without bullets")).toBeInTheDocument();
    // The one_line is rendered as "Ref: {one_line}" in CardDescription
    expect(screen.getByText(/Ref: One line/i)).toBeInTheDocument();
  });
});
