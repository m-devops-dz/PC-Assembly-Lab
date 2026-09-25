/* ---------------- RAM: Asgard 8 GB DDR4 ---------------- */
const ramLabelMat=new T.MeshStandardMaterial({map:ramHeatsinkTexture(true),metalness:.55,roughness:.4});
const ramPlainMat=new T.MeshStandardMaterial({map:ramHeatsinkTexture(false),metalness:.55,roughness:.4});
const ramMetal=new T.MeshStandardMaterial({color:0x34373c,metalness:.6,roughness:.4});
const pcbGreen=new T.MeshStandardMaterial({color:0x17563a,roughness:.6});
const fingPx=new T.MeshStandardMaterial({map:fingerTexture((6.65-NOTCH)/13.3*1330),roughness:.45,metalness:.3});
const fingNx=new T.MeshStandardMaterial({map:fingerTexture((6.65+NOTCH)/13.3*1330),roughness:.45,metalness:.3});
function makeRam(){
  const yaw=new T.Group(); yaw.visible=false; boardRoot.add(yaw);
  const parts=[mesh(box(.12,3.1,13.3),[fingPx,fingNx,pcbGreen,pcbGreen,pcbGreen,pcbGreen],[0,1.55,0],yaw),
    mesh(box(.14,2.5,13.1),[ramLabelMat,ramMetal,ramMetal,ramMetal,ramMetal,ramMetal],[.13,1.85,0],yaw),
    mesh(box(.14,2.5,13.1),[ramMetal,ramPlainMat,ramMetal,ramMetal,ramMetal,ramMetal],[-.13,1.85,0],yaw),
    mesh(box(.42,.16,13.1),ramMetal,[0,3.15,0],yaw)];
  const notch=mesh(box(.14,.36,.18),new T.MeshBasicMaterial({color:0x000000}),[0,.18,NOTCH],yaw,{cast:false});
  return {yaw,parts:[...parts,notch],turns:0,slot:-1,state:"tray"};
}
const rams=[makeRam(),makeRam()];
rams.forEach((r,i)=>r.parts.forEach(m=>m.userData={part:"ram",ram:i}));
