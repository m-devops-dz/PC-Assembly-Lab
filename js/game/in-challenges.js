/* ---------------- install mode: three more challenges (scenarios in install.js) ----------------
   bios  an older-style PC with no boot menu key (no F11): DEL into the BIOS, read its boot mode (UEFI), put the stick
         first in the boot order (Advanced F7 › Settings › Boot), F10 save and exit: the PC then starts from the stick
         by itself. The BIOS is a clickable page here (BX); the other scenarios keep the BIOS picture.
   bsod  a blue screen (MEMORY_MANAGEMENT) during Setup's copy: why (RAM), power off, open the case, take one RAM stick
         out, try again. Only the front stick (nearest the camera, IN.frontRam) comes out, and the one left in is the
         faulty one (IN.badRam): the blue screen comes back, and the student swaps the two sticks.
   wifi  the new Windows has no driver for the Wi-Fi card, and getting one needs the internet: share the phone's
         internet over its USB cable (USB tethering), let Windows Update fetch the drivers, then join the Wi-Fi. */
Object.assign(IN_GROUP_OF,{biosEnter:"bios",biosMode:"bios",biosOrder:"bios",biosSave:"bios",biosBoot:"bios",
  bsodSee:"bsod",bsodWhy:"bsod",bsodOff:"bsod",bsodOpen:"bsod",bsodRam:"bsod",bsodRetry:"bsod",
  wifiSee:"wifi",phoneCable:"wifi",phoneTether:"wifi",wuCheck:"wifi",wuDone:"wifi",wifiOn:"wifi"});
const ramIn=i=>rams[i].yaw.parent===boardRoot;                       // still in its slot (not lying on the mat)
Object.assign(IN_DONE,{
  biosEnter:()=>!!PC.biosSeen, biosMode:()=>BX.mode, biosOrder:()=>BX.order[0]==="usb", biosSave:()=>!!PC.usbFirst, biosBoot:()=>PC.ventoySeen,
  bsodSee:()=>IN.bsodN>0, bsodWhy:()=>!!IN.bsodWhy, bsodOff:()=>IN.bsodN>0&&!S.powered, bsodOpen:()=>!!IN.panelOff,
  bsodRam:()=>rams.filter((r,i)=>ramIn(i)).length===1, bsodRetry:()=>WS.copied,
  wifiSee:()=>!!OW.netSeen, phoneCable:()=>IN.phone==="pc", phoneTether:()=>PH.tether, wuCheck:()=>WU.on, wuDone:()=>WU.done, wifiOn:()=>!!OW.wifi
});
Object.assign(IN_FINISH,{
  biosEnter:()=>{ if(!S.powered) powerUp(); PC.boot++; BX.view="ez"; pcBios(); setTimeout(()=>openScreen("pc"),300); },
  biosMode:()=>{ BX.mode=true; inCardEl.hidden=true; },
  biosOrder:()=>{ BX.order=["usb","win","net"]; BX.view="boot"; BX.pick=-1; },
  biosSave:()=>{ BX.order=["usb","win","net"]; bxSave(); },
  biosBoot:()=>{ PC.boot++; pcVentoy(); },
  bsodSee:()=>{ if(!IN.bsodN) bsodCrash(); },
  bsodWhy:()=>{ IN.bsodWhy=true; inCardEl.hidden=true; },
  bsodOff:()=>{ pcOff(); closeScreen(); },
  bsodOpen:()=>{ sideG.visible=false; panelScrews.forEach(g=>g.visible=false); IN.panelOff=true; },
  bsodRam:()=>ramMove(IN.frontRam,null,true),
  bsodRetry:()=>{ if(ramIn(IN.badRam)) ramSwap(IN.badRam,true); if(!S.powered) powerUp(); PC.boot++; PC.mode="setup"; WS.page="installing"; WS.copyN=(WS.copyN||0)+1; WS.prog=1; wsCopied(); },
  wifiSee:()=>{ OW.netSeen=true; },
  phoneCable:()=>phonePlug(true),
  phoneTether:()=>{ PH.tether=true; },
  wuCheck:()=>{ PH.tether=true; wuCheck(); },
  wuDone:()=>{ WU.on=WU.done=true; WU.k=1; },
  wifiOn:()=>{ OW.wifi=true; }
});
// something a step starts by itself (install.js, inStepChanged)
const IN_STEP_HOOK={ bsodWhy:()=>setTimeout(bsodAsk,2500) };
function inChStart(){
  const c=IN.cfg; phoneG.visible=!!c.wifi;
  if(c.bsod){ IN.frontRam=ramFront(); IN.badRam=1-IN.frontRam;
    rams.forEach(r=>{ r.glow=[]; r.parts.slice(1,3).forEach(m=>{ m.material=m.material.map(x=>x===ramLabelMat||x===ramPlainMat?(r.glow.push(x.clone()),r.glow[r.glow.length-1]):x); }); });   // own copies: only the stick to click glows
    WS.copyN=(WS.copyN||0)+1; WS.prog=0;                                // the copy waits for the intro card, so the crash is seen
    const go=()=>{ if(!inCardEl.hidden||!stepCard.hidden||!SCR.dev){ setTimeout(go,500); return; } wsCopy(); };
    setTimeout(go,2200); }
}
// a question card (wrong: a mistake, and the question comes back, answers reshuffled; right: ok())
function inAsk(pre,ks,right,ok){
  inCard(t("in_q"),t(pre+"_t"),t(pre+"_p"),{cls:"info choice",buttons:shuffle([...ks]).map(k=>({l:t(pre+"_"+k),pri:true,fn:()=>{
    if(k===right){ ok(); }
    else { mistake(); shakeRed(); toast(t("in_q_no"),"err"); setTimeout(()=>inAsk(pre,ks,right,ok),500); } }}))});
}

