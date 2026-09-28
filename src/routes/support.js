import { Router } from "express";
import crypto from "node:crypto";
import { pool } from "../db/client.js";
import { requireAuth } from "../middleware/auth.js";
export function supportRouter(secret) {
  const r=Router(); r.use(requireAuth(secret));
  r.get("/",async(req,res)=>res.json({tickets:(await pool.query("SELECT id,subject,message,status,created_at FROM support_tickets WHERE user_id=$1 ORDER BY created_at DESC",[req.user.sub])).rows}));
  r.post("/",async(req,res)=>{const {subject,message}=req.body||{};if(!subject||!message)return res.status(400).json({error:"Subject and message required"});const id=crypto.randomUUID();const t=(await pool.query("INSERT INTO support_tickets(id,user_id,subject,message,status) VALUES($1,$2,$3,$4,'open') RETURNING id,subject,message,status,created_at",[id,req.user.sub,String(subject),String(message)])).rows[0];res.status(201).json(t);});
  return r;
}
