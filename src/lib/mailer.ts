import nodemailer from "nodemailer";
import dns from "dns";
import type SMTPTransport from "nodemailer/lib/smtp-transport";

dns.setDefaultResultOrder("ipv4first");

const globalForMailer = globalThis as unknown as {
  smtpSelfTestStarted?: boolean;
};

type ParsedFromAddress = {
  name?: string;
  email?: string;
};

function parseBool(value: string | undefined, fallback: boolean) {
  if (value == null) return fallback;
  const normalized = String(value).trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  return fallback;
}

function parseNumber(value: string | undefined, fallback: number) {
  const parsed = Number(String(value ?? "").trim());
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseFromAddress(value: string | undefined): ParsedFromAddress {
  if (!value) return {};
  const trimmed = value.trim();
  const match = trimmed.match(/^(.*)<([^>]+)>$/);
  if (match) {
    const name = match[1]?.trim().replace(/^"|"$/g, "") || undefined;
    const email = match[2]?.trim();
    return { name, email };
  }
  if (trimmed.includes("@")) return { email: trimmed };
  return {};
}

function getSmtpConfig() {
  const host = process.env.SMTP_HOST;
  const port = parseNumber(process.env.SMTP_PORT, 0);
  const secure = parseBool(process.env.SMTP_SECURE, port === 465);
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
  const port = parseNumber(process.env.SMTP_PORT, 0);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || user;
  return Boolean(host && port && user && pass && from);
}

function hasBrevoConfig() {
  const apiKey = process.env.BREVO_API_KEY;
  const fallbackSender = parseFromAddress(process.env.SMTP_FROM);
  const senderEmail = process.env.BREVO_SENDER_EMAIL || fallbackSender.email;
  return Boolean(apiKey && senderEmail);
}

export function hasMailConfig() {
  return hasBrevoConfig() || hasSmtpConfig();
}

function buildTransportOptions() {
  const { host, port, secure, user, pass } = getSmtpConfig();
  const connectionTimeout = parseNumber(process.env.SMTP_CONNECTION_TIMEOUT_MS, 20_000);
  const greetingTimeout = parseNumber(process.env.SMTP_GREETING_TIMEOUT_MS, 20_000);
  const socketTimeout = parseNumber(process.env.SMTP_SOCKET_TIMEOUT_MS, 20_000);
  const requireTLS = parseBool(process.env.SMTP_REQUIRE_TLS, false);
  const ignoreTLS = parseBool(process.env.SMTP_IGNORE_TLS, false);
  const tlsRejectUnauthorized = parseBool(process.env.SMTP_TLS_REJECT_UNAUTHORIZED, true);
  return {
    host,
    port,
    secure,
    auth: { user, pass },
    connectionTimeout,
    greetingTimeout,
    socketTimeout,
    requireTLS,
    ignoreTLS,
    tls: { rejectUnauthorized: tlsRejectUnauthorized }
  } as SMTPTransport.Options;
}

function createTransporter() {
  const transportOptions: any = buildTransportOptions();
  return nodemailer.createTransport(transportOptions);
}

function runSmtpSelfTestOnce() {
  if (globalForMailer.smtpSelfTestStarted) return;
  globalForMailer.smtpSelfTestStarted = true;

  if (!hasSmtpConfig()) {
    console.warn("[smtp] self-test skipped: missing SMTP config");
    return;
  }

  const transporter = createTransporter();
  transporter
    .verify()
    .then(() => {
      console.info("[smtp] self-test ok");
    })
    .catch((error) => {
      console.error("[smtp] self-test failed", error);
    });
}

if (String(process.env.SMTP_SELFTEST || "").toLowerCase() === "true") {
  runSmtpSelfTestOnce();
}

function shouldUseBrevo() {
  return Boolean(process.env.BREVO_API_KEY);
}

function getBrevoSender() {
  const parsedFallback = parseFromAddress(process.env.SMTP_FROM);
  const email = process.env.BREVO_SENDER_EMAIL || parsedFallback.email;
  const name =
    process.env.BREVO_SENDER_NAME ||
    parsedFallback.name ||
    "Polish Vocab Studio";
  if (!email) {
    throw new Error("Missing Brevo sender email");
  }
  return { name, email };
}

function getBrevoInboxEmail() {
  return process.env.BREVO_INBOX_EMAIL || getBrevoSender().email;
}

async function sendBrevoEmail({
  to,
  subject,
  html,
  replyTo
}: {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) throw new Error("Missing Brevo API key");

  const sender = getBrevoSender();
  const payload: Record<string, unknown> = {
    sender,
    to: [{ email: to }],
    subject,
    htmlContent: html
  };

  if (replyTo) {
    payload.replyTo = { email: replyTo };
  }

  if (String(process.env.BREVO_SANDBOX || "").toLowerCase() === "true") {
    payload.headers = { "X-Sib-Sandbox": "drop" };
  }

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "content-type": "application/json",
      accept: "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const details = await response.text().catch(() => "");
    throw new Error(`Brevo send failed: ${response.status} ${details}`.trim());
  }
}

