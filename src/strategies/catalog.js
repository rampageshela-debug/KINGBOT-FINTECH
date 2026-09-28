export const STRATEGIES=[
 ["SMC","KING SMC","Market structure and liquidity"],
 ["BREAKOUT","KING BREAKOUT","Range expansion and confirmation"],
 ["TREND","KING TREND","Directional continuation"],
 ["FLIPPER","KING FLIPPER","Short-duration momentum"],
 ["LADDER","KING LADDER","Stage-based entries"],
 ["LIQUIDITY","KING LIQUIDITY","Sweep and reclaim logic"],
 ["ORDERFLOW","KING ORDERFLOW","Volume confirmation"],
 ["MOMENTUM","KING MOMENTUM","Price acceleration"],
 ["MEAN_REVERSION","KING MEAN REVERSION","Deviation and reversion"],
 ["SESSION","KING SESSION","Session-aware logic"],
 ["VOLATILITY","KING VOLATILITY","Regime adaptation"],
 ["RANGE","KING RANGE","Boundary reaction"],
 ["AI_FUSION","KING AI FUSION","Evidence fusion across engines"]
];
export const strategyCodes=new Set(STRATEGIES.map(x=>x[0]));
