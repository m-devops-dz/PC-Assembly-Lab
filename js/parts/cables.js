/* ---------------- cables (generic plug + tube) ---------------- */
const V3=(x,y,z)=>new T.Vector3(x,y,z);
const CABLES={};
function makeCable(id,o){
  const plug=new T.Group(); plug.visible=false; o.parent.add(plug);
  const pm=new T.MeshStandardMaterial({color:o.plugColor,roughness:.5});
  const body=mesh(box(...o.plugSize),pm,[0,o.plugSize[1]/2,0],plug); body.userData={part:"cable",cable:id};
  const hit=mesh(box(o.plugSize[0]+.8,1.2,o.plugSize[2]+.9),new T.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}),[0,.4,0],plug,{cast:false}); hit.userData={part:"cable",cable:id};
  const c=Object.assign({id,plug,mat:new T.MeshStandardMaterial({color:o.color,roughness:.6}),mesh:null,state:"none",target:null},o);
  CABLES[id]=c; return c;
}
function drawCable(c){
  if(!c.plug.visible){ if(c.mesh) c.mesh.visible=false; return; }
  c.parent.updateMatrixWorld(true);
  const a=c.anchor(), b=c.plug.getWorldPosition(V3(0,0,0)).add(V3(0,c.plugSize[1],0));
  const out=a.clone().add(c.outDir()); const mid=a.clone().lerp(b,.5); mid.y=Math.max(Math.min(a.y,b.y)-.8,c.floorY);
  const pts=[a,out,mid,b.clone().add(V3(0,.7,0)),b].map(p=>c.parent.worldToLocal(p.clone()));
  const geo=new T.TubeGeometry(new T.CatmullRomCurve3(pts),60,c.radius,8,false);
  if(!c.mesh){ c.mesh=new T.Mesh(geo,c.mat); c.mesh.castShadow=true; c.parent.add(c.mesh); } else { c.mesh.geometry.dispose(); c.mesh.geometry=geo; }
  c.mesh.visible=true;
}
makeCable("fan",{parent:boardRoot,color:0x1a1a1d,radius:.06,plugColor:0x111214,plugSize:[1.05,.42,.36],maxLen:9.5,hoverY:2.6,floorY:.45,
  anchor:()=>coolerYaw.localToWorld(CABLE_LOCAL.clone()), outDir:()=>V3(0,-.3,-.4).applyQuaternion(coolerYaw.quaternion),
  targets:()=>HEADERS.map(h=>({name:h.name,x:h.x,z:h.z,seatY:.3,rot:h.rot,ok:h.ok,err:"e_sysfan"})),
  okMsg:"ok_fan", okKey:null});
// short fan lead hanging off the cooler while it's held and rotated; swapped for the draggable cable at the fan step
const fanLead=new T.Group(); coolerYaw.add(fanLead);
(function(){ const c=CABLES.fan, e=V3(1.5,.9,-7.4);
  const tube=new T.TubeGeometry(new T.CatmullRomCurve3([CABLE_LOCAL.clone(),V3(1.2,1.5,-5.6),V3(1.35,1.0,-6.6),e]),24,c.radius,8,false);
  mesh(tube,c.mat,null,fanLead);
  const plug=mesh(box(...c.plugSize),new T.MeshStandardMaterial({color:c.plugColor,roughness:.5}),[e.x,e.y-c.plugSize[1]/2,e.z-.2],fanLead); plug.rotation.y=Math.PI/2;
  fanLead.traverse(m=>{ if(m.isMesh) m.userData.part="cooler"; }); })();
