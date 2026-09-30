/* internal pin headers: front audio, USB 2.0 ×2, USB 3.2 (19-pin), front panel */
function pinTopTex(c,r){ return canvasTex(c*16,r*16,(g,W,H)=>{ g.fillStyle="#141416"; g.fillRect(0,0,W,H); for(let i=0;i<c;i++) for(let j=0;j<r;j++){ g.fillStyle="#d8b25c"; g.fillRect(i*16+5,j*16+5,6,6); } }); }
const hdr25=new T.MeshStandardMaterial({map:pinTopTex(5,2),roughness:.5});
[[-10.5,11.7],[4.9,11.7],[6.6,11.7],[12.2,11.45]].forEach(([x,z])=>mesh(box(1.3,.3,.55),six(blackPlastic,hdr25),[x,.25,z]));
const JUSB3={x:13.9,z:2.2,top:.7}, jusb3Mat=new T.MeshStandardMaterial({color:0x2458d8,roughness:.45});
mesh(box(.9,.6,2.2),jusb3Mat,[JUSB3.x,.4,JUSB3.z]);                                               // JUSB3 (19-pin USB 3.2, front ports)

const chokeMat=new T.MeshStandardMaterial({color:0x3a3c40,metalness:.35,roughness:.55});   // ferrite chokes: dark grey, satin
[-8,-6.6,-5.2,-3.8,-2.4].forEach(z=>mesh(box(.85,.65,.85),chokeMat,[-7.4,.425,z]));
const capTop=new T.MeshStandardMaterial({color:0x9ea3a9,metalness:.8,roughness:.4}), capBody=new T.MeshStandardMaterial({color:0x1c1d20,metalness:.3,roughness:.45});   // solid caps: black sleeve, aluminium top
[[-7.4,-1.1],[-7.4,-.3],[-6.6,-1.1],[10.5,-9],[11.2,-9],[11.9,-9],[9.8,2.4],[10.5,2.4]].forEach(([x,z])=>mesh(new T.CylinderGeometry(.3,.3,.8,20),[capBody,capTop,capBody],[x,.5,z]));
// Mini-Fit power headers, plugs go in from above; the latch tab is where the plug's clip hooks on
const epsHoles=new T.MeshStandardMaterial({map:holesTexture(4,2),roughness:.6});
mesh(box(1.9,1.3,1.1),six(blackPlastic,epsHoles),[-10.1,.75,-11.4]);                             // 8-pin EPS (CPU_PWR1)
mesh(box(.5,.35,.22),blackPlastic,[-10.1,1.05,-12.05]);                                         //   latch tab, top side
const atxHoles=new T.MeshStandardMaterial({map:holesTexture(2,12),roughness:.6});
mesh(box(1.1,1.3,5.4),six(blackPlastic,atxHoles),[13.7,.75,-3.4]);                               // 24-pin (JPWR1)
mesh(box(.22,.35,.5),blackPlastic,[14.35,1.05,-3.4]);                                           //   latch tab, board-edge side
const chipMat=new T.MeshStandardMaterial({map:chipsetTexture(),metalness:.55,roughness:.4});
mesh(box(4.4,.9,4.4),six(hsSide,chipMat),[8.6,.55,7]);
/* PCIe slots: open-topped housings, bracket end at x PCIE_X0. A groove with two rows of contacts runs down the middle,
   broken by the key bridge after the first 11 pins. x16 slots have a retention latch past the far end (PCI_E1's moves: pcie-latch.js),
   and PCI_E1 has steel armour on its sides. */
const PCIE_X0=-14.3, PCIE_KEY=1.165;
const PCIE_SLOTS=[{name:"PCI_E1",z:3.2,len:8.9,armor:true},{name:"PCI_E2",z:5.0,len:2.5},{name:"PCI_E3",z:6.8,len:2.5},
  {name:"PCI_E4",z:8.6,len:8.9,latch:true},{name:"PCI_E5",z:10.2,len:2.5},{name:"PCI_E6",z:11.6,len:2.5}];
const pcieArmor=new T.MeshStandardMaterial({color:0xa9aeb4,metalness:.85,roughness:.38});
function pcieFloorTex(len){ const U=80; return canvasTex(Math.round(len*U),32,(g,W,H)=>{ g.fillStyle="#050506"; g.fillRect(0,0,W,H); g.fillStyle="#c9a54a";   // 1 mm pitch contacts
  for(let x=U*.12;x<W-U*.12;x+=U*.1){ if(Math.abs(x-(PCIE_KEY+.1)*U)<U*.12) continue; g.fillRect(x,3,3,9); g.fillRect(x,H-12,3,9); } }); }
PCIE_SLOTS.forEach(s=>{ const {z,len}=s, cx=PCIE_X0+len/2, floor=new T.MeshStandardMaterial({map:pcieFloorTex(len),roughness:.5});
  mesh(box(len,.2,.75),six(blackPlastic,floor),[cx,.2,z]);                                          // floor, contacts showing in the groove
  [-1,1].forEach(k=>mesh(box(len,1.1,.22),blackPlastic,[cx,.65,z+k*.265]));                        // side walls
  [PCIE_X0+.075,PCIE_X0+len-.075].forEach(x=>mesh(box(.15,1.1,.31),blackPlastic,[x,.65,z]));      // end walls
  mesh(box(.2,.85,.31),blackPlastic,[PCIE_X0+PCIE_KEY+.1,.72,z]);                                  // key bridge
  if(s.armor) [-1,1].forEach(k=>mesh(box(len+.2,1.16,.05),pcieArmor,[cx,.66,z+k*.4]));
  if(s.latch){ mesh(box(.5,.8,.8),blackPlastic,[-5.3,.5,z]); mesh(box(.95,.28,.72),blackPlastic,[-4.83,.95,z]); mesh(box(.28,.42,.72),blackPlastic,[-4.42,1.09,z]); } });

                                             // CPU_FAN1
(function smd(){ const R=rng(77), im=new T.InstancedMesh(box(.2,.07,.1),new T.MeshStandardMaterial({color:0x2a2622,roughness:.55}),320), d=new T.Object3D(); let n=0;
  while(n<320){ const x=R()*29-14.5, z=R()*23-11.5;
    if(Math.abs(x-SX)<4.2&&Math.abs(z-SZ)<5) continue; if(x>2.8&&x<7&&z<3&&z>-11.6) continue; if(x<-11&&z<-2) continue; if(z>2.6&&z<12.2&&x<-5) continue; if(x>-5.8&&x<3.8&&z>4.4&&z<7.4) continue; if(BOARD_HOLES.some(([hx,hz])=>Math.hypot(x-hx,z-hz)<.7)) continue;   // keep mounting holes clear
    d.position.set(x,.135,z); d.rotation.y=R()<.5?0:Math.PI/2; d.updateMatrix(); im.setMatrixAt(n++,d.matrix); }
  im.receiveShadow=true; im.raycast=()=>{}; boardRoot.add(im); })();
