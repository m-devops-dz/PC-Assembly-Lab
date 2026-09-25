/* ---------------- case (lying on its side, side panel off) ---------------- */
const L=V3(0,1.1,-50);                         // where the board ends up
const caseG=new T.Group(); caseG.visible=false; scene.add(caseG);
const steel=new T.MeshStandardMaterial({color:0x1c1d20,metalness:.45,roughness:.5});
const MB_SCREW_Y=.2;                            // seated screw head centre, just on the board surface
const CX0=-16.6, CX1=29.6, CZ0=L.z-18.1, CZ1=L.z+24.6;   // outer extents
const trayTex=canvasTex(1024,900,(g,W,H)=>{ g.fillStyle="#26282c"; g.fillRect(0,0,W,H);
  const px=x=>(x-CX0)/(CX1-CX0)*W, pz=z=>(z-(L.z-17.3))/41.1*H;
  g.fillStyle="#141518"; roundRect(g,px(SX-5),pz(L.z+SZ-5),10/46.2*W,10/41.1*H,10); g.fill();
  [[16.6,-8],[16.6,0],[16.6,8]].forEach(([x,z])=>{ g.fillStyle="#101114"; roundRect(g,px(x),pz(L.z+z),1.6/46.2*W,4/41.1*H,8); g.fill(); });
  g.strokeStyle="rgba(255,255,255,.08)"; g.lineWidth=2; for(let x=0;x<W;x+=32){ g.beginPath(); g.moveTo(x,pz(L.z+13)); g.lineTo(x,H); g.stroke(); } });
const trayMat=new T.MeshStandardMaterial({map:trayTex,metalness:.4,roughness:.55});
mesh(box(CX1-CX0,.5,41.1),six(steel,trayMat),[(CX0+CX1)/2,.15,L.z+3.25],caseG);

/* rear wall with real openings: I/O shield, 120 mm exhaust fan, 7 expansion slots, PSU */
const CASE_SLOTS=[3.2,5.0,6.8,8.6,10.2,11.6,13.2];
(function rearWall(){
  const s=new T.Shape(); s.moveTo(CZ0,-.1); s.lineTo(CZ1,-.1); s.lineTo(CZ1,20.2); s.lineTo(CZ0,20.2); s.lineTo(CZ0,-.1);
  const rect=(z0,z1,y0,y1)=>{ const h=new T.Path(); h.moveTo(z0,y0); h.lineTo(z0,y1); h.lineTo(z1,y1); h.lineTo(z1,y0); h.lineTo(z0,y0); s.holes.push(h); };
  rect(L.z-12.2,L.z-0.6,1.0,5.8);                                               // I/O shield opening (fits all ports)
  CASE_SLOTS.forEach(z=>rect(L.z+z-.45,L.z+z+.45,1.7,13.9));                    // expansion slots
  { const h=new T.Path(); h.moveTo(L.z+15.2,1.7);                               // PSU opening, notched out on one side to expose the power socket;
    [[15.2,14.1],[21.2,14.1],[21.2,12.2],[22.0,12.2],[22.0,7.6],[21.2,7.6],[21.2,1.7],[15.2,1.7]].forEach(([z,y])=>h.lineTo(L.z+z,y));
    s.holes.push(h); }                                                           //   the 4 screw holes stay in solid metal
  const f=new T.Path(); f.absarc(L.z-7,13,5.4,0,Math.PI*2,true); s.holes.push(f); // exhaust fan
  const g=new T.ExtrudeGeometry(s,{depth:.8,bevelEnabled:false,curveSegments:40}); g.rotateY(-Math.PI/2);
  const m=new T.Mesh(g,steel); m.position.x=CX0+.8; m.castShadow=true; m.receiveShadow=true; caseG.add(m);
})();
const ioShieldMat=new T.MeshStandardMaterial({color:0x9a9fa6,metalness:.8,roughness:.35});
const slotCovers=CASE_SLOTS.map(z=>mesh(box(.05,12.4,1.05),ioShieldMat,[CX0-.03,7.8,L.z+z],caseG));
const fanRing=mesh(new T.TorusGeometry(5.5,.35,10,48),steel,[CX0+1.4,13,L.z-7],caseG); fanRing.rotation.y=Math.PI/2;
const rearFan=new T.Group(); rearFan.position.set(CX0+1.8,13,L.z-7); caseG.add(rearFan);
[[-5.4,-5.4],[5.4,-5.4],[-5.4,5.4],[5.4,5.4]].forEach(([y,z])=>mesh(box(2.5,1,1),new T.MeshStandardMaterial({color:0x121316,roughness:.6}),[0,y,z],rearFan));
const rearBlades=new T.Group(); rearFan.add(rearBlades);
mesh(new T.CylinderGeometry(1.8,1.8,2,24),new T.MeshStandardMaterial({color:0x1d1e22,roughness:.5}),[0,0,0],rearBlades).rotation.z=Math.PI/2;
for(let i=0;i<7;i++){ const p=new T.Group(); p.rotation.x=i*Math.PI*2/7; rearBlades.add(p); const b=mesh(box(.06,3.4,1.9),new T.MeshStandardMaterial({color:0x222327,roughness:.5,side:T.DoubleSide}),[0,3.4,0],p); b.rotation.y=.5; }

