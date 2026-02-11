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
  const { host, port, secure, user, pass, from } = getSmtpConfig();
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass }
  });

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
