/* plugs + cables */
function makePlug(len,color,lcolor,id){
  const outer=new T.Group(), inner=new T.Group(); outer.add(inner); outer.visible=false; scene.add(outer);
  const w=len+.3, bm=new T.MeshStandardMaterial({color,roughness:.5});
  const b=mesh(box(1.0,.36,len+.1),bm,[-.5,0,0],inner); b.userData={part:"conn",conn:id};
  const slot=mesh(lGeo(len+.04,.02),new T.MeshBasicMaterial({color:lcolor}),[.021,0,0],inner,{cast:false}); slot.userData={part:"conn",conn:id};
  const hit=mesh(box(1.6,1.2,w+.8),new T.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}),[-.5,0,0],inner,{cast:false}); hit.userData={part:"conn",conn:id};
  return {outer,inner,roll:0};
}
// Molex Mini-Fit power plug (24-pin ATX, 8-pin EPS): rows×cols square pin towers at the front (+x), a body, a latch clip on +y,
// and one wire per pin leaving the back. `pins` are the wire exits in inner-group space.
const MF_P=.42;   // Mini-Fit pin pitch
const pinFaceMat=new T.MeshStandardMaterial({map:canvasTex(32,32,(g,W)=>{ g.fillStyle="#141518"; g.fillRect(0,0,W,W); g.fillStyle="#050506"; g.fillRect(7,7,18,18); g.fillStyle="#b89a55"; g.fillRect(12,10,8,3); g.fillRect(12,19,8,3); }),roughness:.5});
function makePinPlug(rows,cols,id){
  const outer=new T.Group(), inner=new T.Group(); outer.add(inner); outer.visible=false; scene.add(outer);
  const bm=new T.MeshStandardMaterial({color:0x141518,roughness:.5}), tag=m=>{ m.userData={part:"conn",conn:id}; return m; };
  const W=cols*MF_P+.16, H=rows*MF_P+.16, towerGeo=box(.5,.36,.36), pins=[];
  for(let r=0;r<rows;r++) for(let c=0;c<cols;c++){ const y=(r-(rows-1)/2)*MF_P, z=(c-(cols-1)/2)*MF_P;
    tag(mesh(towerGeo,[pinFaceMat,bm,bm,bm,bm,bm],[-.25,y,z],inner)); pins.push(V3(-1.25,y,z)); }
  tag(mesh(box(.75,H,W),bm,[-.875,0,0],inner));                                       // body
  tag(mesh(box(.9,.09,.46),bm,[-.62,H/2+.16,0],inner));                               // latch lever
  tag(mesh(box(.18,.16,.46),bm,[-1.06,H/2+.07,0],inner));                             // lever hinge
  tag(mesh(box(.14,.2,.46),bm,[-.14,H/2+.1,0],inner));                                // hook that catches the header tab
  tag(mesh(box(2.2,H+1,W+.8),new T.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}),[-.8,0,0],inner,{cast:false}));
  return {outer,inner,roll:0,pins,rows,cols};
}
const CONN={
  data:{id:"data",mat:new T.MeshStandardMaterial({color:0xc0212c,roughness:.55}),radius:.1,mesh:null,
        a:makePlug(.95,0xc0212c,0x111111,"data"), b:makePlug(.95,0xc0212c,0x111111,"data"), stateA:"loose", stateB:"loose"},
  power:{id:"power",mat:new T.MeshStandardMaterial({color:0x111214,roughness:.6}),radius:.16,mesh:null,
        a:makePlug(1.9,0x141518,0xdddddd,"power"), stateA:"loose"},
  atx24:{id:"atx24",mat:new T.MeshStandardMaterial({color:0x18191c,roughness:.55}),radius:.085,mesh:null,
        a:makePinPlug(2,12,"atx24"), stateA:"loose"},
  cpu8:{id:"cpu8",mat:new T.MeshStandardMaterial({color:0x18191c,roughness:.55}),radius:.085,mesh:null,overY:16,   // routed over the graphics card so it stays in view
        a:makePinPlug(2,4,"cpu8"), stateA:"loose"},
  gpu8:{id:"gpu8",mat:new T.MeshStandardMaterial({color:0x18191c,roughness:.55}),radius:.085,mesh:null,
        a:makePinPlug(2,4,"gpu8"), stateA:"loose"}
};
// where the wire leaves the plug (p.back: plug-local x of its rear face, default -1) and which way it heads
const plugBack=p=>p.inner.localToWorld(V3(p.back??-1,0,0));
const plugBackDir=p=>p.inner.localToWorld(V3((p.back??-1)-1,0,0)).sub(plugBack(p)).normalize();
// keep a cable's control points between the case walls
const inCase=p=>{ p.x=Math.min(Math.max(p.x,CX0+1.6),CX1-1.4); p.z=Math.min(Math.max(p.z,CZ0+1.4),CZ1-1.4); return p; };
function drawConn(c){
  let a,da,b,db;
  // plugs are often moved in the same tick, before the renderer refreshes world matrices
  psuG.updateMatrixWorld(true); c.a.outer.updateMatrixWorld(true); if(c.b) c.b.outer.updateMatrixWorld(true);
  if(c.id==="data"){ if(!c.a.outer.visible) return; a=plugBack(c.a); da=plugBackDir(c.a); b=plugBack(c.b); db=plugBackDir(c.b); }
  else { if(!c.a.outer.visible) return;
    const psuOff={power:V3(7.3,3,-2),atx24:V3(7.3,3,1),cpu8:V3(7.3,3,-4),gpu8:V3(7.3,5.5,2.6)}[c.id];
    if(c.anchor){ a=c.anchor(); da=c.anchorDir(); } else { a=psuG.localToWorld(psuOff); da=V3(1,0,0).applyQuaternion(psuG.quaternion); }
    b=plugBack(c.a); db=plugBackDir(c.a); }
  const mid=a.clone().lerp(b,.5); mid.y=c.overY??Math.max(Math.min(a.y,b.y)-1,.7);   // overY: arch over the GPU instead of sagging
  if(c.a.pins) return drawBundle(c,a,da,mid,db);
  const keep=c.outside?(p=>p):inCase;                                     // desk cables (keyboard, mouse, monitor) run outside the case
  const pts=[a,keep(a.clone().addScaledVector(da,1.2)),...(c.via?c.via():[keep(mid)]),keep(b.clone().addScaledVector(db,1.2)),b];   // via: route around the case
  const geo=new T.TubeGeometry(new T.CatmullRomCurve3(pts),64,c.radius,8,false);
  if(!c.mesh){ c.mesh=new T.Mesh(geo,c.mat); c.mesh.castShadow=true; c.mesh.userData={part:"conn",conn:c.id}; scene.add(c.mesh); } else { c.mesh.geometry.dispose(); c.mesh.geometry=geo; }
}
// one wire per pin: they leave the plug straight and parallel, then gather into a tighter bundle toward the PSU
function drawBundle(c,a,da,mid,db){
  const P=c.a, q=P.inner.getWorldQuaternion(new T.Quaternion());
  const py=V3(0,1,0).applyQuaternion(q), pz=V3(0,0,1).applyQuaternion(q);                  // plug's row / column axes
  let uy=V3(0,1,0), uz=V3(0,0,1).applyQuaternion(psuG.quaternion);                          // same axes at the PSU face
  if(uy.dot(py)<0) uy.negate(); if(uz.dot(pz)<0) uz.negate();                              // keep wire order so the bundle doesn't cross over
  if(!c.group){ c.group=new T.Group(); scene.add(c.group); }
  P.pins.forEach((pin,i)=>{
    const tip=P.inner.localToWorld(pin.clone()), oP=uy.clone().multiplyScalar(pin.y*.45).addScaledVector(uz,pin.z*.45);
    const oMid=oP.clone().lerp(tip.clone().sub(P.inner.localToWorld(V3(pin.x,0,0))),.4);
    const pts=[a.clone().add(oP),inCase(a.clone().addScaledVector(da,1.6).add(oP)),inCase(mid.clone().add(oMid)),inCase(tip.clone().addScaledVector(db,2.2)),tip];
    const geo=new T.TubeGeometry(new T.CatmullRomCurve3(pts),36,c.radius,5,false);
    let m=c.group.children[i];
    if(!m){ m=new T.Mesh(geo,c.mat); m.castShadow=true; m.userData={part:"conn",conn:c.id}; c.group.add(m); } else { m.geometry.dispose(); m.geometry=geo; }
  });
}
function layLoose(p,pos,yaw,roll){ p.outer.visible=true; p.outer.position.copy(pos); p.outer.rotation.set(0,yaw,0); p.inner.rotation.x=roll; }
function showConnCables(){
  layLoose(CONN.data.a,V3(19.6,.75,L.z+9.6),2.4,Math.PI/2); layLoose(CONN.data.b,V3(17.2,.75,L.z+11),.4,Math.PI/2);
  layLoose(CONN.power.a,V3(3.5,.75,L.z+15.5),2.8,Math.PI/2);
  layLoose(CONN.atx24.a,V3(18.0,.95,L.z-1.0),Math.PI,0);
  layLoose(CONN.cpu8.a,V3(-5.6,4.6,L.z-9.8),Math.PI/2,0);           // on the corner of the cooler shroud, so it isn't hidden under the cooler
  layLoose(CONN.gpu8.a,V3(19.5,.95,L.z+4.5),Math.PI,0);
  Object.values(CONN).forEach(drawConn);
}
// where each connection goes: port frame, and which plug
function connJob(step){
  if(step===ST.dataSsd) return {c:CONN.data,plug:CONN.data.a,port:ssdData,key:"A",ok:"ok_dataSsd"};
  if(step===ST.dataMb) return {c:CONN.data,plug:CONN.data.b,port:mbSata[0],key:"B",ok:"ok_dataMb"};
  if(step===ST.sataPower) return {c:CONN.power,plug:CONN.power.a,port:ssdPower,key:"A",ok:"ok_sataPower"};
  if(step===ST.atx24) return {c:CONN.atx24,plug:CONN.atx24.a,port:mbAtx,key:"A",ok:"ok_atx24",err:"e_latch"};
  if(step===ST.cpu8) return {c:CONN.cpu8,plug:CONN.cpu8.a,port:mbCpuPwr,key:"A",ok:"ok_cpu8",err:"e_latch"};
  if(step===ST.gpuPower) return {c:CONN.gpu8,plug:CONN.gpu8.a,port:gpuPwrPort,key:"A",ok:"ok_gpu8",err:"e_latch"};
  // peripherals: the user picks the port (S.connPort, one of RPORTS) after clicking the cable
  if(step===ST.usbKeyboard) return {c:CONN.usbKb,plug:CONN.usbKb.a,port:S.connPort,choose:"usb",ok:"ok_usbKb",err:"e_usbFlip"};
  if(step===ST.usbMouse) return {c:CONN.usbMouse,plug:CONN.usbMouse.a,port:S.connPort,choose:"usb",ok:"ok_usbMouse",err:"e_usbFlip"};
  if(step===ST.hdmi) return {c:CONN.hdmi,plug:CONN.hdmi.a,port:S.connPort,choose:"hdmi",ok:"ok_hdmi",err:"e_hdmiFlip"};
  if(step===ST.powerCord) return {c:CONN.ac,plug:CONN.ac.a,port:psuInlet,key:"A",ok:"ok_powerCord",err:"e_iecFlip"};
  return null;
}
function portWorld(port){ const f=port.frame; f.updateMatrixWorld(true); const p=f.getWorldPosition(V3(0,0,0)); const q=f.getWorldQuaternion(new T.Quaternion()); return {p,q,out:V3(-1,0,0).applyQuaternion(q)}; }
