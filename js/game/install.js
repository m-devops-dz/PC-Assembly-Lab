/* ---------------- Windows install mode ----------------
   A separate mode (header mode menu; the page reloads into it). The PC starts fully built with the case closed, the
   keyboard and mouse in front of the monitor. Phases:
   1 make the install USB on the laptop (laptop-apps.js)
   2 check the PC's drives: the old Windows, name the customer's drive (old-windows.js)
   3 start the PC from the stick: USB port, F11, boot menu (pc-boot.js)
   4 Windows Setup, 5 partition the right drive: the M.2, not the customer's SATA SSD, split the way the student
     chose (IN.plan: 1 Windows, 2 + files, 3 + room for Linux) (win-setup.js)
   6 copy, take the stick out (a question first: why?), first start of the new Windows Steps are named (IN_STEPS); IN_DONE says when each one is done, and inCheck() moves on
   after every action, so students can work in any order the real tools allow. Ctrl+H skips a step (IN_FINISH).
   A stick made with MBR passes phase 1 but isn't in the boot menu: inRedo() sends the student back to the laptop, and
   the steps that are still done (the ISO is downloaded) pass again on their own. */
const IN={on:appMode==="install", step:0, gen:0,                 // gen: goes up when the stick must be remade (STICK.gen must match)
  label:"", plan:0, quizDone:false, mbrFails:0,                    // mbrFails: times an MBR stick wasn't in the boot menu                                // plan: how the M.2 is split (1, 2 or 3 partitions)                                                       // the name the student gave the customer's drive D: (phase 2)
  stick:"mat",                                                    // "mat" (start), "laptop", "table" (pulled out, in front of the PC), "pc"
  port:null, slow:false, picking:false, phases:{}};               // the PC port it's in; slow: kept in a USB 2.0 port
const IN_STEPS=["stickLaptop","toolDevice","toolInstall","isoSearch","isoDownload","isoCopy","eject",
  "oldBoot","oldOpenD","oldRename","oldShutdown",
  "stickPc","powerF11","bootPick","isoPick",
  "setupStart","setupKey","setupEdition","setupCustom",
  "diskClean","diskPlan","diskNew","diskParts","diskInstall",
  "instCopy","removeStick","firstBoot","userName","newDesk"];
