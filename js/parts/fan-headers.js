/* ---------------- fan headers ---------------- */
const pinGold=new T.MeshStandardMaterial({color:0xe2b95a,metalness:.9,roughness:.3});
const HEADERS=[{name:"CPU_FAN1",x:1.9,z:-10.9,rot:0,ok:true},{name:"SYS_FAN1",x:2.45,z:-8.3,rot:Math.PI/2,ok:false}];
HEADERS.forEach(h=>{ const g=new T.Group(); g.position.set(h.x,0,h.z); g.rotation.y=h.rot; boardRoot.add(g);
  h.mat=new T.MeshStandardMaterial({color:0x151518,roughness:.55});
  if(h.ok) mesh(box(1.1,.5,.45),h.mat,[0,.35,0],g); else mesh(box(1.1,.5,.45),h.mat,[0,.35,0],g);
  for(let i=0;i<4;i++) mesh(new T.CylinderGeometry(.04,.04,.5,8),pinGold,[-.36+i*.24,.55,0],g); h.group=g; });
