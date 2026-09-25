/* ---------------- AM4 socket + retention bracket ---------------- */
const socket=new T.Group(); socket.position.set(SX,0,SZ); boardRoot.add(socket);
const cream=new T.MeshStandardMaterial({color:0xe6dfcb,roughness:.6}), socketTop=new T.MeshStandardMaterial({map:socketTexture(),roughness:.55});
mesh(box(4.8,.35,4.8),six(cream,socketTop),[0,.275,0],socket);
mesh(box(.36,.3,4.8),cream,[2.58,.25,0],socket);                                                  // lever channel
const bracketMat=new T.MeshStandardMaterial({color:0x17171a,roughness:.5});
const bracketGroup=new T.Group(); socket.add(bracketGroup);
const HOLES=[[-2.7,-4.5],[2.7,-4.5],[2.7,4.5],[-2.7,4.5]];            // AM4 backplate holes (54 × 90 mm)
[mesh(box(7.8,.55,1.1),bracketMat,[0,.375,-4.3],bracketGroup), mesh(box(7.8,.55,1.1),bracketMat,[0,.375,4.3],bracketGroup),
 mesh(box(.9,.55,7.5),bracketMat,[-3.45,.375,0],bracketGroup), mesh(box(.9,.55,7.5),bracketMat,[3.45,.375,0],bracketGroup),
 ...[-4.3,4.3].map(z=>mesh(box(1.6,.9,.35),bracketMat,[0,.55,z*1.07],bracketGroup))].forEach(m=>m.userData.part="bracket");
const screwMetal=new T.MeshStandardMaterial({color:0xb9bec5,metalness:.9,roughness:.3});
const bracketScrews=HOLES.map(([x,z])=>{ const s=mesh(new T.CylinderGeometry(.2,.2,.12,16),screwMetal,[x,.71,z],bracketGroup); s.userData.part="bracket"; return s; });
HOLES.forEach(([x,z])=>mesh(new T.CylinderGeometry(.17,.17,.1,16),screwMetal,[x,.15,z],socket));   // backplate threads
function triGeom(s){ const sh=new T.Shape(); sh.moveTo(0,0); sh.lineTo(s,0); sh.lineTo(0,s); sh.lineTo(0,0); const g=new T.ShapeGeometry(sh); g.rotateX(-Math.PI/2); return g; }
/* orientation triangles: raised, matte yellow, with a dark outline so they read from any distance */
const markerMat=new T.MeshStandardMaterial({color:0xffc400,metalness:0,roughness:.55,emissive:0x000000});
const outlineMat=new T.MeshBasicMaterial({color:0x111111});
function triShape(s,e){ const sh=new T.Shape(); sh.moveTo(-e,-e); sh.lineTo(s+e*2.4,-e); sh.lineTo(-e,s+e*2.4); sh.lineTo(-e,-e); return sh; }
function flatExtrude(shape,depth){ const g=new T.ExtrudeGeometry(shape,{depth,bevelEnabled:false}); g.rotateX(-Math.PI/2); return g; }
function addMarker(parent,x,y,z,s){
  const g=new T.Group(); g.position.set(x,y,z); parent.add(g);
  const o=new T.Mesh(flatExtrude(triShape(s,.07),.012),outlineMat); g.add(o);
  const m=new T.Mesh(flatExtrude(triShape(s,0),.03),markerMat); m.position.set(0,.001,0); g.add(m);
  return g;
}
function hintSprite(){
  const tex=canvasTex(256,256,(g,W)=>{
    g.fillStyle="rgba(17,17,17,.85)"; g.beginPath(); g.arc(W/2,W*.42,W*.36,0,7); g.fill();
    g.strokeStyle="#ffc400"; g.lineWidth=10; g.stroke();
    g.fillStyle="#ffc400"; g.beginPath(); g.moveTo(W*.3,W*.6); g.lineTo(W*.3,W*.26); g.lineTo(W*.64,W*.6); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(W*.42,W*.8); g.lineTo(W*.58,W*.8); g.lineTo(W*.5,W*.96); g.closePath(); g.fill();
  });
  const sp=new T.Sprite(new T.SpriteMaterial({map:tex,depthTest:false,depthWrite:false,transparent:true}));
  sp.scale.set(1.3,1.3,1); sp.renderOrder=10; sp.visible=false; return sp;
}
addMarker(socket,-2.4,.452,2.4,.72);
const socketHint=hintSprite(); socketHint.position.set(SX-2.15,1.3,SZ+2.15); boardRoot.add(socketHint);
const leverMat=new T.MeshStandardMaterial({color:0x2f6bff,metalness:.25,roughness:.35});
const leverPivot=new T.Group(); leverPivot.position.set(2.58,.5,2.3); socket.add(leverPivot);
const rod=mesh(new T.CylinderGeometry(.1,.1,4.4,16),leverMat,[0,0,-2.2],leverPivot); rod.rotation.x=Math.PI/2;
const hnd=mesh(new T.CylinderGeometry(.12,.12,.7,16),leverMat,[.35,0,-4.4],leverPivot); hnd.rotation.z=Math.PI/2;
const grip=mesh(new T.SphereGeometry(.2,20,14),leverMat,[.72,0,-4.4],leverPivot);
const leverHit=mesh(box(1.2,.8,4.9),new T.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}),[.25,0,-2.3],leverPivot,{cast:false});
[rod,hnd,grip,leverHit].forEach(m=>m.userData.part="lever");
mesh(box(.3,.2,.3),cream,[2.85,.45,-2.2],socket);                                                 // lever hook
const targetMat=new T.MeshBasicMaterial({color:0xe8b33a,transparent:true,opacity:0,depthWrite:false});
(function(){ const s=new T.Shape(); s.moveTo(-2.6,-2.6); s.lineTo(2.6,-2.6); s.lineTo(2.6,2.6); s.lineTo(-2.6,2.6); const h=new T.Path(); h.moveTo(-2.3,-2.3); h.lineTo(-2.3,2.3); h.lineTo(2.3,2.3); h.lineTo(2.3,-2.3); s.holes.push(h);
  const m=new T.Mesh(new T.ShapeGeometry(s),targetMat); m.rotation.x=-Math.PI/2; m.position.y=.47; socket.add(m); })();
