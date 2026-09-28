import {signal,base,sma} from "./common.js";
export function run(ctx){const b=base(ctx,"TREND");if(b.direction)return b;const m20=sma(b.cs.map(x=>x.close),20),m50=sma(b.cs.map(x=>x.close),50);const d=m20&&m50?(m20>m50?"BUY":m20<m50?"SELL":"NO_TRADE"):"NO_TRADE";return signal({strategy:"TREND",symbol:ctx.symbol,timeframe:ctx.timeframe,direction:d,confidence:.70,reasons:["MA_ALIGNMENT"]})}
