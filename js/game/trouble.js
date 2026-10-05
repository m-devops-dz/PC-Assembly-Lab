/* ---------------- troubleshooting mode ----------------
   A separate mode (header button; the page reloads into it). The PC starts fully built, with ONE fault:
   1 pick a case from the numbered list (TS_CASES)      2 press the case's power button and see the symptom
   3 pick checks from the list: the camera flies to the part, the user says "Looks OK" or "Found the problem"
   4 click the faulty part in 3D to fix it      5 press power again: it boots, and the panel explains the cause.
   Mistakes: calling a good part faulty, missing the faulty one, clicking the wrong part to fix. */
// done: solved case indexes, next: the case to open after the reload (both kept in sessionStorage by persist())
const TS={on:appMode==="trouble",phase:"pick",n:null,sym:null,fault:null,list:[],seen:{},cur:null,fixed:false,
  done:Array.isArray(saved.tsDone)?saved.tsDone:[],next:Number.isInteger(saved.tsNext)?saved.tsNext:null};

// the cases, in the order the list shows them: [symptom, fault]. Cases with the same symptom look the same until you check.
const TS_CASES=[["noPower","powerCord"],["noPower","psuSwitch"],["noPower","powerSw"],["noPower","atx24"],
  ["noDisplay","ram"],["noDisplay","cpu8"],["noDisplay","gpu8"],["cpuFan","cpuFanCable"],["caseFan","caseFanCable"],
  ["frontUsb","frontUsbCable"],["wrongClock","cmos"],["noDrive","sataPower"],["noDrive","sataData"]];
// each symptom's checklist: every cause it can have, plus a few that are never the cause
const TS_SYMPTOMS={
  noPower:["powerCord","psuSwitch","powerSw","atx24","ram"],
  noDisplay:["ram","cpu8","gpu8","atx24","powerSw"],
  cpuFan:["cpuFanCable","caseFanCable","cpu8","atx24"],
  caseFan:["caseFanCable","cpuFanCable","atx24","powerSw"],
  frontUsb:["frontUsbCable","sataData","atx24","powerSw"],
  wrongClock:["cmos","ram","atx24","sataData"],
  noDrive:["sataPower","sataData","cmos","atx24","gpu8"]
};
// what to look at once it boots (symptoms that get as far as the BIOS)
const TS_SEE={wrongClock:"ts_seeClock",noDrive:"ts_seeDrive",cpuFan:"ts_seeCpuFan",caseFan:"ts_seeCaseFan",frontUsb:"ts_seeUsb"};
// a seated plug, d cm back out of its port (d 0 = seated, the way seatConnNow leaves it)
function plugOut(c,P,port,d){ const w=portWorld(port); P.outer.position.copy(w.p).addScaledVector(w.out,-.3+d); drawConn(c); }
function plugSlide(c,P,port,from,to,done){ tween(500,k=>plugOut(c,P,port,from+(to-from)*k),done); }
const fpPinsAt=name=>{ const tg=CABLES.fp.targets().find(x=>x.name===name); return V3(tg.x,tg.seatY,tg.z); };
const ramInSlot=s=>rams.find(r=>r.yaw.visible&&Math.abs(r.yaw.position.x-SLOT_X[s])<.01);
// a header cable (cables.js): its seated spot, pulled up off it (d: offset from there), and plugged back on
const cableSeat=c=>{ const tg=c.targets().find(x=>x.ok); return {p:V3(tg.x,tg.seatY,tg.z),rot:tg.rot}; };
const cableAt=c=>(c.parent.updateMatrixWorld(true),c.parent.localToWorld(cableSeat(c).p));
function cableOff(c,d,tilt){ const s=cableSeat(c); c.plug.position.copy(s.p).add(d); c.plug.rotation.set(tilt,s.rot+.5,0); drawCable(c); }
function cableOn(c,done){ const s=cableSeat(c), P=c.plug, a=P.position.clone(), r=P.rotation.clone();
  tween(700,k=>{ P.position.lerpVectors(a,s.p,k); P.position.y+=Math.sin(k*Math.PI)*.8; P.rotation.set(r.x*(1-k),r.y+(s.rot-r.y)*k,0); drawCable(c); },done); }
/* the checks. at(): world point to look at, off: where the camera sits from there, hit(d): the part's userData,
   fault(): break it (instant), fix(done): repair it (animated). Checks that are never the cause have no fault/fix. */
