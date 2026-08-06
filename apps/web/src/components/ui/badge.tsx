import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// Status chips are machine readouts, so they take the mono voice and square
// corners rather than the pill shape stock shadcn ships.
const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-xs border px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-[0.1em] w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:ring-ring focus-visible:ring-2 aria-invalid:border-destructive transition-colors overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/85",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/70",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground [a&]:hover:bg-destructive/85 focus-visible:ring-destructive",
        // A measured, passing value. DESIGN.md reserves teal for exactly this.
        tertiary:
          "border-tertiary/40 bg-tertiary/10 text-tertiary",
        outline:
          "border-border text-muted-foreground [a&]:hover:border-primary/40 [a&]:hover:text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
