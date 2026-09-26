/* ---------------- peripherals: USB keyboard, USB mouse, HDMI monitor ----------------
   Keyboard and mouse sit on the desk behind the case, the monitor past its front panel.
   They plug into the ports at the back:
   the board's rear I/O (USB, HDMI) and the graphics card's bracket (HDMI, DisplayPort). */
const periG=new T.Group(); periG.visible=false; scene.add(periG);
const periBlack=new T.MeshStandardMaterial({color:0x17181b,roughness:.55}), periGrey=new T.MeshStandardMaterial({color:0x2a2c31,metalness:.3,roughness:.5});
const plugMetal=new T.MeshStandardMaterial({color:0xc4c9cf,metalness:.9,roughness:.3});

/* keyboard (behind the case, clear of the desk space where its plug lies) and mouse (beyond the bottom).
   1 unit = 1 cm. The keyboard's long side runs along z; the typist sits at −x, so its back (F-row, cable) faces +x and the case. */
const KB_POS=V3(-44,0,L.z-20), MOUSE_POS=V3(-25,0,L.z+31), MOUSE_YAW=.12;
const KB_U=1.905, KB_W=45.4, KB_D=15.4, KB_PLATE=1.06, KB_TILT=.05;         // key pitch, body length (z) and depth (x), plate top, back-up tilt
// full-size ANSI layout, rows back to front. A string is a 1u key; [label,w,h] a wider/taller key; [null,w] a gap.
const KB_ROWS=(()=>{ const k=s=>s.split(" ");
  return [
    [["Esc"],[null,1],...k("F1 F2 F3 F4"),[null,.5],...k("F5 F6 F7 F8"),[null,.5],...k("F9 F10 F11 F12"),[null,.25],...k("PrtSc ScrLk Pause")],
    [...k("` 1 2 3 4 5 6 7 8 9 0 - ="),["Backspace",2],[null,.25],...k("Ins Home PgUp"),[null,.25],...k("Num / * -")],
    [["Tab",1.5],...k("Q W E R T Y U I O P [ ]"),["\\",1.5],[null,.25],...k("Del End PgDn"),[null,.25],...k("7 8 9"),["+",1,2]],
    [["Caps Lock",1.75],...k("A S D F G H J K L ; '"),["Enter",2.25],[null,3.5],...k("4 5 6")],
    [["Shift",2.25],...k("Z X C V B N M , . /"),["Shift",2.75],[null,1.25],["↑"],[null,1.25],...k("1 2 3"),["Enter",1,2]],
    [["Ctrl",1.25],["Win",1.25],["Alt",1.25],["",6.25],["Alt",1.25],["Fn",1.25],["Menu",1.25],["Ctrl",1.25],[null,.25],...k("← ↓ →"),[null,.25],["0",2],["."]]
  ].map(r=>r.map(e=>typeof e==="string"?[e,1,1]:[e[0],e[1]||1,e[2]||1])); })();
