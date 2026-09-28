import{Router}from"express";import{pool}from"../db/client.js";import{config}from"../config/env.js";
export const router=Router();
router.get("/",async(_req,res)=>{try{await pool.query("SELECT 1");res.json({ok:true,service:"KINGBOT FINTECH",database:"up",tradingEnabled:config.tradingEnabled,time:new Date().toISOString()})}catch{res.status(503).json({ok:false,database:"down"})}});