/* ---- bios: the clickable MSI BIOS ---- */
const BX={view:"ez", order:["win","usb","net"], pick:-1, dlg:null, mode:false};
PC.savedOrder=["win","usb","net"];
const BX_DEV={win:"Windows Boot Manager (Samsung SSD 980 PRO 1TB)",usb:"UEFI USB Key: SanDisk Ultra 32GB 1.00",net:"UEFI Network: Realtek PXE B04 D00"};
const BX_SHORT={win:"Windows Boot Manager",usb:"USB: SanDisk",net:"Network"};
function bxRender(){
  const cur=inCur(), pt=S.glow&&S.hints?" point":"", o=BX.order;
  const top=`<div class="bx-top"><b class="bx-msi">msi</b><span>CLICK BIOS 5</span>
    <nav><button data-b="ez" class="${BX.view==="ez"?"on":""}">EZ Mode</button><button data-b="adv" class="${BX.view==="boot"?"on":""}${cur==="biosOrder"&&BX.view==="ez"?pt:""}">Advanced (F7)</button></nav><time>14:32 Tue 29 Sep, 2026</time></div>`;
  const info=`<div class="bx-info"><div><small>CPU Speed</small><b>3.90 GHz</b></div><div><small>DDR Speed</small><b>3200 MHz</b></div>
    <button data-b="mode" class="bx-mode${cur==="biosMode"?pt:""}"><small>BIOS Mode</small><b>UEFI</b></button>
    <dl><dt>CPU</dt><dd>AMD Ryzen 5 5600G with Radeon Graphics</dd><dt>Memory Size</dt><dd>16384MB</dd><dt>BIOS Ver</dt><dd>E7C02AMS.2H0</dd></dl></div>`;
  const body=BX.view==="ez"
    ?`<section class="bx-box"><h4>Boot Priority</h4><div class="bx-prio">${o.map((k,i)=>`<span class="${i===0?"first":""}">${i+1}. ${BX_SHORT[k]}</span>`).join("")}</div>
       <p class="bx-help">Advanced (F7) › Settings › Boot to change the order</p></section>
      <section class="bx-box"><h4>Storage</h4><p>M2_1: Samsung SSD 980 PRO 1TB</p><p>SATA1: SATA SSD 512GB</p><p>USB: SanDisk Ultra 32GB</p></section>`
    :`<section class="bx-box bx-adv"><p class="bx-path">Settings\\Boot</p>
       <button class="bx-row" data-b="mode"><span>Boot mode select</span><b>[UEFI]</b></button>
       <p class="bx-sub">FIXED BOOT ORDER Priorities</p>
       ${o.map((k,i)=>`<button class="bx-row${cur==="biosOrder"&&i===0&&k!=="usb"&&BX.pick<0?pt:""}" data-b="opt" data-v="${i}"><span>Boot Option #${i+1}</span><b>[${BX_DEV[k]}]</b></button>`).join("")}</section>`;
  const pop=BX.pick<0?"":`<div class="bx-bg"><div class="bx-pop"><p>Boot Option #${BX.pick+1}</p>${o.map(k=>`<button data-b="set" data-v="${k}" class="${k===o[BX.pick]?"on":""}${cur==="biosOrder"&&k==="usb"?pt:""}">${BX_DEV[k]}</button>`).join("")}</div></div>`;
  const ch=o.map((k,i)=>k!==PC.savedOrder[i]?`<li>Boot Option #${i+1}: ${BX_DEV[PC.savedOrder[i]]} → ${BX_DEV[k]}</li>`:"").join("");
  const dlg=!BX.dlg?"":`<div class="bx-bg"><div class="bx-pop bx-dlg"><p>${BX.dlg==="save"?"Save &amp; Exit Setup":"Exit Setup"}</p>
    <p>${BX.dlg==="save"?"Save configuration and exit?":"Exit without saving the changes?"}</p>${BX.dlg==="save"&&ch?`<ul>${ch}</ul>`:""}
    <div><button data-b="yes" class="${cur==="biosSave"&&BX.dlg==="save"?pt.trim():""}">Yes</button><button data-b="no">No</button></div></div></div>`;
  return `<div class="pc bx">${top}${info}<div class="bx-main">${body}</div>
    <footer class="bx-foot"><button data-b="adv">F7: Advanced Mode</button><button data-b="save" class="${cur==="biosSave"&&!BX.dlg?pt.trim():""}">F10: Save &amp; Exit</button><button data-b="esc">ESC: ${BX.view==="boot"?"Back":"Exit"}</button></footer>${pop}${dlg}</div>`;
}
function bxKey(k){
  if(BX.dlg){ if(k==="Enter") bxAct("yes"); else if(k==="Escape") bxAct("no"); return; }
  if(BX.pick>=0){ if(k==="Escape"){ BX.pick=-1; renderScreen(); } return; }
  if(k==="F7") bxAct(BX.view==="ez"?"adv":"ez");
  else if(k==="F10") bxAct("save");
  else if(k==="Escape") bxAct("esc");
}
function bxSave(){ PC.savedOrder=[...BX.order]; PC.usbFirst=BX.order[0]==="usb"; BX.dlg=null; BX.pick=-1; BX.view="ez"; inCheck(); pcPost(); }
function bxAct(a,v){
  switch(a){
    case "ez": BX.view="ez"; BX.pick=-1; break;
    case "adv": BX.view=BX.view==="boot"?"ez":"boot"; BX.pick=-1; break;
    case "esc": if(BX.view==="boot"){ BX.view="ez"; break; } BX.dlg="exit"; break;
    case "mode": if(inCur()==="biosMode"&&!BX.mode){ inAsk("in_bm",["a","b","c"],"a",()=>{ BX.mode=true; inCheck(); renderScreen();
        setTimeout(()=>inCard(t("in_note"),t("in_bm_okT"),t("in_bm_ok"),{cls:"info"}),50); }); return; }
      toast(t("in_bx_uefi")); return;
    case "opt": if(!inGate("biosOrder")) return; BX.pick=+v; break;
    case "set": { const o=BX.order, from=o.indexOf(v), to=BX.pick; [o[from],o[to]]=[o[to],o[from]]; BX.pick=-1; inCheck(); break; }
    case "save": BX.dlg="save"; break;
    case "yes": if(BX.dlg==="save"){ if(BX.order[0]!=="usb") toast(t("in_bx_notFirst"),"err"); bxSave(); return; }
      BX.order=[...PC.savedOrder]; BX.dlg=null; BX.view="ez"; toast(t("in_bx_discard")); pcPost(); return;   // exit without saving: the changes are gone
    case "no": BX.dlg=null; break;
  }
  renderScreen();
}
scrBody.addEventListener("click",e=>{
  if(SCR.dev!=="pc"||PC.mode!=="bios"||!IN.cfg.bios) return; const el=e.target.closest("[data-b]"); if(!el) return;
  startClock(); bxAct(el.dataset.b,el.dataset.v);
});