const IS={}; IN_STEPS.forEach((id,i)=>IS[id]=i);
const IN_GROUPS=[[IS.stickLaptop,"in_g_usb"],[IS.oldBoot,"in_g_check"],[IS.stickPc,"in_g_boot"],[IS.setupStart,"in_g_setup"],[IS.diskClean,"in_g_disk"],[IS.instCopy,"in_g_end"]];
const IN_PHASE_END={eject:1,oldShutdown:2,isoPick:3,setupCustom:4,diskInstall:5,newDesk:6};   // finishing these steps ends a phase: a card says so (once)
const IN_LAST=6, IN_LATER=[];                           // the last phase built; phases still to come, listed greyed out
const IN_DONE={
  stickLaptop:()=>IN.stick==="laptop", toolDevice:()=>LAP.dev==="E"&&stickIn(), toolInstall:()=>!!STICK.boot&&STICK.gen===IN.gen,
  isoSearch:()=>LAP.web.found, isoDownload:()=>LAP.dl>=1, isoCopy:()=>STICK.iso, eject:()=>IN.stick==="table",
  oldBoot:()=>OW.seen, oldOpenD:()=>OW.openedD, oldRename:()=>!!IN.label, oldShutdown:()=>OW.shut,
  stickPc:()=>IN.stick==="pc", powerF11:()=>PC.menuSeen, bootPick:()=>PC.ventoySeen, isoPick:()=>PC.setup,
  setupStart:()=>WS.started, setupKey:()=>WS.noKey, setupEdition:()=>WS.license&&WS.ed===WS_PRO, setupCustom:()=>WS.custom,
  diskClean:()=>WS.cleaned, diskPlan:()=>IN.plan>0, diskNew:()=>wsLayoutOk(),
  diskParts:()=>WS.seen.sys&&WS.seen.msr&&WS.seen.pri&&(IN.plan===1||WS.seen.files), diskInstall:()=>WS.installing,
  instCopy:()=>WS.copied, removeStick:()=>WS.copied&&IN.stick==="table", firstBoot:()=>WS.oobeDone,
  userName:()=>!!WS.user, newDesk:()=>OW.fresh&&OW.checked
};
// Ctrl+H: the state each step leaves behind
const gptStick=()=>Object.assign(STICK,{boot:"GPT",gen:IN.gen,iso:STICK.iso});
const IN_FINISH={
  stickLaptop:()=>stickToLaptop(true), toolDevice:()=>{ LAP.app="tool"; LAP.dev="E"; },
  toolInstall:()=>{ LAP.dev="E"; LAP.tool="done"; LAP.toolP=1; LAP.dlg=null; LAP.style="GPT"; Object.assign(STICK,{boot:"GPT",gen:IN.gen,iso:false}); },
  isoSearch:()=>{ LAP.app="web"; LAP.web.q=t("wb_sug"); LAP.web.page="ms"; LAP.web.found=true; },
  isoDownload:()=>{ LAP.web.ed="x64"; LAP.web.edOk=true; LAP.web.lng=LAP.web.lng||(lang==="ar"?"ar":"en"); LAP.web.lngOk=true; LAP.iso=isoName(); LAP.dl=1; },
  isoCopy:()=>{ LAP.app="files"; LAP.files.loc="e"; LAP.copy=-1; STICK.iso=true; LAP.dlg=null; },
  eject:()=>{ LAP.ejected=true; LAP.dev="D"; stickOut(true); },
  oldBoot:()=>{ if(!S.powered) powerUp(); PC.boot++; PC.mode="oldwin"; OW.view="desk"; OW.seen=true; },
  oldOpenD:()=>{ OW.app=true; OW.loc="d"; OW.openedD=true; },
  oldRename:()=>{ IN.label=t("in_labelSug"); OW.renaming=false; },
  oldShutdown:()=>owShutdown(true),
  stickPc:()=>{ stickToPc(IN_PORTS.find(p=>p.usb3&&portFree(p)),true); },
  powerF11:()=>{ gptStick(); STICK.iso=true; if(!S.powered) powerUp(); PC.boot++; PC.mode="menu"; PC.sel=0; PC.menuSeen=true; },
  bootPick:()=>{ gptStick(); STICK.iso=true; PC.boot++; PC.mode="ventoy"; PC.ventoySeen=true; },
  isoPick:()=>{ PC.boot++; PC.mode="setup"; PC.setup=true; WS.page="lang"; },
  setupStart:()=>{ WS.started=true; WS.page="key"; }, setupKey:()=>{ WS.noKey=true; WS.page="edition"; },
  setupEdition:()=>{ WS.ed=WS_PRO; WS.license=true; WS.page="type"; }, setupCustom:()=>{ WS.custom=true; WS.page="disk"; },
  diskClean:()=>{ WS.parts=WS.parts.filter(p=>!(p.drive===1&&p.old)); WS.cleaned=true; WS.sel="d1u"; WS.dlg=null; },
  diskPlan:()=>{ IN.plan=IN.plan||1; inCardEl.hidden=true; },
  diskNew:()=>{ WS.parts=WS.parts.filter(p=>p.drive===0||p.old); const plan=IN.plan;
    wsNew(plan===1?D1_GB:200); if(plan===2) wsNew(D1_GB); if(plan===3) wsNew(wsNewRoom()-150); },
  diskParts:()=>{ WS.seen={sys:1,msr:1,pri:1,files:1}; },
  diskInstall:()=>{ WS.sel="p1"; WS.installing=true; WS.page="installing"; WS.prog=0; wsCopy(); },
  instCopy:()=>{ WS.prog=1; if(!WS.copied) wsCopied(); },
  removeStick:()=>stickPcOut(true),
  firstBoot:()=>{ clearInterval(wsCopied.timer); if(IN.stick==="pc") stickPcOut(true); PC.boot++; PC.mode="setup"; WS.page="user"; WS.oobeDone=true; },
  userName:()=>{ WS.draft=WS.draft||t("ob_userPh"); wsUserDone(); },
  newDesk:()=>{ PC.boot++; PC.mode="oldwin"; Object.assign(OW,{fresh:true,view:"desk",app:true,loc:"pc",checked:true}); }
};
const inCur=()=>IN_STEPS[IN.step];
// text that can name the customer's drive ({l}: what the student called it in phase 2)
const inT=(k,v)=>t(k,{l:IN.label||t("in_labelSug"),...v});
// a step's explanation; partitioning depends on the plan the student picked
const inStepD=id=>inT(id==="diskNew"&&IN.plan?"in_s_diskNewd"+IN.plan:"in_s_"+id+"d");
function inGate(id){ if(IN.step>=IS[id]) return true; toast(t("in_notYet",{s:t("in_s_"+inCur())})); return false; }
function inCheck(){
  let moved=false, phase=0;
  while(IN.step<IN_STEPS.length&&IN_DONE[inCur()]()){ const id=inCur();
    S.stepMs[IN.step]=performance.now()-(S.stepAt||performance.now()); toast(t("in_okStep",{s:t("in_s_"+id)}),"ok");
    if(IN_PHASE_END[id]&&!IN.phases[IN_PHASE_END[id]]) phase=IN.phases[IN_PHASE_END[id]]=IN_PHASE_END[id];
    IN.step++; moved=true; }
  if(moved) inStepChanged(phase);
}
function inStepChanged(phase){ S.stepAt=performance.now(); renderIN(); renderScreen();
  if((IN.step===IS.powerF11||IN.step===IS.oldBoot)&&!S.powered) setTimeout(()=>{ if(!S.busy&&!SCR.dev) focus("powerBtn",1000); },900);   // plugged in: over to the power button
  if(IN.step===IS.diskPlan&&!IN.plan) setTimeout(inPlanCard,700);
  if(IN.step===IS.removeStick&&IN.stick==="pc") setTimeout(()=>{ if(SCR.dev) closeScreen(); setTimeout(inLookAtStick,950); },1800);   // copied: out to the stick
  if(phase){ setTimeout(()=>inPhaseDone(phase),1200); return; }
  if(IN.step<IN_STEPS.length&&S.card&&(window.innerWidth<=860||isFs())) inStepCard(); }
