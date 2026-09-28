import crypto from "node:crypto";
export function makeCode() { return String(crypto.randomInt(100000, 1000000)); }
export function hashCode(code) { return crypto.createHash("sha256").update(String(code)).digest("hex"); }
export function verifyCode(code, hash) { return crypto.timingSafeEqual(Buffer.from(hashCode(code)), Buffer.from(String(hash))); }

async function resendEmail({ to, code }) {
  const key = process.env.RESEND_API_KEY, from = process.env.RESEND_FROM;
  if (!key || !from) throw new Error("Resend email provider is not configured");
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Authorization": "Bearer " + key, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [to], subject: "KINGBOT FINTECH verification code", html: "<p>Your KINGBOT FINTECH verification code is <strong>" + code + "</strong>.</p><p>This code expires in 10 minutes.</p>" })
  });
  if (!r.ok) throw new Error("Email delivery failed");
}

async function twilioVerify({ to, action = "start", code }) {
  const sid = process.env.TWILIO_ACCOUNT_SID, token = process.env.TWILIO_AUTH_TOKEN, service = process.env.TWILIO_VERIFY_SERVICE_SID;
  if (!sid || !token || !service) throw new Error("Twilio Verify provider is not configured");
  const auth = Buffer.from(sid + ":" + token).toString("base64");
  const endpoint = "https://verify.twilio.com/v2/Services/" + encodeURIComponent(service) + "/" + (action === "check" ? "VerificationCheck" : "Verifications");
  const body = action === "check"
    ? new URLSearchParams({ To: to, Code: code }).toString()
    : new URLSearchParams({ To: to, Channel: "sms" }).toString();
  const r = await fetch(endpoint, { method: "POST", headers: { "Authorization": "Basic " + auth, "Content-Type": "application/x-www-form-urlencoded" }, body });
  if (!r.ok) throw new Error("SMS verification provider failed");
  return r.json();
}

export async function sendEmailCode(to, code) {
  if (process.env.NODE_ENV !== "production" && (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM)) console.log("[KINGBOT DEV] email verification", to, code);
  else await resendEmail({ to, code });
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
