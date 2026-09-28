import { pool } from "./client.js";
export async function initDb() {
  await pool.query("CREATE TABLE IF NOT EXISTS users(id UUID PRIMARY KEY DEFAULT gen_random_uuid(),email TEXT UNIQUE NOT NULL,display_name TEXT NOT NULL,password_hash TEXT NOT NULL,created_at TIMESTAMPTZ NOT NULL DEFAULT now())");
  await pool.query("CREATE TABLE IF NOT EXISTS risk_profiles(user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,risk_per_trade NUMERIC NOT NULL DEFAULT 1,daily_drawdown NUMERIC NOT NULL DEFAULT 5,total_drawdown NUMERIC NOT NULL DEFAULT 10,max_open_positions INT NOT NULL DEFAULT 3,kill_switch BOOLEAN NOT NULL DEFAULT false,updated_at TIMESTAMPTZ NOT NULL DEFAULT now())");
  await pool.query("CREATE TABLE IF NOT EXISTS bot_instances(id UUID PRIMARY KEY DEFAULT gen_random_uuid(),user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,strategy_code TEXT NOT NULL,symbol TEXT NOT NULL,timeframe TEXT NOT NULL,enabled BOOLEAN NOT NULL DEFAULT false,created_at TIMESTAMPTZ NOT NULL DEFAULT now())");
  await pool.query("CREATE TABLE IF NOT EXISTS audit_logs(id BIGSERIAL PRIMARY KEY,user_id UUID NULL REFERENCES users(id) ON DELETE SET NULL,event_type TEXT NOT NULL,payload JSONB NOT NULL DEFAULT '{}'::jsonb,created_at TIMESTAMPTZ NOT NULL DEFAULT now())");
}