function inSkip(){
  if(IN.step>=IN_STEPS.length) return;
  if(S.busy||LAP.dlg&&LAP.dlg.kind!=="info"){ toast(t("e_skipBusy")); return; }
  const at=IN.step; startClock(); IN_FINISH[inCur()]();                // a finisher may move the steps on by itself (owShutdown)
  if(IN.step===at&&!IN_DONE[inCur()]()){ IN.step++; inStepChanged(); }   // should not happen; never get stuck
  else inCheck();
  toast(t("ok_skipped"),"ok");
}
function inMistake(key,onOk){ mistake(); shakeRed(); inCard(t("in_err"),inT(key+"_t"),inT(key),{onOk}); }
// the serious one: the customer's files would be gone. A mistake, plus a minute to read why before going on.
function inPenalty(key){ mistake(); shakeRed(); inCard(t("in_fatal"),inT(key+"_t"),inT(key)+"\n"+t("in_restored"),{cls:"fatal",wait:60}); }
// the stick has to be remade (wipe: with a new install; otherwise only the ISO is missing). The PC goes off, the
// student takes the stick back to the laptop; steps that are still done pass again by themselves.
function inRedo(wipe){
  pcOff(); closeScreen(); if(wipe) IN.gen++;
  setTimeout(inLookAtStick,950);                                         // after the screen's own way back to the desk
  PC.menuSeen=PC.ventoySeen=false; IN.step=IS.stickLaptop;
  toast(t("in_redo")); inStepChanged();
}
// how to split the M.2: asked once the old partitions are gone
function inPlanCard(){ if(IN.plan||IN.step!==IS.diskPlan) return; if(!inCardEl.hidden){ setTimeout(inPlanCard,700); return; }   // after any card that is up
  inCard(t("in_note"),t("in_plan_t"),inT("in_plan"),{cls:"info choice",buttons:[3,2,1].map(n=>({l:t("in_plan"+n),pri:true,
    fn:()=>{ IN.plan=n; toast(t("in_planOk"+n),"ok"); renderIN(); inCheck(); }}))}); }
