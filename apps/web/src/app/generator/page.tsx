import { redirect } from "next/navigation";

/**
 * Legacy /generator route - permanently redirects to /generate.
 * Kept so bookmarks and external links continue to work.
 */
export default function GeneratorPage() {
  redirect("/generate");
}
