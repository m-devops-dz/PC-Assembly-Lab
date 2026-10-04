/* ---------------- Windows install mode ----------------
   A separate mode (header mode menu; the page reloads into it). The PC starts fully built with the case closed, the
   keyboard and mouse in front of the monitor.
   Scenarios (IN_SCENARIOS). The main one is short: the install stick is ready on the desk, the PC's drives are new.
     main    plug the stick in → power on, F11 → pick the stick → click through Setup → Windows + Data on the M.2 →
             install → wait → sign in (name, "Hi", desktop)
   Everything else is a challenge the student picks from the list in the sidebar (each one starts from a fresh page):
     usb     make the install stick on the laptop (Ventoy, official ISO, copy, eject); MBR passes but the stick is then
             missing from the boot menu, and inRedo() sends the student back (laptop-apps.js, pc-boot.js)
     used    a customer's PC: look at the old Windows, name the drive with their files, then clean the M.2 without
             touching that drive (Delete/Format on it = a 60 s penalty) (old-windows.js, win-setup.js)
     plan    choose how to split the M.2: Windows only / + files / + room for Linux, and what Windows adds (System, MSR)
     finish  copy, take the stick out (why? a question), leave it in and the installer starts again, first start
   Steps are named; a scenario lists the ones it uses. IN_DONE says when each is done and inCheck() moves on after every
   action, so students can work in any order the real tools allow. Ctrl+H skips a step (IN_FINISH). */
const IN_SCENARIOS={
  main:{steps:["stickPc","powerF11","bootPick","setupGo","diskNew","diskInstall","instCopy","login"],disks:"fresh",stick:"ready",plan:2},
  usb:{steps:["stickLaptop","toolDevice","toolInstall","isoSearch","isoDownload","isoCopy","eject","stickPc","powerF11","bootPick"],disks:"used",stick:"blank",laptop:true},
  used:{steps:["oldBoot","oldOpenD","oldRename","oldShutdown","stickPc","powerF11","bootPick","setupGo","diskClean","diskNew","diskInstall"],disks:"used",stick:"ready",plan:1},
  plan:{steps:["diskPlan","diskNew","diskParts","diskInstall"],disks:"fresh",stick:"ready",start:"disk"},
  finish:{steps:["instCopy","removeStick","firstBoot","userName","newDesk"],disks:"fresh",stick:"ready",start:"copy",plan:2,trap:true},
  split:{steps:["dmOpen","dmShrink","dmNew","dmCheck"],disks:"fresh",stick:"none",start:"desktop",plan:1,intro:true},
  car:{steps:["stickLaptop","carCopy","carFormat","carBack","eject"],disks:"used",stick:"blank",laptop:true,intro:true}
};
const IN_ORDER=["main","usb","used","plan","finish","split","car"];
// the sidebar group a step belongs to
const IN_GROUP_OF={stickLaptop:"usb",toolDevice:"usb",toolInstall:"usb",isoSearch:"usb",isoDownload:"usb",isoCopy:"usb",eject:"usb",
  oldBoot:"check",oldOpenD:"check",oldRename:"check",oldShutdown:"check",stickPc:"boot",powerF11:"boot",bootPick:"boot",setupGo:"setup",
  diskClean:"disk",diskPlan:"disk",diskNew:"disk",diskParts:"disk",diskInstall:"disk",instCopy:"end",removeStick:"end",firstBoot:"end",userName:"end",newDesk:"end",login:"end",
  dmOpen:"dm",dmShrink:"dm",dmNew:"dm",dmCheck:"dm",carCopy:"car",carFormat:"car",carBack:"car"};
const inGroup=id=>IN.sc==="car"?"car":IN_GROUP_OF[id];
const IN_SC_ID=IN_SCENARIOS[saved.inSc]?saved.inSc:"main";
const IN={on:appMode==="install", sc:IN_SC_ID, cfg:IN_SCENARIOS[IN_SC_ID], step:0, gen:0,   // gen: goes up when the stick must be remade (STICK.gen must match)
  done:Array.isArray(saved.inDone)?saved.inDone:[],                 // scenarios finished this session
  label:"", plan:0, quizDone:false, mbrFails:0,                     // label: the name given to the customer's drive; plan: how the M.2 is split; mbrFails: MBR sticks missing from the boot menu
  stick:"mat",                                                      // "mat" (blank, by the laptop), "laptop", "table" (on the desk by the PC), "pc"
  port:null, slow:false, picking:false};                            // the PC port it's in; slow: kept in a USB 2.0 port
