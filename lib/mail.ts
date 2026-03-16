import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

function getSenderEmail(): string {
  const sender = process.env.RESEND_FROM_EMAIL?.trim();
  if (!sender) {
    throw new Error("RESEND_FROM_EMAIL must be configured");
  }

  return sender;
}

export async function sendOwnerVerificationEmail(params: {
  to: string;
  name: string;
  verificationUrl: string;
}): Promise<void> {
  if (!resend) {
    throw new Error("RESEND_API_KEY must be configured");
  }

  const { name, to, verificationUrl } = params;

  await resend.emails.send({
    from: getSenderEmail(),
    to,
    subject: "Confirmez votre email pour activer votre demande Locaryx",
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
        <p>Bonjour ${escapeHtml(name)},</p>
        <p>Confirmez votre adresse email pour finaliser votre demande d'ouverture de compte Locaryx.</p>
        <p>
          <a href="${verificationUrl}" style="display:inline-block;padding:12px 18px;background:#111827;color:#ffffff;text-decoration:none;border-radius:8px">
            Vérifier mon email
          </a>
        </p>
        <p>Après validation, votre agence restera en attente d'approbation avant l'accès à l'application.</p>
        <p>Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
      </div>
    `,
  });
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
