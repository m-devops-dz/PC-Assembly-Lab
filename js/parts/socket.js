/* ---------------- AM4 socket + retention bracket ---------------- */
const socket=new T.Group(); socket.position.set(SX,0,SZ); boardRoot.add(socket);
const cream=new T.MeshStandardMaterial({color:0xe6dfcb,roughness:.6}), socketTop=new T.MeshStandardMaterial({map:socketTexture(),roughness:.55});
mesh(box(4.8,.35,4.8),six(cream,socketTop),[0,.275,0],socket);
mesh(box(.36,.3,4.8),cream,[2.58,.25,0],socket);                                                  // lever channel
const bracketMat=new T.MeshStandardMaterial({color:0x17171a,roughness:.5});
const bracketGroup=new T.Group(); socket.add(bracketGroup);
const HOLES=[[-2.7,-4.5],[2.7,-4.5],[2.7,4.5],[-2.7,4.5]];            // AM4 backplate holes (54 × 90 mm)
const screwMetal=new T.MeshStandardMaterial({color:0xb9bec5,metalness:.9,roughness:.3});
/* Phillips pan-head screw: slightly domed head with a cross recess on top, threaded shank below.
   Local y 0 is the underside of the head. topMat is the head top (pass a clone of phillipsMat to make it glow on its own). */
const phillipsTex=canvasTex(128,128,(g,W)=>{ const gr=g.createRadialGradient(W*.42,W*.4,4,W/2,W/2,W*.5); gr.addColorStop(0,"#e4e7eb"); gr.addColorStop(1,"#8e949b");
  g.fillStyle=gr; g.fillRect(0,0,W,W); g.fillStyle="#2a2d32"; g.fillRect(W*.45,W*.18,W*.1,W*.64); g.fillRect(W*.18,W*.45,W*.64,W*.1);
  g.fillStyle="rgba(255,255,255,.35)"; g.fillRect(W*.55,W*.18,W*.02,W*.27); g.fillRect(W*.55,W*.55,W*.27,W*.02); });
const phillipsMat=new T.MeshStandardMaterial({map:phillipsTex,metalness:.85,roughness:.32});
const threadTex=canvasTex(32,64,(g,W,H)=>{ g.fillStyle="#9ea3a9"; g.fillRect(0,0,W,H); g.strokeStyle="#4a4e54"; g.lineWidth=3; for(let y=-H;y<H*2;y+=8){ g.beginPath(); g.moveTo(0,y); g.lineTo(W,y+6); g.stroke(); } });
threadTex.wrapS=threadTex.wrapT=T.RepeatWrapping;
function panScrew(parent,r,headH,shankR,shankL,topMat=phillipsMat){
  const g=new T.Group(); parent.add(g);
  const head=mesh(new T.CylinderGeometry(r*.84,r,headH,28),[screwMetal,topMat,screwMetal],[0,headH/2,0],g);
  const dome=mesh(new T.CylinderGeometry(r*.6,r*.84,headH*.3,28),[screwMetal,topMat,screwMetal],[0,headH*1.15,0],g);
  const tm=new T.MeshStandardMaterial({map:threadTex.clone(),metalness:.85,roughness:.35}); tm.map.needsUpdate=true; tm.map.repeat.set(1,shankL/.12);
  const shank=mesh(new T.CylinderGeometry(shankR,shankR*.8,shankL,12),tm,[0,-shankL/2,0],g);
  return {g,head,dome,shank}; }
/* retention bracket: two black plastic pieces, one along each 54 mm row of holes (above and below the socket).
   Each is a flat bar with round screw bosses at the ends, a segmented rib on the socket side, and a flared hook
   in the middle on the outside (where clip-on coolers latch). Piece space: x along the bar, shape +y points away from the socket. */