/* ---- bsod: a blue screen during Setup's copy ---- */
const BS={k:0};
const bsodTex=canvasTex(1024,576,(g,W,H)=>{ g.fillStyle="#0a5fb4"; g.fillRect(0,0,W,H); g.fillStyle="#fff"; g.font="300 150px Barlow, Arial"; g.fillText(":(",110,230);
  g.font="400 30px Barlow, Arial"; g.fillText("Your PC ran into a problem and needs to restart.",110,310); g.font="400 22px Barlow, Arial"; g.fillText("Stop code: MEMORY_MANAGEMENT",250,440);
  g.fillStyle="#fff"; g.fillRect(110,390,110,110); g.fillStyle="#0a5fb4"; g.fillRect(126,406,30,30); g.fillRect(174,406,30,30); g.fillRect(126,454,30,30); });
const bsodRamOk=()=>!ramIn(IN.badRam);
// the stick nearer the camera when it looks into the open case (ramLook)
function ramFront(){ const cam=ramAt().add(V3(14,24,10)); return wpos(rams[0].yaw).distanceTo(cam)<=wpos(rams[1].yaw).distanceTo(cam)?0:1; }
const ramPos=i=>wpos(rams[i].yaw).add(boardRoot.localToWorld(V3(0,2,0)).sub(boardRoot.localToWorld(V3(0,0,0))));   // on the stick's side, below its top edge
// called by Setup's copy on every frame (win-setup.js): about a third of the way, a PC with the faulty stick in crashes
function bsodNow(k){ if(!IN.cfg.bsod||k<.35||bsodRamOk()) return false; bsodCrash(); return true; }
function bsodCrash(){
  WS.copyN=(WS.copyN||0)+1; const id=++PC.boot; PC.mode="bsod"; BS.k=0; IN.bsodN=(IN.bsodN||0)+1; showScreen(bsodTex,.6); renderScreen();
  tween(8000,k=>{ if(PC.boot!==id) return; BS.k=k; const el=document.getElementById("bsPct"); if(el) el.textContent=Math.round(k*100); },null,k=>k);
  inCheck();
  if(IN.bsodN>1) setTimeout(()=>{ if(PC.boot===id) inCard(t("in_note"),t("in_bs_againT"),t("in_bs_again"),{cls:"info"}); },2600);   // the stick left in is the faulty one
}
function bsodRender(){ return `<div class="pc bsod"><div class="bs-in"><p class="bs-face">:(</p><p>${t("bs_msg")}</p><p><span id="bsPct">${Math.round(BS.k*100)}</span>% ${t("bs_pct")}</p>
  <div class="bs-qr"><i aria-hidden="true"></i><p><small>${t("bs_more")}</small><br><small>${t("bs_code")} MEMORY_MANAGEMENT</small></p></div></div></div>`; }
