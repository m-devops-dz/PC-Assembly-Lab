/* ---------------- loop ---------------- */
function resize(){ const w=vp.clientWidth,h=vp.clientHeight; if(!w||!h) return; renderer.setSize(w,h,false); camera.aspect=w/h; camera.fov=w<600?50:36; camera.updateProjectionMatrix(); }
new ResizeObserver(resize).observe(vp); resize();
const glow=new T.Color(0xffc400), black=new T.Color(0);
function setGlow(mat,on,pulse){
  if(!mat) return;
  if(on&&S.glow){
    mat.emissive.copy(glow).multiplyScalar(.45+.55*pulse);
  } else {
    mat.emissive.setHex(0x000000);
  }
}
const dropTargetGeo=new T.RingGeometry(.7,1.2,32); dropTargetGeo.rotateX(-Math.PI/2);
const dropTargetMesh=new T.Mesh(dropTargetGeo,targetMat); dropTargetMesh.position.y=.48; boardRoot.add(dropTargetMesh);

// targets are world x/z; the ring hangs off the board, so convert (the board may be in the case, or in hand)
function placeRing(x,z){ boardRoot.updateMatrixWorld(true); const p=boardRoot.worldToLocal(V3(x,0,z)); dropTargetMesh.position.set(p.x,.48,p.z); }
let lastT=performance.now();
function frame(now){
  const dt=Math.min(.05,(now-lastT)/1000); lastT=now;
  for(let i=tweens.length-1;i>=0;i--){ const tw=tweens[i]; const k=Math.min(1,(now-tw.s)/tw.dur); tw.fn(tw.ease(k)); if(k>=1){ tweens.splice(i,1); tw.done&&tw.done(); } }
  const pulse=.5+.5*Math.sin(now/450), st=S.step;
  setGlow(leverMat,st===ST.leverUp||st===ST.leverDown,pulse);
  const showTri=S.hints&&(st===ST.takeCpu||st===ST.placeCpu);
  setGlow(markerMat,showTri,pulse);
  socketHint.visible=showTri&&S.glow; cpuHint.visible=showTri&&S.glow&&cpuYaw.visible;
  const bob=Math.sin(now/300)*.12; socketHint.position.y=1.3+bob; cpuHint.position.y=(S.flips%2?-1:1)*1.25+bob;
  slots.forEach((s,i)=>setGlow(s.mat,S.hints&&st===ST.clips&&GOOD.includes(i)&&!s.open,pulse));
  setGlow(bracketMat,st===ST.bracket,pulse);
  const o=S.tightOrder, next=o.length%2===1?(o[o.length-1]+2)%4:-1;
  coolerScrews.forEach((s,i)=>setGlow(s.mat,st===ST.coolerScrews&&!s.tight&&(next<0||!S.hints||i===next),pulse));
  HEADERS.forEach(h=>setGlow(h.mat,S.hints&&(st===ST.fanCable&&h.ok||st===ST.caseFan&&!h.ok),pulse));
  setGlow(m2ScrewMat,st===ST.m2Out||st===ST.m2Screw,pulse);
  m2Ring.visible=S.glow&&(st===ST.m2Out||st===ST.m2Screw)&&!S.busy;
  if(m2Ring.visible){ const k=(now%900)/900; m2Ring.position.set(m2Screw.position.x,m2Screw.position.y+.07,m2Screw.position.z); m2Ring.scale.setScalar(1+2.2*k); m2Ring.material.opacity=.95*(1-k); }
  setGlow(boardEdge,st===ST.board&&!S.held,pulse);
  setGlow(psuHoleMat,S.hints&&st===ST.psu,pulse);
  setGlow(mbHoleMat,st===ST.boardScrews&&!S.used.screws,pulse);
  setGlow(pcieLatchMat,st===ST.pcieLatch,pulse);
  setGlow(fpMarkMat,S.hints&&st===ST.frontPanel,pulse);
  fpRing.visible=S.glow&&st===ST.frontPanel&&!S.busy;
  if(fpRing.visible){ const k=(now%900)/900; fpRing.scale.setScalar(1+2.2*k); fpRing.material.opacity=.95*(1-k); }
  setGlow(panelFrameMat,st===ST.closeCase&&!S.busy,pulse);
  // rear ports: glow the ones that fit the cable being plugged in (after a motherboard-HDMI warning, only the card's)
  RPORTS.forEach(p=>{ const fits=S.connPick==="usb"?p.kind==="usb"&&!p.used:S.connPick==="hdmi"?(p.kind==="hdmiGpu"||(p.kind==="hdmiMb"&&!S.hdmiWarned)):false;
    p.mat.opacity=S.glow&&S.hints&&fits&&!S.held?.25+.45*pulse:0; });
  psuMark.material.opacity=S.glow&&S.hints&&st===ST.psu?.35+.35*pulse:0;

  if(S.glow&&S.held&&!S.busy){
    const sn=S.snap;
    if(sn){
      targetMat.color.setHex(0x2f8f5b);
      targetMat.opacity=.85;
      placeRing(sn.x,sn.z);
      dropTargetMesh.visible=true;
    } else {
      targetMat.color.setHex(0xffc400);
      targetMat.opacity=.35+.35*pulse;
      const tgtPos={
        cpu:{x:SX,z:SZ}, ram:{x:SLOT_X[1],z:SLOT_Z}, paste:{x:SX,z:SZ},
        cooler:{x:SX,z:SZ}, m2:{x:M2_SEAT.x,z:M2_SEAT.z}, psu:{x:PSU_POS.x,z:PSU_POS.z},
        board:{x:L.x,z:L.z}, gpu:{x:GPU_X,z:L.z+3.2}, sata:{x:SATA_POS.x,z:SATA_POS.z}, battery:{x:BAT_POS.x,z:BAT_POS.z}
      }[S.held];
      if(tgtPos){ placeRing(tgtPos.x,tgtPos.z); dropTargetMesh.visible=true; }
      else dropTargetMesh.visible=false;
    }
  } else {
    dropTargetMesh.visible=false;
  }

  Object.values(CABLES).forEach(c=>{ if(c.plug.visible&&c.state!=="seated") drawCable(c); });
  if(S.fanOn) fanRot.rotation.y-=dt*14;
  if(S.caseFanOn) rearBlades.rotation.x-=dt*10;
  if(S.step>=STEPS) gpuFans.forEach(r=>r.rotation.z-=dt*9);
  if(S.start&&!S.end&&now-(frame.last||0)>500){ frame.last=now; document.getElementById("timer").textContent=fmtTime(now-S.start); }
  controls.update(); renderer.render(scene,camera);
  if(!window.__sceneReady){ window.__sceneReady=true; const lm=document.getElementById("loadMsg"); if(lm&&!lm.classList.contains("err")) lm.style.display="none"; }
  requestAnimationFrame(frame);
}
applyLang(); setStep(0);
(document.fonts&&document.fonts.ready?document.fonts.ready:Promise.resolve()).then(drawThumbs);
requestAnimationFrame(frame);