// why take the stick out? asked before it comes out (once); a wrong answer is a mistake and the question comes back
function inQuiz(){
  if(IN.quizDone){ stickPcOut(false); return; }
  const ks=shuffle(["a","b","c"]);
  inCard(t("in_q"),t("in_q_t"),t("in_q_p"),{cls:"info choice",buttons:ks.map(k=>({l:t("in_q_"+k),pri:true,fn:()=>{
    if(k==="a"){ IN.quizDone=true; toast(t("in_q_ok"),"ok"); stickPcOut(false); }
    else { mistake(); shakeRed(); toast(t("in_q_no"),"err"); setTimeout(inQuiz,500); } }}))});
}
/* a card over the 3D view: mistakes, a choice (buttons: [{l,fn,pri}]) or the end of a phase.
   opt: {cls, buttons, onOk} */
const inCardEl=document.getElementById("inCard"), icBtns=document.getElementById("icBtns"), icOk=document.getElementById("icOk");
let icOnOk=null;
function inCard(top,title,text,opt={}){ document.getElementById("icNum").textContent=top; document.getElementById("icTitle").textContent=title;
  document.getElementById("icText").innerHTML=text.split("\n").map(p=>`<p>${p}</p>`).join("");
  inCardEl.className="quiz step-card in-card"+(opt.cls?" "+opt.cls:""); icOnOk=opt.onOk||null;
  clearInterval(inCard.timer); icOk.disabled=false; icOk.textContent=t("ok");
  if(opt.wait){ let n=opt.wait; const tick=()=>{ icOk.textContent=n>0?t("in_wait",{s:n}):t("ok"); icOk.disabled=n>0; if(n--<=0) clearInterval(inCard.timer); };
    tick(); inCard.timer=setInterval(tick,1000); }
  const bs=opt.buttons||[]; icBtns.hidden=!bs.length; icOk.hidden=!!bs.length; icBtns.innerHTML="";
  bs.forEach(b=>{ const el=document.createElement("button"); el.className=b.pri?"primary":"chip-btn"; el.textContent=b.l; el.onclick=()=>{ inCardEl.hidden=true; b.fn(); }; icBtns.appendChild(el); });
  inCardEl.hidden=false; (bs.length?icBtns.firstChild:icOk).focus({preventScroll:true}); }
function inCardOk(){ if(inCardEl.hidden||icOk.disabled) return; inCardEl.hidden=true; const f=icOnOk; icOnOk=null; if(f) f(); }
icOk.onclick=inCardOk;
inCardEl.addEventListener("keydown",e=>{ if(e.key==="Escape"&&icBtns.hidden) inCardOk(); });
function inStepCard(){ if(IN.step>=IN_STEPS.length) return;
  document.getElementById("scNum").textContent=t("stepN",{n:IN.step+1,m:IN_STEPS.length});
  document.getElementById("scTitle").textContent=t("in_s_"+inCur()); document.getElementById("scText").textContent=inStepD(inCur());
  const was=stepCard.hidden; stepCard.hidden=false; if(was) document.getElementById("scOk").focus({preventScroll:true}); }
function inPhaseDone(n){ const last=IN.step>=IN_STEPS.length; if(last) S.end=performance.now(); renderIN();
  inCard(t("in_phase",{n}),t("in_p"+n+"_t"),inT("in_p"+n,{t:fmtTime((S.end||performance.now())-S.start),m:S.mistakes}),
    {cls:"good",onOk:()=>{ if(!last&&S.card&&(window.innerWidth<=860||isFs())) inStepCard(); }}); }

