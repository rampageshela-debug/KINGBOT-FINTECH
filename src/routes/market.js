import { Router } from "express";
import { syntheticDevelopmentCandles } from "../services/marketData.js";
export const router = Router();
router.get("/development/:symbol", (_req,res)=>res.json({mode:"development",candles:syntheticDevelopmentCandles()}));
const symbols=["OANDA:XAUUSD","OANDA:EURUSD","OANDA:GBPUSD","OANDA:USDJPY","OANDA:USDCHF","OANDA:AUDUSD","OANDA:USDCAD","BINANCE:BTCUSDT","BINANCE:ETHUSDT","NASDAQ:NDX","TVC:USOIL","TVC:VIX","SP:SPX"];
router.get("/symbols",(_req,res)=>res.json({symbols}));
export function marketRouter(){return router;}
