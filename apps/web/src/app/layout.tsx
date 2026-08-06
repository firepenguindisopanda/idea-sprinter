import type { Metadata } from "next";
import { Geist, JetBrains_Mono } from "next/font/google";
import "../index.css";
import Providers from "@/components/providers";
import Header from "@/components/header";

// DESIGN.md's dual-logic rule: Geist for anything a person reads, JetBrains
// Mono for anything a machine produced. Geist Mono was standing in for the
// second half and reads as the same voice as the first, which is exactly the
// distinction the rule exists to draw.
const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
	variable: "--font-jetbrains-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "specs before code",
	description: "AI-powered multi-agent system for generating software specifications before you code.",
	icons: {
		icon: "/favicon.ico",
	},
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		// The font variables belong on <html>, not <body>. Tailwind declares
		// --font-sans/--font-mono on :root, and a custom property whose value
		// references an undefined variable is guaranteed-invalid: with the
		// variables one level down on <body>, both resolved to nothing and every
		// font-sans/font-mono in the app silently fell back to the UA stack.
		<html
			lang="en"
			suppressHydrationWarning
			className={`${geistSans.variable} ${jetbrainsMono.variable}`}
		>
			<body className="antialiased selection:bg-primary/25 min-h-svh">
				<Providers>
					<div className="relative grid grid-rows-[auto_auto_1fr] h-svh overflow-hidden">
						{/* Refactoring UI principle 6: a colour rule across the top of the
						    layout. The one place in the app that carries pigment at full
						    strength rather than as a tint, so the drawing has a datum line
						    to hang from. Decorative, hence aria-hidden. */}
						<div aria-hidden className="h-0.5 bg-primary" />
						<Header />
						<main className="relative z-10 overflow-y-auto">
							{children}
						</main>
					</div>
				</Providers>
			</body>
		</html>
	);
}