/* other walls */
mesh(box(.8,20.3,41.1),steel,[CX1-.4,10.05,L.z+3.25],caseG);                                                      // front
mesh(box(CX1-CX0,20.3,.8),steel,[(CX0+CX1)/2,10.05,CZ0+.4],caseG);                                               // top
mesh(box(CX1-CX0,20.3,.8),steel,[(CX0+CX1)/2,10.05,CZ1-.4],caseG);                                               // bottom
mesh(box(CX1-CX0,.6,.8),new T.MeshStandardMaterial({color:0x2a2c30,metalness:.5,roughness:.4}),[(CX0+CX1)/2,20.35,CZ0+.4],caseG);

/* front I/O panel on the outside of the front: power button, reset, 2× USB-A, USB-C, audio */
(function frontIO(){
  const x=CX1+.02, y=10, blackP=new T.MeshStandardMaterial({color:0x0d0e10,roughness:.6}), blue=new T.MeshStandardMaterial({color:0x2458d8,roughness:.4});
  mesh(box(.12,6,11.5),new T.MeshStandardMaterial({color:0x2a2c30,metalness:.5,roughness:.4}),[x,y,L.z-11],caseG);
  const pb=mesh(new T.CylinderGeometry(1.1,1.1,.3,32),new T.MeshStandardMaterial({color:0xc9ced4,metalness:.9,roughness:.25}),[x+.15,y,L.z-15.3],caseG); pb.rotation.z=Math.PI/2;
  const ring=mesh(new T.TorusGeometry(1.15,.08,8,32),new T.MeshBasicMaterial({color:0x4ea1ff}),[x+.16,y,L.z-15.3],caseG); ring.rotation.y=Math.PI/2;
  const rs=mesh(new T.CylinderGeometry(.35,.35,.2,16),blackP,[x+.1,y,L.z-13.3],caseG); rs.rotation.z=Math.PI/2;
  [L.z-11.6,L.z-10.3].forEach(z=>{ mesh(box(.3,1.35,.6),new T.MeshStandardMaterial({color:0xb9bec5,metalness:.9,roughness:.3}),[x+.1,y,z],caseG); mesh(box(.32,1.15,.42),blackP,[x+.1,y,z],caseG); mesh(box(.33,1.0,.12),blue,[x+.1,y,z-.08],caseG); });
  const c=mesh(box(.3,.95,.36),new T.MeshStandardMaterial({color:0xb9bec5,metalness:.9,roughness:.3}),[x+.1,y,L.z-9.1],caseG); mesh(box(.32,.8,.22),blackP,[x+.1,y,L.z-9.1],caseG);
  [[L.z-7.9,0x7ac943],[L.z-6.9,0xe86aa8]].forEach(([z,col])=>{ const j=mesh(new T.CylinderGeometry(.34,.34,.3,20),new T.MeshStandardMaterial({color:col,roughness:.5}),[x+.1,y,z],caseG); j.rotation.z=Math.PI/2;
    const h=mesh(new T.CylinderGeometry(.16,.16,.32,14),blackP,[x+.11,y,z],caseG); h.rotation.z=Math.PI/2; });
})();

