import { notFound } from "next/navigation";
import { isValidLocale } from "@/lib/i18n/config";

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  if (!isValidLocale(locale)) {
    notFound();
  }
  return children;
}
