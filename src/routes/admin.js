import { Router } from "express";
import { pool } from "../db/client.js";
import { requireRole } from "../utils/roles.js";
import { activeSubscription } from "../utils/access.js";
export function adminRouter(secret) {
  const r=Router(); r.use(requireRole(secret,["admin"]));
  r.get("/overview",async(_req,res)=>{
    const [users,payments,tickets,subs,recent]=await Promise.all([
      pool.query("SELECT COUNT(*)::int AS n FROM users"),
      pool.query("SELECT COUNT(*)::int AS n FROM payment_requests WHERE status='pending'"),
      pool.query("SELECT COUNT(*)::int AS n FROM support_tickets WHERE status IN ('open','pending')"),
      pool.query("SELECT COUNT(*)::int AS n FROM subscriptions WHERE status='active' AND (ends_at IS NULL OR ends_at > now())"),
      pool.query("SELECT id,email,display_name,role,email_verified,phone_verified,created_at FROM users ORDER BY created_at DESC LIMIT 25")
    ]);
    res.json({counts:{users:users.rows[0].n,pendingPayments:payments.rows[0].n,openTickets:tickets.rows[0].n,activeSubscriptions:subs.rows[0].n},recentUsers:recent.rows});
  });
  r.get("/payments",async(_req,res)=>res.json({payments:(await pool.query("SELECT p.*,u.email,u.display_name FROM payment_requests p JOIN users u ON u.id=p.user_id ORDER BY p.created_at DESC LIMIT 100")).rows}));
  r.post("/payments/:id/approve",async(req,res)=>{
    const client=await pool.connect();
    try{
      await client.query("BEGIN");
      const p=(await client.query("SELECT * FROM payment_requests WHERE id=$1 FOR UPDATE",[req.params.id])).rows[0];
      if(!p) { await client.query("ROLLBACK"); return res.status(404).json({error:"Payment request not found"}); }
      if(p.status!=="pending") { await client.query("ROLLBACK"); return res.status(409).json({error:"Payment request already reviewed"}); }
      const end=(await client.query("SELECT GREATEST(COALESCE(MAX(ends_at),now()),now()) + interval '1 month' AS ends_at FROM subscriptions WHERE user_id=$1",[p.user_id])).rows[0].ends_at;
      await client.query("UPDATE subscriptions SET status='expired' WHERE user_id=$1 AND status='active' AND ends_at < now()",[p.user_id]);
      const subId=crypto.randomUUID();
      await client.query("INSERT INTO subscriptions(id,user_id,plan_code,status,provider,amount_cents,currency,starts_at,ends_at,approved_at,approved_by) VALUES($1,$2,$3,'active',$4,$5,'USD',now(),$6,now(),$7)",[subId,p.user_id,p.plan_code,p.method,p.amount_cents,end,req.user.sub]);
      await client.query("UPDATE payment_requests SET status='approved',reviewed_at=now(),reviewed_by=$1 WHERE id=$2",[req.user.sub,p.id]);
      await client.query("COMMIT"); res.json({ok:true,subscription:await activeSubscription(p.user_id)});
    }catch(e){await client.query("ROLLBACK");res.status(500).json({error:e.message||"Approval failed"});}finally{client.release();}
  });
  r.post("/payments/:id/reject",async(req,res)=>{const q=await pool.query("UPDATE payment_requests SET status='rejected',reviewed_at=now(),reviewed_by=$1 WHERE id=$2 AND status='pending' RETURNING id",[req.user.sub,req.params.id]);res.json({ok:!!q.rowCount});});
  r.get("/tickets",async(_req,res)=>res.json({tickets:(await pool.query("SELECT t.*,u.email,u.display_name FROM support_tickets t JOIN users u ON u.id=t.user_id ORDER BY t.created_at DESC LIMIT 100")).rows}));
  r.patch("/tickets/:id",async(req,res)=>{const status=String(req.body?.status||"");if(!["open","pending","resolved","closed"].includes(status))return res.status(400).json({error:"Invalid ticket status"});res.json({ok:(await pool.query("UPDATE support_tickets SET status=$1 WHERE id=$2",[status,req.params.id])).rowCount>0});});
  return r;
}
