/* ---------------- stock cooler (low-profile, screw mount) ---------------- */
function finTexture(){ return canvasTex(512,128,(g,W,H)=>{ g.fillStyle="#2b2d31"; g.fillRect(0,0,W,H); for(let x=0;x<W;x+=6){ g.fillStyle="#6c7078"; g.fillRect(x,0,2,H); } g.fillStyle="rgba(0,0,0,.35)"; g.fillRect(0,0,W,10); }); }
function hubTexture(){ return canvasTex(256,256,(g,W)=>{ g.fillStyle="#1d1e22"; g.beginPath(); g.arc(W/2,W/2,W/2,0,7); g.fill(); g.strokeStyle="#55595f"; g.lineWidth=5; g.beginPath(); g.arc(W/2,W/2,W*.4,0,7); g.stroke(); g.fillStyle="#8a8f96"; g.font="700 34px 'Barlow Semi Condensed', Arial"; g.textAlign="center"; g.fillText("65W",W/2,W/2+12); }); }
const coolerYaw=new T.Group(); coolerYaw.visible=false; boardRoot.add(coolerYaw);
const alu=new T.MeshStandardMaterial({color:0xc7ccd2,metalness:.85,roughness:.35}), finMat=new T.MeshStandardMaterial({map:finTexture(),metalness:.6,roughness:.45});
const shroudMat2=new T.MeshStandardMaterial({color:0x1a1b1e,roughness:.5}), hubMat=new T.MeshStandardMaterial({map:hubTexture(),roughness:.5});
const coolerParts=[mesh(box(3.4,.25,3.4),alu,[0,.125,0],coolerYaw), mesh(new T.CylinderGeometry(4,4,1.45,48,1,true),finMat,[0,.97,0],coolerYaw),
  mesh(new T.CylinderGeometry(4,4,.05,48),shroudMat2,[0,.27,0],coolerYaw)];
(function(){ const s=new T.Shape(); s.moveTo(-4.3,-5.1); s.lineTo(4.3,-5.1); s.lineTo(4.3,5.1); s.lineTo(-4.3,5.1); const h=new T.Path(); h.absarc(0,0,4.0,0,Math.PI*2,true); s.holes.push(h);
  coolerParts.push(mesh(flatExtrude(s,.35),shroudMat2,[0,1.7,0],coolerYaw)); })();
const fanRot=new T.Group(); fanRot.position.y=1.85; coolerYaw.add(fanRot);
coolerParts.push(mesh(new T.CylinderGeometry(1.25,1.25,.3,40),[shroudMat2,hubMat,shroudMat2],[0,0,0],fanRot));
const bladeMat=new T.MeshStandardMaterial({color:0x222327,roughness:.45,side:T.DoubleSide});
for(let i=0;i<7;i++){ const p=new T.Group(); p.rotation.y=i*Math.PI*2/7; fanRot.add(p); const b=mesh(box(2.6,.04,1.1),bladeMat,[2.5,0,0],p); b.rotation.x=.45; coolerParts.push(b); }
coolerParts.forEach(m=>m.userData.part="cooler");
const coolerScrews=HOLES.map(([x,z],i)=>{ const g=new T.Group(); g.position.set(x,0,z); coolerYaw.add(g);
  const mat=screwMetal.clone(); mat.emissive=new T.Color(0);
  mesh(new T.CylinderGeometry(.07,.07,3.0,10),screwMetal,[0,.7,0],g);
  mesh(new T.CylinderGeometry(.2,.2,.45,12,1,true),new T.MeshStandardMaterial({color:0x2a2b2f,metalness:.7,roughness:.4}),[0,2.3,0],g);
  const head=mesh(new T.CylinderGeometry(.27,.27,.16,20),mat,[0,2.6,0],g); head.userData={part:"screw",screw:i};
  const hit=mesh(new T.CylinderGeometry(.45,.45,.8,12),new T.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}),[0,2.5,0],g,{cast:false}); hit.userData={part:"screw",screw:i};
  return {g,mat,head,hit,tight:false}; });
const CABLE_LOCAL=new T.Vector3(1.2,1.85,-5.15);
const COOLER_HOVER=6, COOLER_SEAT=.88;