/* ---- the 3D side: the desk, the stick, the laptop, the PC's USB ports ---- */
VIEWS.inDesk={pos:[124,78,10],tgt:[36,4,-46]};                       // laptop, PC and monitor
// keyboard and mouse turned to face the monitor (they sit behind the case in the other modes), cables rerouted round the case's top end.
// Keyboard and mouse move from the two USB 2.0 ports to the USB 3 pair under the LAN port, so both USB 2.0 ports are free for the stick.
function inPlaceDeskSet(){
  const yaw=Math.PI+MON_YAW, face=V3(Math.cos(MON_YAW),0,-Math.sin(MON_YAW)), right=V3(-face.z,0,face.x).negate();   // right: the typist's right hand
  const at=MON_POS.clone().addScaledVector(face,15).addScaledVector(right,-9);   // a little to the typist's left, so the mouse has room
  kbSet.rotation.y=yaw; kbSet.position.copy(at).sub(V3(KB_POS.x,0,KB_POS.z).applyAxisAngle(V3(0,1,0),yaw));
  mouseG.position.z=KB_POS.z+28;
  const back=(dx,dz)=>kbSet.localToWorld(V3(KB_POS.x+KB_D/2+dx,.3,KB_POS.z+dz));
  kbSet.updateMatrixWorld(true);
  const replug=(c,from,to)=>{ const a=rport(from), b=rport(to); if(!a.used||b.used) return; a.used=false; b.used=true;
    const w=portWorld(b), P=c.a; P.outer.quaternion.copy(w.q); P.outer.position.copy(w.p).addScaledVector(w.out,-.3); };
  replug(CONN.usbKb,"usb2a","usb31a"); replug(CONN.usbMouse,"usb2b","usb31b");
  CONN.usbKb.via=()=>[back(2.5,-26),V3(CX1+3,.3,CZ0-5),V3(CX0-5,.3,CZ0-5)];
  CONN.usbMouse.via=()=>[back(4,22),back(4,-27.5),V3(CX1+4.2,.3,CZ0-6.2),V3(CX0-6.2,.3,CZ0-6.2)];
  drawConn(CONN.usbKb); drawConn(CONN.usbMouse);
}
// USB-A ports the stick can go in: the rear ones (RPORTS, black = USB 2.0, red = USB 3) and the two blue ones on the case front.
// Each port frame's +x points into the port, its y across the slot's short side.
const IN_PORTS=[];
function inMakePorts(){
  RPORTS.filter(p=>p.kind==="usb").forEach(p=>IN_PORTS.push({id:p.id,usb3:!p.id.startsWith("usb2"),frame:p.frame,hint:p.hint,mat:p.mat,rp:p}));
  [L.z-11.6,L.z-10.3].forEach((z,i)=>{ const f=new T.Group(); f.position.set(CX1+.27,10,z);
    f.quaternion.setFromAxisAngle(V3(0,1,0),Math.PI).multiply(new T.Quaternion().setFromAxisAngle(V3(1,0,0),Math.PI/2)); caseG.add(f);   // facing in, slot standing up
    const mat=new T.MeshBasicMaterial({color:0xffc400,transparent:true,opacity:0,depthWrite:false});
    const hint=mesh(box(.12,.6,1.3),mat,[-.1,0,0],f,{cast:false}); hint.userData={part:"inPort",port:"front"+(i+1)}; hint.visible=false;
    IN_PORTS.push({id:"front"+(i+1),usb3:true,frame:f,hint,mat}); });
}
const inPort=id=>IN_PORTS.find(p=>p.id===id);
const portFree=p=>!(p.rp&&p.rp.used)&&IN.port!==p.id;
function stickOnMat(){ inStick.position.copy(STICK_DESK); inStick.rotation.set(0,.6,0); }
// arc the stick from wherever it is to a spot in front of a port, then push it in. pre: outside the port, seat: in it
function stickFly(pre,seat,q,done){
  const p0=inStick.position.clone(), q0=inStick.quaternion.clone(), up=Math.max(5,(pre.y-p0.y)+4); S.busy=true;
  tween(1100,k=>{ inStick.position.lerpVectors(p0,pre,k); inStick.position.y+=Math.sin(k*Math.PI)*up; inStick.quaternion.slerpQuaternions(q0,q,k); },()=>{
    tween(500,k=>{ inStick.position.lerpVectors(pre,seat,k); },()=>{ S.busy=false; done(); },easeOut); },easeOut);
}
// into the laptop's right-side port (now: no animation, for Ctrl+H)
function stickToLaptop(now){
  const w=lapPortWorld(), pre=w.p.clone().addScaledVector(w.in,-3), q=new T.Quaternion().setFromAxisAngle(V3(0,1,0),Math.PI/2).premultiply(lapG.quaternion);
  const done=()=>{ IN.stick="laptop"; IN.port=null; LAP.ejected=false; };
  if(now){ inStick.position.copy(w.p); inStick.quaternion.copy(q); done(); return; }
  focusPoint(w.p.clone().add(V3(12,9,-15)),w.p.clone(),1000);
  stickFly(pre,w.p,q,()=>{ done(); lapNote("os_usbIn","os_usbInD"); inCheck(); setTimeout(()=>openScreen("laptop"),500); });
}
// pulled out of the laptop and laid down in front of the PC
const STICK_PC=V3(40,DESK.y+.4,-38);                              // on the desk in front of the case, in plain view
function stickOut(now){
  const q=new T.Quaternion().setFromEuler(new T.Euler(0,-.4,0));
  if(now){ inStick.position.copy(STICK_PC); inStick.quaternion.copy(q); IN.stick="table"; return; }
  const w=lapPortWorld(), out=w.p.clone().addScaledVector(w.in,-3.5), q0=inStick.quaternion.clone(); S.busy=true;
  tween(450,k=>{ inStick.position.lerpVectors(w.p,out,k); },()=>{
    tween(1000,k=>{ inStick.position.lerpVectors(out,STICK_PC,k); inStick.position.y+=Math.sin(k*Math.PI)*5; inStick.quaternion.slerpQuaternions(q0,q,k); },()=>{ S.busy=false; IN.stick="table"; inCheck(); },easeOut); });
}
// choosing a PC port: the camera goes to the back panel, free ports glow (the front ones too)
// choosing starts close on the two USB 2.0 ports (the easy pick); after the USB 2.0 card the camera pulls back to show them all
function inStartPick(){ IN.picking=true; S.connPick="in"; IN_PORTS.forEach(p=>{ if(!p.rp) p.hint.visible=true; });
  const a=portWorld(rport("usb2a")), b=portWorld(rport("usb2b")), c=a.p.clone().lerp(b.p,.5);
  focusPoint(c.clone().addScaledVector(a.out,9).add(V3(0,3,2.5)),c,1000); toast(t("in_pickPort")); }
