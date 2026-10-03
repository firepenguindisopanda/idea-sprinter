import { redirect } from "next/navigation";

/**
 * The ideation wizard fed the retired generator (revamp I2). An idea starts
 * in the Workshop now, which asks about whatever the idea leaves open.
 */
export default function IdeationPage() {
  redirect("/workspace");
}