// what's the likely cause? (waits for any card that is up, the phones' step card too)
function bsodAsk(){
  if(inCur()!=="bsodWhy"||IN.bsodWhy) return;
  if(!inCardEl.hidden||!stepCard.hidden){ setTimeout(bsodAsk,700); return; }
  inAsk("in_bs_q",["a","b","c"],"a",()=>{ IN.bsodWhy=true; inCheck(); setTimeout(()=>inCard(t("in_note"),t("in_bs_okT"),t("in_bs_ok"),{cls:"info"}),50); });
}
// after a restart with the stick in, Setup picks up the copy again (the student doesn't click through it a second time)
function bsodResume(){ const id=PC.boot; PC.mode="load"; PC.loadMsg="pc_setupLoad"; showScreen(screenOn); renderScreen();
  setTimeout(()=>{ if(PC.boot!==id) return; PC.mode="setup"; WS.page="installing"; WS.prog=0; renderScreen(); wsCopy(); },2600); }
function pressPower(done){ S.busy=true; tween(260,k=>{ powerBtn.position.x=CX1+.17-.12*Math.sin(k*Math.PI); },()=>{ S.busy=false; done(); }); }
// the side panel: thumbscrews out, slide back, lift off
function panelOpen(){ S.busy=true;
  panelScrews.forEach((g,i)=>setTimeout(()=>{ const x0=g.position.x; tween(500,k=>{ g.position.x=x0-2*k; g.rotation.x=-k*Math.PI*5; },()=>{ g.visible=false; }); },i*250));
  setTimeout(()=>{ const x0=sideG.position.x, y0=sideG.position.y;
    tween(450,k=>{ sideG.position.x=x0-1.5*k; },()=>{ tween(900,k=>{ sideG.position.y=y0+18*k; },()=>{ sideG.visible=false; S.busy=false; IN.panelOff=true; inCheck(); ramLook(); },easeOut); }); },800); }
