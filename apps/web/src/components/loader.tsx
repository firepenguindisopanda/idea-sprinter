import { Loader2 } from "lucide-react";

export default function Loader() {
	return (
		<div className="flex flex-col h-full items-center justify-center py-12 gap-4">
			<Loader2 className="animate-spin text-primary h-8 w-8" />
			<span className="font-mono text-[10px] uppercase tracking-[0.4em] text-primary/60 animate-pulse">Processing_Packet...</span>
		</div>
	);
}
