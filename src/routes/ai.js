import { Router } from "express";
import { pool } from "../db/client.js";
import { requireAuth } from "../middleware/auth.js";
import { requireSubscription } from "../utils/access.js";
import { askGemini, geminiReady } from "../services/gemini.js";
import { getPlan } from "../config/plans.js";
export function aiRouter(secret) {
  const r = Router();
  r.use(requireAuth(secret), requireSubscription());
  r.post("/chat", async (req, res) => {
    try {
      const { prompt, history = [] } = req.body || {};
      if (!String(prompt || "").trim()) return res.status(400).json({ error: "Prompt required" });
      const plan = req.subscription.plan || getPlan(req.subscription.plan_code);
      const used = Number((await pool.query("SELECT COUNT(*)::int AS n FROM audit_logs WHERE user_id=$1 AND event_type='AI_REQUESTED' AND created_at >= date_trunc('month', now())",[req.user.sub])).rows[0].n);
      if (used >= plan.aiMessages) return res.status(429).json({ error: "Monthly AI request allowance reached" });
      if (!geminiReady()) return res.status(503).json({ error: "Gemini is not configured yet. Add GEMINI_API_KEY on the server." });
      const answer = await askGemini({
        prompt,
        history,
        system: "You are KING AI Agent inside KINGBOT FINTECH. You are a risk-aware trading technology research agent. Use the user's prompt and conversation context. Discuss market structure, strategy design, analytics, broker connectivity, risk controls and platform operations. Never present simulated or unavailable data as live. Never promise profits. Never execute, authorize or simulate broker orders. When discussing a setup, label observations versus hypotheses and identify missing data."
      });
      await pool.query("INSERT INTO audit_logs(user_id,event_type,payload) VALUES($1,'AI_REQUESTED',$2)",[req.user.sub,JSON.stringify({model:answer.model})]);
      res.json({ ...answer, remaining: Math.max(0, plan.aiMessages - used - 1) });
    } catch (e) { res.status(500).json({ error: e.message || "AI request failed" }); }
  });
  r.get("/status", (_req,res)=>res.json({ configured: geminiReady(), model: process.env.GEMINI_MODEL || "gemini-3.8-flash" }));
  return r;
}
