/* ---------------- peripherals: USB keyboard, USB mouse, HDMI monitor ----------------
   Keyboard and mouse sit on the desk behind the case, the monitor past its front panel.
   They plug into the ports at the back:
   the board's rear I/O (USB, HDMI) and the graphics card's bracket (HDMI, DisplayPort). */
const periG=new T.Group(); periG.visible=false; scene.add(periG);
const periBlack=new T.MeshStandardMaterial({color:0x17181b,roughness:.55}), periGrey=new T.MeshStandardMaterial({color:0x2a2c31,metalness:.3,roughness:.5});
const plugMetal=new T.MeshStandardMaterial({color:0xc4c9cf,metalness:.9,roughness:.3});

/* keyboard (behind the case, clear of the desk space where its plug lies) and mouse (beyond the bottom) */
const KB_POS=V3(-44,0,L.z-20), MOUSE_POS=V3(-25,0,L.z+31);
(function devices(){
  const keyTop=new T.MeshStandardMaterial({map:canvasTex(1024,320,(g,W,H)=>{ g.fillStyle="#141518"; g.fillRect(0,0,W,H);
    const rows=[15,15,14,13,12], kw=W/15.6;
    rows.forEach((n,r)=>{ for(let i=0;i<n;i++){ const w=(r===4&&i===5)?kw*5:kw*.86; const x=10+i*kw+(r===4&&i>5?kw*4:0);
      if(x+w>W-8) continue; g.fillStyle="#26282d"; roundRect(g,x,12+r*kw*1.02,w,kw*.86,6); g.fill(); } }); }),roughness:.5});
  mesh(box(15,1.0,44),[periBlack,periBlack,keyTop,periBlack,periBlack,periBlack],[KB_POS.x,.5,KB_POS.z],periG);   // keys face up, long side along z
  const mouse=mesh(new T.SphereGeometry(1,24,16),periBlack,[MOUSE_POS.x,.7,MOUSE_POS.z],periG); mouse.scale.set(3.2,1.3,2.0);
  mesh(box(.3,.1,.08),periGrey,[MOUSE_POS.x+1.2,1.95,MOUSE_POS.z],periG);                                         // scroll wheel
})();

/* monitor past the case's front panel and off beyond its top edge, screen turned toward the finishing camera */
const MON_POS=V3(52,0,L.z-46), MON_YAW=-.5;
const monG=new T.Group(); monG.position.copy(MON_POS); monG.rotation.y=MON_YAW; periG.add(monG);
const screenOff=canvasTex(1024,576,(g,W,H)=>{ g.fillStyle="#050608"; g.fillRect(0,0,W,H); g.fillStyle="#3a3f47"; g.font="600 40px Barlow, Arial"; g.textAlign="center"; g.fillText("No signal",W/2,H/2); });
const screenOn=canvasTex(1024,576,(g,W,H)=>{ const gr=g.createLinearGradient(0,0,0,H); gr.addColorStop(0,"#0b0c10"); gr.addColorStop(1,"#1a0a0c"); g.fillStyle=gr; g.fillRect(0,0,W,H);
  g.fillStyle="#d22630"; g.font="800 150px 'Barlow Semi Condensed', Arial"; g.textAlign="center"; g.fillText("MSI",W/2,H*.5);
  g.fillStyle="#c9ced4"; g.font="600 34px Barlow, Arial"; g.fillText("B450 GAMING PLUS MAX",W/2,H*.62);
  g.fillStyle="#8a9099"; g.font="500 26px Barlow, Arial"; g.fillText("Press DEL to run BIOS setup",W/2,H*.9); });
const screenMat=new T.MeshStandardMaterial({map:screenOff,roughness:.3,metalness:.1,emissive:0xffffff,emissiveMap:screenOff,emissiveIntensity:.0});
(function monitor(){
  mesh(box(12,.6,18),periGrey,[0,.3,0],monG);                                                           // foot
  mesh(box(2,20,4),periGrey,[-1,10,0],monG);                                                            // neck
  mesh(box(2,33,56),periBlack,[.4,26,0],monG);                                                          // bezel
  const s=mesh(new T.PlaneGeometry(53,30),screenMat,[1.42,26,0],monG,{cast:false}); s.rotation.y=Math.PI/2; })();
function screenBoot(){ screenMat.map=screenOn; screenMat.emissiveMap=screenOn; screenMat.emissiveIntensity=.9; screenMat.needsUpdate=true; }

/* USB-A plug: metal shell with the plastic insert on one side (roll 0 = insert at the bottom, matching the port's tongue at the top) */
const usbFace=new T.MeshStandardMaterial({map:canvasTex(128,64,(g,W,H)=>{ g.fillStyle="#b9bec5"; g.fillRect(0,0,W,H); g.fillStyle="#050506"; g.fillRect(6,6,W-12,H-12);
  g.fillStyle="#1d4fd8"; g.fillRect(10,H/2,W-20,H/2-10); g.fillStyle="#d4af37"; for(let i=0;i<4;i++) g.fillRect(22+i*24,H/2+4,12,6); }),metalness:.5,roughness:.4});