const ramAt=()=>boardRoot.localToWorld(V3((SLOT_X[GOOD[0]]+SLOT_X[GOOD[1]])/2,2,SLOT_Z));
function ramLook(){ const p=ramAt(); focusPoint(p.clone().add(V3(14,24,10)),p,1100); }
// a stick out to the parts mat (lying flat), or from the mat into slot (when it's given)
const RAM_MAT_AT=[V3(22,DESK.y+.1,-7),V3(27,DESK.y+.1,-7)], RAM_FLAT=new T.Quaternion().setFromEuler(new T.Euler(0,0,Math.PI/2));
const ramSlotOf=r=>GOOD.find(s=>Math.abs(r.yaw.position.x-SLOT_X[s])<.01);
function ramMove(i,slot,now,done){
  const r=rams[i], y=r.yaw;
  if(slot==null){                                                        // out of the board
    const s=ramSlotOf(r); IN.ramSlot=s; setLatches(s,true,now?1:200);
    const fly=()=>{ scene.attach(y); if(now){ y.position.copy(RAM_MAT_AT[i]); y.quaternion.copy(RAM_FLAT); done&&done(); return; }
      const a=y.position.clone(), q0=y.quaternion.clone();
      tween(1200,k=>{ y.position.lerpVectors(a,RAM_MAT_AT[i],k); y.position.y+=Math.sin(k*Math.PI)*10; y.quaternion.slerpQuaternions(q0,RAM_FLAT,k); },()=>{ S.busy=false; done&&done(); },easeOut); };
    if(now){ fly(); return; }
    S.busy=true; const y0=y.position.y; setTimeout(()=>tween(400,k=>{ y.position.y=y0+4*k; },fly),220); return; }
  // into slot: over the board, then down, clips shut
  boardRoot.updateMatrixWorld(true);
  const top=boardRoot.localToWorld(V3(SLOT_X[slot],RAM_SEAT+4,SLOT_Z)), qb=boardRoot.getWorldQuaternion(new T.Quaternion());
  const seat=()=>{ boardRoot.attach(y); y.position.set(SLOT_X[slot],RAM_SEAT+4,SLOT_Z); y.rotation.set(0,0,0);
    if(now){ y.position.y=RAM_SEAT; setLatches(slot,false,1); done&&done(); return; }
    tween(450,k=>{ y.position.y=RAM_SEAT+4*(1-k); },()=>{ setLatches(slot,false,220); S.busy=false; done&&done(); },easeOut); };
  if(now){ seat(); return; }
  S.busy=true; const a=y.position.clone(), q0=y.quaternion.clone();
  tween(1200,k=>{ y.position.lerpVectors(a,top,k); y.position.y+=Math.sin(k*Math.PI)*8; y.quaternion.slerpQuaternions(q0,qb,k); },seat,easeOut);
}
// the one in the board comes out, the one on the mat goes into its slot
function ramSwap(i,now){ const inB=ramIn(i)?i:1-i, out=1-inB;
  ramMove(inB,null,now,()=>ramMove(out,IN.ramSlot,now,()=>{ toast(t("in_bs_swapped"),"ok"); inCheck(); })); }
function ramClick(i){
  if(S.powered){ inMistake("in_m_ramOn"); return; }
  if(!inGate("bsodRam")) return;
  // one out: back to the desk, where the power button is next (a second click on the board would swap them by accident)
  if(ramIn(0)&&ramIn(1)){ if(i!==IN.frontRam){ toast(t("in_bs_front")); return; }
    ramMove(i,null,false,()=>{ toast(t("in_bs_out"),"ok"); inCheck(); focus("inDesk",1000); }); return; }
  if(IN.bsodN<2||WS.copied){ toast(t("in_bs_tryFirst")); return; }      // a swap only once the blue screen came back with one stick
  ramSwap(i,false);
}

