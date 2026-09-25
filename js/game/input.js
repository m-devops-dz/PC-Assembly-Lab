/* ---------------- picking & dragging ---------------- */
const ray=new T.Raycaster(), ndc=new T.Vector2();
const visible=o=>{ while(o){ if(!o.visible) return false; o=o.parent; } return true; };
const isDesc=(o,root)=>{ while(o){ if(o===root) return true; o=o.parent; } return false; };
const plane=new T.Plane(V3(0,1,0),0), dragOff=V3(0,0,0), hitP=V3(0,0,0);
let dragging=false, downXY=null, moved=false;
function setNDC(e){ const r=renderer.domElement.getBoundingClientRect(); ndc.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1); ray.setFromCamera(ndc,camera); }
function pick(e){ setNDC(e); const hits=ray.intersectObjects(scene.children,true);
  for(const h of hits){ const o=h.object; if(o.isSprite||!visible(o)) continue; if(o.userData&&o.userData.part) return {d:o.userData,o}; if(S.held==="board"&&isDesc(o,boardRoot)) return {d:{part:"board"},o}; }
  return null; }
function grabbable(p){
  if(!p||!S.held||S.held==="conn") return false;
  if(S.held==="board") return isDesc(p.o,boardRoot);
  if(S.held==="cable") return p.d.part==="cable"&&p.d.cable===S.cable.id;
  if(S.held==="ram") return p.d.part==="ram"&&p.d.ram===S.ram;
  return p.d.part===S.held;
}
vp.addEventListener("pointerdown",e=>{
  if(e.target!==renderer.domElement) return;
  downXY=[e.clientX,e.clientY]; moved=false;
  const p=pick(e); if(!canManipulate()||!grabbable(p)) return;
  const o=HELD[S.held].obj(), w=o.getWorldPosition(V3(0,0,0));
  dragging=true; controls.enabled=false;
  plane.constant=-w.y; ray.ray.intersectPlane(plane,hitP); dragOff.set(w.x-hitP.x,0,w.z-hitP.z);
  renderer.domElement.style.cursor="grabbing";
},true);
window.addEventListener("pointermove",e=>{
  if(downXY&&Math.hypot(e.clientX-downXY[0],e.clientY-downXY[1])>6) moved=true;
  if(dragging){
    setNDC(e); if(!ray.ray.intersectPlane(plane,hitP)) return;
    const type=S.held, o=HELD[type].obj();
    let x=Math.max(-40,Math.min(45,hitP.x+dragOff.x)), z=Math.max(-75,Math.min(20,hitP.z+dragOff.z));
    if(type==="cable"){ const a=S.cable.anchor(), d=Math.hypot(x-a.x,z-a.z), m=S.cable.maxLen; if(d>m){ x=a.x+(x-a.x)*m/d; z=a.z+(z-a.z)*m/d; } }
    const sn=HELD[type].snap(x,z);
    if(sn){ x=sn.x; z=sn.z; if(!S.snap||S.snap.key!==sn.key) toast(sn.msg,"ok"); if(type==="cable") o.rotation.y=sn.tg.rot; }
    S.snap=sn;
    const local=o.parent.worldToLocal(V3(x,0,z)); o.position.x=local.x; o.position.z=local.z;
    return;
  }
  if(e.target===renderer.domElement&&!downXY){ const p=pick(e); renderer.domElement.style.cursor=grabbable(p)?"grab":p?"pointer":"default"; }
});
window.addEventListener("pointerup",e=>{
  if(dragging){ dragging=false; controls.enabled=true; renderer.domElement.style.cursor="grab"; downXY=null; return; }
  if(downXY&&!moved&&e.target===renderer.domElement){
    const p=pick(e);
    if(S.step===ST.board&&!S.held&&!S.busy){ setNDC(e); const hits=ray.intersectObjects([boardRoot],true).filter(h=>visible(h.object)); if(hits.length){ pickBoard(); downXY=null; return; } }
    if(p){ const d=p.d;
      if(d.part==="lever") clickLever(); else if(d.part==="slot") clickSlot(d.slot); else if(d.part==="bracket") clickBracket();
      else if(d.part==="screw") clickScrew(d.screw); else if(d.part==="m2screw") clickM2Screw(); else if(d.part==="conn") clickConn(d.conn);
      else if(d.part==="mbscrew") clickBoardScrew(d.screw); else if(d.part==="pcieLatch") clickPcieLatch(); else if(d.part==="sidePanel") clickSidePanel();
      else if(d.part==="rport") clickRearPort(d.port); }
  }
  downXY=null;
});