const IN_STEPS=IN.cfg.steps;
const IS={}; IN_STEPS.forEach((id,i)=>IS[id]=i);
const IN_DONE={
  stickLaptop:()=>IN.stick==="laptop", toolDevice:()=>LAP.dev==="E"&&stickIn(), toolInstall:()=>!!STICK.boot&&STICK.gen===IN.gen,
  isoSearch:()=>LAP.web.found, isoDownload:()=>LAP.dl>=1, isoCopy:()=>STICK.iso, eject:()=>IN.stick==="table",
  oldBoot:()=>OW.seen, oldOpenD:()=>OW.openedD, oldRename:()=>!!IN.label, oldShutdown:()=>OW.shut,
  stickPc:()=>IN.stick==="pc", powerF11:()=>PC.menuSeen||WS.disks==="fresh"&&PC.ventoySeen, bootPick:()=>IN.sc==="usb"?PC.ventoySeen:PC.setup,
  setupGo:()=>WS.custom,
  diskClean:()=>WS.cleaned, diskPlan:()=>IN.plan>0, diskNew:()=>wsLayoutOk(),
  diskParts:()=>WS.seen.sys&&WS.seen.msr&&WS.seen.pri&&(IN.plan===1||WS.seen.files), diskInstall:()=>WS.installing,
  instCopy:()=>WS.copied, removeStick:()=>WS.copied&&IN.stick==="table", firstBoot:()=>WS.oobeDone,
  userName:()=>!!WS.user, newDesk:()=>OW.fresh&&OW.checked, login:()=>OW.fresh,
  dmOpen:()=>DM.opened, dmShrink:()=>DM.shrunk, dmNew:()=>DM.made, dmCheck:()=>DM.checked,
  carCopy:()=>carSaved(), carFormat:()=>CAR.fs==="exFAT", carBack:()=>CAR.fs==="exFAT"&&SONGS.every(s=>CAR.stick.includes(s))
};
// Ctrl+H (and a scenario's starting point): the state each step leaves behind
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
  stickPc:()=>{ stickToPc(inPort("front1"),true); },
  powerF11:()=>{ gptStick(); STICK.iso=true; if(!S.powered) powerUp(); PC.boot++; PC.mode="menu"; PC.sel=0; PC.menuSeen=true; },
  bootPick:()=>{ gptStick(); STICK.iso=true; PC.boot++; PC.ventoySeen=true; if(IN.sc==="usb"){ PC.mode="ventoy"; return; } PC.mode="setup"; PC.setup=true; WS.page="lang"; },
  setupGo:()=>{ if(!S.powered) powerUp(); PC.boot++; PC.mode="setup"; PC.setup=true; Object.assign(WS,{started:true,noKey:true,ed:WS_PRO,license:true,custom:true,page:"disk",msg:null}); },
  diskClean:()=>{ WS.parts=WS.parts.filter(p=>!(p.drive===WS.m2&&p.old)); WS.cleaned=true; WS.sel=m2U(); WS.dlg=null; },
  diskPlan:()=>{ IN.plan=IN.plan||1; inCardEl.hidden=true; },
  diskNew:()=>{ WS.parts=WS.parts.filter(p=>p.drive!==WS.m2||p.old); WS.dlg=null; const plan=IN.plan||1;
    wsNew(plan===1?999:200,true); if(plan===2) wsNew(999,true); if(plan===3) wsNew(wsNewRoom()-150,true); },
  diskParts:()=>{ WS.seen={sys:1,msr:1,pri:1,files:1}; },
  diskInstall:()=>{ WS.sel="p1"; WS.installing=true; WS.page="installing"; WS.prog=0; wsCopy(); },
  instCopy:()=>{ WS.prog=1; if(!WS.copied) wsCopied(); },
  removeStick:()=>stickPcOut(true),
  firstBoot:()=>{ clearInterval(wsCopied.timer); if(IN.stick==="pc"&&IN.cfg.trap) stickPcOut(true); PC.boot++; PC.mode="setup"; WS.page="user"; WS.oobeDone=true; },
  userName:()=>{ WS.draft=WS.draft||t("ob_userPh"); wsUserDone(); },
  newDesk:()=>{ PC.boot++; PC.mode="oldwin"; Object.assign(OW,{fresh:true,view:"desk",app:true,loc:"pc",checked:true}); },
  dmOpen:()=>{ OW.dm=true; DM.opened=true; },
  dmShrink:()=>{ dmPart("c").gb-=400; DM.shrunk=true; DM.sel="u"; DM.dlg=null; },
  dmNew:()=>{ if(!DM.parts.some(p=>p.id==="d")) DM.parts.push({id:"d",gb:dmFree(),fs:"NTFS",letter:"D",label:t("dm_labelSug"),kind:"d"}); DM.made=true; DM.dlg=null; DM.fmt=-1; },
  dmCheck:()=>{ OW.dm=false; OW.app=true; OW.loc="pc"; DM.checked=true; },
  carCopy:()=>{ CAR.desk=[...SONGS]; LAP.dlg=null; },
  carFormat:()=>{ CAR.fs="exFAT"; CAR.stick=[]; CAR.label="MUSIC"; LAP.dlg=null; },
  carBack:()=>{ CAR.stick=[...SONGS]; LAP.dlg=null; },
  login:()=>{ clearInterval(wsCopied.timer); WS.copied=WS.oobeDone=true; WS.user=WS.user||t("ob_userPh"); PC.boot++; PC.mode="oldwin"; Object.assign(OW,{fresh:true,view:"desk",app:false,loc:"pc"}); }
};
const inCur=()=>IN_STEPS[IN.step];
// text that can name the customer's drive ({l}: what the student called it)
const inT=(k,v)=>t(k,{l:IN.label||t("in_labelSug"),...v});
// a step's title and explanation: some depend on the scenario (and partitioning on the plan)
const inStepK=id=>id==="bootPick"&&IN.sc==="usb"?"in_s_bootPickU":id==="stickLaptop"&&IN.sc==="car"?"in_s_stickLaptopC":"in_s_"+id;
const inStepT=id=>t(inStepK(id));
const inStepD=id=>inT(id==="stickPc"&&IN.sc==="used"?"in_s_stickPcdU":id==="diskNew"?(IN.sc==="main"?"in_s_diskNewdM":IN.sc==="used"?"in_s_diskNewdU":IN.plan?"in_s_diskNewd"+IN.plan:"in_s_diskNewd"):inStepK(id)+"d");
// actions that belong to a later step wait for it; steps this scenario doesn't have are always open
function inGate(id){ if(!(id in IS)||IN.step>=IS[id]) return true; toast(t("in_notYet",{s:t("in_s_"+inCur())})); return false; }
function inCheck(){
  let moved=false;
  while(IN.step<IN_STEPS.length&&IN_DONE[inCur()]()){ const id=inCur();
    S.stepMs[IN.step]=performance.now()-(S.stepAt||performance.now()); toast(t("in_okStep",{s:inStepT(id)}),"ok");
    IN.step++; moved=true; }
  if(moved) inStepChanged();
}
function inStepChanged(){ S.stepAt=performance.now(); renderIN(); renderScreen(); const id=inCur();
  if((id==="powerF11"||id==="oldBoot")&&!S.powered) setTimeout(()=>{ if(!S.busy&&!SCR.dev) focus("powerBtn",1000); },900);   // plugged in: over to the power button
  if(id==="diskPlan"&&!IN.plan) setTimeout(inPlanCard,700);
  if(id==="removeStick"&&IN.stick==="pc") setTimeout(()=>inCard(t("in_note"),t("in_rmT"),t("in_rmP"),{cls:"info",
    onOk:()=>{ if(SCR.dev) closeScreen(); setTimeout(inLookAtStick,950); }}),1200);   // copied: the countdown waits for this card, then out to the stick
  if(IN.step>=IN_STEPS.length){ setTimeout(inScDone,1200); return; }
  if(S.card&&(window.innerWidth<=860||isFs())) inStepCard(); }
