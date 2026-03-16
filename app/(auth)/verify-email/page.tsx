import Link from "next/link";
import { CheckCircle2, Clock3, MailWarning, XCircle } from "lucide-react";
import { OnboardingShell } from "@/components/onboarding/OnboardingShell";
import { ContextPanel } from "@/components/onboarding/ContextPanel";
import { consumeOwnerVerificationToken } from "@/lib/owner-verification";

type VerifyEmailPageProps = {
  searchParams?: Promise<{
    token?: string;
  }>;
};

export default async function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
  const params = searchParams ? await searchParams : {};
  const token = params.token?.trim();

  const result = token
    ? await consumeOwnerVerificationToken(token)
    : { status: "verification_expired" as const };

  const content = getContent(result.status, result.email);

  return (
    <OnboardingShell
      leftPanel={
        <ContextPanel
          badgeIcon={content.icon}
          badgeText="Vérification email"
          title={content.title}
          subtitle={content.subtitle}
          steps={content.steps}
        />
      }
    >
      <div className="space-y-6">
        <div className={`rounded-2xl border p-6 ${content.panelClassName}`}>
          <div className="flex items-start gap-3">
            {content.icon}
            <div className="space-y-2">
              <p className="text-lg font-semibold">{content.title}</p>
              <p className="text-sm leading-6">{content.subtitle}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href={content.primaryHref}
            className="inline-flex h-12 items-center justify-center rounded-xl bg-[#111827] px-5 text-sm font-semibold text-white transition hover:bg-black"
          >
            {content.primaryLabel}
          </Link>
          <Link
            href={content.secondaryHref}
            className="inline-flex h-12 items-center justify-center rounded-xl border border-border px-5 text-sm font-semibold transition hover:bg-neutral-50"
          >
            {content.secondaryLabel}
          </Link>
        </div>
      </div>
    </OnboardingShell>
  );
}

function getContent(status: string, email?: string) {
  if (status === "awaiting_approval") {
    return {
      icon: <CheckCircle2 className="h-5 w-5 text-emerald-600" />,
      title: "Email confirmé",
      subtitle:
        "Votre adresse email a été confirmée. Votre demande d'ouverture de compte est maintenant en attente d'approbation.",
      steps: [
        "Email confirmé",
        "Revue de votre demande par notre équipe",
        "Accès à la plateforme après approbation",
      ],
      primaryHref: "/login",
      primaryLabel: "Aller à la connexion",
      secondaryHref: "/signup",
      secondaryLabel: "Créer une autre demande",
      panelClassName: "border-emerald-200 bg-emerald-50/80 text-emerald-900",
    };
  }

  if (status === "email_already_verified") {
    return {
      icon: <Clock3 className="h-5 w-5 text-amber-600" />,
      title: "Email déjà vérifié",
      subtitle:
        "Cette adresse email a déjà été confirmée. Si vous n'avez pas encore accès, votre demande est probablement encore en attente d'approbation.",
      steps: [
        "Email déjà validé",
        "Demande en revue",
        "Connexion après approbation",
      ],
      primaryHref: "/login",
      primaryLabel: "Retour à la connexion",
      secondaryHref: `/verify-email/resend${email ? `?email=${encodeURIComponent(email)}` : ""}`,
      secondaryLabel: "Renvoyer si besoin",
      panelClassName: "border-amber-200 bg-amber-50/80 text-amber-900",
    };
  }

  if (status === "account_rejected") {
    return {
      icon: <XCircle className="h-5 w-5 text-red-600" />,
      title: "Demande refusée",
      subtitle:
        "Cette demande a été refusée. Contactez le support si vous pensez qu'il s'agit d'une erreur.",
      steps: [
        "Email validé",
        "Demande refusée",
        "Contacter le support si nécessaire",
      ],
      primaryHref: "/login",
      primaryLabel: "Retour à la connexion",
      secondaryHref: "/signup",
      secondaryLabel: "Créer une nouvelle demande",
      panelClassName: "border-red-200 bg-red-50/80 text-red-900",
    };
  }

  return {
    icon: <MailWarning className="h-5 w-5 text-slate-600" />,
    title: "Lien invalide ou expiré",
    subtitle:
      "Le lien de vérification est invalide ou a expiré. Demandez un nouvel email pour poursuivre l'ouverture du compte.",
    steps: [
      "Le lien n'est plus valide",
      "Demander un nouvel email",
      "Confirmer l'adresse avant approbation",
    ],
    primaryHref: `/verify-email/resend${email ? `?email=${encodeURIComponent(email)}` : ""}`,
    primaryLabel: "Renvoyer l'email",
    secondaryHref: "/signup",
    secondaryLabel: "Retour à l'inscription",
    panelClassName: "border-slate-200 bg-slate-50 text-slate-900",
  };
}
