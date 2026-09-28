export function validateTrade({risk,signal,openPositions=0}){
 if(!risk)return{approved:false,reason:"RISK_PROFILE_MISSING"};
 if(risk.kill_switch)return{approved:false,reason:"KILL_SWITCH_ACTIVE"};
 if(openPositions>=Number(risk.max_open_positions))return{approved:false,reason:"MAX_OPEN_POSITIONS"};
 if(Number(risk.risk_per_trade)<=0)return{approved:false,reason:"INVALID_RISK"};
 if(signal.direction==="NO_TRADE")return{approved:false,reason:"NO_TRADE_SIGNAL"};
 return{approved:true,reason:"RISK_CHECK_PASSED",riskPerTrade:Number(risk.risk_per_trade)};
}