function inSkip(){
  if(IN.step>=IN_STEPS.length) return;
  if(S.busy||LAP.dlg&&LAP.dlg.kind!=="info"){ toast(t("e_skipBusy")); return; }
  const at=IN.step; startClock(); IN_FINISH[inCur()]();                // a finisher may move the steps on by itself (owShutdown)
  if(IN.step===at&&!IN_DONE[inCur()]()){ IN.step++; inStepChanged(); }   // should not happen; never get stuck
  else inCheck();
  renderScreen(); toast(t("ok_skipped"),"ok");
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
// how to split the M.2 (the plan challenge)
function inPlanCard(){ if(IN.plan||inCur()!=="diskPlan") return; if(!inCardEl.hidden){ setTimeout(inPlanCard,700); return; }   // after any card that is up
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
/* a card over the 3D view: mistakes, a choice (buttons: [{l,fn,pri}]) or the end of a scenario.
   opt: {cls, buttons, onOk, wait (seconds before OK works)} */
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
  document.getElementById("scTitle").textContent=inStepT(inCur()); document.getElementById("scText").textContent=inStepD(inCur());
  const was=stepCard.hidden; stepCard.hidden=false; if(was) document.getElementById("scOk").focus({preventScroll:true}); }
// a scenario reloads the page, the way a troubleshooting case does: every one starts from a clean PC
function inGo(id){ IN.sc=id; persist(); location.reload(); }
// the end of a scenario: congratulations, time and mistakes, OK (the list in the sidebar has the others)
function inScDone(){ S.end=performance.now(); if(!IN.done.includes(IN.sc)) IN.done.push(IN.sc); persist(); renderIN();
  inCard(t("in_sc_"+IN.sc),t("in_congrats"),inT("in_doneP_"+IN.sc)+"\n"+t("in_doneStats",{t:fmtTime(S.end-S.start),m:S.mistakes}),{cls:"good"}); }

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
    if(WS.page==="again"){ toast(t("in_pressPower")); return; }        // Setup is starting over on the screen: the student restarts the PC
    setTimeout(()=>openScreen("pc"),700); };
  if(now||!p){ inStick.position.copy(STICK_PC); inStick.quaternion.copy(q); done(); return; }
  const w=portWorld(p), out=w.p.clone().addScaledVector(w.out,3.5), q0=inStick.quaternion.clone(); S.busy=true;
  tween(450,k=>{ inStick.position.lerpVectors(w.p,out,k); },()=>{
    tween(1100,k=>{ inStick.position.lerpVectors(out,STICK_PC,k); inStick.position.y+=Math.sin(k*Math.PI)*6; inStick.quaternion.slerpQuaternions(q0,q,k); },()=>{ S.busy=false; done(); },easeOut); });
}
// clicks in the 3D view (input.js hands them all here in this mode)
function inClick(d){
  if(S.busy) return; const id=inCur();
  if(d.part==="inStick"){ startClock();
    if(id==="stickLaptop"&&IN.stick!=="laptop"){ stickToLaptop(false); return; }
    if(IN.stick==="laptop"){
      if(IN.step<IS.eject){ toast(t("in_stickBusy")); return; }
      if(!LAP.ejected){ inMistake("in_m_pull"); return; }
      stickOut(false); return; }
    if(IN.stick==="table"&&id==="stickPc"&&IN.sc==="used"){ focus("powerBtn",1000); stickToPc(inPort("front1"),false); return; }   // the customer's PC: straight into the front USB port
    if(IN.stick==="table"&&id==="stickPc"){ if(IN.picking) toast(t("in_pickPort")); else inStartPick(); return; }
    if(IN.stick==="pc"&&id==="removeStick"){ inQuiz(); return; }
    if(IN.stick==="pc"&&id==="instCopy"){ inMistake("in_m_pullEarly"); return; }
    toast(IN.stick==="pc"?t("in_stickBusy"):t("in_notYet",{s:t("in_s_"+id)})); return; }
  if((d.part==="rport"||d.part==="inPort")&&IN.stick==="pc"&&d.port===IN.port){ inClick({part:"inStick"}); return; }
  if(d.part==="rport"||d.part==="inPort"){ if(IN.picking) inPickPort(d.port); return; }
  if(d.part==="powerBtn"){
    if(S.powered&&WS.page==="again"){ if(IN.stick==="pc"){ toast(t("in_stickFirst2"),"err"); return; } startClock(); pcRestartNew(); return; }   // Setup started over: restart it
    if(S.powered){ openScreen("pc"); return; }
    if(id!=="oldBoot"&&id!=="powerF11"&&!(IN.step>IS.powerF11)){ toast(t("in_notYet",{s:t("in_s_"+id)})); return; }
    startClock(); pcPowerOn(); return; }
  if(d.part==="monitor"){ if(S.powered) openScreen("pc"); else toast(t("in_pcOff")); return; }
  if(d.part==="laptop"&&IN.cfg.laptop){ if(IN.stick!=="laptop"&&id==="stickLaptop"){ toast(t("in_e_stickFirst")); return; } startClock(); openScreen("laptop"); return; }
}
const IN_LAPTOP_STEPS=["toolDevice","toolInstall","isoSearch","isoDownload","isoCopy","eject"];
const inStickNext=()=>{ const id=inCur(); return id==="stickLaptop"&&IN.stick!=="laptop"||id==="eject"&&LAP.ejected||id==="stickPc"&&!IN.picking||id==="removeStick"&&IN.stick==="pc"; };
// the pointer arrow: what to click next in the 3D view (nothing while a screen or a card is up)
function inArrow(){
  if(!S.glow||S.busy||SCR.dev||!inCardEl.hidden||IN.step>=IN_STEPS.length) return null;
  const id=inCur();
  if(inStickNext()) return wpos(inStick);
  if(WS.page==="again") return wpos(powerBtn);                       // the stick is out: restart the PC
  if(id==="stickPc") return null;                                     // the free ports glow instead
  if(IN_LAPTOP_STEPS.includes(id)) return laptopView().tgt;
  if(id==="oldBoot"||id==="powerF11") return S.powered?screenView().tgt:wpos(powerBtn);
  return S.powered?screenView().tgt:null;                             // everything else happens on the monitor
}
function inFrame(now){
  if(!IN.on) return;
  const pulse=.5+.5*Math.sin(now/450), id=inCur(), idle=S.glow&&!S.busy&&!SCR.dev;
  setGlow(inStickMat,idle&&inStickNext(),pulse);
  setGlow(powerBtnMat,idle&&((id==="powerF11"||id==="oldBoot")&&!S.powered||WS.page==="again"&&IN.stick!=="pc"),pulse);
  if(IN.picking) IN_PORTS.forEach(p=>{ p.mat.opacity=S.glow&&portFree(p)?.25+.45*pulse:0; });
}
function inStart(){
  document.body.classList.add("in-mode");
  tsBuildAll();                                                          // the whole build, as in troubleshooting
  sideG.visible=true; panelScrews.forEach(g=>g.visible=true);           // ...but the case stays closed: this PC is finished
  inPlaceDeskSet(); inMakePorts();
  const c=IN.cfg; lapG.visible=!!c.laptop; inStick.visible=true; wsSetDisks(c.disks); IN.plan=c.plan||0;
  LAP.web.lng=lang==="ar"?"ar":"en";
  if(c.stick==="ready"){ Object.assign(STICK,{boot:"GPT",gen:0,iso:true}); LAP.iso=isoName(); LAP.dl=1; stickOut(true); }   // made earlier: lying by the PC
  else if(c.stick==="none"){ inStick.visible=false; IN.stick="none"; }
  else stickOnMat();
  if(IN.sc==="car"){ LAP.files.loc="e"; LAP.app="files"; }              // the music stick opens in Files
  showScreen(screenOff,0);
  const v=VIEWS.inDesk; camera.position.copy(viewPos(v.pos,v.tgt)); controls.target.set(...v.tgt); controls.update(); view="inDesk";
  if(c.start){                                                          // challenges that start inside Setup
    stickToPc(inPort("front1"),true); IN_FINISH.setupGo(); WS.sel=m2U();   // in the case's front USB port, in plain view for "Take the stick out"
    if(c.start==="copy"){ IN_FINISH.diskNew(); IN_FINISH.diskInstall(); }
    setTimeout(()=>openScreen("pc"),700); }
  if(c.start==="desktop"){                                              // the new PC, already on its desktop
    powerUp(); PC.mode="oldwin"; Object.assign(OW,{fresh:true,view:"desk"}); WS.user=t("in_owner"); setTimeout(()=>openScreen("pc"),700); }
  if(c.intro) setTimeout(()=>inCard(t("in_note"),t("in_sc_"+IN.sc),t("in_intro_"+IN.sc),{cls:"info"}),1400);
  S.stepAt=performance.now(); renderIN(); inCheck();
  if(inCur()==="diskPlan") setTimeout(inPlanCard,1800);                 // the plan challenge starts on it
  else if(S.card&&(window.innerWidth<=860||isFs())) inStepCard();
}

