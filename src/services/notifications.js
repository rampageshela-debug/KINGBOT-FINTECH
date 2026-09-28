import crypto from "node:crypto";

export function makeCode() { return String(crypto.randomInt(100000, 1000000)); }
export function hashCode(code) { return crypto.createHash("sha256").update(String(code)).digest("hex"); }
export function verifyCode(code, hash) {
  return crypto.timingSafeEqual(Buffer.from(hashCode(code)), Buffer.from(String(hash)));
}

function parseSender(value) {
  const raw = String(value || "").trim();
  const match = raw.match(/^(.*?)\\s*<([^<>\\s]+@[^<>\\s]+)>$/);
  if (match) return { name: match[1].trim(), email: match[2].trim() };
  return { email: raw };
}

async function mailerSendEmail({ to, code }) {
  const key = process.env.MAILERSEND_API_TOKEN, from = process.env.MAILERSEND_FROM;
  if (!key || !from) throw new Error("MailerSend email provider is not configured");
  const sender = parseSender(from);
  const r = await fetch("https://api.mailersend.com/v1/email", {
    method: "POST",
    headers: {
      "Authorization": "Bearer " + key,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: sender,
      to: [{ email: to }],
      subject: "KINGBOT FINTECH verification code",
      text: "Your KINGBOT FINTECH verification code is " + code + ". This code expires in 10 minutes.",
      html: "<p>Your KINGBOT FINTECH verification code is <strong>" + code + "</strong>.</p><p>This code expires in 10 minutes.</p>"
    })
  });
  if (!r.ok) {
    let detail = "";
    try {
      const data = await r.json();
      detail = data?.message || "";
    } catch {}
    throw new Error("MailerSend email delivery failed" + (detail ? ": " + detail : ""));
  }
}

async function resendEmail({ to, code }) {
  const key = process.env.RESEND_API_KEY, from = process.env.RESEND_FROM;
  if (!key || !from) throw new Error("Resend email provider is not configured");
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": "Bearer " + key,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: "KINGBOT FINTECH verification code",
      html: "<p>Your KINGBOT FINTECH verification code is <strong>" + code + "</strong>.</p><p>This code expires in 10 minutes.</p>"
    })
  });
  if (!r.ok) throw new Error("Resend email delivery failed");
}

async function sendGridEmail({ to, code }) {
  const key = process.env.SENDGRID_API_KEY, from = process.env.SENDGRID_FROM;
  if (!key || !from) throw new Error("SendGrid email provider is not configured");
  const sender = parseSender(from);
  const r = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      "Authorization": "Bearer " + key,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: sender,
      subject: "KINGBOT FINTECH verification code",
      content: [{
        type: "text/html",
        value: "<p>Your KINGBOT FINTECH verification code is <strong>" + code + "</strong>.</p><p>This code expires in 10 minutes.</p>"
      }]
    })
  });
  if (!r.ok) throw new Error("SendGrid email delivery failed");
}

async function twilioVerify({ to, action = "start", code }) {
  const sid = process.env.TWILIO_ACCOUNT_SID, token = process.env.TWILIO_AUTH_TOKEN, service = process.env.TWILIO_VERIFY_SERVICE_SID;
  if (!sid || !token || !service) throw new Error("Twilio Verify provider is not configured");
  const auth = Buffer.from(sid + ":" + token).toString("base64");
  const endpoint = "https://verify.twilio.com/v2/Services/" + encodeURIComponent(service) + "/" + (action === "check" ? "VerificationCheck" : "Verifications");
  const body = action === "check"
    ? new URLSearchParams({ To: to, Code: code }).toString()
    : new URLSearchParams({ To: to, Channel: "sms" }).toString();
  const r = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Authorization": "Basic " + auth,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body
  });
  if (!r.ok) throw new Error("SMS verification provider failed");
  return r.json();
}

export async function sendEmailCode(to, code) {
  const hasMailerSend = !!(process.env.MAILERSEND_API_TOKEN && process.env.MAILERSEND_FROM);
  const hasResend = !!(process.env.RESEND_API_KEY && process.env.RESEND_FROM);
  const hasSendGrid = !!(process.env.SENDGRID_API_KEY && process.env.SENDGRID_FROM);

  if (process.env.NODE_ENV !== "production" && !hasMailerSend && !hasResend && !hasSendGrid) {
    console.log("[KINGBOT DEV] email verification", to, code);
    return;
  }

  if (hasMailerSend) return mailerSendEmail({ to, code });
  if (hasResend) return resendEmail({ to, code });
  if (hasSendGrid) return sendGridEmail({ to, code });

  throw new Error("Email provider is not configured. Configure MailerSend, Resend, or SendGrid.");
}

export async function sendPhoneCode(to) {
  if (process.env.NODE_ENV !== "production" && (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_VERIFY_SERVICE_SID)) {
    console.log("[KINGBOT DEV] phone verification configured without provider:", to);
    return { sid: "development" };
  }
  return twilioVerify({ to });
}

export async function checkPhoneCode(to, code) {
  if (process.env.NODE_ENV !== "production" && (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_VERIFY_SERVICE_SID)) {
    return String(code) === "000000";
  }
  const data = await twilioVerify({ to, action: "check", code });
  return data.status === "approved";
}
