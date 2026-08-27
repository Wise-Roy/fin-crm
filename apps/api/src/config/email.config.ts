import { BrevoClient } from "@getbrevo/brevo";

const brevo = new BrevoClient({
  apiKey: process.env.BREVO_API_KEY as string,
});

const DEFAULT_SENDER = {
  name: process.env.BREVO_SENDER_NAME || "FinCRM",
  email: (process.env.BREVO_SENDER_EMAIL || "p.gadiya177@gmail.com").trim(),
};

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  try {
    const result = await brevo.transactionalEmails.sendTransacEmail({
      sender: DEFAULT_SENDER,
      to: [{ email: to }],
      subject,
      htmlContent: html,
    });

    return result;
  } catch (error: any) {
    console.error("Brevo email error:", {
      message: error?.message,
      statusCode: error?.statusCode,
      body: error?.body,
    });
    throw error;
  }
}
