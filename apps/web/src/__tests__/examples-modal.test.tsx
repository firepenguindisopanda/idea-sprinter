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
    fireEvent.click(screen.getByRole("button", { name: /select/i }));

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

    const streamSwitch = screen.getByRole('switch', { name: /stream/i });
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

    expect(screen.getByText("Example without bullets")).toBeInTheDocument();
    expect(screen.getByText("One line")).toBeInTheDocument();
  });
});