/* ---- wifi: the phone, its USB cable and its tethering switch ---- */
const PH={tether:false};
const PHONE_AT=V3(52,DESK.y+.42,-36);
const phoneMat=new T.MeshStandardMaterial({color:0x1d2026,roughness:.35,metalness:.4});
// a lock screen: wallpaper and a row of app icons (no text: it would read mirrored from some sides)
const phoneScrTex=canvasTex(720,340,(g,W,H)=>{ const gr=g.createLinearGradient(0,0,W,H); gr.addColorStop(0,"#1e3a5f"); gr.addColorStop(1,"#3a6ea5"); g.fillStyle=gr; g.fillRect(0,0,W,H);
  ["#4caf50","#2196f3","#ff9800","#e91e63"].forEach((c,i)=>{ g.fillStyle=c; roundRect(g,70,40+i*68,48,48,12); g.fill(); }); });
const phoneG=new T.Group(); phoneG.visible=false; phoneG.position.copy(PHONE_AT); phoneG.rotation.y=.25; scene.add(phoneG);
(function(){ const b=mesh(box(15.4,.8,7.4),phoneMat,[0,0,0],phoneG);
  const s=mesh(new T.PlaneGeometry(14.6,6.8),new T.MeshStandardMaterial({map:phoneScrTex,emissive:0xffffff,emissiveMap:phoneScrTex,emissiveIntensity:.5,roughness:.2}),[0,.41,0],phoneG,{cast:false});
  s.rotation.x=-Math.PI/2; [b,s].forEach(m=>m.userData={part:"phone"}); })();
let phoneCable=null;
// the phone goes next to the case and its cable into the case's second front USB port
function phonePlug(now){
  const w=portWorld(inPort("front2")), to=V3(w.p.x+12,DESK.y+.42,w.p.z+10);
  const done=()=>{ phoneG.rotation.y=0;
    const a=w.p.clone().addScaledVector(w.out,.4), b=a.clone().addScaledVector(w.out,3), end=to.clone().add(V3(-7.9,0,0));
    const pts=[a,b,V3(b.x+2,DESK.y+.5,b.z+2),V3(end.x-1.5,DESK.y+.4,end.z),end];
    phoneCable=new T.Group(); scene.add(phoneCable);
    mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts),48,.22,8),new T.MeshStandardMaterial({color:0xeeeeee,roughness:.6}),[0,0,0],phoneCable);
    const plug=mesh(box(1.6,.6,1.2),new T.MeshStandardMaterial({color:0xdddddd,roughness:.5}),[0,0,0],phoneCable); plug.position.copy(w.p).addScaledVector(w.out,.7); plug.quaternion.copy(w.q);
    IN.phone="pc"; if(!now){ toast(t("in_wf_plugged"),"ok"); inCheck(); } };
  if(now){ phoneG.position.copy(to); done(); return; }
  S.busy=true; const p0=phoneG.position.clone(), r0=phoneG.rotation.y;
  focusPoint(to.clone().add(V3(22,20,14)),to.clone().lerp(w.p,.5),1100);
  tween(1200,k=>{ phoneG.position.lerpVectors(p0,to,k); phoneG.position.y+=Math.sin(k*Math.PI)*6; phoneG.rotation.y=r0*(1-k); },()=>{ S.busy=false; done(); },easeOut);
}
function phoneView(){ const p=wpos(phoneG); return {pos:p.clone().add(V3(8,26,0)),tgt:p}; }
function phRender(){
  const cable=IN.phone==="pc", sw=on=>`<i class="ph-sw${on?" on":""}" aria-hidden="true"></i>`, pt=S.glow&&S.hints&&inCur()==="phoneTether"&&!PH.tether?" point":"";
  scrBody.innerHTML=`<div class="ph"><div class="ph-dev"><div class="ph-status"><span>14:36</span><span>4G ▮▮▮ 78%</span></div>
    <div class="ph-head">${t("ph_title")}</div>
    <div class="ph-list"><div class="ph-row"><div><b>${t("ph_hot")}</b><small>${t("ph_off")}</small></div>${sw(false)}</div>
      <button class="ph-row${cable?"":" dim"}${pt}" data-p="usb"><div><b>${t("ph_usb")}</b><small>${!cable?t("ph_usbNo"):PH.tether?t("ph_usbOn"):t("ph_usbD")}</small></div>${sw(PH.tether)}</button>
      <div class="ph-row"><div><b>${t("ph_bt")}</b><small>${t("ph_off")}</small></div>${sw(false)}</div>
      <p class="ph-note">${t("ph_data")}</p></div></div></div>`;
}
scrBody.addEventListener("click",e=>{
  if(SCR.dev!=="phone"||!e.target.closest("[data-p=usb]")) return; startClock();
  if(IN.phone!=="pc"){ toast(t("in_wf_noCable"),"err"); return; }
  PH.tether=!PH.tether; if(PH.tether) toast(t("in_wf_online"),"ok"); phRender(); inCheck();
});
SCREENS.phone={view:phoneView, render:phRender, back:()=>focus("inDesk",900)};

