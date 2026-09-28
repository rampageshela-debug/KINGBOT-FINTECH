export function env(name, fallback = undefined) {
  const value = process.env[name];
  return value !== undefined && value !== "" ? value : fallback;
}
export const config = {
  port: Number(env("PORT", "10000")),
  nodeEnv: env("NODE_ENV", "development"),
  databaseUrl: env("DATABASE_URL"),
  sessionSecret: env("SESSION_SECRET"),
  tradingEnabled: env("TRADING_ENABLED", "false") === "true",
  appOrigin: env("APP_ORIGIN", "http://localhost:10000")
};
if (!config.sessionSecret) throw new Error("SESSION_SECRET is required");
if (!config.databaseUrl && config.nodeEnv === "production") throw new Error("DATABASE_URL is required in production");
