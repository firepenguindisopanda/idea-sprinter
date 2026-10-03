import { redirect } from "next/navigation";

/**
 * A result page of the retired generator (revamp I2). Saved projects open
 * from the dashboard; a link to a generator session lands in the Workshop.
 */
export default function GenerateSessionPage() {
  redirect("/workspace");
}
