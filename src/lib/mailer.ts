import nodemailer from "nodemailer";

function getSmtpConfig() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 0);
  const secure = String(process.env.SMTP_SECURE || "").toLowerCase() === "true";
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || user;
  if (!host || !port || !user || !pass || !from) {
    throw new Error("Missing SMTP environment variables");
  }
  return { host, port, secure, user, pass, from };
}

export function hasSmtpConfig() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 0);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || user;
  return Boolean(host && port && user && pass && from);
}

export async function sendVerificationEmail(to: string, code: string) {
  const { host, port, secure, user, pass, from } = getSmtpConfig();
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass }
  });

  const subject = "Polish Vocab Studio — підтвердження пошти";
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111">
      <h2 style="margin:0 0 8px">Підтвердження email</h2>
      <p>Ваш код підтвердження:</p>
      <div style="font-size:28px;font-weight:700;letter-spacing:4px;margin:12px 0">${code}</div>
      <p>Код дійсний 15 хвилин.</p>
    </div>
  `;

  await transporter.sendMail({ from, to, subject, html });
}

export async function sendPasswordResetEmail(to: string, code: string) {
  const { host, port, secure, user, pass, from } = getSmtpConfig();
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass }
  });

  const subject = "Polish Vocab Studio — зміна пароля";
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111">
      <h2 style="margin:0 0 8px">Зміна пароля</h2>
      <p>Ваш код для зміни пароля:</p>
      <div style="font-size:28px;font-weight:700;letter-spacing:4px;margin:12px 0">${code}</div>
      <p>Код дійсний 15 хвилин.</p>
    </div>
  `;

  await transporter.sendMail({ from, to, subject, html });
}

export async function sendFeedbackEmail({
  fromName,
  fromEmail,
  subject,
  message
}: {
  fromName: string;
  fromEmail: string;
  subject?: string;
  message: string;
}) {
  const { host, port, secure, user, pass, from } = getSmtpConfig();
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass }
  });

  const mailSubject = subject?.trim()
    ? `Feedback: ${subject.trim()}`
    : "Feedback from Polish Vocab Studio";
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#2b2118;background:#fdf6ef;padding:24px">
      <div style="max-width:640px;margin:0 auto;background:#fff7ef;border:1px solid #e7d7c8;border-radius:18px;padding:20px">
        <h2 style="margin:0 0 12px;font-size:20px">Polish Vocab Studio — Feedback</h2>
        <p style="margin:0 0 8px"><strong>From:</strong> ${fromName} (${fromEmail})</p>
        <p style="margin:0 0 8px"><strong>Subject:</strong> ${subject?.trim() || "—"}</p>
        <div style="margin-top:12px;padding:14px;background:#fff;border-radius:12px;border:1px solid #eadbcc;white-space:pre-wrap">
          ${message}
        </div>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from,
    to: user,
    subject: mailSubject,
    replyTo: fromEmail,
    html
  });
}
