import {signal,base} from "./common.js";
export function run(ctx){const b=base(ctx,"LADDER");if(b.direction)return b;const d=b.last.close-(b.cs.at(-5)?.close||b.prev.close),side=d>0?"BUY":d<0?"SELL":"NO_TRADE";return signal({strategy:"LADDER",symbol:ctx.symbol,timeframe:ctx.timeframe,direction:side,confidence:.61,reasons:["STAGED_ENTRY_CANDIDATE"]})}
