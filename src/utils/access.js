import { pool } from "../db/client.js";
import { getPlan } from "../config/plans.js";
export async function activeSubscription(userId) {
  const r = await pool.query(
    "SELECT * FROM subscriptions WHERE user_id=$1 AND status='active' AND (ends_at IS NULL OR ends_at > now()) ORDER BY ends_at DESC NULLS LAST LIMIT 1",
    [userId]
  );
  const row = r.rows[0] || null;
  return row ? { ...row, plan: getPlan(row.plan_code) } : null;
}
export function requireSubscription() {
  return async (req, res, next) => {
    try {
      const subscription = await activeSubscription(req.user.sub);
      if (!subscription) return res.status(402).json({ error: "Approved subscription required", code: "SUBSCRIPTION_REQUIRED" });
      req.subscription = subscription;
      next();
    } catch { res.status(500).json({ error: "Subscription check failed" }); }
  };
}
export function requireVerified() {
  return async (req, res, next) => {
    try {
      const u = (await pool.query("SELECT email_verified,phone_verified FROM users WHERE id=$1",[req.user.sub])).rows[0];
      if (!u?.email_verified || !u?.phone_verified) return res.status(403).json({ error: "Email and phone verification required", code: "VERIFICATION_REQUIRED" });
      next();
    } catch { res.status(500).json({ error: "Verification check failed" }); }
  };
}