BOARD_HOLES.forEach(([x,z])=>mesh(new T.CylinderGeometry(.22,.22,.6,12),brass,[L.x+x,.7,L.z+z],caseG));
// pan-head Phillips screws: big and bright enough to read against the board
const screwHeadMat=new T.MeshStandardMaterial({map:canvasTex(64,64,(g,W)=>{ g.fillStyle="#c9ced4"; g.fillRect(0,0,W,W); g.fillStyle="#3a3d42"; g.fillRect(W*.44,W*.16,W*.12,W*.68); g.fillRect(W*.16,W*.44,W*.68,W*.12); }),metalness:.85,roughness:.3});
const boardScrews=BOARD_HOLES.map(([x,z])=>{ const m=mesh(new T.CylinderGeometry(.34,.36,.2,20),[screwMetal,screwHeadMat,screwMetal],[x,MB_SCREW_Y,z],boardRoot); m.visible=false; return m; });
// screw-down step: a glowing ring + click target over each mounting hole, shown only during that step
const mbHoleMat=new T.MeshStandardMaterial({color:0xb9b3a3,roughness:.5});
const mbScrewHints=new T.Group(); mbScrewHints.visible=false; boardRoot.add(mbScrewHints);
const mbHoleHints=BOARD_HOLES.map(([x,z],i)=>{ const g=new T.Group(); g.position.set(x,.12,z); mbScrewHints.add(g);
  const r=mesh(new T.RingGeometry(.3,.5,24),mbHoleMat,[0,0,0],g,{cast:false}); r.rotation.x=-Math.PI/2;
  mesh(new T.CylinderGeometry(.7,.7,1,12),new T.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}),[0,.4,0],g,{cast:false}).userData={part:"mbscrew",screw:i};
  return g; });
const SATA_POS=V3(22.5,.75,L.z+15);
mesh(box(11.4,.12,8.4),new T.MeshStandardMaterial({color:0x33363b,metalness:.5,roughness:.45}),[SATA_POS.x,.46,SATA_POS.z],caseG);   // drive mount plate
[[-4.9,-3.4],[4.9,-3.4],[-4.9,3.4],[4.9,3.4]].forEach(([x,z])=>mesh(new T.CylinderGeometry(.18,.18,.2,10),screwMetal,[SATA_POS.x+x,.55,SATA_POS.z+z],caseG));
/* PSU screw holes in the rear wall: standard ATX pattern, 3 corners + 1 offset, so the PSU only lines up one way.
   [dy,dz] from the PSU centre (y 7.9, z L.z+18.2). The same list drives the holes on the PSU's back. */
const PSU_HOLES=[[-6.6,-3.6],[6.6,-3.6],[6.6,3.6],[-3.4,3.6]];
const psuHoleMat=new T.MeshStandardMaterial({color:0x9aa0a8,metalness:.6,roughness:.4});
const holeDark=new T.MeshBasicMaterial({color:0x050506});
PSU_HOLES.forEach(([dy,dz])=>{ const y=7.9+dy, z=L.z+18.2+dz;
  const ring=mesh(new T.RingGeometry(.24,.42,24),psuHoleMat,[CX0+.82,y,z],caseG,{cast:false}); ring.rotation.y=Math.PI/2;
  const d=mesh(new T.CircleGeometry(.24,20),holeDark,[CX0+.815,y,z],caseG,{cast:false}); d.rotation.y=Math.PI/2; });
const psuScrews=PSU_HOLES.map(([dy,dz])=>{ const g=new T.Group(); g.position.set(CX0-1.4,7.9+dy,L.z+18.2+dz); g.visible=false; caseG.add(g);
  const h=mesh(new T.CylinderGeometry(.34,.34,.18,20),screwMetal,[0,0,0],g); h.rotation.z=Math.PI/2;
  const s=mesh(new T.CylinderGeometry(.14,.14,.9,10),screwMetal,[.5,0,0],g); s.rotation.z=Math.PI/2; return g; });
const psuMark=mesh(box(14.2,.02,8.8),new T.MeshBasicMaterial({color:0xffc400,transparent:true,opacity:.0,depthWrite:false}),[-8.8,.42,L.z+18.2],caseG,{cast:false});
