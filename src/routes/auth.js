import crypto from "node:crypto";
import { Router } from "express";
import { pool } from "../db/client.js";
import { audit } from "../utils/audit.js";
import { hashPassword, verifyPassword, signSession, readSession } from "../utils/crypto.js";
import { roleForEmail } from "../utils/roles.js";
import { makeCode, hashCode, verifyCode, sendEmailCode, sendPhoneCode, checkPhoneCode } from "../services/notifications.js";

const cleanPhone=(countryCode,phone)=> {
  const cc=String(countryCode||"").replace(/[^+0-9]/g,"");
  let n=String(phone||"").replace(/[^0-9]/g,"");
  if(n.startsWith("0")) n=n.slice(1);
  if(!cc||n.length<7||n.length>14)return null;
  return cc+n;
};

export function authRouter(secret){
  const r=Router();
  r.post("/register",async(req,res)=>{
    try{
      const {email,displayName,password,countryCode,phoneNumber}=req.body||{};
      if(typeof email!=="string"||typeof displayName!=="string"||typeof password!=="string"||password.length<12)return res.status(400).json({error:"Email, name and 12+ character password required"});
      const e=email.trim().toLowerCase(), phone=cleanPhone(countryCode,phoneNumber);
      if(!phone)return res.status(400).json({error:"Select a country code and enter a valid phone number"});
      if((await pool.query("SELECT 1 FROM users WHERE email=$1",[e])).rowCount)return res.status(409).json({error:"Account already exists"});
      const country=String(countryCode||"").replace(/[^+0-9]/g,"");
      const role=roleForEmail(e);
      const u=(await pool.query("INSERT INTO users(email,display_name,password_hash,phone_country,phone_number,role) VALUES($1,$2,$3,$4,$5,$6) RETURNING id,email,display_name,role,phone_country,phone_number,email_verified,phone_verified",[e,displayName.trim().slice(0,80),hashPassword(password),country,phone,role])).rows[0];
      await pool.query("INSERT INTO risk_profiles(user_id) VALUES($1) ON CONFLICT DO NOTHING",[u.id]);
      const emailCode=makeCode();
      await pool.query("INSERT INTO verification_challenges(id,user_id,channel,code_hash,provider,expires_at) VALUES($1,$2,'email',$3,'resend',$4)",[crypto.randomUUID(),u.id,hashCode(emailCode),new Date(Date.now()+10*60*1000)]);
      await sendEmailCode(e,emailCode);
      let phoneProvider="twilio_verify";
      try{await sendPhoneCode(phone);}catch(err){phoneProvider="unconfigured";if(process.env.NODE_ENV==="production")return res.status(503).json({error:err.message,user:{id:u.id,email:u.email}});}
      await pool.query("INSERT INTO verification_challenges(id,user_id,channel,provider,expires_at) VALUES($1,$2,'phone',$3,$4)",[crypto.randomUUID(),u.id,phoneProvider,new Date(Date.now()+10*60*1000)]);
      await audit(u.id,"USER_REGISTERED",{email_verified:false,phone_verified:false});
      res.cookie("bk_session",signSession(u,secret),{httpOnly:true,sameSite:"lax",secure:process.env.NODE_ENV==="production",maxAge:604800000});
      res.status(201).json({user:u,verificationRequired:true,developmentEmailCode:process.env.NODE_ENV==="production"?undefined:emailCode,developmentPhoneCode:process.env.NODE_ENV==="production"?undefined:"000000"});
    }catch(e){res.status(400).json({error:e.message||"Registration failed"});}
  });
  r.post("/login",async(req,res)=>{
    try{
      const {email,password}=req.body||{};
      const u=(await pool.query("SELECT id,email,display_name,password_hash,role,email_verified,phone_verified FROM users WHERE email=$1",[String(email||"").trim().toLowerCase()])).rows[0];
      if(!u||!verifyPassword(String(password||""),u.password_hash))return res.status(401).json({error:"Invalid credentials"});
      await audit(u.id,"USER_LOGIN");
      res.cookie("bk_session",signSession(u,secret),{httpOnly:true,sameSite:"lax",secure:process.env.NODE_ENV==="production",maxAge:604800000});
      res.json({user:{id:u.id,email:u.email,display_name:u.display_name,role:u.role,email_verified:u.email_verified,phone_verified:u.phone_verified}});
    }catch(e){res.status(500).json({error:e.message||"Login failed"});}
  });
  r.get("/verify/status",async(req,res)=>{
    const s=readSession(req.cookies.bk_session,secret); if(!s)return res.status(401).json({error:"Authentication required"});
    const u=(await pool.query("SELECT email,phone_number,email_verified,phone_verified FROM users WHERE id=$1",[s.sub])).rows[0];
    res.json({email:u?.email||s.email,phone:u?.phone_number||null,emailVerified:!!u?.email_verified,phoneVerified:!!u?.phone_verified});
  });
  r.post("/verify/email",async(req,res)=>{
    const s=readSession(req.cookies.bk_session,secret), code=String(req.body?.code||""); if(!s)return res.status(401).json({error:"Authentication required"});
    const c=(await pool.query("SELECT id,code_hash FROM verification_challenges WHERE user_id=$1 AND channel='email' AND consumed_at IS NULL AND expires_at>now() ORDER BY created_at DESC LIMIT 1",[s.sub])).rows[0];
    if(!c||!verifyCode(code,c.code_hash))return res.status(400).json({error:"Invalid or expired email code"});
    await pool.query("UPDATE verification_challenges SET consumed_at=now() WHERE id=$1",[c.id]); await pool.query("UPDATE users SET email_verified=true WHERE id=$1",[s.sub]); res.json({ok:true});
  });
  r.post("/verify/phone",async(req,res)=>{
    const s=readSession(req.cookies.bk_session,secret), code=String(req.body?.code||""); if(!s)return res.status(401).json({error:"Authentication required"});
    const u=(await pool.query("SELECT phone_number FROM users WHERE id=$1",[s.sub])).rows[0]; if(!u)return res.status(404).json({error:"User not found"});
    try{const ok=await checkPhoneCode(u.phone_number,code);if(!ok)return res.status(400).json({error:"Invalid or expired phone code"});await pool.query("UPDATE users SET phone_verified=true WHERE id=$1",[s.sub]);res.json({ok:true});}
    catch(e){res.status(503).json({error:e.message});}
  });
  r.post("/resend",async(req,res)=>{
    const s=readSession(req.cookies.bk_session,secret); if(!s)return res.status(401).json({error:"Authentication required"});
    const u=(await pool.query("SELECT email,phone_number,email_verified,phone_verified FROM users WHERE id=$1",[s.sub])).rows[0];if(!u)return res.status(404).json({error:"User not found"});
    const result={email:null,phone:null};
    if(!u.email_verified){const code=makeCode();await pool.query("INSERT INTO verification_challenges(id,user_id,channel,code_hash,provider,expires_at) VALUES($1,$2,'email',$3,'resend',$4)",[crypto.randomUUID(),s.sub,hashCode(code),new Date(Date.now()+10*60*1000)]);await sendEmailCode(u.email,code);result.email=process.env.NODE_ENV==="production"?"sent":code;}
    if(!u.phone_verified){try{await sendPhoneCode(u.phone_number);result.phone="sent";}catch(e){result.phone="unconfigured";}}
    res.json(result);
  });
  r.post("/logout",(req,res)=>{res.clearCookie("bk_session");res.json({ok:true});});
  r.get("/me",async(req,res)=>{const s=readSession(req.cookies.bk_session,secret);if(!s)return res.json({user:null});const u=(await pool.query("SELECT id,email,display_name,role,email_verified,phone_verified,theme,avatar_url FROM users WHERE id=$1",[s.sub])).rows[0];res.json({user:u||null});});
  return r;
}