const TS_CHECKS={
  psuSwitch:{at:()=>(psuG.updateMatrixWorld(true),psuG.localToWorld(PSU_SWITCH.clone())),off:V3(-11,4,6),hit:d=>d.part==="psuSwitch",
    fault:()=>setPsuSwitch(false,0), fix:done=>setPsuSwitch(true,350,done)},
  powerSw:{at:()=>fpPinsAt("PWR SW"),off:V3(5,10,6),hit:d=>d.part==="cable"&&d.cable==="fp",
    fault:()=>{ CABLES.fp.plug.position.copy(fpPinsAt("RST SW")); drawCable(CABLES.fp); },       // on the Reset SW pins, right next to Power SW
    fix:done=>{ const P=CABLES.fp.plug, a=P.position.clone(), b=fpPinsAt("PWR SW"); tween(700,k=>{ P.position.lerpVectors(a,b,k); P.position.y+=Math.sin(k*Math.PI)*.8; drawCable(CABLES.fp); },done); }},
  atx24:{at:()=>portWorld(mbAtx).p,off:V3(8,10,5),hit:d=>d.part==="conn"&&d.conn==="atx24",
    fault:()=>plugOut(CONN.atx24,CONN.atx24.a,mbAtx,.9), fix:done=>plugSlide(CONN.atx24,CONN.atx24.a,mbAtx,.9,0,done)},
  ram:{at:()=>boardRoot.localToWorld(V3(SLOT_X[GOOD[1]],1.5,SLOT_Z)),off:V3(8,10,8),hit:d=>d.part==="ram"||d.part==="slot",
    fault:()=>{ const r=ramInSlot(GOOD[1]); r.yaw.position.y=RAM_SEAT+.9; r.yaw.rotation.x=.07; setLatches(GOOD[1],true,1); },   // sits high and crooked, clips open
    fix:done=>{ const r=ramInSlot(GOOD[1]), y0=r.yaw.position.y, x0=r.yaw.rotation.x;
      tween(500,k=>{ r.yaw.position.y=y0+(RAM_SEAT-y0)*k; r.yaw.rotation.x=x0*(1-k); },()=>{ setLatches(GOOD[1],false,220); setTimeout(done,260); },easeOut); }},
  cpu8:{at:()=>portWorld(mbCpuPwr).p,off:V3(6,12,7),hit:d=>d.part==="conn"&&d.conn==="cpu8",
    fault:()=>{ const P=CONN.cpu8.a; TS.cpu8Seat={p:P.outer.position.clone(),q:P.outer.quaternion.clone()};
      layLoose(P,V3(-5.6,4.6,L.z-9.8),Math.PI/2,0); drawConn(CONN.cpu8); },                             // never plugged in: lying on the cooler
    fix:done=>{ const P=CONN.cpu8.a, p0=P.outer.position.clone(), q0=P.outer.quaternion.clone(), s=TS.cpu8Seat;
      tween(900,k=>{ P.outer.position.lerpVectors(p0,s.p,k); P.outer.position.y+=Math.sin(k*Math.PI)*2; P.outer.quaternion.slerpQuaternions(q0,s.q,k); drawConn(CONN.cpu8); },done); }},
  cmos:{at:()=>boardRoot.localToWorld(V3(BAT_POS.x,.5,BAT_POS.z)),off:V3(4,10,7),hit:d=>d.part==="battery",
    fault:()=>{}, reading:()=>t("ts_volts",{v:TS.fault==="cmos"&&!TS.fixed?"1.9":"3.0"}),               // a dead battery looks fine: measure it
    fix:done=>tsSwapBattery(done)},
  sataPower:{at:()=>portWorld(ssdPower).p,off:V3(-6,10,5),hit:d=>d.part==="conn"&&d.conn==="power",
    fault:()=>plugOut(CONN.power,CONN.power.a,ssdPower,1.4), fix:done=>plugSlide(CONN.power,CONN.power.a,ssdPower,1.4,0,done)},
  sataData:{at:()=>portWorld(ssdData).p,off:V3(-6,10,5),hit:d=>d.part==="conn"&&d.conn==="data",
    fault:()=>plugOut(CONN.data,CONN.data.a,ssdData,1.4), fix:done=>plugSlide(CONN.data,CONN.data.a,ssdData,1.4,0,done)},
  powerCord:{at:()=>portWorld(psuInlet).p,off:V3(-14,5,6),hit:d=>d.part==="conn"&&d.conn==="ac",
    fault:()=>plugOut(CONN.ac,CONN.ac.a,psuInlet,3), fix:done=>plugSlide(CONN.ac,CONN.ac.a,psuInlet,3,0,done)},
  gpu8:{at:()=>portWorld(gpuPwrPort).p,off:V3(4,10,8),hit:d=>d.part==="conn"&&d.conn==="gpu8",
    fault:()=>plugOut(CONN.gpu8,CONN.gpu8.a,gpuPwrPort,1.6), fix:done=>plugSlide(CONN.gpu8,CONN.gpu8.a,gpuPwrPort,1.6,0,done)},
  cpuFanCable:{at:()=>cableAt(CABLES.fan),off:V3(6,9,7),hit:d=>d.part==="cable"&&d.cable==="fan",
    fault:()=>{ cableOff(CABLES.fan,V3(.3,1.3,.5),.5); S.fanOn=false; }, fix:done=>cableOn(CABLES.fan,()=>{ S.fanOn=true; done(); })},
  caseFanCable:{at:()=>cableAt(CABLES.caseFan),off:V3(5,10,7),hit:d=>d.part==="cable"&&d.cable==="caseFan",
    fault:()=>{ cableOff(CABLES.caseFan,V3(-.6,1.4,.4),.5); S.caseFanOn=false; }, fix:done=>cableOn(CABLES.caseFan,()=>{ S.caseFanOn=true; done(); })},
  frontUsbCable:{at:()=>cableAt(CABLES.fusb),off:V3(8,10,6),hit:d=>d.part==="cable"&&d.cable==="fusb",
    fault:()=>cableOff(CABLES.fusb,V3(1.4,1.6,-1.2),.35), fix:done=>cableOn(CABLES.fusb,done)}
};
/* CMOS case: a battery-level badge floats over the coin cell. Low (red) while it's being checked or fixed; the fix takes
   the old cell out to the parts mat (it keeps its low badge) and a new one rises from the mat with a full badge and goes in. */
