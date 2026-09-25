function takeCPU(){
  if(S.busy) return; startClock();
  if(S.step===ST.leverUp){ mistake(); toast(t("e_leverFirst"),"err"); return; }
  if(S.used.cpu){ toast(t("e_taken")); return; }
  if(!gate(ST.takeCpu)) return;
  S.used.cpu=true; S.rot.cpu=1+Math.floor(Math.random()*3); S.flips=Math.random()<.5?1:0;
  cpuYaw.visible=true; cpuYaw.position.set(-9,8,10); const fy=S.rot.cpu*Math.PI/2; cpuYaw.rotation.y=fy+Math.PI; cpuFlip.rotation.z=S.flips*Math.PI;
  S.busy=true; const from=cpuYaw.position.clone(), to=V3(-7.5,CPU_HOVER,1.2);
  tween(900,k=>{ cpuYaw.position.lerpVectors(from,to,k); cpuYaw.rotation.y=fy+Math.PI*(1-k); },()=>{ S.busy=false; S.held="cpu"; S.snap=null; setStep(ST.placeCpu); },easeOut);
}
function takeRAM(i){
  if(S.used["ram"+i]){ toast(t("e_taken")); return; }
  if(S.step===ST.clips&&!S.busy&&!S.held){ toast(t("e_clipsFirst")); return; }
  if(!gate(ST.ram1)) return;
  S.used["ram"+i]=true; S.ram=i; const r=rams[i];
  spawn("ram",r.yaw,V3(13,9,6),V3(10.2,RAM_HOVER,-4.3),1);
}
function takePaste(){
  if(S.used.paste){ toast(t("e_taken")); return; }
  if(S.step===ST.bracket&&!S.busy&&!S.held){ toast(t("e_bracketFirst")); return; }
  if(!gate(ST.paste)) return;
  S.used.paste=true; pasteG.rotation.set(0,0,0); spawn("paste",pasteG,V3(-9,9,9),V3(-8,PASTE_HOVER,-.5),0);
}
function takeCooler(){
  if(S.used.cooler){ toast(t("e_taken")); return; }
  if(S.step===ST.paste&&!S.busy&&!S.held){ mistake(); toast(t("e_pasteFirst"),"err"); return; }
  if(S.step===ST.bracket&&!S.busy&&!S.held){ toast(t("e_bracketFirst")); return; }
  if(!gate(ST.cooler)) return;
  S.used.cooler=true; spawn("cooler",coolerYaw,V3(-10,12,12),V3(-4,COOLER_HOVER,5),1+Math.floor(Math.random()*3));
}
function takeM2(){
  if(S.used.m2){ toast(t("e_taken")); return; }
  if(S.step===ST.m2Out&&!S.busy&&!S.held){ toast(t("e_m2screwFirst")); return; }
  if(!gate(ST.m2In)) return;
  S.used.m2=true; m2G.rotation.set(0,0,0); spawn("m2",m2G,V3(-6,8,12),V3(-1,M2_HOVER,10),1);
}
function takePSU(){ if(S.used.psu){ toast(t("e_taken")); return; } if(!gate(ST.psu)) return; S.used.psu=true; spawn("psu",psuG,V3(-10,40,-10),V3(-6,PSU_HOVER,L.z+10),1+Math.floor(Math.random()*3)); }
function takeGPU(){ if(S.used.gpu){ toast(t("e_taken")); return; } if(!gate(ST.gpu)) return; S.used.gpu=true; spawn("gpu",gpuG,V3(-4,30,-14),V3(-2,GPU_HOVER,L.z+6),1); }
function takeSata(){ if(S.used.sata){ toast(t("e_taken")); return; } if(!gate(ST.sata)) return; S.used.sata=true; spawn("sata",sataG,V3(30,30,-14),V3(22,SATA_HOVER,L.z+14),1+Math.floor(Math.random()*3)); }
function takeBattery(){ if(S.used.battery){ toast(t("e_taken")); return; } if(!gate(ST.battery)) return; S.used.battery=true;
  S.batFlip=Math.random()<.5?1:0; batFlip.rotation.z=S.batFlip*Math.PI; spawn("battery",batG,V3(-6,8,14),V3(-4,BAT_HOVER,12.5),0); }
function takeScrews(){ if(S.used.screws){ toast(t("e_taken")); return; } if(!gate(ST.boardScrews)) return; S.used.screws=true; toast(t("ok_takeScrews"),"ok"); updateTray(); }
function pickBoard(){ if(!gate(ST.board)) return; boardRoot.rotation.set(0,0,0); spawn("board",boardRoot,V3(0,0,0),V3(L.x+2,L.y+21,L.z+2),1); focus("caseClose",1200); }
function spawnCable(c){
  if(c.id==="fan") fanLead.visible=false;
  c.tgts=c.targets(); const a=c.anchor(); c.plug.visible=true; c.plug.rotation.set(0,0,0);
  c.plug.position.copy(c.parent.worldToLocal(c.spawnPos?c.spawnPos():V3(a.x+1.2,c.hoverY,a.z-.8))); c.state="hover"; S.cable=c; S.held="cable"; S.snap=null; drawCable(c); updateTools();
}
function showCase(){
  caseG.visible=true; caseG.position.y=40; tween(1400,k=>{ caseG.position.y=40*(1-k); },()=>toast(t("ok_case"),"ok"),easeOut);
  sun.position.set(L.x+12,48,L.z+24); sun.target.position.set(L.x+4,0,L.z+2);
  Object.assign(sun.shadow.camera,{left:-36,right:36,top:36,bottom:-36,far:120}); sun.shadow.camera.updateProjectionMatrix();
}
