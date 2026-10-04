/* ---------------- help: pointer arrow, first-part coach, hint button ----------------
   Pointer: a bouncing arrow and a pulsing ring over the thing to click or the place to drop.
   It always shows on the socket lever, and on whatever a hint points at while the hint is active.
   Coach: a card that walks the first part (lever, then the CPU: flip, rotate, drag, lower) and
   lights up the button for the current move.
   Hints: 5 per build. A hint points at the next thing to do; if a part is in hand it also shows the
   move (turns/flips it, carries it to its place), then puts it back so the user repeats it. */
function hintSprite2(draw,cx,cy){
  const sp=new T.Sprite(new T.SpriteMaterial({map:canvasTex(256,256,draw),depthTest:false,depthWrite:false,transparent:true,toneMapped:false}));
  sp.center.set(cx,cy); sp.renderOrder=12; sp.visible=false; sp.raycast=()=>{}; scene.add(sp); return sp;
}
const hintArrow=hintSprite2((g,W,H)=>{ g.lineJoin="round";
  g.beginPath(); g.moveTo(W*.37,H*.04); g.lineTo(W*.63,H*.04); g.lineTo(W*.63,H*.5); g.lineTo(W*.86,H*.5); g.lineTo(W*.5,H*.93); g.lineTo(W*.14,H*.5); g.lineTo(W*.37,H*.5); g.closePath();
  g.lineWidth=14; g.strokeStyle="#111"; g.stroke(); g.fillStyle="#ffc400"; g.fill(); },.5,.04);
const hintRing=hintSprite2((g,W)=>{ g.beginPath(); g.arc(W/2,W/2,W*.4,0,7); g.lineWidth=22; g.strokeStyle="rgba(17,17,17,.6)"; g.stroke(); g.lineWidth=14; g.strokeStyle="#ffc400"; g.stroke(); },.5,.5);

S.hintsLeft=5;
let hintUntil=0, hintStep=-1, coachOff=false, coachKey="", glowEls=[];
const HINT_PERIOD={cpu:4,cooler:4,psu:4,sata:4,ram:2,m2:2,board:2,gpu:2,wifi:2};
const wpos=(o,dy=0)=>o.getWorldPosition(V3(0,0,0)).add(V3(0,dy,0));
// which way to turn (rotate(1) is the left button): r turns away from correct
function turnFix(r,period){ const m=mod(r,period); if(!m) return null;
  if(period===2) return {el:"rotR",msg:"h_rot1"};
  return m===1?{el:"rotR",msg:"e_turnR"}:m===3?{el:"rotL",msg:"e_turnL"}:{el:"rotR",msg:"e_turn2"}; }
// world spot where the held part belongs
function heldTarget(type){
  if(type==="cpu"||type==="paste"||type==="cooler") return V3(SX,1,SZ);
  if(type==="ram"){ const g=GOOD.find(g=>!slots[g].used); return V3(SLOT_X[g],1,SLOT_Z); }
  if(type==="m2") return V3(M2_SEAT.x,.6,M2_SEAT.z);
  if(type==="battery") return V3(BAT_POS.x,.6,BAT_POS.z);
  if(type==="psu") return PSU_POS.clone();
  if(type==="board") return L.clone();
  if(type==="gpu"){ const s=GPU_SLOTS.find(s=>s.ok); return V3(GPU_X,L.y+1,L.z+s.z); }
  if(type==="sata") return SATA_POS.clone();
  if(type==="wifi") return V3(WIFI_X,L.y+1,L.z+10.2);                     // PCI_E5: well clear of the graphics card
  if(type==="cable"){ const tg=S.cable.tgts.find(x=>x.ok); return V3(tg.x,tg.seatY,tg.z); }
  return null;
}
function snapOk(type){ const sn=S.snap; if(!sn) return false;
  if(type==="ram") return GOOD.includes(sn.key)&&!slots[sn.key].used;
  if(type==="gpu"||type==="wifi") return sn.slot.ok;
  if(type==="cable") return sn.tg.ok;
  return true; }
// the next red slot's clip (latch) nearer the camera, not the slot's middle
function clipPos(){ const i=GOOD.find(i=>!slots[i].open); if(i==null) return null;
  const [a,b]=slots[i].latches.map(p=>wpos(p,1.2)); return a.distanceTo(camera.position)<b.distanceTo(camera.position)?a:b; }
