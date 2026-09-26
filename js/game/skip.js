/* ---------------- skip a step (hold Ctrl+H) ----------------
   finishStep[id]() puts the scene straight into the state that step leaves behind, without animation,
   then skipStep() advances as if the user had done it. Every step in STEP_IDS needs an entry. */
function seatRamNow(){
  const i=S.held==="ram"?S.ram:rams.findIndex((r,k)=>!S.used["ram"+k]), slot=GOOD.find(g=>!slots[g].used), r=rams[i];
  S.used["ram"+i]=true; r.yaw.visible=true; r.yaw.position.set(SLOT_X[slot],RAM_SEAT,SLOT_Z); r.yaw.rotation.y=0; S.rot.ram=0;
  slots[slot].used=true; setLatches(slot,false,1); S.ram=-1;
}
function seatConnNow(){
  const job=connJob(S.step);
  if(job.choose&&!job.port){ job.port=job.choose==="usb"?RPORTS.find(p=>p.kind==="usb"&&!p.used):rport("hdmiGpu1"); }
  const w=portWorld(job.port), P=job.plug;
  P.outer.visible=true; P.outer.quaternion.copy(w.q); P.outer.position.copy(w.p).addScaledVector(w.out,-.3); P.inner.rotation.x=0;
  S.roll=0; S.job=null; drawConn(job.c);
  if(job.choose){ job.port.used=true; S.connPort=null; S.connPick=null; }
}
function takeCpuNow(){ S.used.cpu=true; S.rot.cpu=0; S.flips=0; cpuYaw.visible=true; cpuYaw.position.set(-7.5,CPU_HOVER,1.2); cpuYaw.rotation.y=0; cpuFlip.rotation.z=0; }
const finishStep={
  leverUp:()=>{ leverPivot.rotation.z=LEVER_UP; },
  takeCpu:takeCpuNow,
  placeCpu:()=>{ takeCpuNow(); cpuYaw.position.set(SX,CPU_SEAT,SZ); targetMat.opacity=0; },
  leverDown:()=>{ leverPivot.rotation.z=0; },
  clips:()=>GOOD.forEach(i=>{ if(!slots[i].open) setLatches(i,true,1); }),
  ram1:seatRamNow, ram2:seatRamNow,
  bracket:()=>{ bracketGroup.visible=false; },
  paste:()=>{ S.used.paste=true; pasteG.visible=false; const y=.98, d=1.25;
    drawPasteLeg(0,V3(SX-d,y,SZ-d),V3(SX+d,y,SZ+d)); drawPasteLeg(1,V3(SX+d,y,SZ-d),V3(SX-d,y,SZ+d)); },
  cooler:()=>{ S.used.cooler=true; S.rot.cooler=0; coolerYaw.visible=true; coolerYaw.position.set(SX,COOLER_SEAT,SZ); coolerYaw.rotation.y=0; pasteDot.scale.set(3.6,.03,3.6); },
  coolerScrews:()=>coolerScrews.forEach((s,i)=>{ if(!s.tight){ s.tight=true; S.tightOrder.push(i); s.g.position.y-=.45; } }),
  fanCable:()=>{ const c=CABLES.fan, h=HEADERS.find(x=>x.ok); fanLead.visible=false; c.plug.visible=true;
    c.plug.position.set(h.x,.3,h.z); c.plug.rotation.y=h.rot; c.state="seated"; drawCable(c); S.fanOn=true; },
  m2Out:()=>{ m2Screw.position.copy(M2_PARK); S.m2screw="parked"; },
  m2In:()=>{ S.used.m2=true; S.rot.m2=0; m2G.visible=true; m2G.position.set(M2_SEAT.x,.45,M2Z); m2G.rotation.set(0,0,0); },
  m2Screw:()=>{ m2Screw.position.set(M2_SCREW.x,.55,M2Z); m2Screw.rotation.y=0; S.m2screw="fastened"; },
  battery:()=>{ S.used.battery=true; S.batFlip=0; batFlip.rotation.z=0; batG.visible=true; batG.rotation.y=0; batG.position.set(BAT_POS.x,BAT_SEAT,BAT_POS.z); },
  psu:()=>{ S.used.psu=true; S.rot.psu=0; psuG.visible=true; psuG.position.copy(PSU_POS); psuG.rotation.y=0; psuScrews.forEach(g=>{ g.visible=true; g.position.x=CX0-.1; }); },
  board:()=>{ boardRoot.position.copy(L); boardRoot.rotation.set(0,0,0); S.rot.board=0; },
  boardScrews:()=>{ S.used.screws=true; boardScrews.forEach(m=>{ m.visible=true; m.position.y=MB_SCREW_Y; }); S.mbScrews=BOARD_HOLES.length; mbScrewHints.visible=false; },
  pcieLatch:()=>{ pcieLatch.rotation.z=PCIE_OPEN; },
  gpu:()=>{ S.used.gpu=true; S.rot.gpu=0; gpuG.visible=true; gpuG.position.set(GPU_X,GPU_SEAT,L.z+3.2); gpuG.rotation.y=0; slotCovers[0].visible=false; pcieLatch.rotation.z=0; },
  sata:()=>{ S.used.sata=true; S.rot.sata=0; sataG.visible=true; sataG.position.copy(SATA_POS); sataG.rotation.y=0; },
  dataSsd:seatConnNow, dataMb:seatConnNow, sataPower:seatConnNow, atx24:seatConnNow, cpu8:seatConnNow, gpuPower:seatConnNow,
  frontPanel:()=>{ const c=CABLES.fp, tg=c.targets().find(x=>x.ok); c.plug.visible=true; c.plug.position.set(tg.x,tg.seatY,tg.z); c.plug.rotation.y=tg.rot; c.state="seated"; drawCable(c); },
  caseFan:()=>{ const c=CABLES.caseFan, tg=c.targets().find(x=>x.ok); c.plug.visible=true; c.plug.position.set(tg.x,tg.seatY,tg.z); c.plug.rotation.y=tg.rot; c.state="seated"; drawCable(c); S.caseFanOn=true; },
  closeCase:()=>closeSidePanel(true),
  usbKeyboard:seatConnNow, usbMouse:seatConnNow, hdmi:seatConnNow, powerCord:seatConnNow
};
function skipStep(){
  if(S.step>=STEPS) return;
  if(S.busy||dragging){ toast(t("e_skipBusy")); return; }
  const id=STEP_IDS[S.step]; startClock();
  finishStep[id]();
  S.held=id==="takeCpu"?"cpu":null; S.snap=null; S.cable=null; S.job=null;   // skipping "take the CPU" leaves it in hand, ready to place
  updateTools(); toast(t("ok_skipped"),"ok"); setStep(S.step+1);
}
