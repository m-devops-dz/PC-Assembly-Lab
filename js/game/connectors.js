function focusPoint(pos,tgt,dur=900){ const p0=camera.position.clone(), t0=controls.target.clone(); tween(dur,k=>{ camera.position.lerpVectors(p0,pos,k); controls.target.lerpVectors(t0,tgt,k); }); }
function clickConn(id){
  const job=connJob(S.step);
  if(S.busy) return;
  if(!job||job.c.id!==id||S.held){ toast(t("e_notNow")); return; }
  if(job.choose&&!job.port){ S.connPick=job.choose; toast(t(job.choose==="usb"?"pick_usb":"pick_hdmi")); return; }   // next: click a port
  const w=portWorld(job.port), pre=w.p.clone().addScaledVector(w.out,2.4), P=job.plug;
  const p0=P.outer.position.clone(), q0=P.outer.quaternion.clone(), r0=P.inner.rotation.x;
  S.roll=1+Math.floor(Math.random()*3); S.job=job; S.busy=true;
  const side=V3(0,0,1).applyQuaternion(w.q);
  if(job.c.id==="data"){ const v=dataView(job); focusPoint(v.pos,v.tgt,1000); }
  else if(w.out.y>.9){ const latch=V3(0,1,0).applyQuaternion(w.q);                 // top-entry header: look down from the latch side
    focusPoint(w.p.clone().add(V3(0,7,0)).addScaledVector(latch,5).addScaledVector(side,2),w.p.clone(),1000); }
  else { const far=job.c.id==="ac"?2:1;                                      // the power-cord plug is long: step back so plug and socket both fit
    focusPoint(w.p.clone().addScaledVector(w.out,5.5*far).add(V3(0,4.2*far,0)).addScaledVector(side,3.2*far),w.p.clone(),1000); }
  tween(1000,k=>{ P.outer.position.lerpVectors(p0,pre,k); P.outer.position.y+=Math.sin(k*Math.PI)*2.5; P.outer.quaternion.slerpQuaternions(q0,w.q,k); P.inner.rotation.x=r0+(S.roll*Math.PI/2-r0)*k; drawConn(job.c); },
    ()=>{ S.busy=false; S.held="conn"; updateTools(); drawConn(job.c); });
}
function rollConn(dir){ const P=S.job.plug; S.roll+=dir; S.busy=true; animTo(P.inner.rotation,"x",S.roll*Math.PI/2,300,()=>{ S.busy=false; }); }
function insertConn(){
  const job=S.job, P=job.plug, w=portWorld(job.port), pre=w.p.clone().addScaledVector(w.out,2.4);
  if(mod(S.roll,4)!==0){ mistake(); toast(t(job.err||"e_Lshape"),"err"); S.busy=true;
    tween(600,k=>{ P.outer.position.copy(pre).addScaledVector(w.out,-Math.sin(k*Math.PI)*1.9); drawConn(job.c); },()=>{ S.busy=false; }); return; }
  const seatP=w.p.clone().addScaledVector(w.out,-.3); S.busy=true; S.held=null; updateTools();
  tween(700,k=>{ P.outer.position.lerpVectors(pre,seatP,k); drawConn(job.c); },()=>{ S.busy=false; drawConn(job.c); toast(t(job.ok),"ok"); S.job=null;
    if(job.choose){ job.port.used=true; S.connPort=null; S.connPick=null; }
    const nx=S.step+1, v=nextConnView(nx); if(v) focusPoint(v.pos,v.tgt,900); else focus(viewFor(nx),900); setStep(nx); },easeOut);
}
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
    if(p.kind==="hdmiMb"){ S.hdmiWarned=true; toast(t("e_hdmiBoard"),"err"); GPU_HDMI_VIEW(); return; }
    if(p.kind==="dp"){ mistake(); toast(t("e_hdmiDp"),"err"); return; }
    if(p.kind!=="hdmiGpu"){ mistake(); toast(t("e_notHdmi"),"err"); return; }
  }
  S.connPort=p; clickConn(job.c.id);
}
