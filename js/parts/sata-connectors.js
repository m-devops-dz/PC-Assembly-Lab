/* ---------------- L-shaped SATA connectors ---------------- */
// L outline in the (z, y) plane; the same shape is used for the port tongue and the plug slot, so they match only at roll 0.
function lPts(len){ const t=.11, st=.28, a=-len/2, b=-.14; return [[a,b],[a+len,b],[a+len,b+t],[a+t,b+t],[a+t,b+st],[a,b+st]]; }   // also drawn flat in the key view
function lShape(len){ const s=new T.Shape(), p=lPts(len); s.moveTo(...p[0]); p.slice(1).forEach(q=>s.lineTo(...q)); s.lineTo(...p[0]); return s; }
function lGeo(len,depth){ const g=new T.ExtrudeGeometry(lShape(len),{depth,bevelEnabled:false}); g.rotateY(-Math.PI/2); return g; }  // extrudes toward -x
const tongueMat=new T.MeshStandardMaterial({color:0x3a3c42,roughness:.45});
// A port frame: +x points INTO the device. yaw 0 → opening faces -x, yaw π → opening faces +x.
function makePort(parent,pos,yaw,len,housing){
  const f=new T.Group(); f.position.copy(pos); f.rotation.y=yaw; parent.add(f);
  const [h,w]=housing;
  mesh(box(.5,h,w),blackPlastic,[.55,0,0],f);                                   // back block
  mesh(box(.3,.06,w),blackPlastic,[.15,h/2-.03,0],f); mesh(box(.3,.06,w),blackPlastic,[.15,-h/2+.03,0],f);
  mesh(box(.3,h,.06),blackPlastic,[.15,0,w/2-.03],f); mesh(box(.3,h,.06),blackPlastic,[.15,0,-w/2+.03],f);
  mesh(lGeo(len,.3),tongueMat,[.3,0,0],f,{cast:false});                         // L tongue, visible from outside
  return {frame:f,len,housing};
}