const usbLogo=new T.MeshStandardMaterial({map:canvasTex(128,128,(g,W)=>{ g.fillStyle="#1e1f23"; g.fillRect(0,0,W,W); g.strokeStyle="#6f757d"; g.fillStyle="#6f757d"; g.lineWidth=6;
  g.beginPath(); g.moveTo(W*.2,W/2); g.lineTo(W*.8,W/2); g.moveTo(W*.4,W/2); g.lineTo(W*.52,W*.3); g.lineTo(W*.66,W*.3); g.moveTo(W*.5,W/2); g.lineTo(W*.6,W*.7); g.lineTo(W*.7,W*.7); g.stroke();
  g.beginPath(); g.arc(W*.2,W/2,9,0,7); g.fill(); }),roughness:.5});
function makeUsbPlug(id){
  const outer=new T.Group(), inner=new T.Group(); outer.add(inner); outer.visible=false; scene.add(outer);
  const tag=m=>{ m.userData={part:"conn",conn:id}; return m; };
  tag(mesh(box(1.2,.46,1.2),[usbFace,plugMetal,plugMetal,plugMetal,plugMetal,plugMetal],[-.6,0,0],inner));   // shell
  tag(mesh(box(1.9,.8,1.6),[periBlack,periBlack,usbLogo,periBlack,periBlack,periBlack],[-2.15,0,0],inner));  // overmold, logo on the insert side's back
  const sr=tag(mesh(new T.CylinderGeometry(.22,.3,.8,12),periBlack,[-3.5,0,0],inner)); sr.rotation.z=Math.PI/2;
  tag(mesh(box(4.4,1.6,2.2),new T.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}),[-1.9,0,0],inner,{cast:false}));
  return {outer,inner,roll:0,back:-3.9};
}
/* HDMI plug: trapezoid shell (chamfered corners at local −y) */
function makeHdmiPlug(id){
  const outer=new T.Group(), inner=new T.Group(); outer.add(inner); outer.visible=false; scene.add(outer);
  const tag=m=>{ m.userData={part:"conn",conn:id}; return m; };
  const toPlug=new T.Matrix4().makeBasis(V3(0,0,1),V3(0,1,0),V3(-1,0,0));   // shape x→z, shape y→y, extrude→−x
  const shell=new T.ExtrudeGeometry(portShape(1.36,.42,.13,.13),{depth:1.0,bevelEnabled:false}); shell.applyMatrix4(toPlug);
  tag(mesh(shell,[new T.MeshStandardMaterial({color:0x0c0c0e,roughness:.6}),plugMetal],[0,0,0],inner));
  tag(mesh(box(2.0,.95,2.1),periBlack,[-2.0,0,0],inner));
  const sr=tag(mesh(new T.CylinderGeometry(.28,.36,.8,12),periBlack,[-3.4,0,0],inner)); sr.rotation.z=Math.PI/2;
  tag(mesh(box(4.4,1.6,2.6),new T.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}),[-1.9,0,0],inner,{cast:false}));
  return {outer,inner,roll:0,back:-3.8};
}
/* IEC C13 power-cord plug: same keyed outline as the PSU inlet (cut corners at −z), earth socket on the +z side */
const iecFace=canvasTex(220,125,(g,W,H)=>{ g.fillStyle="#141518"; g.fillRect(0,0,W,H); g.fillStyle="#050506";
  [[W*.26,H*.66],[W*.74,H*.66]].forEach(([x,y])=>g.fillRect(x-7,y-17,14,34)); g.fillRect(W/2-7,H*.2-15,14,30); });
