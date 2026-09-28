import { Router } from "express";
import { pool } from "../db/client.js";
import { requireAuth } from "../middleware/auth.js";
export function settingsRouter(secret) {
  const r=Router(); r.use(requireAuth(secret));
  r.get("/",async(req,res)=>{const u=(await pool.query("SELECT id,email,display_name,phone_country,phone_number,email_verified,phone_verified,role,avatar_url,theme,created_at FROM users WHERE id=$1",[req.user.sub])).rows[0];res.json({user:u||null});});
  r.patch("/",async(req,res)=>{
    const {displayName,theme,avatarUrl}=req.body||{};
    const allowed=new Set(["obsidian","matrix","violet","arctic","ember"]);
    if(theme!==undefined&&!allowed.has(String(theme)))return res.status(400).json({error:"Invalid theme"});
    const u=(await pool.query("UPDATE users SET display_name=COALESCE($1,display_name),theme=COALESCE($2,theme),avatar_url=COALESCE($3,avatar_url) WHERE id=$4 RETURNING id,email,display_name,theme,avatar_url",[displayName===undefined?null:String(displayName).slice(0,80),theme===undefined?null:String(theme),avatarUrl===undefined?null:String(avatarUrl).slice(0,200000),req.user.sub])).rows[0];
    res.json({user:u});
  });
  return r;
}
