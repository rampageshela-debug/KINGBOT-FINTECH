import{Router}from"express";import{syntheticDevelopmentCandles}from"../services/marketData.js";
export const router=Router();
router.get("/development/:symbol",(_req,res)=>res.json({mode:"development",candles:syntheticDevelopmentCandles()}));