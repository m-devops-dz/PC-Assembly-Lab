/* ---------------- fan cables: pick the header, the plug goes on by itself ----------------
   CPU fan (step fanCable) and case fan (step caseFan), build mode only: the plug waits in the air, a number badge
   floats over each fan header (1 CPU_FAN1, 2 SYS_FAN1) and a panel at the bottom of the view asks which one.
   Wrong: a mistake, a red flash, and that choice is struck out. Right: the plug flies over and seats itself.
   Clicking a header on the board picks it too (input.js, part "fanHdr"). Text fp_*. */
const fanAskEl=document.getElementById("fanAsk");
let fanAsk=null;   // {c: the cable, wrong: Set of header indexes already tried, msg: error text}
const fanBadges=HEADERS.map((h,i)=>{ const b=numBadge(); b.material.map=numBadgeTex(i+1); return b; });   // hints.js
function startFanAsk(c){
  spawnCable(c); S.held=null; updateTools();                               // the plug shows, but it isn't dragged any more
  fanAsk={c,wrong:new Set(),msg:""}; fanAskEl.hidden=false; renderFanAsk();
}
function closeFanAsk(){ fanAsk=null; fanAskEl.hidden=true; fanBadges.forEach(b=>b.visible=false); }
function renderFanAsk(){
  if(!fanAsk) return;
  fanAskEl.querySelector(".fan-q").textContent=t(fanAsk.c.id==="fan"?"fp_qCpu":"fp_qCase");
  const row=fanAskEl.querySelector(".fan-row"); row.innerHTML="";
  HEADERS.forEach((h,i)=>{ const b=document.createElement("button"); b.className="quiz-choice";
    b.innerHTML=`<b>${i+1}</b><span></span>`; b.lastChild.textContent=h.name;
    if(fanAsk.wrong.has(i)){ b.classList.add("wrong"); b.disabled=true; }
    b.onclick=()=>pickFanHeader(i); row.appendChild(b); });
  const m=fanAskEl.querySelector(".quiz-msg"); m.textContent=fanAsk.msg; m.className="quiz-msg"+(fanAsk.msg?" err":"");
}
function pickFanHeader(i){
  if(!fanAsk||S.busy) return; startClock();
  const c=fanAsk.c, tg=c.tgts[i];
  if(!tg.ok){ if(fanAsk.wrong.has(i)) return; fanAsk.wrong.add(i); fanAsk.msg=t(tg.err,{s:tg.name}); mistake(); shakeRed(); renderFanAsk(); return; }
  const P=c.plug, a=P.position.clone(), r0=P.rotation.y, hov=c.parent.worldToLocal(V3(tg.x,tg.seatY+1.4,tg.z)), seat=c.parent.worldToLocal(V3(tg.x,tg.seatY,tg.z));
  closeFanAsk(); S.busy=true; updateTools();
  tween(900,k=>{ P.position.lerpVectors(a,hov,k); P.position.y+=Math.sin(k*Math.PI)*.8; P.rotation.y=r0+(tg.rot-r0)*k; drawCable(c); },()=>
    tween(500,k=>{ P.position.lerpVectors(hov,seat,k); drawCable(c); },()=>{
      S.busy=false; c.state="seated"; drawCable(c); if(c.id==="fan") S.fanOn=true; else S.caseFanOn=true;
      toast(t(c.okMsg,{s:tg.name}),"ok"); S.cable=null; setStep(S.step+1); },easeOut),easeOut);
}
// every frame: the number badges sit over their headers, the same size on screen at any zoom
function updateFanAsk(){
  const on=!!fanAsk&&!S.busy;
  fanBadges.forEach((b,i)=>{ b.visible=on; if(!on) return;
    const p=HEADERS[i].group.getWorldPosition(V3(0,0,0)); p.y+=.75; const s=camera.position.distanceTo(p)*.035;
    b.position.copy(p); b.scale.set(s,s,1); });
}
window.addEventListener("keydown",e=>{ if(!fanAsk||e.ctrlKey||e.target.tagName==="INPUT") return;
  const n=+e.key; if(n>=1&&n<=HEADERS.length){ e.preventDefault(); pickFanHeader(n-1); } });
