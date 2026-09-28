import { Router } from "express";
import crypto from "node:crypto";
import { pool } from "../db/client.js";
import { requireAuth } from "../middleware/auth.js";
import { PLAN_LIST, getPlan } from "../config/plans.js";
import { activeSubscription } from "../utils/access.js";
export function subscriptionsRouter(secret) {
  const r = Router();
  r.use(requireAuth(secret));
  r.get("/", async (req,res) => res.json({ plans: PLAN_LIST, active: await activeSubscription(req.user.sub), requests: (await pool.query("SELECT id,plan_code,method,reference,amount_cents,status,created_at FROM payment_requests WHERE user_id=$1 ORDER BY created_at DESC LIMIT 20",[req.user.sub])).rows }));
  r.post("/payment-request", async (req,res) => {
    const plan=getPlan(req.body?.planCode), method=String(req.body?.method||"").toLowerCase(), reference=String(req.body?.reference||"").trim();
    if (!plan || !["mpesa","card","bank"].includes(method) || !reference) return res.status(400).json({error:"Valid plan, payment method and payment reference required"});
    const id=crypto.randomUUID();
    await pool.query("INSERT INTO payment_requests(id,user_id,plan_code,method,reference,amount_cents,status) VALUES($1,$2,$3,$4,$5,$6,'pending')",[id,req.user.sub,plan.code,method,reference,plan.monthlyUsd*100]);
    res.status(201).json({id,status:"pending",message:"Payment submitted for approval"});
  });
  return r;
}