/* ---- sidebar: this scenario's steps, then the list of scenarios ---- */
function renderIN(){
  const el=document.getElementById("inPanel"); if(!IN.on){ el.hidden=true; return; } el.hidden=false;
  let h=`<p class="module-title">${t("in_title")}</p><h3 class="in-sc">${t("in_sc_"+IN.sc)}</h3><ol class="steps">`, grp=null;
  IN_STEPS.forEach((id,i)=>{ if(inGroup(id)!==grp){ grp=inGroup(id); h+=`<li class="group">${t("in_g_"+grp)}</li>`; }
    const st=i<IN.step?"done":i===IN.step?"current":"todo", m=(S.stepMis[i]||0)>2?" warn":"";
    h+=`<li class="${st}${i<IN.step?m:""}"><span>${inStepT(id)}</span></li>`;
    if(i===IN.step) h+=`<li class="exp"><div class="explain"><h2>${inStepT(id)}</h2><p>${inStepD(id)}</p>${id==="diskPlan"&&!IN.plan?`<p><button class="primary in-plan-btn" data-plan>${t("in_planPick")}</button></p>`:""}</div></li>`; });
  h+=`</ol>`;
  if(IN.step>=IN_STEPS.length) h+=`<div class="ts-win"><b>${t("in_sc_"+IN.sc)} ✓</b><p>${inT("in_doneP_"+IN.sc)}</p><p class="ts-muted">${t("in_doneStats",{t:fmtTime((S.end||performance.now())-S.start),m:S.mistakes})}</p></div>`;
  h+=`<div class="in-ch"><p class="module-title">${t("in_chTitle")}</p><ol class="ts-pick">${IN_ORDER.map(k=>{ const d=IN.done.includes(k);
    return `<li><button data-sc="${k}" class="${d?"solved":""}${k===IN.sc?" cur":""}"><i>${d?"✓":k==="main"?"★":IN_ORDER.indexOf(k)}</i><b>${t("in_sc_"+k)}</b><span>${t("in_scd_"+k)}</span></button></li>`; }).join("")}</ol></div>`;
  el.innerHTML=h;
  el.querySelectorAll("[data-sc]").forEach(b=>b.onclick=()=>inGo(b.dataset.sc));
  el.querySelectorAll("[data-plan]").forEach(b=>b.onclick=inPlanCard);
  const cur=el.querySelector("li.current"); if(cur&&window.innerWidth>860&&!isFs()) cur.scrollIntoView({block:"center"});
  document.getElementById("fsStep").textContent=IN.step>=IN_STEPS.length?t("in_sc_"+IN.sc)+" ✓":(IN.step+1)+"/"+IN_STEPS.length+" · "+inStepT(inCur());
}