function inAllPorts(){ const ps=IN_PORTS.filter(p=>p.rp).map(p=>portWorld(p)), c=ps.reduce((a,w)=>a.add(w.p),V3(0,0,0)).multiplyScalar(1/ps.length);
  focusPoint(c.clone().addScaledVector(ps[0].out,20).add(V3(0,7,3)),c,1000); toast(t("in_pickUsb3")); }   // every rear USB port in view
// a camera on the stick wherever it is: the back panel or the front of the case
function inLookAtStick(){ const p=IN.port&&inPort(IN.port); if(IN.stick!=="pc"||!p) return;
  const w=portWorld(p), c=w.p.clone().addScaledVector(w.out,2); focusPoint(c.clone().addScaledVector(w.out,13).add(V3(0,6,4)),c,1000); }
function inPickPort(id){
  const p=inPort(id); if(!p||S.busy) return;
  if(!portFree(p)){ toast(t("e_portUsed"),"err"); return; }
  if(!p.usb3){ inCard(t("in_note"),t("in_usb2_t"),t("in_usb2"),{cls:"info",buttons:[{l:t("in_usb2_move"),pri:true,fn:inAllPorts},{l:t("in_usb2_keep"),fn:()=>stickToPc(p,false)}]}); return; }
  stickToPc(p,false);
}
function stickToPc(p,now){
  const w=portWorld(p), q=w.q.clone().multiply(new T.Quaternion().setFromAxisAngle(V3(0,1,0),Math.PI));   // the stick's metal end (−x) into the port (+x)
  const done=()=>{ IN.stick="pc"; IN.port=p.id; IN.slow=!p.usb3; IN.picking=false; S.connPick=null; IN_PORTS.forEach(x=>{ x.mat.opacity=0; if(!x.rp) x.hint.visible=false; }); };
  if(now){ inStick.position.copy(w.p); inStick.quaternion.copy(q); done(); return; }
  stickFly(w.p.clone().addScaledVector(w.out,3),w.p,q,()=>{ done(); if(IN.slow) toast(t("in_usb2_kept")); inCheck(); });
}
// out of the PC and back onto the desk (after the copy). If the PC already restarted into the stick, it now starts the new Windows.
function stickPcOut(now){
  const p=inPort(IN.port), q=new T.Quaternion().setFromEuler(new T.Euler(0,-.4,0));
  const done=()=>{ IN.stick="table"; IN.port=null; inCheck();
    if(now) return;
    if(PC.mode==="ventoy"&&WS.installing){ toast(t("in_restartNow")); setTimeout(()=>{ openScreen("pc"); pcFirstBoot(); },900); }
    else setTimeout(()=>openScreen("pc"),700); };
  if(now||!p){ inStick.position.copy(STICK_PC); inStick.quaternion.copy(q); done(); return; }
  const w=portWorld(p), out=w.p.clone().addScaledVector(w.out,3.5), q0=inStick.quaternion.clone(); S.busy=true;
  tween(450,k=>{ inStick.position.lerpVectors(w.p,out,k); },()=>{
    tween(1100,k=>{ inStick.position.lerpVectors(out,STICK_PC,k); inStick.position.y+=Math.sin(k*Math.PI)*6; inStick.quaternion.slerpQuaternions(q0,q,k); },()=>{ S.busy=false; done(); },easeOut); });
}
// clicks in the 3D view (input.js hands them all here in this mode)
function inClick(d){
  if(S.busy) return;
  if(d.part==="inStick"){ startClock();
    if(IN.step===IS.stickLaptop&&IN.stick!=="laptop"){ stickToLaptop(false); return; }
    if(IN.stick==="laptop"){
      if(IN.step<IS.eject){ toast(t("in_stickBusy")); return; }
      if(!LAP.ejected){ inMistake("in_m_pull"); return; }
      stickOut(false); return; }
    if(IN.stick==="table"&&IN.step===IS.stickPc){ if(IN.picking) toast(t("in_pickPort")); else inStartPick(); return; }
    if(IN.stick==="pc"&&IN.step===IS.removeStick){ inQuiz(); return; }
    if(IN.stick==="pc"&&IN.step===IS.instCopy){ inMistake("in_m_pullEarly"); return; }
    toast(IN.stick==="pc"?t("in_stickBusy"):t("in_notYet",{s:t("in_s_"+inCur())})); return; }
  if((d.part==="rport"||d.part==="inPort")&&IN.stick==="pc"&&d.port===IN.port){ inClick({part:"inStick"}); return; }
  if(d.part==="rport"||d.part==="inPort"){ if(IN.picking) inPickPort(d.port); return; }
  if(d.part==="powerBtn"){
    if(S.powered){ openScreen("pc"); return; }
    if(IN.step!==IS.oldBoot&&IN.step<IS.powerF11){ toast(t("in_notYet",{s:t("in_s_"+inCur())})); return; }
    startClock(); pcPowerOn(); return; }
  if(d.part==="monitor"){ if(S.powered) openScreen("pc"); else toast(t("in_pcOff")); return; }
  if(d.part==="laptop"){ if(IN.stick!=="laptop"&&IN.step<=IS.stickLaptop){ toast(t("in_e_stickFirst")); return; } startClock(); openScreen("laptop"); return; }
}
// the pointer arrow: what to click next in the 3D view (nothing while a screen is up)
function inArrow(){
  if(!S.glow||S.busy||SCR.dev||!inCardEl.hidden||IN.step>=IN_STEPS.length) return null;
  const s=IN.step;
  if(s===IS.stickLaptop||(s===IS.eject&&LAP.ejected)||(s===IS.stickPc&&!IN.picking)) return wpos(inStick);
  if(s===IS.stickPc) return null;                                     // the free ports glow instead
  if(s===IS.removeStick&&IN.stick==="pc") return wpos(inStick);
  if(s>=IS.powerF11||s>=IS.oldBoot&&s<IS.stickPc) return S.powered?screenView().tgt:wpos(powerBtn);
  return laptopView().tgt;
}
function inFrame(now){
  if(!IN.on) return;
  const pulse=.5+.5*Math.sin(now/450), s=IN.step, idle=S.glow&&!S.busy&&!SCR.dev;
  setGlow(inStickMat,idle&&(s===IS.stickLaptop&&IN.stick!=="laptop"||s===IS.eject&&LAP.ejected||s===IS.stickPc&&!IN.picking||s===IS.removeStick&&IN.stick==="pc"),pulse);
  setGlow(powerBtnMat,idle&&(s===IS.powerF11||s===IS.oldBoot)&&!S.powered,pulse);
  if(IN.picking) IN_PORTS.forEach(p=>{ p.mat.opacity=S.glow&&portFree(p)?.25+.45*pulse:0; });
}
function inStart(){
  document.body.classList.add("in-mode");
  tsBuildAll();                                                          // the whole build, as in troubleshooting
  sideG.visible=true; panelScrews.forEach(g=>g.visible=true);           // ...but the case stays closed: this PC is finished
  inPlaceDeskSet(); inMakePorts(); lapG.visible=true; inStick.visible=true; stickOnMat();
  showScreen(screenOff,0);
  const v=VIEWS.inDesk; camera.position.copy(viewPos(v.pos,v.tgt)); controls.target.set(...v.tgt); controls.update(); view="inDesk";
  S.stepAt=performance.now(); renderIN();
  if(S.card&&(window.innerWidth<=860||isFs())) inStepCard();
}