function batBadge(full){ const tex=canvasTex(320,128,(g,W,H)=>{ g.fillStyle="rgba(14,20,26,.88)"; roundRect(g,4,4,W-8,H-8,26); g.fill();
    const c=full?"#34c759":"#ff3b30"; g.strokeStyle=c; g.lineWidth=5; roundRect(g,4,4,W-8,H-8,26); g.stroke();
    g.strokeStyle="#f1f3f5"; g.lineWidth=8; roundRect(g,26,30,140,68,10); g.stroke(); g.fillStyle="#f1f3f5"; g.fillRect(166,50,12,28);   // cell outline + nub
    g.fillStyle=c; for(let i=0;i<(full?4:1);i++) g.fillRect(38+i*32,42,26,44);
    g.font="700 46px 'Barlow Semi Condensed', Arial"; g.textAlign="center"; g.textBaseline="middle"; g.fillText(full?"3.0V":"1.9V",246,66); });
  const sp=new T.Sprite(new T.SpriteMaterial({map:tex,depthTest:false,depthWrite:false,transparent:true,toneMapped:false,sizeAttenuation:false}));   // same size on screen, near or far
  sp.scale.set(.15,.06,1); sp.center.set(.5,0); sp.position.y=1.2; sp.renderOrder=14; sp.raycast=()=>{}; sp.visible=false; batG.add(sp); return sp; }
