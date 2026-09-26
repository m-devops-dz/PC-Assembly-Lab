function clickLever(){
  if(S.busy) return; startClock();
  if(S.step===ST.leverUp){ S.busy=true; animTo(leverPivot.rotation,"z",LEVER_UP,900,()=>{ S.busy=false; setStep(ST.takeCpu); }); }
  else if(S.step===ST.leverDown){ S.busy=true; animTo(leverPivot.rotation,"z",0,800,()=>{ S.busy=false; setStep(ST.clips); }); }
  else if(S.step===ST.takeCpu||S.step===ST.placeCpu){ mistake(); toast(t("e_leverUp"),"err"); }
  else toast(t("e_notNow"));
}
function clickSlot(i){
  if(S.busy) return;
  if(S.step<ST.clips){ toast(t("e_cpuFirst")); return; }
  if(S.step!==ST.clips){ toast(t("e_notNow")); return; }
  if(!GOOD.includes(i)){ mistake(); toast(t("e_wrongSlot",{s:SLOT_NAMES[i]}),"err"); return; }
  if(slots[i].open) return;
  setLatches(i,true); toast(t("ok_open",{s:SLOT_NAMES[i]}),"ok");
  if(GOOD.every(g=>slots[g].open)) setTimeout(()=>setStep(ST.ram1),400);
}
function clickBracket(){
  if(S.busy) return;
  if(S.step!==ST.bracket){ toast(t(S.step<ST.clips?"e_cpuFirst":S.step<ST.bracket?"e_ramFirst":"e_notNow")); return; }
  S.busy=true;
  tween(900,k=>{ bracketScrews.forEach(s=>{ s.position.y=.71+k*.7; s.rotation.y=k*Math.PI*6; }); },()=>{
    tween(700,k=>{ bracketGroup.position.y=k*4; bracketGroup.position.x=k*-3; },()=>{ bracketGroup.visible=false; S.busy=false; toast(t("ok_bracket"),"ok"); setStep(ST.paste); }); });
}
function clickScrew(i){
  if(S.busy||S.step!==ST.coolerScrews) return;
  const sc=coolerScrews[i]; if(sc.tight) return;
  const o=S.tightOrder;
  if(o.length%2===1&&i!==(o[o.length-1]+2)%4){ mistake(); toast(t("e_diag"),"err"); return; }
  sc.tight=true; o.push(i); S.busy=true; const y0=sc.g.position.y;
  tween(600,k=>{ sc.g.position.y=y0-.45*k; },()=>{ S.busy=false; toast(t("ok_screw"),"ok"); if(o.length===4) setTimeout(()=>setStep(ST.fanCable),300); });
}
function clickM2Screw(){
  if(S.busy) return;
  if(S.step===ST.m2Out){ S.busy=true; const p0=m2Screw.position.clone();
    tween(900,k=>{ m2Screw.position.lerpVectors(p0,M2_PARK,k); m2Screw.position.y+=Math.sin(k*Math.PI)*1.5; m2Screw.rotation.y=k*12; },()=>{ S.busy=false; S.m2screw="parked"; toast(t("ok_m2out"),"ok"); setStep(ST.m2In); }); }
  else if(S.step===ST.m2Screw){ S.busy=true; const p0=m2Screw.position.clone(), p1=V3(M2_SCREW.x,.55,M2Z);
    tween(900,k=>{ m2Screw.position.lerpVectors(p0,p1,k); m2Screw.position.y+=Math.sin(k*Math.PI)*1.5; m2Screw.rotation.y=-k*12; },()=>{ S.busy=false; S.m2screw="fastened"; toast(t("ok_m2screw"),"ok"); setStep(ST.battery); }); }
  else toast(t("e_notNow"));
}
function rotate(dir){
  if(!canManipulate()) return; if(S.held==="conn"){ rollConn(dir); return; } const type=S.held, h=HELD[type]; if(!h.step) return;
  S.rot[type]+=dir; S.busy=true; renderKeyView(); animTo(h.obj().rotation,"y",S.rot[type]*h.step,type==="board"?700:400,()=>{ S.busy=false; });
}
function flip(){
  if(!canManipulate()) return;
  if(S.held==="battery"){ S.batFlip+=1; S.busy=true; const y0=batG.position.y, z0=batFlip.rotation.z, z1=S.batFlip*Math.PI;
    tween(480,k=>{ batFlip.rotation.z=z0+(z1-z0)*k; batG.position.y=y0+Math.sin(k*Math.PI)*1.0; },()=>{ S.busy=false; }); return; }
  if(S.held!=="cpu") return; S.flips+=1; S.busy=true;
  const y0=cpuYaw.position.y, z0=cpuFlip.rotation.z, z1=S.flips*Math.PI;
  tween(520,k=>{ cpuFlip.rotation.z=z0+(z1-z0)*k; cpuYaw.position.y=y0+Math.sin(k*Math.PI)*1.2; },()=>{ S.busy=false; });
}
function refuse(obj,hoverY,lowY){
  S.busy=true; const bx=obj.position.x;
  tween(700,k=>{ obj.position.y=hoverY-(hoverY-lowY)*Math.sin(k*Math.PI); obj.position.x=bx+Math.sin(k*Math.PI*8)*.1*(1-k); },()=>{ obj.position.x=bx; S.busy=false; });
}
function seat(obj,y,dur,done){ S.busy=true; animTo(obj.position,"y",y,dur,()=>{ S.busy=false; S.held=null; S.snap=null; done(); },easeOut); updateTools(); }
const wrong=(key,obj,hover,low)=>{ mistake(); toast(t(key),"err"); refuse(obj,hover,low); };
// one click drives all 9 screws, one after another (clicking any glowing hole does the same as taking them from the tray)
function clickBoardScrew(){ takeScrews(); }
function screwAllBoard(){
  S.busy=true; const gap=220, n=BOARD_HOLES.length;
  boardScrews.forEach((m,i)=>setTimeout(()=>{ mbHoleHints[i].visible=false; m.visible=true; m.position.y=1.2;
    tween(420,k=>{ m.position.y=1.2-(1.2-MB_SCREW_Y)*k; m.rotation.y=k*Math.PI*6; },()=>{ S.mbScrews=i+1; }); },i*gap));
  setTimeout(()=>{ S.busy=false; mbScrewHints.visible=false; toast(t("ok_boardScrews"),"ok"); setStep(ST.pcieLatch); },(n-1)*gap+520);
}
function clickPcieLatch(){
  if(S.busy) return;
  if(S.step!==ST.pcieLatch){ toast(t("e_notNow")); return; }
  S.busy=true; setPcieLatch(true,450,()=>{ S.busy=false; toast(t("ok_pcieOpen"),"ok"); setStep(ST.gpu); });
}
function clickSidePanel(){
  if(S.busy||S.step!==ST.closeCase) return;
  S.busy=true; closeSidePanel(false,()=>{ S.busy=false; toast(t("ok_closed"),"ok"); setStep(ST.usbKeyboard); });
}
