function focusPoint(pos,tgt,dur=900){ pos=viewPos(pos.toArray(),tgt.toArray()); const p0=camera.position.clone(), t0=controls.target.clone(); tween(dur,k=>{ camera.position.lerpVectors(p0,pos,k); controls.target.lerpVectors(t0,tgt,k); }); }
function clickConn(id){
  const job=connJob(S.step);
  if(S.busy) return;
  if(job&&job.choose==="usb"&&id==="hdmi"&&!S.held){ toast(t("e_hdmiNotUsb"),"err"); flashHdmi(); return; }   // keyboard/mouse step: that's the monitor's cable
  if(!job||job.c.id!==id||S.held){ toast(t("e_notNow")); return; }
  if(job.choose&&!job.port){ S.connPick=job.choose; toast(t(job.choose==="usb"?"pick_usb":"pick_hdmi")); return; }   // next: click a port
  if(job.pick&&!S.connPort){ S.connPick="sata"; toast(t(job.c.id==="power"?"pick_sataPower":job.pick==="mb"?"pick_sataMb":"pick_sataSsd")); return; }
  const w=portWorld(job.port), pre=w.p.clone().addScaledVector(w.out,2.4), P=job.plug;
  const p0=P.outer.position.clone(), q0=P.outer.quaternion.clone(), r0=P.inner.rotation.x;
  S.roll=1+Math.floor(Math.random()*3); S.job=job; S.busy=true;
  const side=V3(0,0,1).applyQuaternion(w.q), hold=holdFor(job), end=hold?hold.pos:pre, qEnd=hold?hold.q:w.q;
  if(hold) focusPoint(hold.cam,hold.tgt,1000);
  else if(job.c.id==="gpu8"){ const v=VIEWS.gpuPwrPlug; focusPoint(V3(...v.pos),V3(...v.tgt),1000); }   // step back: the whole card and the socket at its end
  else if(w.out.y>.9){ const latch=V3(0,1,0).applyQuaternion(w.q);                 // top-entry header (24-pin, CPU 8-pin): look down from the latch side
    const cam=w.p.clone().add(V3(0,14,0)).addScaledVector(latch,10).addScaledVector(side,4);
    cam.x=Math.min(Math.max(cam.x,CX0+2.5),CX1-2.5); cam.z=Math.min(Math.max(cam.z,CZ0+2.5),CZ1-2.5);   // stay inside the case walls (CPU_PWR1 is next to the top wall)
    focusPoint(cam,w.p.clone(),1000); }
  else { const far=job.c.id==="ac"?5.5:1;                                      // the power-cord plug is long: step back so plug and socket both fit
    focusPoint(w.p.clone().addScaledVector(w.out,5.5*far).add(V3(0,4.2*far,0)).addScaledVector(side,3.2*far),w.p.clone(),1000); }
  tween(1000,k=>{ P.outer.position.lerpVectors(p0,end,k); P.outer.position.y+=Math.sin(k*Math.PI)*2.5; P.outer.quaternion.slerpQuaternions(q0,qEnd,k); P.inner.rotation.x=r0+(S.roll*Math.PI/2-r0)*k; drawConn(job.c); },
    ()=>{ S.busy=false; S.held="conn"; updateTools(); drawConn(job.c); });
}
function rollConn(dir){ const job=S.job, P=job.plug, r0=P.inner.rotation.x, r1=(S.roll+=dir)*Math.PI/2; S.busy=true; renderKeyView();
  tween(300,k=>{ P.inner.rotation.x=r0+(r1-r0)*k; drawConn(job.c); },()=>{ S.busy=false; drawConn(job.c); }); }   // the wires follow the plug as it turns
