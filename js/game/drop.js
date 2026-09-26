function drop(){
  if(!canManipulate()) return;
  const type=S.held, sn=S.snap;
  if(type==="conn"){ insertConn(); return; }
  if(type==="cpu"){
    if(!sn){ toast(t("e_notAbove"),"err"); return; }
    const r=mod(S.rot.cpu,4);
    if(S.flips%2) return wrong("e_flipped",cpuYaw,CPU_HOVER,.9);
    if(r!==0){ mistake(); toast(t("e_wrongYaw")+(S.hints?" "+t(r===1?"e_turnR":r===3?"e_turnL":"e_turn2"):""),"err"); refuse(cpuYaw,CPU_HOVER,.9); return; }
    targetMat.opacity=0; seat(cpuYaw,CPU_SEAT,1100,()=>{ toast(t("ok_cpu"),"ok"); setStep(ST.leverDown); });
  } else if(type==="ram"){
    const r=rams[S.ram];
    if(!sn){ toast(t("e_ramAbove"),"err"); return; }
    const i=sn.key, name=SLOT_NAMES[i];
    if(!GOOD.includes(i)) return wrong2(t("e_wrongSlot",{s:name}),r.yaw,RAM_HOVER,1.2);
    if(slots[i].used){ toast(t("e_used",{s:name}),"err"); refuse(r.yaw,RAM_HOVER,1.2); return; }
    if(mod(S.rot.ram,2)) return wrong("e_notch",r.yaw,RAM_HOVER,1.0);
    seat(r.yaw,RAM_SEAT,900,()=>{ setLatches(i,false,220); slots[i].used=true; toast(t("ok_ram",{s:name}),"ok"); S.ram=-1; setStep(S.step+1); });
  } else if(type==="paste"){
    if(!sn){ toast(t("e_pasteAbove"),"err"); return; }
    S.busy=true; S.held=null; updateTools();
    applyPasteX();
  } else if(type==="cooler"){
    if(!sn){ toast(t("e_coolerAbove"),"err"); return; }
    const r=mod(S.rot.cooler,4);
    if(r===1||r===3) return wrong("e_holes",coolerYaw,COOLER_HOVER,2.4);
    if(r===2) return wrong("e_cable",coolerYaw,COOLER_HOVER,2.4);
    seat(coolerYaw,COOLER_SEAT,1100,()=>{ pasteDot.scale.set(3.6,.03,3.6); toast(t("ok_cooler"),"ok"); setStep(ST.coolerScrews); });
  } else if(type==="m2"){
    if(!sn){ toast(t("e_m2Above"),"err"); return; }
    if(mod(S.rot.m2,2)) return wrong("e_m2Turn",m2G,M2_HOVER,1.2);
    S.busy=true; S.held=null; updateTools(); const p0=m2G.position.clone(), p1=V3(M2_SEAT.x,.75,M2Z);
    tween(700,k=>{ m2G.position.lerpVectors(p0,p1,k); m2G.rotation.z=-.42*k; },()=>{
      tween(700,k=>{ m2G.rotation.z=-.42*(1-k); m2G.position.y=.75-.3*k; },()=>{ S.busy=false; toast(t("ok_m2"),"ok"); setStep(ST.m2Screw); }); });
  } else if(type==="psu"){
    if(!sn){ toast(t("e_psuAbove"),"err"); return; }
    if(mod(S.rot.psu,4)!==0) return wrong("e_psuTurn",psuG,PSU_HOVER,17);
    seat(psuG,PSU_POS.y,1200,()=>{ S.busy=true;
      psuScrews.forEach((g,i)=>setTimeout(()=>{ g.visible=true; const x0=CX0-2.4;
        tween(500,k=>{ g.position.x=x0+(CX0-.1-x0)*k; g.rotation.x=k*Math.PI*6; }); },i*250));
      setTimeout(()=>{ S.busy=false; toast(t("ok_psu"),"ok"); setStep(ST.board); },250*PSU_HOLES.length+550); });
  } else if(type==="board"){
    if(!sn){ toast(t("e_boardAbove"),"err"); return; }
    if(mod(S.rot.board,2)) return wrong("e_boardIO",boardRoot,L.y+21,L.y+8);
    seat(boardRoot,L.y,1300,()=>{ toast(t("ok_board"),"ok"); setStep(ST.boardScrews); });
  } else if(type==="gpu"){
    if(!sn){ toast(t("e_gpuAbove"),"err"); return; }
    if(!sn.slot.ok) return wrong("e_gpuSlot",gpuG,GPU_HOVER,L.y+3);
    if(mod(S.rot.gpu,2)) return wrong("e_gpuTurn",gpuG,GPU_HOVER,L.y+3);
    slotCovers[0].visible=false; seat(gpuG,GPU_SEAT,1000,()=>{ setPcieLatch(false,250); toast(t("ok_gpu"),"ok"); setStep(ST.sata); });
  } else if(type==="sata"){
    if(!sn){ toast(t("e_sataAbove"),"err"); return; }
    if(mod(S.rot.sata,4)!==0) return wrong("e_sataTurn",sataG,SATA_HOVER,3);
    seat(sataG,SATA_POS.y,900,()=>{ toast(t("ok_sata"),"ok"); setStep(ST.dataSsd); });
  } else if(type==="battery"){
    if(!sn){ toast(t("e_batAbove"),"err"); return; }
    if(S.batFlip%2) return wrong("e_batFlip",batG,BAT_HOVER,1.2);
    seat(batG,BAT_SEAT,800,()=>{ toast(t("ok_bat"),"ok"); setStep(ST.psu); });
  } else if(type==="cable"){
    const c=S.cable;
    if(!sn){ toast(t("e_plugAbove"),"err"); return; }
    if(!sn.tg.ok){ mistake(); toast(t(sn.tg.err,{s:sn.tg.label||sn.tg.name}),"err"); refuse(c.plug,c.parent.worldToLocal(V3(0,c.hoverY,0)).y,c.parent.worldToLocal(V3(0,Math.max(sn.tg.seatY+1,1.2),0)).y); return; }
    const local=c.parent.worldToLocal(V3(sn.x,sn.tg.seatY,sn.z));
    seat(c.plug,local.y,700,()=>{ c.state="seated"; drawCable(c); if(c.id==="fan") S.fanOn=true; if(c.id==="caseFan") S.caseFanOn=true; toast(t(c.okMsg,{s:sn.tg.name}),"ok"); S.cable=null; setStep(S.step+1); });
  }
}
function wrong2(msg,obj,hover,low){ mistake(); toast(msg,"err"); refuse(obj,hover,low); }
function finish(){ S.end=performance.now(); screenBoot(); document.getElementById("doneText").textContent=t("doneText",{t:fmtTime(S.end-S.start),m:S.mistakes}); setTimeout(()=>document.getElementById("done").classList.add("show"),1800); }
function persist(){ try{ sessionStorage.setItem("pclab",JSON.stringify({lang,hints:S.hints,glow:S.glow,bright:S.bright})); }catch(e){} }
function resetAll(){ persist(); location.reload(); }
