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
  if(w.out.y>.9){ const latch=V3(0,1,0).applyQuaternion(w.q);                 // top-entry header: look down from the latch side
    focusPoint(w.p.clone().add(V3(0,7,0)).addScaledVector(latch,5).addScaledVector(side,2),w.p.clone(),1000); }
  else focusPoint(w.p.clone().addScaledVector(w.out,5.5).add(V3(0,4.2,0)).addScaledVector(side,3.2),w.p.clone(),1000);
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
    const nx=S.step+1; focus(viewFor(nx),900); setStep(nx); },easeOut);
}
// peripherals: after clicking a cable, the user clicks the port they want it in
const GPU_HDMI_VIEW=()=>{ const p=portWorld(rport("hdmiGpu1")).p; focusPoint(p.clone().add(V3(-12,5,-5)),p.clone().add(V3(0,-1,-3)),900); };
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
