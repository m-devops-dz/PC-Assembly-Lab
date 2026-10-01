/* ---------------- power strip (EU, 4 Schuko sockets) + the monitor's power cable ----------------
   White strip on the desk behind the case, red lit rocker switch at the cord end, its cord running off the desk
   to the wall. Two plugs sit in it: the PC's power cord (CONN.ac: the user plugs its other end into the PSU,
   powerCord step) and the monitor's power cable, already plugged in at both ends. Part of periG, so it shows up
   with the keyboard, mouse and monitor. 1 unit = 1 cm. */
const STRIP_POS=V3(-36,DESK.y,-17), STRIP_L=34, STRIP_W=6, STRIP_H=3.4;
const STRIP_SOCKETS=[-6.5,-.5,5.5,11.5];                 // socket centres along x (strip-local); cord and switch at the −x end
const stripG=new T.Group(); stripG.position.copy(STRIP_POS); periG.add(stripG);
const stripWhite=new T.MeshStandardMaterial({color:0xf3f4f5,roughness:.42});
const stripCopper=new T.MeshStandardMaterial({color:0xc77c4a,metalness:.8,roughness:.35});
const stripHole=new T.MeshBasicMaterial({color:0x0b0b0c});
const stripSwitch=new T.MeshStandardMaterial({color:0xd8141c,roughness:.35,emissive:0xff1a1a,emissiveIntensity:.55});   // lit: the strip is on
(function strip(){
  // body with rounded ends
  const r=STRIP_W/2, s=new T.Shape(); s.moveTo(-STRIP_L/2+r,-r); s.lineTo(STRIP_L/2-r,-r); s.absarc(STRIP_L/2-r,0,r,-Math.PI/2,Math.PI/2,false);
  s.lineTo(-STRIP_L/2+r,r); s.absarc(-STRIP_L/2+r,0,r,Math.PI/2,Math.PI*1.5,false);
  const g=new T.ExtrudeGeometry(s,{depth:STRIP_H-.4,bevelEnabled:true,bevelThickness:.2,bevelSize:.2,bevelSegments:2,curveSegments:16});
  g.rotateX(-Math.PI/2); g.translate(0,.2,0); mesh(g,stripWhite,[0,0,0],stripG);
  const top=STRIP_H;
  STRIP_SOCKETS.forEach(x=>{
    const well=mesh(new T.CylinderGeometry(2.05,2.05,.12,40),new T.MeshStandardMaterial({color:0xe2e5e8,roughness:.55}),[x,top+.02,0],stripG,{cast:false});
    [-.95,.95].forEach(dx=>mesh(new T.CylinderGeometry(.24,.24,.14,14),stripHole,[x+dx,top+.04,0],stripG,{cast:false}));
    [-1,1].forEach(sz=>mesh(box(.9,.16,.3),stripCopper,[x,top+.05,sz*1.85],stripG,{cast:false}));   // earth clips
  });
  mesh(box(3.6,.4,3.8),new T.MeshStandardMaterial({color:0x141517,roughness:.5}),[-13,top+.12,0],stripG);   // switch surround
  const rk=mesh(box(2.9,.5,3.1),stripSwitch,[-13,top+.35,0],stripG); rk.rotation.x=.12;            // rocker, pressed to "I"
  mesh(box(2.4,1.8,2.2),stripWhite,[-STRIP_L/2-.6,1.6,0],stripG);                                     // cord boot
})();
// a Schuko plug seated in socket i, its cable leaving toward −z (the case side). Returns where the cable starts.
const schukoBlack=new T.MeshStandardMaterial({color:0x17181b,roughness:.55});
function schukoPlug(i){
  const x=STRIP_SOCKETS[i], top=STRIP_H, p=new T.Group(); p.position.set(x,top,0); stripG.add(p);
  mesh(new T.CylinderGeometry(1.95,2.05,2.0,32),schukoBlack,[0,1.0,0],p);
  mesh(new T.TorusGeometry(1.98,.08,6,32),schukoBlack,[0,1.6,0],p).rotation.x=Math.PI/2;        // grip ridge
  const boot=mesh(new T.CylinderGeometry(.55,.75,2.4,16),schukoBlack,[0,1.5,-2.6],p); boot.rotation.x=Math.PI/2;
  stripG.updateMatrixWorld(true); return stripG.localToWorld(V3(x,top+1.5,-3.9));
}
const STRIP_PC=3, STRIP_MON=2;
const pcPlugOut=schukoPlug(STRIP_PC), monPlugOut=schukoPlug(STRIP_MON);
// the PC's power cord now starts at the strip
Object.assign(CONN.ac,{anchor:()=>pcPlugOut.clone(), anchorDir:()=>V3(0,0,-1)});
// strip cord: off the −x end, along the desk and over its edge to the wall
(function cord(){ stripG.updateMatrixWorld(true); const e=stripG.localToWorld(V3(-STRIP_L/2-1.8,1.6,0));
  const pts=[e,e.clone().add(V3(-3,0,0)),V3(-60,.3,-15.5),V3(-70,.3,-13),V3(-77.2,.3,-12.5),V3(-79,-1.2,-12.4),V3(-79.6,-8,-12.3),V3(-79.8,-40,-12.3)];
  const m=new T.Mesh(cableGeo(pts,.32,90,8),stripWhite); m.castShadow=true; periG.add(m); })();
// monitor power cable: an IEC C13 plug in the back of the monitor, down behind the stand, along the desk around the
// top end of the case (beside the HDMI cable), to the strip
(function monitorPower(){
  monG.updateMatrixWorld(true);
  mesh(box(1.6,2.2,2.4),schukoBlack,[-1.4,13,13],monG);
  const L2=v=>monG.localToWorld(v);
  const pts=[L2(V3(-2.2,13,13)),L2(V3(-3.2,12.6,13)),L2(V3(-4.5,6,14)),L2(V3(-5.5,.4,15)),V3(CX1+3,.4,CZ0-8),V3(CX0-10,.4,CZ0-8),
    V3(CX0-10,.4,-30),V3(monPlugOut.x,.4,monPlugOut.z-5),V3(monPlugOut.x,monPlugOut.y,monPlugOut.z-1.4),monPlugOut.clone()];
  const m=new T.Mesh(cableGeo(pts,.28,140,8),schukoBlack); m.castShadow=true; periG.add(m); })();
