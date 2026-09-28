import express from "express";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { config } from "./config/env.js";
import { initDb } from "./db/init.js";
import { pool } from "./db/client.js";
import { router as health } from "./routes/health.js";
import { authRouter } from "./routes/auth.js";
import { strategiesRouter } from "./routes/strategies.js";
import { dashboardRouter } from "./routes/dashboard.js";
import { aiRouter } from "./routes/ai.js";
import { subscriptionsRouter } from "./routes/subscriptions.js";
import { accountsRouter } from "./routes/accounts.js";
import { analyticsRouter } from "./routes/analytics.js";
import { supportRouter } from "./routes/support.js";
import { settingsRouter } from "./routes/settings.js";
import { adminRouter } from "./routes/admin.js";
import { developerRouter } from "./routes/developer.js";
import { marketRouter } from "./routes/market.js";

await initDb();
const app=express();
app.use(helmet({contentSecurityPolicy:false,crossOriginEmbedderPolicy:false}));
app.use(express.json({limit:"256kb"}));
app.use(cookieParser());
app.use(express.static("public",{index:false}));

app.get("/",(_req,res)=>res.sendFile("index.html",{root:"public"}));
app.get("/health",(_req,res)=>res.redirect("/api/health"));

app.use("/api/health",health);
app.use("/api/auth",authRouter(config.sessionSecret));
app.use("/api/strategies",strategiesRouter(config.sessionSecret));
app.use("/api/dashboard",dashboardRouter(config.sessionSecret));
app.use("/api/ai",aiRouter(config.sessionSecret));
app.use("/api/subscriptions",subscriptionsRouter(config.sessionSecret));
app.use("/api/accounts",accountsRouter(config.sessionSecret));
app.use("/api/analytics",analyticsRouter(config.sessionSecret));
app.use("/api/support",supportRouter(config.sessionSecret));
app.use("/api/settings",settingsRouter(config.sessionSecret));
app.use("/api/admin",adminRouter(config.sessionSecret));
app.use("/api/developer",developerRouter(config.sessionSecret));
app.use("/api/market",marketRouter());

app.use((req,res)=>req.path.startsWith("/api/")?res.status(404).json({error:"Not found"}):res.sendFile("index.html",{root:"public"}));
app.listen(config.port,"0.0.0.0",()=>console.log("KINGBOT FINTECH "+process.env.npm_package_version+" on "+config.port));
process.on("SIGTERM",async()=>{await pool.end();process.exit(0)});
