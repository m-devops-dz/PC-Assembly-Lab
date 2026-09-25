/* ---------------- graphics card ---------------- */
const GPU_SLOTS=[{name:"PCI_E1",z:3.2,ok:true},{name:"PCI_E4",z:8.6,ok:false}];
const gpuG=new T.Group(); gpuG.visible=false; scene.add(gpuG);
const GPU_FANS=[1.2,11.4];                       // fan centres along x; the shroud face is 23 wide centred on x 6.3
const gpuShroud=new T.MeshStandardMaterial({map:canvasTex(1024,440,(g,W,H)=>{ brushed(g,W,H,"#2a2c31",61,1800); g.strokeStyle="#b3121e"; g.lineWidth=6; g.beginPath(); g.moveTo(0,H*.88); g.lineTo(W*.45,H*.88); g.lineTo(W*.5,H*.96); g.lineTo(W,H*.96); g.stroke();
  GPU_FANS.forEach(x=>{ const cx=(x-6.3+11.5)/23*W, cy=H/2, r=4.45/23*W;                // dark fan wells with a chamfered rim
    g.fillStyle="#08090a"; g.beginPath(); g.arc(cx,cy,r,0,7); g.fill(); g.strokeStyle="#3d4046"; g.lineWidth=5; g.beginPath(); g.arc(cx,cy,r+4,0,7); g.stroke(); }); }),metalness:.5,roughness:.45});
const gpuPcb=new T.MeshStandardMaterial({color:0x14301f,roughness:.6}), gpuBack=new T.MeshStandardMaterial({color:0x2b2d31,metalness:.6,roughness:.4});
/* I/O bracket, outside face (-x): slanted exhaust slots away from the PCB, "HDMI"/"DP" labels and a screw beside each port,
   like a real card. Canvas x runs along +z (0 at the PCB side), canvas top is the screw-tab end (+y). Face: z −0.1…2.1, y 0.2…12.2. */
const GPU_OUTPUTS=[{kind:"hdmi",y:9.4},{kind:"dp",y:7.2},{kind:"hdmi",y:5.0},{kind:"dp",y:2.8}], GPU_PORT_Z=.15;
const bracketSteel=new T.MeshStandardMaterial({color:0xb9bec5,metalness:.85,roughness:.32});
const bracketFace=new T.MeshStandardMaterial({metalness:.8,roughness:.35,map:canvasTex(176,960,(g,W,H)=>{
  const cz=z=>(z+.1)/2.2*W, cy=y=>(12.2-y)/12*H, U=W/2.2;
  brushed(g,W,H,"#b3b8be",91,900);
  g.fillStyle="#0e0f11";                                                           // slanted vents, between PCB side ports and the cooler side
  for(let y=.9;y<11.6;y+=.62){ g.beginPath(); g.moveTo(cz(.78),cy(y)); g.lineTo(cz(.78),cy(y+.3)); g.lineTo(cz(2.0),cy(y+.72)); g.lineTo(cz(2.0),cy(y+.42)); g.closePath(); g.fill(); }
  g.fillStyle="#b3b8be"; g.fillRect(cz(.5),0,cz(.78)-cz(.5),H);                    // solid strip that carries the screws
  GPU_OUTPUTS.forEach(p=>{ const len=p.kind==="hdmi"?1.4:1.6;
    g.save(); g.translate(cz(.02),cy(p.y+len/2+.12)); g.rotate(-Math.PI/2); g.fillStyle="#3b3e44"; g.font="600 "+Math.round(.24*U)+"px Barlow, Arial"; g.fillText(p.kind==="hdmi"?"HDMI":"DP",0,0); g.restore();
    const sx=cz(.64), sy=cy(p.y), r=.13*U; g.fillStyle="#8e949b"; g.beginPath(); g.arc(sx,sy,r,0,7); g.fill();          // screw beside the port
    g.fillStyle="#2b2e33"; g.fillRect(sx-r*.7,sy-r*.14,r*1.4,r*.28); g.fillRect(sx-r*.14,sy-r*.7,r*.28,r*1.4); });
})});
const gpuParts=[mesh(box(23.6,10.5,.16),gpuPcb,[6.0,5.25,0],gpuG),
  mesh(box(8.9,.8,.18),new T.MeshStandardMaterial({color:0xe2b95a,metalness:.85,roughness:.3}),[0,.4,0],gpuG),
  mesh(box(23,10,3.3),[gpuBack,gpuBack,gpuBack,gpuBack,gpuShroud,gpuBack],[6.3,5.7,1.85],gpuG),
  mesh(box(23,10,.12),gpuBack,[6.3,5.7,-.16],gpuG),
  mesh(box(.14,12,2.2),[bracketSteel,bracketFace,bracketSteel,bracketSteel,bracketSteel,bracketSteel],[-5.95,6.2,1.0],gpuG),
  mesh(box(1.9,.5,1.1),six(blackPlastic,new T.MeshStandardMaterial({map:holesTexture(4,2),roughness:.6})),[15,10.7,.6],gpuG),  // 8-pin PCIe power socket, opens upward
  mesh(box(.5,.3,.22),blackPlastic,[15,10.8,1.26],gpuG)];                                                                         //   its latch tab
