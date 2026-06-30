import { redirect } from "next/navigation";

/*
 * /browse folds into the home scroll world (Phase 14): the spiral is now reached by
 * scrolling down the home spine, so this route just sends you there.
 */
export default function BrowsePage() {
  redirect("/");
}
