const split = (value) => String(value || "").split(",").map(v => v.trim().toLowerCase()).filter(Boolean);
export function roleForEmail(email) {
  const e = String(email || "").trim().toLowerCase();
  if (split(process.env.DEVELOPER_EMAILS).includes(e)) return "developer";
  if (split(process.env.ADMIN_EMAILS).includes(e)) return "admin";
  return "user";
}
export function requireRole(secret, allowed) {
  const { readSession } = require("./crypto.js");
  return (req, res, next) => {
    const session = readSession(req.cookies?.bk_session, secret);
    if (!session) return res.status(401).json({ error: "Authentication required" });
    if (!allowed.includes(session.role)) return res.status(403).json({ error: "Restricted control area" });
    req.user = session;
    next();
  };
}
