/* ---------------- DIMM slots ---------------- */
const slotTopTexRed=slotTopTexture("#c01a26"), slotTopTexBlack=slotTopTexture("#18181b");
const slots=SLOT_X.map((x,i)=>{
  const red=GOOD.includes(i), mat=new T.MeshStandardMaterial({color:red?0xb3121e:0x151518,roughness:.45}), top=new T.MeshStandardMaterial({map:red?slotTopTexRed:slotTopTexBlack,roughness:.45});
  const body=mesh(box(.75,.75,14),[mat,mat,top,mat,mat,mat],[x,.475,SLOT_Z]); body.userData={part:"slot",slot:i};
  const latches=[-1,1].map(sgn=>{ const p=new T.Group(); p.position.set(x,.1,SLOT_Z+sgn*7.18); boardRoot.add(p); const l=mesh(box(.72,1.1,.34),mat,[0,.55,0],p); l.userData={part:"slot",slot:i}; p.userData.sgn=sgn; return p; });
  return {x,body,mat,latches,open:false,used:false};
});
function setLatches(i,open,dur=350){ slots[i].open=open; slots[i].latches.forEach(p=>animTo(p.rotation,"x",open?p.userData.sgn*.6:0,dur)); }
