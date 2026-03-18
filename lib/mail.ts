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
}): Promise<{ messageId?: string }> {
  if (!resend) {
    throw new Error("RESEND_API_KEY must be configured");
  }

  const { name, to, verificationUrl } = params;

  const result = await resend.emails.send({
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

  if (result.error) {
    console.error("sendOwnerVerificationEmail resend error:", result.error);
    throw new Error(`RESEND_SEND_FAILED: ${result.error.message}`);
  }

  return { messageId: getResendMessageId(result) };
}

export async function sendNotificationReminderEmail(params: {
  to: string;
  agencyName: string;
  vehicleName: string;
  plate: string;
  title: string;
  body: string;
  dueLabel?: string | null;
  dashboardUrl: string;
}): Promise<{ messageId?: string }> {
  if (!resend) {
    throw new Error("RESEND_API_KEY must be configured");
  }

  const result = await resend.emails.send({
    from: getSenderEmail(),
    to: params.to,
    subject: `[${params.agencyName}] ${params.title}`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
        <p>Bonjour,</p>
        <p>Un rappel véhicule nécessite votre attention.</p>
        <div style="padding:16px;border:1px solid #e5e7eb;border-radius:12px;background:#f9fafb">
          <p style="margin:0 0 8px 0"><strong>${escapeHtml(params.title)}</strong></p>
          <p style="margin:0 0 8px 0">${escapeHtml(params.body)}</p>
          <p style="margin:0;color:#6b7280">
            Véhicule : <strong>${escapeHtml(params.vehicleName)}</strong> (${escapeHtml(params.plate)})
          </p>
          ${
            params.dueLabel
              ? `<p style="margin:8px 0 0 0;color:#6b7280">${escapeHtml(params.dueLabel)}</p>`
              : ""
          }
        </div>
        <p style="margin-top:16px">
          <a href="${params.dashboardUrl}" style="display:inline-block;padding:12px 18px;background:#111827;color:#ffffff;text-decoration:none;border-radius:8px">
            Ouvrir les notifications
          </a>
        </p>
      </div>
    `,
  });

  if (result.error) {
    console.error("sendNotificationReminderEmail resend error:", result.error);
    throw new Error(`RESEND_SEND_FAILED: ${result.error.message}`);
  }

  return { messageId: getResendMessageId(result) };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getResendMessageId(result: unknown): string | undefined {
  if (!result || typeof result !== "object") return undefined;
  const maybeData = (result as { data?: { id?: string } }).data;
  return typeof maybeData?.id === "string" ? maybeData.id : undefined;
}
