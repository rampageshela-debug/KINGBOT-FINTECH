import { Router } from "express";
import crypto from "node:crypto";
import { pool } from "../db/client.js";
import { requireAuth } from "../middleware/auth.js";
import { requireVerified, requireSubscription } from "../utils/access.js";
export function accountsRouter(secret) {
  const r = Router();
  r.use(requireAuth(secret), requireVerified(), requireSubscription());
  r.get("/", async (req,res)=>res.json({accounts:(await pool.query("SELECT id,provider,label,status,external_account_id,created_at FROM account_connections WHERE user_id=$1 ORDER BY created_at DESC",[req.user.sub])).rows}));
  r.post("/", async (req,res)=>{
    const {provider,label,externalAccountId}=req.body||{};
    if(!provider||!label) return res.status(400).json({error:"Provider and account label required"});
    const id=crypto.randomUUID();
    await pool.query("INSERT INTO account_connections(id,user_id,provider,label,external_account_id,status,metadata) VALUES($1,$2,$3,$4,$5,'pending',$6)",[id,req.user.sub,String(provider),String(label),String(externalAccountId||""),JSON.stringify({integrationConfigured:false})]);
    res.status(201).json({id,status:"pending",message:"Connector registered. Broker verification is still required before execution."});
  });
  return r;
}
