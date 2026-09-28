export function normalizeCandles(candles){
 if(!Array.isArray(candles))return[];
 return candles.map(x=>({open:Number(x.open),high:Number(x.high),low:Number(x.low),close:Number(x.close),volume:Number(x.volume||0)})).filter(x=>Number.isFinite(x.close));
}
export function syntheticDevelopmentCandles(){return Array.from({length:80},(_,i)=>{const base=2650+i*.42+Math.sin(i/3)*1.7;return{open:base,high:base+2.2,low:base-2,close:base+(i%7)*.25-.6,volume:100+i*3}})}