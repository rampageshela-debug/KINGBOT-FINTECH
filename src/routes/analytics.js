import { Router } from "express";
import { pool } from "../db/client.js";
import { requireAuth } from "../middleware/auth.js";
import { requireSubscription } from "../utils/access.js";
export function analyticsRouter(secret) {
  const r=Router(); r.use(requireAuth(secret), requireSubscription());
  r.get("/",async(req,res)=>{
    const [summary,bySymbol,recent]=await Promise.all([
      pool.query("SELECT COUNT(*)::int AS trades, COALESCE(SUM(CASE WHEN status='closed' THEN pnl ELSE 0 END),0)::numeric AS pnl, COALESCE(SUM(CASE WHEN status='closed' AND pnl>0 THEN 1 ELSE 0 END),0)::int AS wins, COALESCE(SUM(CASE WHEN status='closed' AND pnl<0 THEN 1 ELSE 0 END),0)::int AS losses, COALESCE(AVG(CASE WHEN status='closed' THEN pnl END),0)::numeric AS avg_pnl FROM trades WHERE user_id=$1",[req.user.sub]),
      pool.query("SELECT symbol,COUNT(*)::int AS trades,COALESCE(SUM(CASE WHEN status='closed' THEN pnl ELSE 0 END),0)::numeric AS pnl FROM trades WHERE user_id=$1 GROUP BY symbol ORDER BY pnl DESC",[req.user.sub]),
      pool.query("SELECT id,symbol,side,qty,entry_price,exit_price,pnl,status,opened_at,closed_at FROM trades WHERE user_id=$1 ORDER BY COALESCE(closed_at,opened_at) DESC LIMIT 50",[req.user.sub])
    ]);
    const s=summary.rows[0], total=s.wins+s.losses;
    res.json({summary:{...s,win_rate:total?Number((s.wins/total*100).toFixed(2)):0},bySymbol:bySymbol.rows,recent:recent.rows});
  });
  return r;
}
