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
  return {outer,inner,roll:0,pins,rows,cols,bm};
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
// a cable's tube: a smooth curve through pts that never sinks into the case floor or the desk.
// (A plain Catmull-Rom curve overshoots where a cable drops onto the floor, and those stretches vanished under it.)
const CASE_FLOOR=.4;
function floorUnder(p){
  if(caseG.visible&&p.x>CX0&&p.x<CX1&&p.z>CZ0&&p.z<CZ1) return CASE_FLOOR;
  if(p.x>DESK.x0&&p.x<DESK.x1&&p.z>DESK.z0&&p.z<DESK.z1) return DESK.y;
  return -Infinity;                                                       // off the desk edge: free to hang down
}
function cableGeo(pts,r,segs=64,radial=8){
  const sm=new T.CatmullRomCurve3(pts,false,"centripetal").getPoints(segs*2);
  for(let i=2;i<sm.length-2;i++){ const p=sm[i]; p.y=Math.max(p.y,floorUnder(p)+r+.03); }   // the ends stay on their plugs
  return new T.TubeGeometry(new T.CatmullRomCurve3(sm,false,"centripetal"),segs,r,radial,false);
}
function drawConn(c){
  let a,da,b,db;
  // plugs are often moved in the same tick, before the renderer refreshes world matrices
  psuG.updateMatrixWorld(true); c.a.outer.updateMatrixWorld(true); if(c.b) c.b.outer.updateMatrixWorld(true);
  if(c.id==="data"){ if(!c.a.outer.visible) return; a=plugBack(c.a); da=plugBackDir(c.a); b=plugBack(c.b); db=plugBackDir(c.b); }
  else { if(!c.a.outer.visible) return;
    const psuOff={power:V3(7.3,3.25,-2.3),atx24:V3(7.3,2.75,-2.3),cpu8:V3(7.3,3.25,-1.7),gpu8:V3(7.3,2.75,-1.7)}[c.id];   // all out of the one cable hole (psuG 7.1, 3, -2)
    if(c.anchor){ a=c.anchor(); da=c.anchorDir(); } else { a=psuG.localToWorld(psuOff); da=V3(1,0,0).applyQuaternion(psuG.quaternion); }
    b=plugBack(c.a); db=plugBackDir(c.a); }
  const mid=a.clone().lerp(b,.5); mid.y=(c.a.loose&&c.looseY)||(c.overY??Math.max(Math.min(a.y,b.y)-1,.7));   // overY: arch over the GPU instead of sagging
  if(c.a.pins) return drawBundle(c,a,da,mid,db);
  const keep=c.outside?(p=>p):inCase;                                     // desk cables (keyboard, mouse, monitor) run outside the case
  const pts=[a,keep(a.clone().addScaledVector(da,1.2)),...(c.via?c.via(a,b):[keep(mid)]),keep(b.clone().addScaledVector(db,1.2)),b];   // via: route around the case
  const geo=cableGeo(pts,c.radius);
  if(!c.mesh){ c.mesh=new T.Mesh(geo,c.mat); c.mesh.castShadow=true; c.mesh.userData={part:"conn",conn:c.id}; scene.add(c.mesh); } else { c.mesh.geometry.dispose(); c.mesh.geometry=geo; }
}
// sleeved like a real modular cable: one thick covered cable from the PSU hole to just behind the plug, where it opens
// into one wire per pin running straight into the plug. Mesh 0 is the sleeve, the rest are the wires.
const SLEEVE_OPEN=3.4;                                                      // how far behind the plug the sleeve ends
// one wire out of the sleeve's end into its pin, bound to the plug's own frame (its row / column axes), so the wires keep
// their order and stay straight when the plug turns: they start packed in the sleeve's cross-section, in the same pattern
// as the pins, and run straight back along the plug's axis into the pin. span: the plug's pin pattern half-width.
// bend: {corner, tw}: the wires rise straight out of the plug to the corner, then turn (uncovered, in parallel) toward
// the sleeve's end, which lies along tw. Without it they run straight from the sleeve's end into the plug.
function sleeveWire(P,pin,split,db,R,span,bend){
  const q=P.inner.getWorldQuaternion(new T.Quaternion()), py=V3(0,1,0).applyQuaternion(q), pz=V3(0,0,1).applyQuaternion(q), k=R*.72/span;
  const tip=P.inner.localToWorld(pin.clone()), lane=py.clone().multiplyScalar(pin.y).addScaledVector(pz,pin.z);   // the pin's offset in the plug
  const behind=tip.clone().addScaledVector(db,.9);
  if(!bend){ const start=split.clone().addScaledVector(py,pin.y*k).addScaledVector(pz,pin.z*k);
    return [start,start.clone().lerp(behind,.5),behind,tip]; }             // straight: no arch
  // packed in the sleeve's cross-section (the lane with its part along the sleeve removed), turning together at the corner
  const across=lane.clone().addScaledVector(bend.tw,-lane.dot(bend.tw)), start=split.clone().addScaledVector(across,k);
  const turn=bend.corner.clone().add(lane.clone().multiplyScalar(.85));
  return [start,start.clone().lerp(turn,.5).add(across.clone().multiplyScalar(.3)),turn,behind,tip];
}
const pinSpan=(Ps,dz=()=>0)=>Math.max(.2,...Ps.flatMap(P=>P.pins.map(p=>Math.hypot(p.y,p.z+dz(P)))));   // dz: a plug's offset inside its set (4+4 halves)
function drawBundle(c,a,da,mid,db){
  const P=c.a; if(!c.group){ c.group=new T.Group(); scene.add(c.group); }
  const span=pinSpan([P]), open=Math.max(SLEEVE_OPEN,span*2.4), R=c.radius*Math.sqrt(P.pins.length)*1.15;
  const back=P.inner.localToWorld(V3(P.pins[0].x,0,0));
  const ar=P.loose&&c.looseAround||c.around, way=ar?ar.map(w=>inCase(w.clone())):[inCase(mid.clone())];
  // the sleeve stops short and off to the side the cable comes from; the last stretch, with the bend, is bare wires
  const tw=way[way.length-1].clone().sub(back); tw.addScaledVector(db,-tw.dot(db));
  const bend=tw.length()>1?{corner:back.clone().addScaledVector(db,open*.7),tw:tw.normalize()}:null;
  const split=bend?bend.corner.clone().addScaledVector(bend.tw,open*.9).addScaledVector(db,open*.25):back.clone().addScaledVector(db,open);
  const lead=bend?split.clone().addScaledVector(bend.tw,3):split.clone().addScaledVector(db,3.2).setY(Math.max(split.y+3.2*db.y,P.loose?3.2:0));
  const put=(k,geo)=>{ let m=c.group.children[k];
    if(!m){ m=new T.Mesh(geo,c.mat); m.castShadow=true; m.userData={part:"conn",conn:c.id}; c.group.add(m); } else { m.geometry.dispose(); m.geometry=geo; } };
  put(0,cableGeo([a,inCase(a.clone().addScaledVector(da,1.6)),...way,inCase(lead),split],R,64,10));
  P.pins.forEach((pin,i)=>put(i+1,cableGeo(sleeveWire(P,pin,split,db,R,span,bend),c.radius,18,5)));   // bare wires out of the sleeve, in pin order
}
// loose: lying on the tray, not yet picked up (clickConn / seatConnNow clear it). A loose plug's wires may arch higher (looseY).
function layLoose(p,pos,yaw,roll){ p.loose=true; p.outer.visible=true; p.outer.position.copy(pos); p.outer.rotation.set(0,yaw,0); p.inner.rotation.x=roll; }
// plugs that lie loose to the right of the board: their wires arch over the board (looseY) instead of lying on it
CONN.atx24.looseY=4.2; CONN.gpu8.looseY=4.2;
// the 24-pin's header is on the far side of the graphics card (it stands up across the board, x −16…8 at z ≈ −45):
// its wires go round the card's free end, between the card and the board's edge, never through it
CONN.atx24.around=[V3(4,4.6,L.z+13.5),V3(11.4,5.2,L.z+5)];
CONN.gpu8.looseAround=[V3(4.75,4.6,L.z+14.16),V3(12.15,5.2,L.z+5.66)];       // lying loose: alongside the 24-pin, 1 apart, so the two never cross                  // high enough to clear the parts on the board
function showConnCables(){
  layLoose(CONN.data.a,V3(19.6,.75,L.z+9.6),2.4,Math.PI/2); layLoose(CONN.data.b,V3(17.2,.75,L.z+11),.4,Math.PI/2);
  layLoose(CONN.power.a,V3(9,.75,L.z+15.3),.1,Math.PI/2);   // cable end toward the PSU, so the wire leaves it straight
  layLoose(CONN.atx24.a,V3(24.5,.95,L.z-6.5),0,0);       // back toward the board, where its cable comes from: no hairpin
  layLoose(CONN.cpu8.a,V3(-5.6,4.6,L.z-9.8),Math.PI/2,0);           // on the corner of the cooler shroud, so it isn't hidden under the cooler
  layLoose(CONN.gpu8.a,V3(24.5,.95,L.z-.5),0,0);     // well clear of the SATA ports (L.z+6.8 / +8.4), so its wires don't dip over them
  Object.values(CONN).forEach(drawConn);
}
// where each connection goes: port frame, and which plug
function connJob(step){
  // SATA: after clicking the plug the user clicks the port (SPORTS); pick says which device's port is wanted
  if(step===ST.dataSsd) return {c:CONN.data,plug:CONN.data.a,port:ssdData,key:"A",ok:"ok_dataSsd",pick:"ssd"};
  if(step===ST.dataMb) return {c:CONN.data,plug:CONN.data.b,port:S.sataMb||mbSata[0],key:"B",ok:"ok_dataMb",pick:"mb"};
  if(step===ST.sataPower) return {c:CONN.power,plug:CONN.power.a,port:ssdPower,key:"A",ok:"ok_sataPower",pick:"ssd"};
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
// clickable SATA ports: the SSD's data and power ports and the board's four data ports. Each gets a see-through box
// over its opening that takes the click and glows when it fits the plug in hand.
const SPORTS=[{id:"ssdData",kind:"data",dev:"ssd",port:ssdData},{id:"ssdPower",kind:"power",dev:"ssd",port:ssdPower},
  ...mbSata.map((p,i)=>({id:"sata"+(i+1),kind:"data",dev:"mb",port:p}))];
SPORTS.forEach(s=>{ const [h,w]=s.port.housing; s.mat=new T.MeshBasicMaterial({color:0xffc400,transparent:true,opacity:0,depthWrite:false}); s.used=false;
  s.hint=mesh(box(.14,h+.12,w+.12),s.mat,[-.08,0,0],s.port.frame,{cast:false}); s.hint.userData={part:"sport",port:s.id}; s.hint.visible=false; });
const sportFits=(s,job)=>!!job&&!!job.pick&&!s.used&&s.kind===job.c.id&&s.dev===job.pick;