const batLow=batBadge(false), batFull=batBadge(true);
const BAT_OLD_AT=V3(30,DESK.y+.17,6), BAT_NEW_AT=V3(34.5,DESK.y+.17,6);   // spots on the parts mat
function tsSwapBattery(done){
  const cam=TS_CHECKS.cmos, look=()=>{ const p=cam.at(); focusPoint(p.clone().add(cam.off),p,1300); };
  boardRoot.updateMatrixWorld(true); TS.swap=true;
  const old=batG.clone(true); old.traverse(o=>{ o.raycast=()=>{}; }); batG.getWorldPosition(old.position); scene.add(old);   // the old cell, still wearing its low badge
  old.children.forEach(o=>{ if(o.isSprite) o.visible=o.material===batLow.material; });
  batG.visible=false;
  const s0=old.position.clone();
  tween(500,k=>{ old.position.y=s0.y+k*2.5; },()=>{                                         // out of the holder
    const a=old.position.clone(); focus("table",1300);
    tween(1300,k=>{ old.position.lerpVectors(a,BAT_OLD_AT,k); old.position.y+=Math.sin(k*Math.PI)*8; },()=>{   // over to the mat
      const lp=boardRoot.worldToLocal(BAT_NEW_AT.clone()); batG.position.copy(lp); batG.visible=true; batFull.visible=true;
      tween(600,k=>{ batG.position.y=lp.y+k*3; },()=>{                                     // the new cell rises, full badge on
        const b=batG.position.clone(), top=V3(BAT_POS.x,BAT_SEAT+2.5,BAT_POS.z); setTimeout(look,250);
        tween(1300,k=>{ batG.position.lerpVectors(b,top,k); batG.position.y+=Math.sin(k*Math.PI)*8; },()=>{
          tween(450,k=>{ batG.position.y=top.y+(BAT_SEAT-top.y)*k; },()=>{ old.children.forEach(o=>{ if(o.isSprite) o.visible=false; }); TS.swap=false;
            setTimeout(done,1200); setTimeout(()=>{ batFull.visible=false; },3400); },easeOut); },easeOut); },easeOut); },easeOut); },easeOut);
}
// every frame (loop.js): the low badge shows over the dead cell while it's being checked or replaced
function tsFrame(now){
  batLow.visible=TS.on&&TS.fault==="cmos"&&!TS.fixed&&!TS.swap&&(TS.cur==="cmos"||TS.phase==="fix");
  const bob=Math.sin(now/320)*.15; batLow.position.y=batFull.position.y=1.2+bob;
}
// the BIOS screen for the PC as it is now (fault still there or fixed); the USB stick is always in the front port
const biosCache={};
function tsBios(){ const f=TS.fixed?"":TS.fault;
  return biosCache[f]||(biosCache[f]=biosTex({reset:f==="cmos",noSata:f==="sataPower"||f==="sataData",cpuFan0:f==="cpuFanCable",sysFan0:f==="caseFanCable",usb:f==="frontUsbCable"?"none":"ok"})); }
const shuffle=a=>{ for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; };

// the whole build, done at once (like holding Ctrl+H through every step), stopping before "press the power button"
function tsBuildAll(){
  while(S.step<ST.powerOn){ const id=STEP_IDS[S.step]; finishStep[id](); S.held=id==="takeCpu"?"cpu":null; S.snap=null; S.cable=null; S.job=null; setStep(S.step+1); }
  tweens.length=0; caseG.position.y=0;                                     // drop the queued camera moves and the case's drop-in
  sideG.visible=false; panelScrews.forEach(g=>g.visible=false);            // side panel stays off for the whole case, so every part is in plain view
  const v=VIEWS.tsFront; camera.position.copy(viewPos(v.pos,v.tgt)); controls.target.set(...v.tgt); controls.update();
}
function tsStart(){ document.body.classList.add("ts-mode"); tsBuildAll(); usbStick.visible=true;
  const n=TS.next; TS.next=null; persist();
  if(n!==null&&TS_CASES[n]) tsPick(n); else renderTS(); }
