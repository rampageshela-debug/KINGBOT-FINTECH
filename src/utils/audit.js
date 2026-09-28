import { pool } from "../db/client.js";
export async function audit(userId,eventType,payload={}) {
  await pool.query("INSERT INTO audit_logs(user_id,event_type,payload) VALUES($1,$2,$3)",[userId||null,eventType,payload]);
}
