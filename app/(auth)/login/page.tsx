import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth-cache";
import { LoginPageClient } from "./LoginPageClient";

export default async function LoginPage() {
  const session = await getSession();

  if (session?.user) {
    redirect("/post-login");
  }

  return <LoginPageClient />;
}