(function keyboard(){
  const kbG=new T.Group(); kbG.position.set(KB_POS.x,KB_D/2*KB_TILT,KB_POS.z); kbG.rotation.z=KB_TILT; periG.add(kbG);   // lifted so the front edge rests on the desk
  // rounded, bevelled body
  const r=1.1, w=KB_D-.4, d=KB_W-.4, sh=new T.Shape(); sh.moveTo(-w/2+r,-d/2);
  sh.lineTo(w/2-r,-d/2); sh.quadraticCurveTo(w/2,-d/2,w/2,-d/2+r); sh.lineTo(w/2,d/2-r); sh.quadraticCurveTo(w/2,d/2,w/2-r,d/2);
  sh.lineTo(-w/2+r,d/2); sh.quadraticCurveTo(-w/2,d/2,-w/2,d/2-r); sh.lineTo(-w/2,-d/2+r); sh.quadraticCurveTo(-w/2,-d/2,-w/2+r,-d/2);
  const bodyGeo=new T.ExtrudeGeometry(sh,{depth:.6,bevelEnabled:true,bevelThickness:.2,bevelSize:.2,bevelSegments:3,curveSegments:8}); bodyGeo.rotateX(-Math.PI/2);
  mesh(bodyGeo,new T.MeshStandardMaterial({color:0x0e0f11,roughness:.45,metalness:.15}),[0,.2,0],kbG);
  // brushed dark-aluminium top plate
  const plateTex=canvasTex(1024,360,(g,W,H)=>brushed(g,W,H,"#1e2023",7,1400));
  mesh(box(KB_D-1.3,.12,KB_W-1.3),[periBlack,periBlack,new T.MeshStandardMaterial({map:plateTex,metalness:.45,roughness:.55}),periBlack,periBlack,periBlack],[0,KB_PLATE-.06,0],kbG);
  // keycaps: tapered caps, one InstancedMesh per size; row → x (back is +x), column → z (left is −z)
  const capMat=new T.MeshStandardMaterial({color:0x08080a,roughness:.7}), gap=.2, taper=.3, capH=.8;
  const z0=-KB_U*22.5/2, x0=KB_D/2-1.35, keys=[], groups={};
  KB_ROWS.forEach((row,ri)=>{ let c=0; const y=ri===0?0:ri+.5;
    row.forEach(([lab,kw,kh])=>{ if(lab!==null){ const k={lab,w:kw,h:kh,z:z0+(c+kw/2)*KB_U,x:x0-(y+kh/2)*KB_U,row:ri}; keys.push(k); (groups[kw+"x"+kh]=groups[kw+"x"+kh]||[]).push(k); } c+=kw; }); });
  const capGeo=(kw,kh)=>{ const dz=kw*KB_U-gap, dx=kh*KB_U-gap, g=box(dx,capH,dz), p=g.attributes.position;
    for(let i=0;i<p.count;i++) if(p.getY(i)>0){ p.setX(i,p.getX(i)*(dx-taper)/dx-.06); p.setZ(i,p.getZ(i)*(dz-taper)/dz); }   // top face shifted toward the typist, like a sculpted cap
    g.computeVertexNormals(); return g; };
  const m4=new T.Matrix4();
  Object.values(groups).forEach(list=>{ const im=new T.InstancedMesh(capGeo(list[0].w,list[0].h),capMat,list.length); im.castShadow=true; im.receiveShadow=true;
    list.forEach((k,i)=>{ m4.makeTranslation(k.x,KB_PLATE-.12+capH/2,k.z); im.setMatrixAt(i,m4); }); kbG.add(im); });
  // printed legends: one transparent sheet just above the cap tops (keys all share one height)
  const S_=2048/KB_W, px=z=>(z+KB_W/2)*S_, py=x=>(KB_D/2-x)*S_;
  const legend=canvasTex(2048,Math.round(2048*KB_D/KB_W),(g)=>{ g.fillStyle="#d9dce1"; g.textBaseline="top";
    keys.forEach(k=>{ if(!k.lab) return; const tl=(k.w*KB_U-gap-taper)/2, th=(k.h*KB_U-gap-taper)/2, cx=px(k.z), cy=py(k.x-.06);
      const big=[...k.lab].length===1&&k.row>0, arrow="←↓→↑".includes(k.lab);
      g.font=(big?"600 ":"500 ")+Math.round((big?.5:k.lab.length>3?.27:.32)*S_)+"px 'Barlow Semi Condensed', Arial";
      if(arrow){ g.textAlign="center"; g.textBaseline="middle"; g.fillText(k.lab,cx,cy); g.textBaseline="top"; }
      else if(big){ g.textAlign="left"; g.fillText(k.lab,cx-(tl-.22)*S_,cy-(th-.18)*S_); }
      else { g.textAlign="left"; g.textBaseline="bottom"; g.fillText(k.lab,cx-(tl-.2)*S_,cy+(th-.2)*S_); g.textBaseline="top"; } });
    // lock LEDs above the number pad
    const lz=z0+19.2*KB_U, lx=x0-.5*KB_U; g.font="500 "+Math.round(.26*S_)+"px Barlow, Arial"; g.textAlign="center";
    [["1",0],["A",1.3],["⇩",2.6]].forEach(([l,o])=>{ g.fillStyle="#3ecf6e"; g.beginPath(); g.arc(px(lz+o),py(lx+.25),.13*S_,0,7); g.fill(); g.fillStyle="#8e939b"; g.fillText(l,px(lz+o),py(lx-.1)); }); });
  const lg=new T.PlaneGeometry(KB_W,KB_D); lg.rotateX(-Math.PI/2); lg.rotateY(-Math.PI/2);          // image x → +z, image top → +x (back)
  mesh(lg,new T.MeshBasicMaterial({map:legend,transparent:true,depthWrite:false}),[0,KB_PLATE-.12+capH+.004,0],kbG,{cast:false});
  const sr=mesh(new T.CylinderGeometry(.28,.36,.9,14),periBlack,[KB_D/2+.3,.55,13],kbG); sr.rotation.z=Math.PI/2;   // cable strain relief at the back
})();
/* mouse: sculpted right-handed shell (hump toward the palm, narrower nose), split buttons, scroll wheel, 2 thumb buttons */
const mouseG=new T.Group(); mouseG.position.copy(MOUSE_POS); mouseG.rotation.y=MOUSE_YAW; periG.add(mouseG);
(function mouse(){
  // unit-sphere point → shell point. x is the long axis (nose at +x), flat bottom at y 0.
  const shape=(x,y,z)=>{ const top=3.55-.8*(x+.3)*(x+.3), wide=(3.15-.28*x)*(1-.07*Math.exp(-(((x+.05)/.35)**2)));
    return V3(x*6.1,(y>0?y*top:Math.max(y*.55,-.32))+.32,z*wide); };
  const surf=(x,z)=>shape(x,Math.sqrt(Math.max(0,1-x*x-z*z)),z);
  const geo=new T.SphereGeometry(1,72,44), p=geo.attributes.position;
  for(let i=0;i<p.count;i++){ const v=shape(p.getX(i),p.getY(i),p.getZ(i)); p.setXYZ(i,v.x,v.y,v.z); }
  geo.computeVertexNormals();
  const shell=new T.MeshStandardMaterial({color:0x141518,roughness:.38,metalness:.05}), seam=new T.MeshStandardMaterial({color:0x040405,roughness:.9});
  mesh(geo,shell,[0,0,0],mouseG);
  const groove=(pts)=>mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts),40,.045,6,false),seam,null,mouseG,{cast:false});
  const line=(n,f)=>Array.from({length:n+1},(_,i)=>f(i/n));
  groove(line(12,k=>surf(.985-.3*k,0))); groove(line(12,k=>surf(.37-.34*k,0)));                  // left/right button split, broken by the wheel
  groove(line(24,k=>{ const z=-.82+1.64*k; return surf(.03+.12*z*z,z); }));                     // back edge of the buttons
  // scroll wheel in its slot: ribbed rubber tyre
  const w=surf(.52,0), rib=canvasTex(256,32,(g,W,H)=>{ g.fillStyle="#26282c"; g.fillRect(0,0,W,H); g.fillStyle="#0c0c0e"; for(let x=0;x<W;x+=8) g.fillRect(x,0,4,H); });
  rib.wrapS=T.RepeatWrapping; rib.repeat.set(3,1);
  mesh(box(1.6,.3,.72),seam,[w.x,w.y-.1,0],mouseG,{cast:false}).rotation.z=-.15;
  const wheel=mesh(new T.CylinderGeometry(.52,.52,.42,28),[new T.MeshStandardMaterial({map:rib,roughness:.85}),periGrey,periGrey],[w.x,w.y-.28,0],mouseG); wheel.rotation.x=Math.PI/2;
  const dpi=surf(.24,0); mesh(box(.5,.12,.3),periGrey,[dpi.x,dpi.y+.02,0],mouseG).rotation.z=-.2;   // DPI button
  // thumb buttons on the left side (−z)
  [[.28,1.25],[-.08,1.1]].forEach(([x,len])=>{ const q=surf(x,-.9); const b=mesh(new T.CapsuleGeometry(.17,len,4,10),periGrey,[q.x,q.y,q.z-.08],mouseG);
    b.rotation.z=Math.PI/2; b.scale.set(1,1,.6); });
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
    anchor:()=>V3(KB_POS.x+KB_D/2+.8,1.3,KB_POS.z+13), anchorDir:()=>V3(1,0,0)},
  usbMouse:{id:"usbMouse",mat:periCable(0x1b1c1f),radius:.14,mesh:null,a:makeUsbPlug("usbMouse"),outside:true,
    anchor:()=>(mouseG.updateMatrixWorld(true),mouseG.localToWorld(V3(6.3,.5,0))), anchorDir:()=>V3(Math.cos(MOUSE_YAW),0,-Math.sin(MOUSE_YAW))},
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
