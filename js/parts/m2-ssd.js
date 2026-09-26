/* ---------------- M.2 slot + SSD ---------------- */
const M2Z=5.9, M2_SEAT=V3(3.05,.45,M2Z), M2_SCREW=V3(-4.95,0,M2Z), M2_PARK=V3(-6.4,.2,7.4);
mesh(box(.5,.4,2.3),blackPlastic,[3.3,.3,M2Z]);
const brass=new T.MeshStandardMaterial({color:0xc9a54a,metalness:.85,roughness:.35});
mesh(new T.CylinderGeometry(.22,.22,.31,16),brass,[M2_SCREW.x,.255,M2Z]);
const m2ScrewMat=screwMetal.clone();
const m2Screw=new T.Group(); m2Screw.position.set(M2_SCREW.x,.5,M2Z); boardRoot.add(m2Screw);
mesh(new T.CylinderGeometry(.26,.26,.1,18),m2ScrewMat,[0,0,0],m2Screw).userData.part="m2screw";
mesh(new T.CylinderGeometry(.5,.5,.5,10),new T.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}),[0,.1,0],m2Screw,{cast:false}).userData.part="m2screw";
// ripple ring that keeps pulsing out from the screw while it's the thing to click (see loop.js)
const m2Ring=mesh(new T.RingGeometry(.32,.46,32),new T.MeshBasicMaterial({color:0xffc400,transparent:true,opacity:0,depthWrite:false,side:T.DoubleSide}),null,boardRoot,{cast:false});
m2Ring.rotation.x=-Math.PI/2; m2Ring.visible=false; m2Ring.raycast=()=>{};
function m2Texture(){ return canvasTex(800,220,(g,W,H)=>{ g.fillStyle="#141518"; g.fillRect(0,0,W,H);
  g.fillStyle="#e8e9eb"; roundRect(g,W*.06,H*.08,W*.8,H*.84,8); g.fill();
  g.fillStyle="#1b1d22"; g.font="700 44px 'Barlow Semi Condensed', Arial"; g.fillText("NVMe SSD  512GB",W*.1,H*.42);
  g.font="500 26px Barlow, Arial"; g.fillText("M.2 2280  PCIe 3.0 x4",W*.1,H*.62);
  const R=rng(6); let x=W*.1; while(x<W*.5){ const w=1+R()*4; g.fillRect(x,H*.7,w,H*.14); x+=w+1+R()*3; }
  g.fillStyle="#0a0a0a"; g.beginPath(); g.arc(0,H/2,18,0,7); g.fill(); }); }
const m2G=new T.Group(); m2G.visible=false; boardRoot.add(m2G);
const m2Top=new T.MeshStandardMaterial({map:m2Texture(),roughness:.5});
const m2Pcb=new T.MeshStandardMaterial({color:0x141518,roughness:.6});
[mesh(box(8,.08,2.2),[m2Pcb,m2Pcb,m2Top,m2Pcb,m2Pcb,m2Pcb],[-4,0,0],m2G),
 mesh(box(.45,.085,2.0),new T.MeshStandardMaterial({color:0xe2b95a,metalness:.8,roughness:.3}),[-.23,0,0],m2G),
 mesh(box(.5,.1,.2),new T.MeshBasicMaterial({color:0x000000}),[-.2,0,-.5],m2G,{cast:false})].forEach(m=>m.userData.part="m2");
const M2_HOVER=3;
