import { pool } from "./client.js";
export async function initDb() {
  await pool.query("CREATE EXTENSION IF NOT EXISTS pgcrypto");
  await pool.query("CREATE TABLE IF NOT EXISTS users(id UUID PRIMARY KEY DEFAULT gen_random_uuid(),email TEXT UNIQUE NOT NULL,display_name TEXT NOT NULL,password_hash TEXT NOT NULL,phone_country TEXT,phone_number TEXT,email_verified BOOLEAN NOT NULL DEFAULT false,phone_verified BOOLEAN NOT NULL DEFAULT false,role TEXT NOT NULL DEFAULT 'user',avatar_url TEXT,theme TEXT NOT NULL DEFAULT 'obsidian',created_at TIMESTAMPTZ NOT NULL DEFAULT now())");
  await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_country TEXT");
  await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number TEXT");
  await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT false");
  await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN NOT NULL DEFAULT false");
  await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user'");
  await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT");
  await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS theme TEXT NOT NULL DEFAULT 'obsidian'");
  await pool.query("CREATE TABLE IF NOT EXISTS risk_profiles(user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,risk_per_trade NUMERIC NOT NULL DEFAULT 1,daily_drawdown NUMERIC NOT NULL DEFAULT 5,total_drawdown NUMERIC NOT NULL DEFAULT 10,max_open_positions INT NOT NULL DEFAULT 3,kill_switch BOOLEAN NOT NULL DEFAULT false,updated_at TIMESTAMPTZ NOT NULL DEFAULT now())");
  await pool.query("CREATE TABLE IF NOT EXISTS bot_instances(id UUID PRIMARY KEY DEFAULT gen_random_uuid(),user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,strategy_code TEXT NOT NULL,symbol TEXT NOT NULL,timeframe TEXT NOT NULL,enabled BOOLEAN NOT NULL DEFAULT false,template_code TEXT,created_at TIMESTAMPTZ NOT NULL DEFAULT now())");
  await pool.query("ALTER TABLE bot_instances ADD COLUMN IF NOT EXISTS template_code TEXT");
  await pool.query("CREATE TABLE IF NOT EXISTS audit_logs(id BIGSERIAL PRIMARY KEY,user_id UUID NULL REFERENCES users(id) ON DELETE SET NULL,event_type TEXT NOT NULL,payload JSONB NOT NULL DEFAULT '{}'::jsonb,created_at TIMESTAMPTZ NOT NULL DEFAULT now())");
  await pool.query("CREATE TABLE IF NOT EXISTS verification_challenges(id UUID PRIMARY KEY,user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,channel TEXT NOT NULL,code_hash TEXT,provider TEXT,expires_at TIMESTAMPTZ NOT NULL,consumed_at TIMESTAMPTZ,created_at TIMESTAMPTZ NOT NULL DEFAULT now())");
  await pool.query("CREATE TABLE IF NOT EXISTS subscriptions(id UUID PRIMARY KEY,user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,plan_code TEXT NOT NULL,status TEXT NOT NULL,provider TEXT,amount_cents INT NOT NULL,currency TEXT NOT NULL DEFAULT 'USD',starts_at TIMESTAMPTZ,ends_at TIMESTAMPTZ,approved_at TIMESTAMPTZ,approved_by UUID REFERENCES users(id) ON DELETE SET NULL,created_at TIMESTAMPTZ NOT NULL DEFAULT now())");
  await pool.query("CREATE TABLE IF NOT EXISTS payment_requests(id UUID PRIMARY KEY,user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,plan_code TEXT NOT NULL,method TEXT NOT NULL,reference TEXT NOT NULL,amount_cents INT NOT NULL,status TEXT NOT NULL DEFAULT 'pending',reviewed_at TIMESTAMPTZ,reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,created_at TIMESTAMPTZ NOT NULL DEFAULT now())");
  await pool.query("CREATE TABLE IF NOT EXISTS account_connections(id UUID PRIMARY KEY,user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,provider TEXT NOT NULL,label TEXT NOT NULL,external_account_id TEXT,status TEXT NOT NULL DEFAULT 'pending',metadata JSONB NOT NULL DEFAULT '{}'::jsonb,created_at TIMESTAMPTZ NOT NULL DEFAULT now())");
  await pool.query("CREATE TABLE IF NOT EXISTS trades(id UUID PRIMARY KEY DEFAULT gen_random_uuid(),user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,account_id UUID REFERENCES account_connections(id) ON DELETE SET NULL,symbol TEXT NOT NULL,side TEXT NOT NULL,qty NUMERIC,entry_price NUMERIC,exit_price NUMERIC,pnl NUMERIC NOT NULL DEFAULT 0,status TEXT NOT NULL DEFAULT 'open',opened_at TIMESTAMPTZ NOT NULL DEFAULT now(),closed_at TIMESTAMPTZ)");
  await pool.query("CREATE TABLE IF NOT EXISTS support_tickets(id UUID PRIMARY KEY,user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,subject TEXT NOT NULL,message TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'open',created_at TIMESTAMPTZ NOT NULL DEFAULT now())");
  await pool.query("CREATE TABLE IF NOT EXISTS system_settings(key TEXT PRIMARY KEY,value JSONB NOT NULL,updated_at TIMESTAMPTZ NOT NULL DEFAULT now())");
  const admins=String(process.env.ADMIN_EMAILS||"").split(",").map(x=>x.trim().toLowerCase()).filter(Boolean);
  const devs=String(process.env.DEVELOPER_EMAILS||"").split(",").map(x=>x.trim().toLowerCase()).filter(Boolean);
  if(admins.length) await pool.query("UPDATE users SET role='admin' WHERE lower(email)=ANY($1::text[])",[admins]);
  if(devs.length) await pool.query("UPDATE users SET role='developer' WHERE lower(email)=ANY($1::text[])",[devs]);
}
