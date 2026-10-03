import { redirect } from "next/navigation";

/**
 * Legacy /generator route. It pointed at /generate, which is retired too
 * (revamp I2); both land in the Workshop.
 */
export default function GeneratorPage() {
  redirect("/workspace");
}
