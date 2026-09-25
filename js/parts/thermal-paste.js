/* ---------------- thermal paste syringe ---------------- */
const pasteG=new T.Group(); pasteG.visible=false; boardRoot.add(pasteG);
const tubeMat=new T.MeshStandardMaterial({color:0xd9dde2,metalness:.2,roughness:.35});
[mesh(new T.CylinderGeometry(.36,.36,2.6,24),tubeMat,[0,1.7,0],pasteG),
 mesh(new T.CylinderGeometry(.37,.37,.5,24),new T.MeshStandardMaterial({color:0x2f6bff,roughness:.4}),[0,1.2,0],pasteG),
 mesh(new T.CylinderGeometry(.14,.05,.4,16),tubeMat,[0,.2,0],pasteG),
 mesh(new T.CylinderGeometry(.5,.5,.12,24),tubeMat,[0,3.05,0],pasteG),
 mesh(new T.CylinderGeometry(.1,.1,.9,12),tubeMat,[0,3.55,0],pasteG)].forEach(m=>m.userData.part="paste");
const pasteDot=mesh(new T.SphereGeometry(.28,20,12),new T.MeshStandardMaterial({color:0x9aa0a6,roughness:.85}),[SX,.87,SZ],null,{cast:false});
pasteDot.scale.set(1,.45,1); pasteDot.visible=false;
const pasteMat=new T.MeshStandardMaterial({color:0xb4b8be,roughness:.9}), pasteLines=[];
const PASTE_HOVER=3.0;