const trayBtn=id=>document.querySelector(`#tray [data-id="${id}"]`);
// what to do next: {pos} a world point for the arrow, {el} a button to light up, msg the i18n key to show
function hintInfo(){
  const st=S.step, h=S.held, el=id=>document.getElementById(id);
  if(st>=STEPS) return null;
  if(h==="conn"){ const f=turnFix(S.roll,4); return f?{el:el(f.el),msg:f.msg,fix:true}:{el:el("dropBtn"),msg:"h_drop"}; }
  if(h){
    if(h==="cpu"&&S.flips%2||h==="battery"&&S.batFlip%2) return {el:el("flipBtn"),msg:"h_flip",fix:true};
    const f=HINT_PERIOD[h]&&turnFix(S.rot[h],HINT_PERIOD[h]); if(f) return {el:el(f.el),msg:f.msg,fix:true};
    if(!snapOk(h)) return {pos:heldTarget(h),msg:"h_drag",fix:true};
    return {el:el("dropBtn"),msg:"h_drop"};
  }
  const tray={[ST.takeCpu]:"cpu",[ST.ram1]:"ram"+(S.used.ram0?1:0),[ST.ram2]:"ram"+(S.used.ram0?1:0),[ST.paste]:"paste",[ST.cooler]:"cooler",[ST.m2In]:"m2",
    [ST.battery]:"battery",[ST.psu]:"psu",[ST.boardScrews]:"screws",[ST.gpu]:"gpu",[ST.sata]:"sata",[ST.wifi]:"wifi",[ST.antennas]:"antennas"}[st];
  if(tray) return S.tray?{el:trayBtn(tray),msg:"h_tray"}:{pos:tablePos(tray),msg:"h_table"};
  if(st===ST.leverUp||st===ST.leverDown) return {pos:wpos(grip),msg:"h_click"};
  if(st===ST.clips){ const pos=clipPos(); return pos&&{pos,msg:"h_click"}; }
  if(st===ST.bracket) return {pos:wpos(bracketScrews[0],.3),msg:"h_click"};
  if(st===ST.coolerScrews){ const o=S.tightOrder, i=o.length%2?(o[o.length-1]+2)%4:coolerScrews.findIndex(s=>!s.tight); return {pos:wpos(coolerScrews[i].g,.3),msg:"h_click"}; }
  if(st===ST.m2Out||st===ST.m2Screw) return {pos:wpos(m2Screw,.1),msg:"h_click"};
  if(st===ST.board) return {pos:wpos(boardRoot,1),msg:"h_click"};
  if(st===ST.pcieLatch) return {pos:wpos(pcieLatch,.3),msg:"h_click"};
  if(st===ST.closeCase) return {pos:wpos(sideG,.3),msg:"h_click"};
  if(st===ST.powerOn) return {pos:wpos(powerBtn),msg:"h_click"};
  const job=connJob(st);
  if(job){
    if(job.pick&&S.connPick==="sata"){ const p=SPORTS.find(p=>sportFits(p,job)); if(p) return {pos:portWorld(p.port).p,msg:"h_port"}; }
    if(job.choose&&S.connPick){ const p=RPORTS.find(p=>S.connPick==="usb"?p.kind==="usb"&&!p.used:p.kind==="hdmiGpu"); if(p) return {pos:portWorld(p).p,msg:"h_port"}; }
    job.plug.outer.updateMatrixWorld(true); return {pos:wpos(job.plug.outer),msg:"h_cable"};
  }
  return null;
}
// show the move with the part in hand, then put it back exactly as it was
function demoHeld(done){
  const type=S.held;
  if(type==="conn"){ const job=S.job, P=job.plug, r=S.roll, m=mod(r,4); if(!m) return done();
    const rc=m<=2?r-m:r+4-m, a0=r*Math.PI/2, a1=rc*Math.PI/2, go=k=>{ P.inner.rotation.x=a0+(a1-a0)*k; drawConn(job.c); };
    S.busy=true; tween(800,go,()=>setTimeout(()=>tween(700,k=>go(1-k),()=>{ go(0); S.busy=false; done(); }),900)); return; }
  const o=type==="cable"?S.cable.plug:HELD[type].obj(), tg=heldTarget(type); if(!tg) return done();
  const p0=o.position.clone(), w=o.getWorldPosition(V3(0,0,0)), p1=o.parent.worldToLocal(V3(tg.x,w.y,tg.z)); p1.y=p0.y;
  const y0=o.rotation.y; let y1=y0;
  if(type==="cable") y1=S.cable.tgts.find(x=>x.ok).rot;
  else if(HINT_PERIOD[type]){ const P=HINT_PERIOD[type], r=S.rot[type], m=mod(r,P); y1=(m===0?r:m<=P/2?r-m:r+P-m)*HELD[type].step; }
  const fl=type==="cpu"?cpuFlip:type==="battery"?batFlip:null, n=type==="cpu"?S.flips:S.batFlip, z0=fl?fl.rotation.z:0, z1=fl&&n%2?(n+1)*Math.PI:z0;
  const go=k=>{ o.position.lerpVectors(p0,p1,k); if(z1!==z0) o.position.y+=Math.sin(k*Math.PI)*1.2; o.rotation.y=y0+(y1-y0)*k; if(fl) fl.rotation.z=z0+(z1-z0)*k; if(type==="cable") drawCable(S.cable); };
  S.busy=true; tween(1100,go,()=>setTimeout(()=>tween(900,k=>go(1-k),()=>{ go(0); S.busy=false; done(); }),900));
}
function useHint(){
  if(S.step>=STEPS||!BUILD_MODE) return;
  if(S.busy||dragging){ toast(t("e_hintBusy")); return; }
  if(S.hintsLeft<=0){ toast(t("e_noHints"),"err"); return; }
  const info=hintInfo(); if(!info) return;
  S.hintsLeft--; renderHintBtn(); startClock();
  hintStep=S.step; hintUntil=performance.now()+9000;
  if(S.held&&info.fix){ toast(t("h_watch")); demoHeld(()=>{ hintUntil=performance.now()+8000; toast(t(info.msg)); }); }
  else toast(t(info.msg));
}
function renderHintBtn(){ const b=document.getElementById("hintBtn"); document.getElementById("hintLeft").textContent=S.hintsLeft;
  b.classList.toggle("empty",S.hintsLeft<=0); b.title=t("hintTip"); b.setAttribute("aria-label",t("hintBtn")+" ("+S.hintsLeft+")"); }