function insertConn(){
  const job=S.job, P=job.plug, w=portWorld(job.port), pre=w.p.clone().addScaledVector(w.out,2.4), hold=holdFor(job);
  S.busy=true;
  if(hold) swingPlug(P,job.c,hold.pos,pre,hold.q,w.q,()=>seatConn(job,w,pre,hold)); else seatConn(job,w,pre,null);
}
// L plugs wait beside the port: swing in line first, and back out again if the L doesn't match
function swingPlug(P,c,a,b,qa,qb,done){ tween(450,k=>{ P.outer.position.lerpVectors(a,b,k); P.outer.quaternion.slerpQuaternions(qa,qb,k); drawConn(c); },done); }
function seatConn(job,w,pre,hold){
  const P=job.plug;
  if(mod(S.roll,4)!==0){ mistake(); toast(t(job.err||"e_Lshape"),"err");
    tween(600,k=>{ P.outer.position.copy(pre).addScaledVector(w.out,-Math.sin(k*Math.PI)*1.9); drawConn(job.c); },
      ()=>{ if(hold) swingPlug(P,job.c,pre,hold.pos,w.q,hold.q,()=>{ S.busy=false; }); else S.busy=false; }); return; }
  const seatP=w.p.clone().addScaledVector(w.out,-.3); S.busy=true; S.held=null; updateTools();
  tween(700,k=>{ P.outer.position.lerpVectors(pre,seatP,k); drawConn(job.c); },()=>{ S.busy=false; drawConn(job.c); toast(t(job.ok,{s:job.pick==="mb"?"SATA"+(mbSata.indexOf(job.port)+1):""}),"ok"); S.job=null;
    if(job.choose) job.port.used=true;
    if(job.pick) S.connPort.used=true;
    if(job.choose||job.pick){ S.connPort=null; S.connPick=null; }
    const nx=S.step+1, v=nextConnView(nx); if(v) focusPoint(v.pos,v.tgt,900); else focus(viewFor(nx),900); setStep(nx); },easeOut);
}
// SATA plugs (L-keyed): while held, the plug floats beside the port with its face turned to a 45° camera,
// so the plug's L and the port's L are both in view. Plug on one side of the port, camera on the other so it doesn't block.
const isLJob=job=>job.c.id==="data"||job.c.id==="power";
function lHold(job){ const w=portWorld(job.port), side=V3(0,0,1).applyQuaternion(w.q);
  if(side.z<0) side.negate();                                                  // camera toward the front of the case
  const h=w.out.clone().add(side).normalize(), pos=w.p.clone().addScaledVector(w.out,3).addScaledVector(side,-2.2).add(V3(0,1.2,0));   // lifted, clear of the board edge
  const q=new T.Quaternion().setFromUnitVectors(w.out.clone().negate(),h).multiply(w.q);   // plug face (+x) turned from the port toward the camera
  const tgt=w.p.clone().lerp(pos,.5);
  return {pos,q,tgt,cam:tgt.clone().addScaledVector(h,6).add(V3(0,6,0))}; }
// HDMI and USB: the plug waits out in front of the port, turned 180° so its keyed face looks at the camera beside the port.
// Turned about the port's own up axis, so the plug's cut corners point the same way as the port's.
function faceHold(job){ const w=portWorld(job.port), up=V3(0,1,0).applyQuaternion(w.q), s=V3(0,0,0).crossVectors(w.out,V3(0,1,0)).normalize();
  const pos=w.p.clone().addScaledVector(w.out,5.6).addScaledVector(s,2.6), q=new T.Quaternion().setFromAxisAngle(up,Math.PI).multiply(w.q);
  const tgt=w.p.clone().lerp(pos,.5);
  return {pos,q,tgt,cam:tgt.clone().addScaledVector(w.out,11).add(V3(0,2.5,0))}; }
const holdFor=job=>isLJob(job)?lHold(job):job.c.id==="hdmi"||job.choose==="usb"?faceHold(job):null;
// SATA data cable: frame the port and the other end, which is already plugged in or lying loose
function dataView(job){ const w=portWorld(job.port), o=portWorld(job.key==="A"?mbSata[0]:ssdData).p, c=w.p.clone().lerp(o,.5);
  return {pos:c.clone().add(V3(0,11,11)).addScaledVector(w.out,3.5),tgt:c}; }