iecFace.repeat.set(1/2.2,1/1.25); iecFace.offset.set(.5,.5);                  // extrude caps use shape units as UVs
function makeIecPlug(id){
  const outer=new T.Group(), inner=new T.Group(); outer.add(inner); outer.visible=false; scene.add(outer);
  const tag=m=>{ m.userData={part:"conn",conn:id}; return m; };
  const body=new T.ExtrudeGeometry(portShape(2.2,1.25,.3,.3),{depth:2.2,bevelEnabled:false});
  body.applyMatrix4(new T.Matrix4().makeBasis(V3(0,1,0),V3(0,0,1),V3(1,0,0)));   // shape x→y (long side), shape y→z, extrude→+x
  tag(mesh(body,[new T.MeshStandardMaterial({map:iecFace,roughness:.6}),periBlack],[-2.2,0,0],inner));
  const sr=tag(mesh(new T.CylinderGeometry(.34,.5,1.4,14),periBlack,[-2.9,0,0],inner)); sr.rotation.z=Math.PI/2;
  tag(mesh(box(4.4,2.8,2),new T.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}),[-1.8,0,0],inner,{cast:false}));
  return {outer,inner,roll:0,back:-3.6};
}
const periCable=(c)=>new T.MeshStandardMaterial({color:c,roughness:.6});
Object.assign(CONN,{
  usbKb:{id:"usbKb",mat:periCable(0x1b1c1f),radius:.18,mesh:null,a:makeUsbPlug("usbKb"),outside:true,
    anchor:()=>V3(KB_POS.x+7.6,.5,KB_POS.z+13), anchorDir:()=>V3(1,0,0)},
  usbMouse:{id:"usbMouse",mat:periCable(0x1b1c1f),radius:.14,mesh:null,a:makeUsbPlug("usbMouse"),outside:true,
    anchor:()=>V3(MOUSE_POS.x+3.1,.6,MOUSE_POS.z), anchorDir:()=>V3(1,0,0)},
  hdmi:{id:"hdmi",mat:periCable(0x111214),radius:.25,mesh:null,a:makeHdmiPlug("hdmi"),outside:true,
    anchor:()=>(monG.updateMatrixWorld(true),monG.localToWorld(V3(-2.1,12,0))), anchorDir:()=>V3(0,-1,0),
    via:()=>[monG.localToWorld(V3(-6,.3,6)),V3(CX1+2,.3,CZ0-4),V3(CX0-4,.3,CZ0-4)]},       // down the monitor's neck, then along the desk around the top of the case
  ac:{id:"ac",mat:periCable(0x141517),radius:.3,mesh:null,a:makeIecPlug("ac"),outside:true,           // runs off the desk to the wall socket
    anchor:()=>V3(-80,.35,L.z+26), anchorDir:()=>V3(1,0,0)}
});
function showPeripherals(){ periG.visible=true; RPORTS.forEach(p=>p.hint.visible=true);
  layLoose(CONN.usbKb.a,V3(-20.5,.5,L.z-7),0,0); layLoose(CONN.usbMouse.a,V3(-21,.5,L.z+12),-.3,0); layLoose(CONN.hdmi.a,V3(-20.5,.55,L.z-1),0,0);
  layLoose(CONN.ac.a,V3(-25,.65,L.z+21),-.2,Math.PI/2);
  drawConn(CONN.usbKb); drawConn(CONN.usbMouse); drawConn(CONN.hdmi); drawConn(CONN.ac); }

/* clickable rear ports. Board ones are on the -x faces of the rear I/O blocks (see rear-io.js), GPU ones on its bracket (see gpu.js).
   A port frame's +x points into the port; GPU HDMI frames are turned 90° because the card's ports stand on end. */
const RPORTS=[
  {id:"usb2a",kind:"usb",parent:boardRoot,pos:V3(-15.55,1.26,-9.7)}, {id:"usb2b",kind:"usb",parent:boardRoot,pos:V3(-15.55,.66,-9.7)},
  {id:"usb32a",kind:"usb",parent:boardRoot,pos:V3(-15.55,2.43,-6.5)}, {id:"usb32b",kind:"usb",parent:boardRoot,pos:V3(-15.55,1.72,-6.5)},
  {id:"hdmiMb",kind:"hdmiMb",parent:boardRoot,pos:V3(-15.55,.83,-6.5)},
  {id:"usb31a",kind:"usb",parent:boardRoot,pos:V3(-15.55,1.5,-4.2)}, {id:"usb31b",kind:"usb",parent:boardRoot,pos:V3(-15.55,.8,-4.2)},
  // the card's outputs, from GPU_OUTPUTS in gpu.js (HDMI, DP, HDMI, DP from the screw-tab end)
  ...GPU_OUTPUTS.map((p,i)=>({id:(p.kind==="hdmi"?"hdmiGpu":"dpGpu")+(i<2?1:2),kind:p.kind==="hdmi"?"hdmiGpu":"dp",parent:gpuG,pos:V3(-6.1,p.y,GPU_PORT_Z),turn:true}))
];
RPORTS.forEach(p=>{ const f=new T.Group(); f.position.copy(p.pos); if(p.turn) f.rotation.x=Math.PI/2; p.parent.add(f); p.frame=f;
  p.mat=new T.MeshBasicMaterial({color:0xffc400,transparent:true,opacity:0,depthWrite:false});   // own material: glows only when it fits the cable in hand
  const hint=mesh(box(.12,p.kind==="usb"?.6:.62,p.kind==="usb"?1.3:1.55),p.mat,[-.1,0,0],f,{cast:false}); hint.userData={part:"rport",port:p.id}; hint.visible=false; p.hint=hint; p.used=false; });
const rport=id=>RPORTS.find(p=>p.id===id);
