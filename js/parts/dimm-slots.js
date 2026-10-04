/* ---------------- DIMM slots ---------------- */
const slotTopTexRed=slotTopTexture("#9a1721"), slotTopTexBlack=slotTopTexture("#18181b");
// DDR4 latch, side profile (z outward from the slot's end, y up): a hinged arm with a hook at the top that reaches in over
// the stick's end notch, and a thumb tab sloping outward to push on. Extruded across the slot's width.
const LATCH_PROFILE=[[-.16,0],[.16,0],[.18,.82],[.5,1.08],[.46,1.24],[.12,1.16],[-.36,1.2],[-.42,1.1],[-.4,1.0],[-.16,.94]];
function latchGeo(sgn){ const s=new T.Shape(); LATCH_PROFILE.forEach(([z,y],k)=>k?s.lineTo(z,y):s.moveTo(z,y)); s.closePath();
  const g=new T.ExtrudeGeometry(s,{depth:.7,bevelEnabled:true,bevelThickness:.02,bevelSize:.02,bevelSegments:1});
  g.applyMatrix4(new T.Matrix4().makeBasis(new T.Vector3(0,0,sgn),new T.Vector3(0,1,0),new T.Vector3(-sgn,0,0))); g.translate(sgn*.35,0,0); return g; }
const LATCH_GEO={"-1":latchGeo(-1),"1":latchGeo(1)};
const slots=SLOT_X.map((x,i)=>{
  const red=GOOD.includes(i), mat=new T.MeshStandardMaterial({color:red?0x8f141c:0x151518,roughness:.45}), top=new T.MeshStandardMaterial({map:red?slotTopTexRed:slotTopTexBlack,roughness:.45});
  const body=mesh(box(.75,.75,14),[mat,mat,top,mat,mat,mat],[x,.475,SLOT_Z]); body.userData={part:"slot",slot:i};
  const latches=[-1,1].map(sgn=>{ const p=new T.Group(); p.position.set(x,.1,SLOT_Z+sgn*7.18); boardRoot.add(p); const l=mesh(LATCH_GEO[sgn],mat,[0,0,0],p); l.userData={part:"slot",slot:i}; p.userData.sgn=sgn; return p; });
  return {x,body,mat,latches,open:false,used:false};
});
function setLatches(i,open,dur=350){ slots[i].open=open; slots[i].latches.forEach(p=>animTo(p.rotation,"x",open?p.userData.sgn*.6:0,dur)); }
