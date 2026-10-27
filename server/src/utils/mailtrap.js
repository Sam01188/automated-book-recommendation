import { MailtrapClient } from "mailtrap";

const sender = {
  email: "sandbox@example.com",
  name: "Book Recommendation Portal"
};

export class MailtrapConfigurationError extends Error {
  constructor(message) {
    super(message);
    this.name = "MailtrapConfigurationError";
  }
}

export class MailtrapDeliveryError extends Error {
  constructor({ status, code }) {
    const message = status
      ? `Mailtrap API returned HTTP ${status}.`
      : code
        ? `Mailtrap request failed (${code}).`
        : "Mailtrap request failed.";
    super(message);
    this.name = "MailtrapDeliveryError";
    this.status = status;
    this.code = code;
  }
}

export function assertMailtrapConfigured() {
  const token = process.env.MAILTRAP_API_KEY?.trim();
  const rawInboxId = process.env.MAILTRAP_INBOX_ID?.trim();
  const inboxId = Number(rawInboxId);

  if (!token) {
    throw new MailtrapConfigurationError("MAILTRAP_API_KEY is not configured.");
  }
  if (!rawInboxId || !Number.isSafeInteger(inboxId) || inboxId <= 0) {
    throw new MailtrapConfigurationError("MAILTRAP_INBOX_ID must be a positive integer.");
  }

  return { token, inboxId };
}

export async function sendEmail({ to, subject, text, html }) {
  const { token, inboxId } = assertMailtrapConfigured();
  const client = new MailtrapClient({
    token,
    sandbox: true,
    testInboxId: inboxId
  });

  try {
    return await client.send({
      from: sender,
      to: [{ email: to }],
      subject,
      ...(text ? { text } : {}),
      ...(html ? { html } : {})
    });
  } catch (error) {
    const cause = error?.cause;
    const status = Number.isInteger(cause?.response?.status) ? cause.response.status : undefined;
    const code = typeof cause?.code === "string" ? cause.code : undefined;
    throw new MailtrapDeliveryError({ status, code });
  }
}

export function logMailtrapError(context, error) {
  const isConfigurationError = error instanceof MailtrapConfigurationError;
  const isDeliveryError = error instanceof MailtrapDeliveryError;
  console.error(context, {
    status: isDeliveryError ? error.status : undefined,
    code: isDeliveryError ? error.code : undefined,
    message: isConfigurationError || isDeliveryError
      ? error.message
      : "Unexpected email operation error."
  });
}
