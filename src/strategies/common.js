export function signal(o){return {...o,timestamp:new Date().toISOString()}}
export function sma(values,n){if(values.length<n)return null;return values.slice(-n).reduce((a,b)=>a+b,0)/n}
export function atr(cs,n=14){if(cs.length<n+1)return null;const t=cs.slice(1).map((c,i)=>Math.max(c.high-c.low,Math.abs(c.high-cs[i].close),Math.abs(c.low-cs[i].close)));return sma(t,n)}
export function base(ctx,code){const cs=ctx.candles||[];if(cs.length<25)return signal({strategy:code,symbol:ctx.symbol,timeframe:ctx.timeframe,direction:"NO_TRADE",confidence:0,reasons:["INSUFFICIENT_DATA"]});const last=cs.at(-1),prev=cs.at(-2),a=atr(cs)||1;return {cs,last,prev,a,entry:last.close}}
