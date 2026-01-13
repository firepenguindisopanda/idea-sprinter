import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../index.css";
import Providers from "@/components/providers";
import Header from "@/components/header";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "specs before code",
	description: "AI-powered multi-agent system for generating software specifications before you code.",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body
				className={`${geistSans.variable} ${geistMono.variable} antialiased selection:bg-primary/30 min-h-svh`}
			>
				<Providers>
					<div className="relative grid grid-rows-[auto_1fr] h-svh overflow-hidden">
						{/* Background grid layer */}
						<div className="absolute inset-0 -z-10 blueprint-grid opacity-30 pointer-events-none" />
						<div className="absolute inset-0 -z-10 blueprint-grid-sub opacity-20 pointer-events-none" />
						
						<Header />
						<main className="overflow-y-auto">
							{children}
						</main>
					</div>
				</Providers>
			</body>
		</html>
	);
}
