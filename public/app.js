const strategies=[
 {id:"strategic",name:"KINGBOT",title:"STRATEGIC",type:"MULTI-STRATEGY",color:"#09aaff",img:"/assets/strategic.png",checks:["Multi-Strategy Trading","AI Market Analysis","Adaptive Execution","Consistent Results"],desc:"Multi-strategy adaptive execution engine."},
 {id:"flipper",name:"KINGBOT",title:"FLIPPER",type:"HIGH-SPEED FLIPPING",color:"#d83cff",img:"/assets/flipper.png",checks:["Quick Entry & Exit","High Frequency Trades","Maximum Opportunity","Precision Execution"],desc:"Short-duration momentum and rapid execution."},
 {id:"breakout",name:"KINGBOT",title:"BREAKOUT",type:"MOMENTUM",color:"#ffc400",img:"/assets/breakout.png",checks:["Trend Breakout Detection","Volatility Trading","Big Moves","Profitable Momentum"],desc:"Breakout and expansion regime engine."},
 {id:"smc",name:"KINGBOT",title:"SMC PRO",type:"SMART MONEY",color:"#00ed76",img:"/assets/smc-pro.png",checks:["Smart Money Concepts","Precision Entry","Profit Potential","Institutional Logic"],desc:"Structure, liquidity and order-flow evidence engine."},
 {id:"ladder",name:"KINGBOT",title:"LADDER FLIP V8",type:"LADDER SYSTEM",color:"#ff2442",img:"/assets/ladder-flip-v8.png",checks:["Ladder Entry System","Risk Control","Steady Growth","Compounding Logic"],desc:"Stage-based execution with defined risk controls."}
];
let selected=strategies[0],running=false,balance=10000,pnl=0;
const $=s=>document.querySelector(s);
const strategyGrid=$("#strategyGrid");
strategyGrid.innerHTML=strategies.map(s=>`<article class="strategy-card" data-id="${s.id}" style="--accent:${s.color}">
 <div class="strategy-image"><img src="${s.img}" alt="${s.title}" onerror="this.style.display='none'"></div>
 <div class="strategy-content"><h3>${s.name}<em>${s.title}</em></h3><div class="strategy-type">${s.type}</div>
 <div class="checks">${s.checks.map(x=>`<span>${x}</span>`).join("")}</div>
 <button class="launch">Launch Bot <b>→</b></button></div></article>`).join("");
document.querySelectorAll(".strategy-card").forEach(card=>card.addEventListener("click",e=>{
 const id=card.dataset.id; selected=strategies.find(x=>x.id===id)||selected;
 document.querySelectorAll(".strategy-card").forEach(x=>x.classList.remove("selected"));card.classList.add("selected");
 $("#selectedName").textContent=selected.name+" "+selected.title;$("#selectedDesc").textContent=selected.desc;$("#activeMode").textContent=selected.title;
 toast(selected.title+" selected");
}));
const botList=$("#botList");
botList.innerHTML=strategies.map(s=>`<div class="bot-row"><span>${s.name} ${s.title}</span><i>READY</i></div>`).join("");
document.querySelector(".strategy-card")?.classList.add("selected");
function toast(msg){const root=$("#toastRoot"),el=document.createElement("div");el.textContent=msg;el.style.cssText="position:fixed;right:20px;bottom:20px;z-index:100;padding:12px 16px;border:1px solid #08aaff;background:#061423;color:#dff6ff;border-radius:8px;box-shadow:0 10px 35px #000;font-size:12px";root.appendChild(el);setTimeout(()=>el.remove(),2600)}
function setEngine(on){running=on;$("#engineStatus").textContent=on?"RUNNING":"READY";$("#engineStatus").className=on?"green":"";$("#engineLog").textContent=on?"Engine active — monitoring "+selected.title+" conditions.":"Waiting for command center activation.";$("#startAll").textContent=on?"STOP BOT ENGINE":"START BOT ENGINE →";toast(on?"BOT ENGINE STARTED":"BOT ENGINE STOPPED")}
$("#startAll").addEventListener("click",()=>setEngine(!running));
document.querySelectorAll(".launch").forEach((btn,i)=>btn.addEventListener("click",e=>{e.stopPropagation();selected=strategies[i];setEngine(true);$("#selectedName").textContent=selected.name+" "+selected.title;$("#selectedDesc").textContent=selected.desc;$("#activeMode").textContent=selected.title;toast(selected.title+" launched")}));
setInterval(()=>{if(!running)return;const move=(Math.random()-.42)*18;pnl+=move;balance+=move;$("#balance").textContent="$"+balance.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});$("#dayPnl").textContent=(pnl>=0?"+":"")+"$"+pnl.toFixed(2)},3500);
$("#fullscreenBtn").addEventListener("click",()=>{if(!document.fullscreenElement)document.documentElement.requestFullscreen?.();else document.exitFullscreen?.()});
$("#connectBtn").addEventListener("click",()=>toast("Backend gateway ready for API integration"));
$("#themeBtn").addEventListener("click",()=>{document.body.classList.toggle("light");toast(document.body.classList.contains("light")?"Light display enabled":"Obsidian display enabled")});
document.querySelectorAll(".side-link,.topnav a").forEach(a=>a.addEventListener("click",()=>{document.querySelectorAll(".side-link").forEach(x=>x.classList.toggle("active",x.getAttribute("href")===a.getAttribute("href")));}));
const menu=document.createElement("button");menu.className="mobile-menu";menu.textContent="☰";menu.style.cssText="display:none";document.querySelector(".topbar").prepend(menu);
function mobile(){if(innerWidth<=900){menu.style.display="block";menu.onclick=()=>{$("#sidebar").classList.toggle("open");$("#overlay").classList.toggle("show")}}else{menu.style.display="none"}}
$("#mobileClose").onclick=()=>{$("#sidebar").classList.remove("open");$("#overlay").classList.remove("show")};$("#overlay").onclick=()=>{$("#sidebar").classList.remove("open");$("#overlay").classList.remove("show")};window.addEventListener("resize",mobile);mobile();
