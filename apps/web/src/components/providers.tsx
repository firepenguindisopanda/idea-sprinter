"use client";

import { ThemeProvider } from "./theme-provider";
import { Toaster } from "./ui/sonner";

export default function Providers({ children }: { children: React.ReactNode }) {
	// DESIGN.md puts the system in dark by default - the cyanotype is the
	// drawing it was designed against. System and Light stay available from
	// the theme menu.
	return (
		<ThemeProvider
			attribute="class"
			defaultTheme="dark"
			enableSystem
			disableTransitionOnChange
		>
			{children}
			<Toaster richColors />
		</ThemeProvider>
	);
}
