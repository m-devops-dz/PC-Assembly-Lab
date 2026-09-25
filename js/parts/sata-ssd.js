/* ---------------- 2.5" SATA SSD ---------------- */
const sataG=new T.Group(); sataG.visible=false; scene.add(sataG);
const sataTop=new T.MeshStandardMaterial({map:canvasTex(700,490,(g,W,H)=>{ brushed(g,W,H,"#2e3136",71,1500); g.fillStyle="#e9eaec"; roundRect(g,W*.12,H*.22,W*.76,H*.56,10); g.fill();
  g.fillStyle="#1b1d22"; g.font="700 58px 'Barlow Semi Condensed', Arial"; g.fillText("SATA SSD 480GB",W*.17,H*.45); g.font="500 30px Barlow, Arial"; g.fillText("2.5\"  6Gb/s  7mm",W*.17,H*.6); }),metalness:.5,roughness:.45});
const sataSide=new T.MeshStandardMaterial({color:0x2e3136,metalness:.6,roughness:.4});
const sataParts=[mesh(box(10,.7,7),[sataSide,sataSide,sataTop,sataSide,sataSide,sataSide],[0,0,0],sataG)];
sataParts.forEach(m=>m.userData.part="sata");
const ssdData=makePort(sataG,V3(-5.35,0,-1.7),0,.95,[.5,1.25]);
const ssdPower=makePort(sataG,V3(-5.35,0,.55),0,1.9,[.5,2.2]);
const SATA_HOVER=8;

// vertical Mini-Fit headers: the plug comes straight down from above. The frame's +x points down into the header,
// `latch` is where the plug's clip (its local +y) must end up: the side with the header's latch tab.
function makeTopPort(parent,pos,latch){ const f=new T.Group(); f.position.copy(pos);
  const x=V3(0,-1,0), y=latch.clone().normalize(), z=x.clone().cross(y);
  f.quaternion.setFromRotationMatrix(new T.Matrix4().makeBasis(x,y,z)); parent.add(f); return {frame:f}; }
const mbAtx=makeTopPort(boardRoot,V3(13.7,1.4,-3.4),V3(1,0,0));
// right-angle SATA ports on the board's right edge, stacked in pairs (SATA1 under SATA2, SATA3 under SATA4), openings face +x
const mbSata=[[6.8,.4],[6.8,.95],[8.4,.4],[8.4,.95]].map(([z,y])=>makePort(boardRoot,V3(14.95,y,z),Math.PI,.95,[.5,1.25]));
[6.8,8.4].forEach(z=>mesh(box(1.1,.1,1.35),blackPlastic,[14.45,.15,z]));   // shared base under each pair
const mbCpuPwr=makeTopPort(boardRoot,V3(-10.1,1.4,-11.4),V3(0,0,-1));
const gpuPwrPort=makeTopPort(gpuG,V3(15,10.95,.6),V3(0,0,1));
