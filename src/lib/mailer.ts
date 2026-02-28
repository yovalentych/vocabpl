export function hasMailConfig(): boolean {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  return !!(host && port && user && pass);
}

export function getMailConfig() {
  if (!hasMailConfig()) {
    throw new Error("SMTP configuration is missing");
  }

  return {
    host: process.env.SMTP_HOST!,
    port: parseInt(process.env.SMTP_PORT!),
    user: process.env.SMTP_USER!,
    pass: process.env.SMTP_PASS!,
    from: process.env.SMTP_FROM || process.env.SMTP_USER!
  };
}

export async function sendFeedbackEmail(params: {
  fromName: string;
  fromEmail: string;
  subject: string;
  message: string;
}): Promise<boolean> {
  if (!hasMailConfig()) {
    console.warn("SMTP not configured, skipping email");
    return false;
  }

  // TODO: Implement actual email sending with nodemailer or similar
  console.log("Feedback email would be sent:", params);
  return true;
}

export async function sendPasswordResetEmail(email: string, code: string): Promise<boolean> {
  if (!hasMailConfig()) {
    console.warn("SMTP not configured, skipping email");
    return false;
  }

  console.log("Password reset email would be sent to:", email, "with code:", code);
  return true;
}

export async function sendPaymentReceiptEmail(params: {
  to: string;
  name?: string;
  amountUah: number;
  planLabel: string;
  periodDays?: number;
  invoiceId: string;
  paidAt?: Date;
  receiptUrl?: string | null;
}): Promise<boolean> {
  if (!hasMailConfig()) {
    console.warn("SMTP not configured, skipping email");
    return false;
  }

  console.log("Payment receipt email would be sent:", params);
  return true;
}

export async function sendVerificationEmail(email: string, code: string): Promise<boolean> {
  if (!hasMailConfig()) {
    console.warn("SMTP not configured, skipping email");
    return false;
  }

  console.log("Verification email would be sent to:", email, "with code:", code);
  return true;
}
