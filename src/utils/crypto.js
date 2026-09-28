import crypto from "node:crypto";
export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  return salt + ":" + crypto.scryptSync(password, salt, 64).toString("hex");
}
export function verifyPassword(password, stored) {
  const [salt,digest] = String(stored || "").split(":");
  if (!salt || !digest) return false;
  const candidate = crypto.scryptSync(password,salt,64).toString("hex");
  return candidate.length === digest.length && crypto.timingSafeEqual(Buffer.from(candidate),Buffer.from(digest));
}
export function signSession(user,secret) {
  const body=Buffer.from(JSON.stringify({sub:user.id,email:user.email,name:user.display_name,exp:Date.now()+604800000})).toString("base64url");
  const mac=crypto.createHmac("sha256",secret).update(body).digest("base64url");
  return body+"."+mac;
}
export function readSession(token,secret) {
  try {
    const [body,mac]=String(token||"").split(".");
    const expected=crypto.createHmac("sha256",secret).update(body||"").digest("base64url");
    if(!mac || mac.length!==expected.length || !crypto.timingSafeEqual(Buffer.from(mac),Buffer.from(expected))) return null;
    const v=JSON.parse(Buffer.from(body,"base64url").toString());
    return v.exp>Date.now()?v:null;
  } catch { return null; }
}
