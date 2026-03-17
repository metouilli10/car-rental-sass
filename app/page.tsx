import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-cache";
import { LandingPage } from "@/app/cometly-clone-2/page";

export default async function HomePage() {
  const session = await getSession();

  if (session?.user) {
    redirect("/post-login");
  }

  return <LandingPage />;
}
