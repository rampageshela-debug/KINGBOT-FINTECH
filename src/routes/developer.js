import { Router } from "express";
import { pool } from "../db/client.js";
import { requireRole } from "../utils/roles.js";
import { geminiReady } from "../services/gemini.js";
export function developerRouter(secret) {
  const r=Router(); r.use(requireRole(secret,["developer"]));
  r.get("/overview",async(_req,res)=>{
    const tables=["users","subscriptions","payment_requests","account_connections","bot_instances","trades","support_tickets","audit_logs"];
    const counts={}; for(const t of tables) counts[t]=Number((await pool.query("SELECT COUNT(*)::int AS n FROM "+t)).rows[0].n);
    const settings=Object.fromEntries((await pool.query("SELECT key,value FROM system_settings ORDER BY key")).rows.map(x=>[x.key,x.value]));
    res.json({version:"2.1.0",gemini:{configured:geminiReady(),model:process.env.GEMINI_MODEL||"gemini-3.8-flash"},tradingEnabled:process.env.TRADING_ENABLED==="true",nodeEnv:process.env.NODE_ENV,counts,settings,adminEmails:String(process.env.ADMIN_EMAILS||"").split(",").map(x=>x.trim()).filter(Boolean).map(x=>"configured"),developerEmails:String(process.env.DEVELOPER_EMAILS||"").split(",").map(x=>x.trim()).filter(Boolean).map(x=>"configured")});
  });
  r.put("/settings/:key",async(req,res)=>{
    const allowed=["maintenance_mode","default_theme","support_banner","ai_agent_mode","market_banner"];
    if(!allowed.includes(req.params.key))return res.status(403).json({error:"Setting not writable"});
    const value=req.body?.value;
    await pool.query("INSERT INTO system_settings(key,value,updated_at) VALUES($1,$2,now()) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value,updated_at=now()",[req.params.key,JSON.stringify(value)]);
    res.json({ok:true,key:req.params.key,value});
  });
  r.get("/audit",async(_req,res)=>res.json({events:(await pool.query("SELECT id,user_id,event_type,payload,created_at FROM audit_logs ORDER BY created_at DESC LIMIT 200")).rows}));
  return r;
}