// SATA steps stay close in: the data cable (right after the SSD is mounted), its board end, then the SSD's power plug and its port
function nextConnView(n){
  if(n===ST.dataSsd||n===ST.dataMb) return dataView(connJob(n));
  if(n===ST.sataPower){ const P=CONN.power.a; P.outer.updateMatrixWorld(true);
    const c=portWorld(ssdPower).p.lerp(plugBack(P),.5); return {pos:c.clone().add(V3(1,15,6)),tgt:c}; }   // stay inside the case's bottom wall
  return null;
}
// peripherals: after clicking a cable, the user clicks the port they want it in
const GPU_HDMI_VIEW=()=>{ const ps=RPORTS.filter(p=>p.parent===gpuG).map(p=>portWorld(p).p), c=ps.reduce((a,p)=>a.add(p),V3(0,0,0)).multiplyScalar(1/ps.length);
  focusPoint(c.clone().add(V3(-14,4,-6)),c,900); };                          // frames all of the card's outputs
function clickRearPort(id){
  if(S.busy||S.held) return;
  const p=rport(id), job=connJob(S.step);
  if(!job||!job.choose){ toast(t("e_notNow")); return; }
  if(!S.connPick){ toast(t(job.choose==="usb"?"e_pickUsbFirst":"e_pickHdmiFirst")); return; }
  if(p.used){ toast(t("e_portUsed"),"err"); return; }
  if(job.choose==="usb"&&p.kind!=="usb"){ mistake(); toast(t("e_notUsb"),"err"); return; }
  if(job.choose==="hdmi"){
    // motherboard HDMI: a warning, not a mistake (it would work, on the iGPU). Point them at the card's ports.
    if(p.kind==="hdmiMb"){ S.hdmiWarned=true; toast(t("e_hdmiBoard"),"err",true); GPU_HDMI_VIEW(); return; }
    if(p.kind==="dp"){ mistake(); toast(t("e_hdmiDp"),"err"); return; }
    if(p.kind!=="hdmiGpu"){ mistake(); toast(t("e_notHdmi"),"err"); return; }
  }
  S.connPort=p; clickConn(job.c.id);
}
// SATA: after clicking a SATA plug, the user clicks the port it goes in
function clickSataPort(id){
  if(S.busy||S.held) return;
  const s=SPORTS.find(p=>p.id===id), job=connJob(S.step);
  if(!job||!job.pick){ toast(t("e_notNow")); return; }
  if(S.connPick!=="sata"){ toast(t(job.c.id==="power"?"e_pickSataPowerFirst":"e_pickSataFirst")); return; }
  if(s.kind!==job.c.id){ mistake(); toast(t(job.c.id==="power"?"e_sataNotPower":"e_sataNotData"),"err"); return; }
  if(s.used){ toast(t("e_portUsed"),"err"); return; }
  if(s.dev!==job.pick){ toast(t(job.pick==="ssd"?"e_sataSsdEnd":"e_sataMbEnd")); return; }   // right kind of port, wrong end of the cable: not a mistake
  if(S.step===ST.dataMb) S.sataMb=s.port;                                       // any of the board's SATA ports will do
  S.connPort=s; clickConn(job.c.id);
}
// HDMI clicked while plugging in the keyboard or mouse: the HDMI cable, its plug and the monitor turn red for a moment,
// and the camera pulls back to show where that cable goes before returning
const hdmiRed=new T.MeshStandardMaterial({color:0xe01010,emissive:0xff0000,emissiveIntensity:.5,roughness:.5,toneMapped:false});
let hdmiFlash=null;
function flashHdmi(){
  if(!hdmiFlash){ hdmiFlash=new Map();
    const swap=o=>{ if(!o.isMesh||o.material===screenMat||o.material.opacity===0) return; hdmiFlash.set(o,o.material); o.material=hdmiRed; };
    monG.traverse(swap); CONN.hdmi.a.outer.traverse(swap); if(CONN.hdmi.mesh) swap(CONN.hdmi.mesh); }
  clearTimeout(flashHdmi.timer); const st=S.step;
  focusPoint(V3(-28,72,-24),V3(18,10,-78),900);
  tween(3200,k=>{ hdmiRed.emissiveIntensity=.25+.75*Math.abs(Math.sin(k*Math.PI*4)); });
  flashHdmi.timer=setTimeout(()=>{ hdmiFlash.forEach((m,o)=>o.material=m); hdmiFlash=null;
    if(S.step===st&&!S.busy&&!S.held) focus(viewFor(st),900); },3400);
}