/* axial fans: 11 swept, pitched blades on a hub, inside a thin frame ring with 3 support struts */
const fanBlade=new T.MeshStandardMaterial({color:0x0d0e10,roughness:.35,metalness:.15,side:T.DoubleSide});
const bladeGeo=(()=>{ const s=new T.Shape(), r0=1.15, r1=4.05, n=10, P=(r,a)=>[r*Math.cos(a),r*Math.sin(a)];
  const mid=r=>-.14*(r-r0), half=r=>.26+.04*(r-r0);                      // wide blades, swept back toward the tip
  for(let i=0;i<=n;i++){ const r=r0+(r1-r0)*i/n; const [x,y]=P(r,mid(r)+half(r)); i?s.lineTo(x,y):s.moveTo(x,y); }
  for(let i=n;i>=0;i--){ const r=r0+(r1-r0)*i/n; const [x,y]=P(r,mid(r)-half(r)); s.lineTo(x,y); }
  const g=new T.ExtrudeGeometry(s,{depth:.04,bevelEnabled:false,curveSegments:8}), p=g.attributes.position;
  for(let i=0;i<p.count;i++){ const x=p.getX(i), y=p.getY(i), r=Math.hypot(x,y);   // helical pitch: leading edge up, trailing edge down
    p.setZ(i,p.getZ(i)+(Math.atan2(y,x)-mid(r))*r*.45); }
  g.computeVertexNormals(); return g; })();
const gpuHubMat=new T.MeshStandardMaterial({map:canvasTex(256,256,(g,W)=>{ g.fillStyle="#1b1c1f"; g.beginPath(); g.arc(W/2,W/2,W/2,0,7); g.fill(); g.strokeStyle="#b3121e"; g.lineWidth=6; g.beginPath(); g.arc(W/2,W/2,W*.36,0,7); g.stroke();
  g.fillStyle="#c9ced4"; g.font="700 48px 'Barlow Semi Condensed', Arial"; g.textAlign="center"; g.fillText("MSI",W/2,W/2+16); }),roughness:.45});
const gpuFans=GPU_FANS.map(x=>{ const f=new T.Group(); f.position.set(x,5.7,3.52); gpuG.add(f);
  const ring=mesh(new T.TorusGeometry(4.25,.1,8,56),gpuBack,[0,0,0],f); gpuParts.push(ring);
  [0,2.09,4.19].forEach(a=>{ const s=mesh(box(3.2,.14,.06),gpuBack,[Math.cos(a)*2.65,Math.sin(a)*2.65,-.08],f); s.rotation.z=a; gpuParts.push(s); });
  const rot=new T.Group(); f.add(rot);
  const hub=mesh(new T.CylinderGeometry(1.2,1.25,.34,32),[gpuBack,gpuHubMat,gpuBack],[0,0,.1],rot); hub.rotation.x=Math.PI/2; gpuParts.push(hub);
  for(let i=0;i<11;i++){ const arm=new T.Group(); arm.rotation.z=i*Math.PI*2/11; rot.add(arm);
    const b=mesh(bladeGeo,fanBlade,[0,0,-.05],arm); gpuParts.push(b); }
  return rot; });

/* display outputs on the bracket (outside face, -x): HDMI, DP, HDMI, DP from the screw-tab end, along the PCB edge */
const portShell=new T.MeshStandardMaterial({color:0xc4c9cf,metalness:.9,roughness:.3}), portInsert=new T.MeshStandardMaterial({color:0x0c0c0e,roughness:.6});
function outputPort(y,w,h,cL,cR,z=GPU_PORT_Z){
  const outer=portShape(w,h,cL,cR), hole=portShape(w,h,cL,cR,.05); outer.holes.push(hole);
  const toBracket=new T.Matrix4().makeBasis(V3(0,1,0),V3(0,0,1),V3(1,0,0));   // shape x→y, shape y→z, extrude→+x (into the card)
  const shell=new T.ExtrudeGeometry(outer,{depth:.9,bevelEnabled:false}); shell.applyMatrix4(toBracket);
  const tongue=new T.ExtrudeGeometry(portShape(w*.72,h*.34,0,0),{depth:.75,bevelEnabled:false}); tongue.applyMatrix4(toBracket);
  gpuParts.push(mesh(shell,portShell,[-6.1,y,z],gpuG), mesh(tongue,portInsert,[-6.02,y,z+.04],gpuG), mesh(box(.02,w-.1,h-.1),portInsert,[-5.3,y,z],gpuG,{cast:false}));
}
GPU_OUTPUTS.forEach(p=>p.kind==="hdmi"?outputPort(p.y,1.4,.45,.14,.14):outputPort(p.y,1.6,.45,0,.12));   // HDMI: both corners cut; DP: one
gpuParts.forEach(m=>m.userData.part="gpu");
const GPU_HOVER=L.y+8, GPU_SEAT=L.y+.7, GPU_X=L.x-9.85;