// a case can only start on a freshly built PC, so switching cases reloads the page (TS.next says which one to open)
function tsGo(n){ TS.next=n; persist(); location.reload(); }
const tsLeft=()=>TS_CASES.map((c,i)=>i).filter(i=>!TS.done.includes(i));
function tsPick(n){
  if(n==="random"){ const l=tsLeft(); n=shuffle(l.length?l:TS_CASES.map((c,i)=>i))[0]; }
  TS.n=n; [TS.sym,TS.fault]=TS_CASES[n]; TS.list=shuffle([...TS_SYMPTOMS[TS.sym]]);
  TS_CHECKS[TS.fault].fault(); TS.phase="power"; S.start=performance.now(); S.end=0;
  focus("powerBtn",1000); renderTS(); toast(t("ts_pressPower"));
}
function tsPressAnim(done){ S.busy=true; tween(260,k=>{ powerBtn.position.x=CX1+.17-.12*Math.sin(k*Math.PI); },done); }
function tsPower(){
  if(S.busy||!["power","check","retry"].includes(TS.phase)) { if(TS.phase==="fix") toast(t("ts_fixIt")); return; }
  tsPressAnim(()=>{
    const bad=!TS.fixed;
    if(bad&&TS.sym==="noPower"){ S.busy=false; toast(t("ts_nothing"),"err"); tsToCheck(); return; }   // no fans, no lights, nothing
    powerUp(); const v=screenView(); focusPoint(v.pos,v.tgt,1200); showScreen(screenOff);
    if(bad&&TS.sym==="noDisplay"){                                          // fans spin, but the screen stays on "No signal"
      setTimeout(()=>{ focus("fansOn",1400); toast(t("ts_fansNoPic"),"err"); },3000); setTimeout(tsPowerOff,8000); return; }
    const fans=TS.sym==="cpuFan"||TS.sym==="caseFan";                     // then look in at the fans
    setTimeout(()=>showScreen(screenOn),1800);
    setTimeout(()=>{ showScreen(tsBios()); if(bad) toast(t(TS_SEE[TS.sym]),"err"); },3400);
    if(fans) setTimeout(()=>{ focus("fansOn",1400); toast(t(bad?"ts_seeFans":"ts_fansOk"),bad?"err":"ok"); },7500);
    if(bad) setTimeout(tsPowerOff,fans?13500:10000); else setTimeout(tsSolved,fans?11500:7000);
  });
}
// switched off (and unplugged) before anyone works on it
function tsPowerOff(){ S.powered=false; powerLedMat.color.setHex(0x1a2330); keyboardLights(false); showScreen(screenOff,0); S.busy=false; toast(t("ts_offNote")); tsToCheck(); }
function tsToCheck(){ if(TS.phase==="power") TS.phase="check"; focus("tsFront",1200); renderTS(); }
function tsInspect(id){
  if(S.busy||TS.phase!=="check") return;
  TS.cur=id; const c=TS_CHECKS[id], p=c.at(); focusPoint(p.clone().add(c.off),p,900); renderTS();
  // phones / full screen: show the view (and its floating card) instead of the list the check was picked from
  if(document.body.classList.contains("fs-open")) showFsPanel(false);
  else if(matchMedia("(max-width: 860px)").matches) document.querySelector(".work").scrollTo({top:0,behavior:"smooth"});
}
function tsVerdict(bad){
  const id=TS.cur; if(!id) return;
  if(bad&&id!==TS.fault){ mistake(); toast(t("ts_notFault"),"err"); TS.seen[id]="ok"; TS.cur=null; }
  else if(!bad&&id===TS.fault){ mistake(); toast(t("ts_missed"),"err"); return; }
  else if(bad){ TS.seen[id]="bad"; TS.phase="fix"; toast(t("ts_fixIt")); }
  else { TS.seen[id]="ok"; TS.cur=null; }
  renderTS();
}
// clicks in the 3D view (input.js hands them all here in this mode)
function tsClick(d){
  if(d.part==="powerBtn"){ tsPower(); return; }
  if(S.busy) return;
  if(TS.phase==="check"){ const id=TS.list.find(k=>TS_CHECKS[k].hit(d)); if(id) tsInspect(id); return; }   // clicking a listed part checks it
  if(TS.phase!=="fix") return;
  const c=TS_CHECKS[TS.fault];
  if(!c.hit(d)){ mistake(); toast(t("ts_wrongPart"),"err"); return; }
  S.busy=true; c.fix(()=>{ S.busy=false; TS.fixed=true; TS.phase="retry"; TS.cur=null; toast(t("ts_fix_"+TS.fault),"ok");
    setTimeout(()=>{ focus("powerBtn",1000); toast(t("ts_retry")); },900); renderTS(); });
}
function tsSolved(){ S.busy=false; TS.phase="solved"; S.end=performance.now(); if(!TS.done.includes(TS.n)) TS.done.push(TS.n); persist(); toast(t("ts_solved"),"ok"); renderTS(); }
// the pointer arrow: power button when it's time to press it, the faulty part while fixing (hints on)
function tsArrow(){
  if(!S.glow||S.busy) return null;
  if(TS.phase==="power"||TS.phase==="retry") return wpos(powerBtn);
  if(TS.phase==="fix"&&S.hints) return TS_CHECKS[TS.fault].at();
  return null;
}
function renderTS(){
  const el=document.getElementById("tsPanel"); if(!TS.on){ el.hidden=true; return; } el.hidden=false;
  const sym=TS.sym?`<div class="ts-sym"><b>${t("ts_"+TS.sym)}</b><p>${t("ts_"+TS.sym+"d")}</p></div>`:"";
  let h=`<p class="module-title">${t("ts_title")}</p>`, insp="";
  const num=TS.n===null?"":`<p class="ts-case">${t("ts_case",{n:TS.n+1})}</p>`;
  if(TS.phase==="pick"){
    h+=`<p>${t("ts_intro")}</p><p class="ts-muted">${t("ts_progress",{d:TS.done.length,n:TS_CASES.length})}</p><ol class="ts-pick">`
      +TS_CASES.map(([s,f],i)=>{ const d=TS.done.includes(i);
        return `<li><button data-case="${i}" class="${d?"solved":""}"><i>${d?"✓":i+1}</i><b>${t("ts_case",{n:i+1})} · ${t("ts_"+s)}</b>${d?`<span>${t("ts_c_"+f)}</span>`:""}</button></li>`; }).join("")
      +`</ol><button data-case="random" class="ts-rand primary">${t(tsLeft().length?"ts_random":"ts_randomAll")}</button>`;
  } else if(TS.phase==="solved"){
    const c=TS.fault, left=tsLeft(), nx=left.find(i=>i>TS.n)??left[0];
    h+=num+sym+`<div class="ts-win"><b>${t("ts_solved")}</b><p><strong>${t("ts_cause")}</strong> ${t("ts_c_"+c)}</p><p>${t("ts_w_"+c)}</p>
      <p class="ts-muted">${t("ts_stats",{t:fmtTime(S.end-S.start),m:S.mistakes})} ${t("ts_progress",{d:TS.done.length,n:TS_CASES.length})}</p>
      <div class="ts-row">${nx!==undefined?`<button class="primary" data-go="${nx}">${t("ts_next",{n:nx+1})}</button>`:`<p><b>${t("ts_allDone")}</b></p>`}
      <button class="chip-btn" data-act="list">${t("ts_list")}</button></div></div>`;
  } else {
    const say={power:"ts_pressPower",check:"ts_pickCheck",fix:"ts_fixIt",retry:"ts_retry"}[TS.phase];
    h+=num+sym+`<p class="ts-do">${t(say)}</p>`;
    if(TS.phase!=="power"){
      h+=`<ol class="ts-list">`+TS.list.map(k=>{ const s=TS.seen[k]||""; return `<li><button data-chk="${k}" class="${s}${TS.cur===k?" cur":""}"${TS.phase==="check"?"":" disabled"}><i></i>${t("ts_c_"+k)}</button></li>`; }).join("")+`</ol>`;
      if(TS.cur&&TS.phase==="check"){ const c=TS_CHECKS[TS.cur];
        insp=`<div class="ts-inspect"><b>${t("ts_c_"+TS.cur)}</b><p>${t("ts_l_"+TS.cur)}</p>${c.reading?`<p class="ts-read">${c.reading()}</p>`:""}
          <div class="ts-row"><button class="chip-btn" data-v="ok">${t("ts_ok")}</button><button class="chip-btn ts-bad" data-v="bad">${t("ts_bad")}</button></div></div>`;
        h+=insp; }
    }
    h+=`<button class="chip-btn ts-back" data-act="list">${t("ts_list")}</button>`;
  }
  document.getElementById("fsStep").textContent=TS.phase==="pick"?t("ts_title"):TS.phase==="solved"?t("ts_solved"):t({power:"ts_pressPower",check:"ts_pickCheck",fix:"ts_fixIt",retry:"ts_retry"}[TS.phase]);
  // phones and full screen: the sidebar is below the view or closed, so the same card also floats over the 3D view
  const fl=document.getElementById("tsFloat"); fl.innerHTML=insp; fl.hidden=!insp;
  fl.querySelectorAll("[data-v]").forEach(b=>b.onclick=()=>tsVerdict(b.dataset.v==="bad"));
  el.innerHTML=h; el.parentElement.scrollTop=0;                          // the panel is at the top of the sidebar
  el.querySelectorAll("[data-case]").forEach(b=>b.onclick=()=>tsPick(b.dataset.case==="random"?"random":+b.dataset.case));
  el.querySelectorAll("[data-go]").forEach(b=>b.onclick=()=>tsGo(+b.dataset.go));
  el.querySelectorAll("[data-chk]").forEach(b=>b.onclick=()=>tsInspect(b.dataset.chk));
  el.querySelectorAll("[data-v]").forEach(b=>b.onclick=()=>tsVerdict(b.dataset.v==="bad"));
  el.querySelectorAll("[data-act=list]").forEach(b=>b.onclick=()=>tsGo(null));
  clLock(el);                                                            // classroom: the teacher picked the case
}