/* ---- wifi: the new Windows' network flyout and Windows Update ---- */
const WU={on:false,k:0,done:false,offline:false};
const WU_ICON=`<svg viewBox="0 0 24 24" fill="none" stroke="#2a6fdb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 12a8 8 0 1 1-2.3-5.7"/><path d="M20 4v5h-5"/></svg>`;
const NET_ICON={off:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="8"/><path d="M4 12h16M12 4c2.5 2.6 2.5 13.4 0 16M12 4c-2.5 2.6-2.5 13.4 0 16"/><path d="M15 15l6 6M21 15l-6 6" stroke="#c42b1c" stroke-width="2.2"/></svg>`,
  eth:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="12" rx="1.5"/><path d="M9 20h6M12 16v4"/></svg>`,
  wifi:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M2.5 9a14 14 0 0 1 19 0M5.5 12.5a9.5 9.5 0 0 1 13 0M8.7 16a5 5 0 0 1 6.6 0"/><circle cx="12" cy="19.3" r="1.2" fill="currentColor"/></svg>`};
function netBtn(){ const k=OW.wifi?"wifi":PH.tether?"eth":"off", pt=S.glow&&S.hints&&(inCur()==="wifiSee"||inCur()==="wifiOn"&&!OW.net)?" point":"";
  return `<button data-o="net" class="${OW.net?"on":""}${pt}" title="${t("net_title")}" aria-label="${t("net_title")}">${NET_ICON[k]}</button>`; }
function netFlyout(){
  const wifi=WU.done?`<div class="net-item">${NET_ICON.wifi}<div><b>Home-WiFi</b><small>${OW.wifi?t("net_connected"):t("net_secured")}</small></div>${OW.wifi?"":`<button class="os-btn pri${S.glow&&S.hints?" point":""}" data-o="wifiCon">${t("net_connect")}</button>`}</div>`
    :`<div class="net-item off">${NET_ICON.wifi}<div><b>Wi-Fi</b><small>${t("net_noAdapter")}</small></div></div>`;
  return `<div class="net-fly" role="dialog" aria-label="${t("net_title")}"><p class="net-h">${t("net_title")}</p>${wifi}
    <div class="net-item${PH.tether?"":" off"}">${NET_ICON.eth}<div><b>${t("net_eth")}</b><small>${PH.tether?t("net_ethOn"):t("net_ethOff")}</small></div></div>
    ${WU.done?"":`<p class="net-tip">${t("net_noAdapterD")}</p>`}</div>`;
}
// the update list: each item downloads, then installs (the Wi-Fi driver first)
const WU_ITEMS=["wu_i1","wu_i2","wu_i3","wu_i4"];
function wuWindow(){
  const h=!WU.on?(WU.offline?t("wu_offline"):t("wu_title")):WU.done?t("wu_done"):t("wu_busy");
  const sub=!WU.on?(WU.offline?t("wu_offlineD"):t("wu_never")):WU.done?t("wu_doneD"):t("wu_busyD");
  const items=WU_ITEMS.map((k,i)=>{ const [p,st]=wuItem(i);
    return `<div class="wu-item"><b>${t(k)}</b><small>${st}</small><div class="pbar"><i style="width:${(p*100).toFixed(0)}%"></i></div></div>`; }).join("");
  return `<section class="win"><header class="win-bar"><span class="win-ic">${WU_ICON}</span><b>${t("wu_set")}</b><button data-o="close" class="x" aria-label="${t("os_close")}">×</button></header>
    <div class="win-body"><div class="wu"><div class="wu-head"><span class="wu-big">${WU_ICON}</span><div><h3>${h}</h3><small>${sub}</small></div>
      ${WU.on?"":`<button class="os-btn pri${S.glow&&S.hints&&inCur()==="wuCheck"?" point":""}" data-o="wuCheck">${t("wu_check")}</button>`}</div>
      ${WU.on?`<div class="wu-list">${items}</div>`:""}</div></div></section>`;
}
// one item's progress (0–1) and its status text
function wuItem(i){ const p=Math.max(0,Math.min(1,(WU.k-i*.12)/.52));
  return [p,p>=1?t("wu_installed"):p<.6?t("wu_dl",{n:Math.round(p/.6*100)}):t("wu_inst",{n:Math.round((p-.6)/.4*100)})]; }
// while it runs, only the bars and their text change, in place (a full redraw replays the window's opening animation: it flickered)
function wuDom(){ scrBody.querySelectorAll(".wu-item").forEach((el,i)=>{ const [p,st]=wuItem(i);
  el.querySelector("small").textContent=st; el.querySelector(".pbar i").style.width=(p*100).toFixed(0)+"%"; }); }
function wuCheck(){
  if(WU.on) return;
  if(!PH.tether){ WU.offline=true; toast(t("wu_offline")); return; }    // no internet: nothing to download
  WU.offline=false; WU.on=true; WU.k=0; let last=0;
  tween(16000,k=>{ WU.k=k; const n=performance.now(); if(n-last>300){ last=n; if(SCR.dev==="pc"&&OW.wu) wuDom(); } },
    ()=>{ WU.k=1; WU.done=true; toast(t("in_wf_drivers"),"ok"); renderScreen(); inCheck(); },k=>k);
}
function owChAct(a){
  switch(a){
    case "net": OW.net=!OW.net; if(OW.net) OW.netSeen=true; return true;
    case "wifiCon": OW.wifi=true; toast(t("in_wf_wifiOk"),"ok"); return true;
    case "wu": OW.wu=true; OW.app=OW.dm=OW.net=false; return true;
    case "wuCheck": wuCheck(); return true;
  }
  return false;
}

/* ---- the 3D side: clicks, the pointer arrow, what glows ---- */
function inChClick(d,id){
  const c=IN.cfg;
  if(d.part==="powerBtn"&&S.powered&&c.bsod&&PC.mode==="bsod"){ startClock(); pressPower(()=>{ pcOff(); closeScreen(); inCheck();   // hold it in: off
    if(IN.bsodN>1&&IN.panelOff) setTimeout(ramLook,950); }); return true; }                        // the second crash: next is the swap
  if(d.part==="sidePanel"&&c.bsod){ startClock();
    if(S.powered){ inMistake("in_m_openOn"); return true; }
    if(inGate("bsodOpen")&&!IN.panelOff) panelOpen(); return true; }
  if(d.part==="ram"&&c.bsod){ startClock(); ramClick(d.ram); return true; }
  if(d.part==="phone"&&c.wifi){ startClock();
    if(IN.phone!=="pc"){ if(inGate("phoneCable")) phonePlug(false); return true; }
    openScreen("phone"); return true; }
  return false;
}
function inChArrow(id){
  switch(id){
    case "bsodOff": return S.powered?wpos(powerBtn):null;
    case "bsodOpen": return sideG.visible?wpos(sideG,.3):null;
    case "bsodRam": return ramPos(IN.frontRam);
    case "bsodRetry": if(S.powered&&PC.mode==="bsod") return wpos(powerBtn);
      if(!S.powered&&IN.bsodN>1&&ramIn(IN.badRam)) return ramPos(IN.badRam); return undefined;
    case "phoneCable": case "phoneTether": return wpos(phoneG,.5);
  }
  return undefined;
}
const inChPowerGlow=id=>(id==="bsodOff"||id==="bsodRetry")&&S.powered&&PC.mode==="bsod";
function inChFrame(id,idle,pulse){
  if(IN.cfg.bsod){ setGlow(panelFrameMat,idle&&id==="bsodOpen"&&sideG.visible,pulse);
    const want=id==="bsodRam"?IN.frontRam:id==="bsodRetry"&&IN.bsodN>1&&ramIn(IN.badRam)?IN.badRam:-1;
    rams.forEach((r,i)=>(r.glow||[]).forEach(m=>setGlow(m,idle&&!S.powered&&i===want,pulse))); }
  if(IN.cfg.wifi) setGlow(phoneMat,idle&&(id==="phoneCable"||id==="phoneTether"),pulse);
}
