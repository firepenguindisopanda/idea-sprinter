import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * A small icon enclosed in a bordered tile, so the tile fills the space rather
 * than the glyph being scaled past the size it was drawn at.
 *
 *   <IconTile tone="destructive"><AlertTriangle /></IconTile>
 *
 * The tile sizes the child, so pass the icon without a size class.
 */

const TONES = {
	primary: "border-primary/25 bg-primary/5 text-primary",
	destructive: "border-destructive/30 bg-destructive/10 text-destructive",
	warning: "border-warning/30 bg-warning/10 text-warning",
	tertiary: "border-tertiary/30 bg-tertiary/10 text-tertiary",
	muted: "border-border bg-muted/40 text-muted-foreground",
} as const;

const SIZES = {
	sm: "p-2.5 [&_svg]:size-4",
	md: "p-3.5 [&_svg]:size-5",
	lg: "p-5 [&_svg]:size-6",
} as const;

interface IconTileProps extends React.ComponentProps<"div"> {
	readonly tone?: keyof typeof TONES;
	readonly size?: keyof typeof SIZES;
}

export function IconTile({
	tone = "primary",
	size = "md",
	className,
	children,
	...props
}: IconTileProps) {
	return (
		<div
			data-slot="icon-tile"
			aria-hidden
			className={cn(
				"inline-flex shrink-0 items-center justify-center border",
				TONES[tone],
				SIZES[size],
				className,
			)}
			{...props}
		>
			{children}
		</div>
	);
}
