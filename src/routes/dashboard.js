import { Router } from "express";
import { pool } from "../db/client.js";
import { requireAuth } from "../middleware/auth.js";
import { requireSubscription } from "../utils/access.js";
export function dashboardRouter(secret){
  const r=Router(); r.use(requireAuth(secret));
  r.get("/",async(req,res)=>{
    const [bots,risk,audit,sub,user]=await Promise.all([
      pool.query("SELECT * FROM bot_instances WHERE user_id=$1 ORDER BY created_at DESC",[req.user.sub]),
      pool.query("SELECT * FROM risk_profiles WHERE user_id=$1",[req.user.sub]),
      pool.query("SELECT event_type,created_at FROM audit_logs WHERE user_id=$1 ORDER BY created_at DESC LIMIT 20",[req.user.sub]),
      pool.query("SELECT plan_code,status,ends_at FROM subscriptions WHERE user_id=$1 AND status='active' AND (ends_at IS NULL OR ends_at > now()) ORDER BY ends_at DESC LIMIT 1",[req.user.sub]),
      pool.query("SELECT id,email,display_name,role,email_verified,phone_verified,theme FROM users WHERE id=$1",[req.user.sub])
    ]);
    res.json({bots:bots.rows,risk:risk.rows[0]||null,audit:audit.rows,subscription:sub.rows[0]||null,user:user.rows[0]||null});
  });
  r.post("/bots",requireSubscription(),async(req,res)=>{
    const {strategyCode,symbol="XAUUSD",timeframe="M15",templateCode=""}=req.body||{};
    const code=String(strategyCode||"").trim(); if(!code)return res.status(400).json({error:"Strategy required"});
    const count=Number((await pool.query("SELECT COUNT(*)::int AS n FROM bot_instances WHERE user_id=$1",[req.user.sub])).rows[0].n);
    if(count>=req.subscription.plan.bots)return res.status(403).json({error:"Plan bot capacity reached"});
    const b=(await pool.query("INSERT INTO bot_instances(user_id,strategy_code,symbol,timeframe,template_code) VALUES($1,$2,$3,$4,$5) RETURNING *",[req.user.sub,code,String(symbol),String(timeframe),String(templateCode||"")])).rows[0];
    res.status(201).json(b);
  });
  r.patch("/risk",requireSubscription(),async(req,res)=>{
    const current=(await pool.query("SELECT * FROM risk_profiles WHERE user_id=$1",[req.user.sub])).rows[0];
    const riskPerTrade=Number(req.body?.riskPerTrade??current?.risk_per_trade??1);
    const daily=Number(req.body?.dailyDrawdown??current?.daily_drawdown??5);
    const total=Number(req.body?.totalDrawdown??current?.total_drawdown??10);
    const maxOpen=Math.max(1,Math.min(100,Number(req.body?.maxOpenPositions??current?.max_open_positions??3)));
    const kill=Boolean(req.body?.killSwitch??current?.kill_switch??false);
    if(riskPerTrade<=0||riskPerTrade>10||daily<=0||daily>100||total<=0||total>100)return res.status(400).json({error:"Invalid risk limits"});
    const row=(await pool.query("INSERT INTO risk_profiles(user_id,risk_per_trade,daily_drawdown,total_drawdown,max_open_positions,kill_switch) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT(user_id) DO UPDATE SET risk_per_trade=EXCLUDED.risk_per_trade,daily_drawdown=EXCLUDED.daily_drawdown,total_drawdown=EXCLUDED.total_drawdown,max_open_positions=EXCLUDED.max_open_positions,kill_switch=EXCLUDED.kill_switch,updated_at=now() RETURNING *",[req.user.sub,riskPerTrade,daily,total,maxOpen,kill])).rows[0];
    res.json({risk:row});
  });
  return r;
}