export async function sendVerificationEmail(to: string, code: string) {
  if (shouldUseBrevo()) {
    const subject = "Polish Vocab Studio — підтвердження пошти / Email verification";
    const preheader = "Ваш код підтвердження / Your verification code";
    const html = `
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${preheader}</div>
    <div style="background:#f6ede3;padding:32px 18px;font-family:'Segoe UI',Arial,sans-serif;color:#2b2118;line-height:1.6">
      <div style="max-width:560px;margin:0 auto;background:#fff7ef;border:1px solid #eadbcc;border-radius:18px;padding:24px">
        <h2 style="margin:0 0 8px;font-size:20px">Polish Vocab Studio</h2>
        <p style="margin:0 0 16px;font-size:14px;color:#6b5a4a">Підтвердження email · Email verification</p>
        <p style="margin:0 0 10px">Ваш код підтвердження:</p>
        <p style="margin:0 0 10px">Your verification code:</p>
        <div style="font-size:28px;font-weight:700;letter-spacing:6px;margin:12px 0;color:#2b2118">${code}</div>
        <p style="margin:0 0 6px;font-size:13px;color:#6b5a4a">Код дійсний 15 хвилин.</p>
        <p style="margin:0 0 18px;font-size:13px;color:#6b5a4a">The code is valid for 15 minutes.</p>
        <div style="height:1px;background:#eadbcc;margin:18px 0"></div>
        <p style="margin:0;font-size:12px;color:#7a6a5a">Якщо це були не ви — просто ігноруйте цей лист.</p>
        <p style="margin:0;font-size:12px;color:#7a6a5a">If this wasn't you, you can ignore this email.</p>
      </div>
    </div>
  `;

    try {
      await sendBrevoEmail({ to, subject, html });
      return;
    } catch (error) {
      console.error("[smtp] verification email failed", error);
      throw error;
    }
  }

  const { from } = getSmtpConfig();
  const transporter = createTransporter();

  const subject = "Polish Vocab Studio — підтвердження пошти / Email verification";
  const preheader = "Ваш код підтвердження / Your verification code";
  const html = `
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${preheader}</div>
    <div style="background:#f6ede3;padding:32px 18px;font-family:'Segoe UI',Arial,sans-serif;color:#2b2118;line-height:1.6">
      <div style="max-width:560px;margin:0 auto;background:#fff7ef;border:1px solid #eadbcc;border-radius:18px;padding:24px">
        <h2 style="margin:0 0 8px;font-size:20px">Polish Vocab Studio</h2>
        <p style="margin:0 0 16px;font-size:14px;color:#6b5a4a">Підтвердження email · Email verification</p>
        <p style="margin:0 0 10px">Ваш код підтвердження:</p>
        <p style="margin:0 0 10px">Your verification code:</p>
        <div style="font-size:28px;font-weight:700;letter-spacing:6px;margin:12px 0;color:#2b2118">${code}</div>
        <p style="margin:0 0 6px;font-size:13px;color:#6b5a4a">Код дійсний 15 хвилин.</p>
        <p style="margin:0 0 18px;font-size:13px;color:#6b5a4a">The code is valid for 15 minutes.</p>
        <div style="height:1px;background:#eadbcc;margin:18px 0"></div>
        <p style="margin:0;font-size:12px;color:#7a6a5a">Якщо це були не ви — просто ігноруйте цей лист.</p>
        <p style="margin:0;font-size:12px;color:#7a6a5a">If this wasn't you, you can ignore this email.</p>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({ from, to, subject, html });
  } catch (error) {
    console.error("[smtp] verification email failed", error);
    throw error;
  }
}

export async function sendPasswordResetEmail(to: string, code: string) {
  if (shouldUseBrevo()) {
    const subject = "Polish Vocab Studio — зміна пароля / Password reset";
    const preheader = "Код для зміни пароля / Password reset code";
    const html = `
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${preheader}</div>
    <div style="background:#f6ede3;padding:32px 18px;font-family:'Segoe UI',Arial,sans-serif;color:#2b2118;line-height:1.6">
      <div style="max-width:560px;margin:0 auto;background:#fff7ef;border:1px solid #eadbcc;border-radius:18px;padding:24px">
        <h2 style="margin:0 0 8px;font-size:20px">Polish Vocab Studio</h2>
        <p style="margin:0 0 16px;font-size:14px;color:#6b5a4a">Зміна пароля · Password reset</p>
        <p style="margin:0 0 10px">Ваш код для зміни пароля:</p>
        <p style="margin:0 0 10px">Your password reset code:</p>
        <div style="font-size:28px;font-weight:700;letter-spacing:6px;margin:12px 0;color:#2b2118">${code}</div>
        <p style="margin:0 0 6px;font-size:13px;color:#6b5a4a">Код дійсний 15 хвилин.</p>
        <p style="margin:0 0 18px;font-size:13px;color:#6b5a4a">The code is valid for 15 minutes.</p>
        <div style="height:1px;background:#eadbcc;margin:18px 0"></div>
        <p style="margin:0;font-size:12px;color:#7a6a5a">Якщо ви не запитували зміну пароля — просто ігноруйте цей лист.</p>
        <p style="margin:0;font-size:12px;color:#7a6a5a">If you didn't request a password change, ignore this email.</p>
      </div>
    </div>
  `;

    try {
      await sendBrevoEmail({ to, subject, html });
      return;
    } catch (error) {
      console.error("[smtp] password reset email failed", error);
      throw error;
    }
  }

  const { from } = getSmtpConfig();
  const transporter = createTransporter();

  const subject = "Polish Vocab Studio — зміна пароля / Password reset";
  const preheader = "Код для зміни пароля / Password reset code";
  const html = `
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${preheader}</div>
    <div style="background:#f6ede3;padding:32px 18px;font-family:'Segoe UI',Arial,sans-serif;color:#2b2118;line-height:1.6">
      <div style="max-width:560px;margin:0 auto;background:#fff7ef;border:1px solid #eadbcc;border-radius:18px;padding:24px">
        <h2 style="margin:0 0 8px;font-size:20px">Polish Vocab Studio</h2>
        <p style="margin:0 0 16px;font-size:14px;color:#6b5a4a">Зміна пароля · Password reset</p>
        <p style="margin:0 0 10px">Ваш код для зміни пароля:</p>
        <p style="margin:0 0 10px">Your password reset code:</p>
        <div style="font-size:28px;font-weight:700;letter-spacing:6px;margin:12px 0;color:#2b2118">${code}</div>
        <p style="margin:0 0 6px;font-size:13px;color:#6b5a4a">Код дійсний 15 хвилин.</p>
        <p style="margin:0 0 18px;font-size:13px;color:#6b5a4a">The code is valid for 15 minutes.</p>
        <div style="height:1px;background:#eadbcc;margin:18px 0"></div>
        <p style="margin:0;font-size:12px;color:#7a6a5a">Якщо ви не запитували зміну пароля — просто ігноруйте цей лист.</p>
        <p style="margin:0;font-size:12px;color:#7a6a5a">If you didn't request a password change, ignore this email.</p>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({ from, to, subject, html });
  } catch (error) {
    console.error("[smtp] password reset email failed", error);
    throw error;
  }
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
  if (shouldUseBrevo()) {
    const mailSubject = subject?.trim()
      ? `Feedback: ${subject.trim()}`
      : "Feedback from Polish Vocab Studio";
    const html = `
    <div style="background:#f6ede3;padding:28px 18px;font-family:'Segoe UI',Arial,sans-serif;color:#2b2118;line-height:1.6">
      <div style="max-width:640px;margin:0 auto;background:#fff7ef;border:1px solid #e7d7c8;border-radius:18px;padding:20px">
        <h2 style="margin:0 0 12px;font-size:20px">Polish Vocab Studio — Feedback</h2>
        <p style="margin:0 0 8px"><strong>From / Від:</strong> ${fromName} (${fromEmail})</p>
        <p style="margin:0 0 8px"><strong>Subject / Тема:</strong> ${subject?.trim() || "—"}</p>
        <div style="margin-top:12px;padding:14px;background:#fff;border-radius:12px;border:1px solid #eadbcc;white-space:pre-wrap">
          ${message}
        </div>
      </div>
    </div>
  `;

    try {
      await sendBrevoEmail({
        to: getBrevoInboxEmail(),
        subject: mailSubject,
        html,
        replyTo: fromEmail
      });
      return;
    } catch (error) {
      console.error("[smtp] feedback email failed", error);
      throw error;
    }
  }

  const { user, from } = getSmtpConfig();
  const transporter = createTransporter();

  const mailSubject = subject?.trim()
    ? `Feedback: ${subject.trim()}`
    : "Feedback from Polish Vocab Studio";
  const html = `
    <div style="background:#f6ede3;padding:28px 18px;font-family:'Segoe UI',Arial,sans-serif;color:#2b2118;line-height:1.6">
      <div style="max-width:640px;margin:0 auto;background:#fff7ef;border:1px solid #e7d7c8;border-radius:18px;padding:20px">
        <h2 style="margin:0 0 12px;font-size:20px">Polish Vocab Studio — Feedback</h2>
        <p style="margin:0 0 8px"><strong>From / Від:</strong> ${fromName} (${fromEmail})</p>
        <p style="margin:0 0 8px"><strong>Subject / Тема:</strong> ${subject?.trim() || "—"}</p>
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
  }).catch((error) => {
    console.error("[smtp] feedback email failed", error);
    throw error;
  });
}
