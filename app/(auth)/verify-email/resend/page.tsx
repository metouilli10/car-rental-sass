import { ResendVerificationClient } from "@/app/(auth)/verify-email/resend/ResendVerificationClient";

type ResendVerificationPageProps = {
  searchParams?: Promise<{
    email?: string;
  }>;
};

export default async function ResendVerificationPage({
  searchParams,
}: ResendVerificationPageProps) {
  const params = searchParams ? await searchParams : {};

  return <ResendVerificationClient initialEmail={params.email ?? ""} />;
}
