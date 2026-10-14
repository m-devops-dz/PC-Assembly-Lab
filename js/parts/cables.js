/* ---------------- cables (generic plug + tube) ---------------- */
const V3=(x,y,z)=>new T.Vector3(x,y,z);
const CABLES={};
function makeCable(id,o){
  const plug=new T.Group(); plug.visible=false; o.parent.add(plug);
  const pm=new T.MeshStandardMaterial({color:o.plugColor,roughness:.5});
  const body=mesh(box(...o.plugSize),pm,[0,o.plugSize[1]/2,0],plug); body.userData={part:"cable",cable:id};
  if(o.wires){ const [w,h,d]=o.plugSize;                                 // fan plug: the guide rib along one side, and the pin holes underneath
    mesh(box(w*.6,h*.85,.07),pm,[0,h*.45,d/2+.035],plug).userData={part:"cable",cable:id};
    mesh(box(.12,h*.5,.05),pm,[w*.36,h*.62,d/2+.03],plug); }
  const hit=mesh(box(o.plugSize[0]+.8,1.2,o.plugSize[2]+.9),new T.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}),[0,.4,0],plug,{cast:false}); hit.userData={part:"cable",cable:id};
  const c=Object.assign({id,plug,mat:new T.MeshStandardMaterial({color:o.color,roughness:.6}),mesh:null,state:"none",target:null},o);
  CABLES[id]=c; return c;
}
// fan leads: thin wires side by side (black first, then the colours), not one round tube. The wires spread along side0
// (the plug's long axis), kept square to the cable so they still lie side by side where it runs straight up or down
function ribbonGeos(curve,wires,gap,r,side0){ const n=48, P=curve.getSpacedPoints(n), up=V3(0,1,0);
  const sides=P.map((p,i)=>{ const tg=curve.getTangentAt(i/n), s=side0.clone().addScaledVector(tg,-side0.dot(tg)); if(s.lengthSq()<.01) s.crossVectors(tg,up); return s.normalize(); });
  return wires.map((col,w)=>{ const o=(w-(wires.length-1)/2)*gap; return new T.TubeGeometry(new T.CatmullRomCurve3(P.map((p,i)=>p.clone().addScaledVector(sides[i],o))),n,r,5,false); }); }
function ribbonMesh(geos,wires,parent){ const g=new T.Group();
  geos.forEach((geo,i)=>{ const m=new T.Mesh(geo,new T.MeshStandardMaterial({color:wires[i],roughness:.5})); m.castShadow=true; g.add(m); }); parent.add(g); return g; }
function drawCable(c){
  if(!c.plug.visible){ if(c.mesh) c.mesh.visible=false; return; }
  c.parent.updateMatrixWorld(true);
  const a=c.anchor(), b=c.plug.getWorldPosition(V3(0,0,0)).add(V3(0,c.plugSize[1],0));
  const out=a.clone().add(c.outDir()); const mid=a.clone().lerp(b,.5); mid.y=Math.max(Math.min(a.y,b.y)-.8,c.floorY);
  const pts=(c.route?[a,...c.route(),b.clone().add(V3(0,.7,0)),b]:[a,out,mid,b.clone().add(V3(0,.7,0)),b]).map(p=>c.parent.worldToLocal(p.clone()));   // route: fixed waypoints instead of the straight sag
  if(c.wires){ const geos=ribbonGeos(new T.CatmullRomCurve3(pts),c.wires,c.gap,c.radius,V3(1,0,0).applyQuaternion(c.plug.quaternion));
    if(!c.mesh) c.mesh=ribbonMesh(geos,c.wires,c.parent); else c.mesh.children.forEach((m,i)=>{ m.geometry.dispose(); m.geometry=geos[i]; });
    c.mesh.visible=true; return; }
  const geo=new T.TubeGeometry(new T.CatmullRomCurve3(pts),60,c.radius,8,false);
  if(!c.mesh){ c.mesh=new T.Mesh(geo,c.mat); c.mesh.castShadow=true; c.parent.add(c.mesh); } else { c.mesh.geometry.dispose(); c.mesh.geometry=geo; }
  c.mesh.visible=true;
}
const FAN4_WIRES=[0x18181a,0xf2c21b,0x2f9e44,0x2864d8], FAN3_WIRES=[0x18181a,0xd83a2e,0xf2c21b];   // GND, +12 V, tach (, PWM)
makeCable("fan",{parent:boardRoot,color:0x1a1a1d,radius:.06,wires:FAN4_WIRES,gap:.13,plugColor:0xe9e4d6,   // white plug, thick bright wires: easy to see which way the cooler's lead points
  plugSize:[1.05,.42,.36],maxLen:9.5,hoverY:2.6,floorY:.45,
  anchor:()=>coolerYaw.localToWorld(CABLE_LOCAL.clone()), outDir:()=>V3(0,-.3,-.4).applyQuaternion(coolerYaw.quaternion),
  targets:()=>HEADERS.map(h=>({name:h.name,x:h.x,z:h.z,seatY:.3,rot:h.rot,ok:h.ok,err:"e_sysfan"})),
  okMsg:"ok_fan", okKey:null});
// short fan lead hanging off the cooler while it's held and rotated; swapped for the draggable cable at the fan step
const fanLead=new T.Group(); coolerYaw.add(fanLead);
(function(){ const c=CABLES.fan, e=V3(1.5,.9,-7.4);
  ribbonMesh(ribbonGeos(new T.CatmullRomCurve3([CABLE_LOCAL.clone(),V3(1.2,1.5,-5.6),V3(1.35,1.0,-6.6),e]),c.wires,c.gap,c.radius,V3(0,0,1)),c.wires,fanLead);
  const plug=mesh(box(...c.plugSize),new T.MeshStandardMaterial({color:c.plugColor,roughness:.5}),[e.x,e.y-c.plugSize[1]/2,e.z-.2],fanLead); plug.rotation.y=Math.PI/2;
  fanLead.traverse(m=>{ if(m.isMesh) m.userData.part="cooler"; }); })();
const fanLeadMats=[]; fanLead.traverse(m=>{ if(m.isMesh) fanLeadMats.push(m.material); });   // pulse while the cooler is placed (loop.js): which way the lead points decides the turn