document.getElementById("hintBtn").onclick=useHint;
document.getElementById("coachX").onclick=()=>{ coachOff=true; };
window.addEventListener("keydown",e=>{ if(e.target.tagName!=="INPUT"&&!e.ctrlKey&&e.code==="KeyH") useHint(); });

// coach for the first part: [text key, state] with state info / done / cur / todo
function coachLines(){
  const st=S.step; if(coachOff||st>ST.placeCpu) return null;
  const held=S.held==="cpu"&&st===ST.placeCpu, f=held&&S.flips%2===0, r=held&&mod(S.rot.cpu,4)===0, sn=held&&!!S.snap;
  const at=(s,done)=>st>s||done?"done":st===s?"cur":"todo";
  return [["co_orbit","info"],["co_lever",at(ST.leverUp)],[S.tray?"co_tray":"co_table",at(ST.takeCpu)],
    ["co_flip",!held?"todo":f?"done":"cur"],["co_rot",!held?"todo":!f?"todo":r?"done":"cur"],
    ["co_drag",!held?"todo":sn?"done":f&&r?"cur":"todo"],["co_drop",f&&r&&sn?"cur":"todo"]];
}
function coachEls(lines){ const cur=lines&&lines.find(l=>l[1]==="cur"); if(!cur||S.busy) return [];
  const k=cur[0], el=id=>document.getElementById(id);
  if(k==="co_tray") return [trayBtn("cpu")];
  if(k==="co_flip") return [el("flipBtn")];
  if(k==="co_rot") return [el(mod(S.rot.cpu,4)===3?"rotL":"rotR")];
  if(k==="co_drop") return [el("dropBtn")];
  return []; }
function renderCoach(lines){
  const box=document.getElementById("coach"), key=lines?lang+lines.map(l=>l[1]).join()+(S.held==="cpu"?mod(S.rot.cpu,4):""):"";
  if(key===coachKey) return; coachKey=key; box.hidden=!lines; if(!lines) return;
  const r=S.held==="cpu"?mod(S.rot.cpu,4):0;
  box.querySelector("ol").innerHTML=lines.map(([k,s])=>`<li class="${s}">${t(k)}${k==="co_rot"&&s==="cur"&&r?` <b>${t(r===1?"e_turnR":r===3?"e_turnL":"e_turn2")}</b>`:""}</li>`).join("");
}
const gpuCableNag=now=>S.step===ST.gpuPower&&!S.held&&!S.busy&&now-S.stepAt>20000;
// called every frame from the render loop
function updateHints(now){
  if(hintUntil&&(now>hintUntil||S.step!==hintStep)) hintUntil=0;
  const info=hintUntil&&BUILD_MODE?hintInfo():null, lines=BUILD_MODE?coachLines():null;
  let pos=TS.on?tsArrow():IN.on?inArrow():PI.on?piArrowPos():info&&info.pos;
  if(BUILD_MODE&&!pos&&S.glow&&(S.step===ST.leverUp||S.step===ST.leverDown)&&!S.busy) pos=wpos(grip);   // the lever is easy to miss: always point at it
  if(BUILD_MODE&&!pos&&S.glow&&S.step===ST.clips&&!S.busy) pos=clipPos();                                   // and the small memory clips
  if(BUILD_MODE&&!pos&&S.glow&&S.step===ST.powerOn&&!S.busy) pos=wpos(powerBtn);                          // so is the power button, on the far side of the case
  if(!pos&&S.glow&&gpuCableNag(now)){ CONN.gpu8.a.outer.updateMatrixWorld(true); pos=wpos(CONN.gpu8.a.outer); }
  hintArrow.visible=hintRing.visible=!!pos;
  if(pos){ const s=camera.position.distanceTo(pos)*.07, k=(now%1100)/1100;
    hintArrow.scale.set(s*.6,s,1); hintArrow.position.copy(pos); hintArrow.position.y+=s*(.25+.2*Math.abs(Math.sin(now/260)));
    hintRing.position.copy(pos); hintRing.scale.setScalar(s*(.35+.9*k)); hintRing.material.opacity=1-k; }
  renderCoach(lines);
  const want=[...(info&&info.el&&!S.busy?[info.el]:[]),...coachEls(lines)].filter(Boolean);
  glowEls.forEach(e=>{ if(!want.includes(e)) e.classList.remove("hint-glow"); });
  want.forEach(e=>e.classList.add("hint-glow")); glowEls=want;
}
