import { redirect } from "next/navigation";

/**
 * The old pipeline's generator, retired (revamp I2): the Workshop writes the
 * design spec now. Kept as a redirect so bookmarks still land somewhere.
 */
export default function GeneratePage() {
  redirect("/workspace");
}
