import {signal,base} from "./common.js";
export function run(ctx){const b=base(ctx,"FLIPPER");if(b.direction)return b;const d=b.last.close-b.prev.close,side=Math.abs(d)>b.a*.6?(d>0?"BUY":"SELL"):"NO_TRADE";return signal({strategy:"FLIPPER",symbol:ctx.symbol,timeframe:ctx.timeframe,direction:side,confidence:.66,reasons:["MOMENTUM_BAR","ATR_FILTER"]})}
