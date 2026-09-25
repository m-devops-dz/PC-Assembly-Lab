/* ---------------- CPU: Ryzen 5 5600G (AM4 PGA) ---------------- */
const cpuYaw=new T.Group(), cpuFlip=new T.Group(); cpuYaw.add(cpuFlip); boardRoot.add(cpuYaw); cpuYaw.visible=false;
const subTopMat=new T.MeshStandardMaterial({map:cpuTopTexture(),roughness:.5}), subSide=new T.MeshStandardMaterial({color:0x185a33,roughness:.6}), subBot=new T.MeshStandardMaterial({color:0x1a5f37,roughness:.5});
const ihsTopMat=new T.MeshStandardMaterial({map:ihsTexture(),metalness:.85,roughness:.3}), ihsSide=new T.MeshStandardMaterial({color:0xc2c7cd,metalness:.9,roughness:.3});
[mesh(box(4,.12,4),[subSide,subSide,subTopMat,subBot,subSide,subSide],[0,0,0],cpuFlip),
 mesh(box(3.44,.05,3.44),ihsSide,[0,.085,0],cpuFlip),
 mesh(box(3.36,.24,3.36),six(ihsSide,ihsTopMat),[0,.23,0],cpuFlip),
 ].forEach(m=>m.userData.part="cpu");
addMarker(cpuFlip,-1.97,.061,1.97,.55);
const cpuHint=hintSprite(); cpuHint.position.set(-1.75,1.25,1.75); cpuFlip.add(cpuHint);
(function pins(){ const list=[]; for(let i=0;i<PIN_N;i++) for(let j=0;j<PIN_N;j++) if(!pinSkipped(i,j)) list.push([(i-18)*PIN_P,(j-18)*PIN_P]);
  const im=new T.InstancedMesh(new T.CylinderGeometry(.016,.016,.14,6),new T.MeshStandardMaterial({color:0xe0b55a,metalness:.9,roughness:.25}),list.length), d=new T.Object3D();
  list.forEach(([x,z],k)=>{ d.position.set(x,-.13,z); d.updateMatrix(); im.setMatrixAt(k,d.matrix); }); im.raycast=()=>{}; cpuFlip.add(im); })();
