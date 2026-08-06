import * as React from "react";
import { Slot as SlotPrimitive } from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

// Controls are sharp-edged and carry no resting shadow: DESIGN.md puts
// standard UI at a 4px radius and primary CTAs at 0, and asks depth to come
// from tonal layering and hairline rules rather than diffusion.
const buttonVariants = cva(
	"inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background aria-invalid:ring-destructive/30 aria-invalid:border-destructive",
	{
		variants: {
			variant: {
				default:
					"bg-primary text-primary-foreground hover:bg-primary/85",
				destructive:
					"bg-destructive text-destructive-foreground hover:bg-destructive/85 focus-visible:ring-destructive",
				outline:
					"border border-border bg-transparent hover:border-primary/50 hover:bg-primary/8 hover:text-foreground",
				plate:
					"rounded-none border-2 border-primary/35 bg-transparent hover:border-primary/60 hover:bg-primary/8 hover:text-foreground",
				plateActive:
					"rounded-none border-2 border-primary bg-primary/5 text-primary hover:bg-primary/10",
				secondary:
					"bg-secondary text-secondary-foreground hover:bg-secondary/70",
				ghost:
					"hover:bg-primary/8 hover:text-foreground",
				link: "text-primary underline-offset-4 hover:underline",
			},
			size: {
				default: "h-9 px-4 py-2 has-[>svg]:px-3",
				sm: "h-8 gap-1.5 px-3 has-[>svg]:px-2.5",
				lg: "h-10 px-6 has-[>svg]:px-4",
				// The primary action reads as a machine control: square, mono,
				// letterspaced. DESIGN.md's mono-label-sm.
				xl: "h-12 rounded-none px-8 font-mono text-xs font-bold uppercase tracking-[0.15em] has-[>svg]:px-6",
				icon: "size-9",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	},
);

function Button({
	className,
	variant,
	size,
	asChild = false,
	...props
}: React.ComponentProps<"button"> &
	VariantProps<typeof buttonVariants> & {
		asChild?: boolean;
	}) {
	const Comp = asChild ? SlotPrimitive.Slot : "button";

	return (
		<Comp
			data-slot="button"
			className={cn(buttonVariants({ variant, size, className }))}
			{...props}
		/>
	);
}

export { Button, buttonVariants };