/* ---- sidebar ---- */
function renderIN(){
  const el=document.getElementById("inPanel"); if(!IN.on){ el.hidden=true; return; } el.hidden=false;
  let h=`<p class="module-title">${t("in_title")}</p><ol class="steps">`;
  IN_STEPS.forEach((id,i)=>{ const g=IN_GROUPS.find(([at])=>at===i); if(g) h+=`<li class="group">${t(g[1])}</li>`;
    const st=i<IN.step?"done":i===IN.step?"current":"todo", m=(S.stepMis[i]||0)>2?" warn":"";
    h+=`<li class="${st}${i<IN.step?m:""}"><span>${t("in_s_"+id)}</span></li>`;
    if(i===IN.step) h+=`<li class="exp"><div class="explain"><h2>${t("in_s_"+id)}</h2><p>${inStepD(id)}</p></div></li>`; });
  h+=`</ol>`;
  if(IN.step>=IN_STEPS.length) h+=`<div class="ts-win"><b>${t("in_p"+IN_LAST+"_t")}</b><p>${inT("in_p"+IN_LAST,{t:fmtTime((S.end||performance.now())-S.start),m:S.mistakes})}</p></div>`;
  if(IN_LATER.length) h+=`<div class="in-later"><p class="module-title">${t("in_soon")}</p><ul>${IN_LATER.map(k=>`<li>${t(k)}</li>`).join("")}</ul></div>`;
  el.innerHTML=h;
  const cur=el.querySelector("li.current"); if(cur&&window.innerWidth>860&&!isFs()) cur.scrollIntoView({block:"center"});
  document.getElementById("fsStep").textContent=IN.step>=IN_STEPS.length?t("in_p"+IN_LAST+"_t"):(IN.step+1)+"/"+IN_STEPS.length+" · "+t("in_s_"+inCur());
}