const BRACKET_SCREW_Y=.42;
function bracketPiece(z){
  const g=new T.Group(); g.position.z=z; if(z>0) g.rotation.y=Math.PI; bracketGroup.add(g);   // local −z is always outward
  const bar=new T.Shape(); bar.moveTo(-2.75,-.45); bar.lineTo(2.75,-.45); bar.absarc(2.75,0,.45,-Math.PI/2,Math.PI/2,false); bar.lineTo(-2.75,.45); bar.absarc(-2.75,0,.45,Math.PI/2,Math.PI*1.5,false);
  const hook=new T.Shape(); hook.moveTo(-1.7,.2); hook.quadraticCurveTo(-.6,.3,-.55,1.05); hook.lineTo(-.55,1.3); hook.lineTo(.55,1.3); hook.lineTo(.55,1.05); hook.quadraticCurveTo(.6,.3,1.7,.2); hook.lineTo(-1.7,.2);
  const parts=[mesh(flatExtrude(bar,.3),bracketMat,[0,.1,0],g), mesh(flatExtrude(hook,.95),bracketMat,[0,.1,0],g),
    mesh(box(1.1,.2,.42),bracketMat,[0,.95,-1.45],g),                                    // catch lip on top of the hook
    ...[-1.85,0,1.85].map(x=>mesh(box(1.25,.7,.22),bracketMat,[x,.75,.32],g)),           // rib on the socket side, in 3 segments
    ...[-2.7,2.7].map(x=>mesh(new T.CylinderGeometry(.34,.34,.1,20),bracketMat,[x,.42,0],g))];   // raised screw bosses
  parts.forEach(m=>m.userData.part="bracket"); }
[-4.5,4.5].forEach(bracketPiece);
const bracketScrews=HOLES.map(([x,z])=>{ const s=panScrew(bracketGroup,.21,.08,.07,.45); s.g.position.set(x,BRACKET_SCREW_Y+.05,z);
  [s.head,s.dome,s.shank].forEach(m=>m.userData.part="bracket"); return s.g; });
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
/* lever: like the real board, it lies along the bottom edge (+z) with the handle at the left; the bent end at the
   bottom-right corner is the axle going into the cam housing, so it lifts in the x-y plane (rotation.z → LEVER_UP) */
const LEVER_UP=-Math.PI/2;
const leverPivot=new T.Group(); leverPivot.position.set(2.62,.5,2.62); socket.add(leverPivot);
const rod=mesh(new T.CylinderGeometry(.1,.1,5.0,16),leverMat,[-2.5,0,0],leverPivot); rod.rotation.z=Math.PI/2;
const axle=mesh(new T.CylinderGeometry(.1,.1,.5,16),leverMat,[0,0,-.25],leverPivot); axle.rotation.x=Math.PI/2;
const hnd=mesh(new T.CylinderGeometry(.12,.12,.45,16),leverMat,[-5.0,0,.2],leverPivot); hnd.rotation.x=Math.PI/2;
const grip=mesh(new T.SphereGeometry(.2,20,14),leverMat,[-5.0,0,.45],leverPivot);
const leverHit=mesh(box(5.6,.8,1.3),new T.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}),[-2.6,0,.15],leverPivot,{cast:false});
[rod,axle,hnd,grip,leverHit].forEach(m=>m.userData.part="lever");
mesh(box(.3,.2,.3),cream,[-1.9,.45,2.85],socket);                                                 // lever hook
const targetMat=new T.MeshBasicMaterial({color:0xe8b33a,transparent:true,opacity:0,depthWrite:false});
(function(){ const s=new T.Shape(); s.moveTo(-2.6,-2.6); s.lineTo(2.6,-2.6); s.lineTo(2.6,2.6); s.lineTo(-2.6,2.6); const h=new T.Path(); h.moveTo(-2.3,-2.3); h.lineTo(-2.3,2.3); h.lineTo(2.3,2.3); h.lineTo(2.3,-2.3); s.holes.push(h);
  const m=new T.Mesh(new T.ShapeGeometry(s),targetMat); m.rotation.x=-Math.PI/2; m.position.y=.47; socket.add(m); })();
