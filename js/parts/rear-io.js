/* rear I/O ports (face the back of the case, -x) */
function ps2UsbTex(){
  return canvasTex(256,400,(g,W,H)=>{
    g.fillStyle="#c4c9cf"; g.fillRect(0,0,W,H);
    const R=rng(101); for(let i=0;i<600;i++){ g.fillStyle=R()<.5?"rgba(255,255,255,.08)":"rgba(0,0,0,.08)"; g.fillRect(R()*W,R()*H,R()*40,1); }
    g.fillStyle="#a5abb4"; g.beginPath(); g.arc(W/2,75,64,0,7); g.fill();
    g.fillStyle="#d0202d"; g.beginPath(); g.arc(W/2,75,56,0,7); g.fill();
    g.fillStyle="#08080a"; g.fillRect(W/2-10,110,20,16);
    for(let a=0;a<6;a++){ const ang=a*Math.PI/3, px=W/2+34*Math.cos(ang), py=75+34*Math.sin(ang);
      g.fillStyle="#d4af37"; g.beginPath(); g.arc(px,py,8,0,7); g.fill();
      g.fillStyle="#050506"; g.beginPath(); g.arc(px,py,4.5,0,7); g.fill(); }
    const drawUsb=(y0,isRed)=>{
      g.fillStyle="#8c929c"; roundRect(g,24,y0,W-48,70,6); g.fill();
      g.fillStyle="#060608"; roundRect(g,30,y0+6,W-60,58,4); g.fill();
      g.fillStyle=isRed?"#d0202d":"#121316"; roundRect(g,36,y0+10,W-72,24,3); g.fill();
      g.fillStyle="#d4af37";
      for(let i=0;i<4;i++) g.fillRect(60+i*38,y0+38,20,8);
    };
    drawUsb(180,false);
    drawUsb(280,false);
  });
}

function usb2HdmiTex(){
  return canvasTex(256,440,(g,W,H)=>{
    g.fillStyle="#c4c9cf"; g.fillRect(0,0,W,H);
    const R=rng(102); for(let i=0;i<600;i++){ g.fillStyle=R()<.5?"rgba(255,255,255,.08)":"rgba(0,0,0,.08)"; g.fillRect(R()*W,R()*H,R()*40,1); }
    const drawUsb=(y0,isRed)=>{
      g.fillStyle="#8c929c"; roundRect(g,24,y0,W-48,70,6); g.fill();
      g.fillStyle="#060608"; roundRect(g,30,y0+6,W-60,58,4); g.fill();
      g.fillStyle=isRed?"#d0202d":"#121316"; roundRect(g,36,y0+10,W-72,24,3); g.fill();
      g.fillStyle="#d4af37";
      for(let i=0;i<4;i++) g.fillRect(60+i*38,y0+38,20,8);
    };
    drawUsb(20,true);
    drawUsb(140,true);
    g.fillStyle="#d0202d"; roundRect(g,26,270,W-52,110,8); g.fill();
    g.fillStyle="#8c929c"; roundRect(g,32,276,W-64,98,6); g.fill();
    g.fillStyle="#060608"; roundRect(g,38,282,W-76,86,4); g.fill();
    g.fillStyle="#151619"; roundRect(g,50,314,W-100,20,3); g.fill();
    g.fillStyle="#d4af37"; g.fillRect(65,317,W-130,5);
  });
}

function lanUsbTex(){
  return canvasTex(256,460,(g,W,H)=>{
    g.fillStyle="#c4c9cf"; g.fillRect(0,0,W,H);
    const R=rng(103); for(let i=0;i<600;i++){ g.fillStyle=R()<.5?"rgba(255,255,255,.08)":"rgba(0,0,0,.08)"; g.fillRect(R()*W,R()*H,R()*40,1); }
    g.fillStyle="#8c929c"; roundRect(g,20,15,W-40,135,8); g.fill();
    g.fillStyle="#060608"; roundRect(g,26,21,W-52,123,6); g.fill();
    g.fillStyle="#d0202d"; roundRect(g,32,27,W-64,111,4); g.fill();
    g.fillStyle="#060608"; roundRect(g,44,39,W-88,87,3); g.fill();
    g.fillStyle="#060608"; roundRect(g,W/2-24,15,48,22,2); g.fill();
    g.fillStyle="#d4af37";
    for(let i=0;i<8;i++) g.fillRect(52+i*18,52,6,45);
    g.fillStyle="#3ddc84"; g.fillRect(32,22,22,12);
    g.fillStyle="#ffa500"; g.fillRect(W-54,22,22,12);
    const drawUsb=(y0,isRed)=>{
      g.fillStyle="#8c929c"; roundRect(g,24,y0,W-48,70,6); g.fill();
      g.fillStyle="#060608"; roundRect(g,30,y0+6,W-60,58,4); g.fill();
      g.fillStyle=isRed?"#d0202d":"#121316"; roundRect(g,36,y0+10,W-72,24,3); g.fill();
      g.fillStyle="#d4af37";
      for(let i=0;i<4;i++) g.fillRect(60+i*38,y0+38,20,8);
    };
    drawUsb(195,true);
    drawUsb(315,true);
  });
}

function audioBlockTex(){
  return canvasTex(300,420,(g,W,H)=>{
    g.fillStyle="#c4c9cf"; g.fillRect(0,0,W,H);
    const R=rng(104);
    for(let i=0;i<800;i++){ g.fillStyle="rgba(0,0,0,.15)"; g.fillRect(R()*W,R()*H,2,2); }
    const jacks=[
      [75,70,false],[75,210,true],[75,350,false],
      [225,70,false],[225,210,false],[225,350,false]
    ];
    jacks.forEach(([x,y,isRed])=>{
      g.fillStyle="#d4af37"; g.beginPath(); g.arc(x,y,44,0,7); g.fill();
      g.fillStyle="#a88c2d"; g.beginPath(); g.arc(x,y,38,0,7); g.fill();
      g.fillStyle=isRed?"#d0202d":"#111111"; g.beginPath(); g.arc(x,y,32,0,7); g.fill();
      g.fillStyle="#030304"; g.beginPath(); g.arc(x,y,18,0,7); g.fill();
    });
  });
}

/* rear I/O ports (face the back of the case, -x) - real MSI B450 GAMING PLUS MAX panel */
(function rearIO(){
  const shell=new T.MeshStandardMaterial({color:0xc4c9cf,metalness:.9,roughness:.25}), darkShell=new T.MeshStandardMaterial({color:0x7a8088,metalness:.85,roughness:.35});
  const goldRing=new T.MeshStandardMaterial({color:0xd4af37,metalness:.95,roughness:.2});
  const col=c=>new T.MeshStandardMaterial({color:c,roughness:.45});
  const X=-15.55;
  const texMat=fn=>new T.MeshStandardMaterial({map:fn(),metalness:.7,roughness:.35});
  const frontSix=(side,front)=>[side,front,side,side,side,side];

  /* 1. BIOS FlashBack+ button (far left, Z ~ -11.5) */
  mesh(box(.4,.4,.4),darkShell,[X+.3,.75,-11.5]);
  const fb=mesh(new T.CylinderGeometry(.12,.12,.2,16),col(0x1a1a1a),[X-.05,.75,-11.5]); fb.rotation.z=Math.PI/2;

  /* 2. PS/2 Combo + 2× USB 2.0 stack (Z ~ -9.7) */
  const m1=frontSix(shell,texMat(ps2UsbTex));
  mesh(box(1.5,2.4,1.4),m1,[X+.75,1.35,-9.7]);
  const psBezel=mesh(new T.TorusGeometry(.44,.04,12,32),shell,[X-.01,2.0,-9.7]); psBezel.rotation.y=Math.PI/2;

  /* 3. 2× USB 3.2 Gen2 (Red) + HDMI stack (Z ~ -6.5) */
  const m2=frontSix(shell,texMat(usb2HdmiTex));
  mesh(box(1.5,2.6,1.5),m2,[X+.75,1.45,-6.5]);

  /* 4. RJ45 LAN (red housing) + 2× USB 3.2 Gen1 (Red) stack (Z ~ -4.2) */
  const m3=frontSix(shell,texMat(lanUsbTex));
  mesh(box(1.5,2.7,1.5),m3,[X+.75,1.5,-4.2]);
  mesh(box(.04,.1,.14),new T.MeshStandardMaterial({color:0x3ddc84,emissive:0x3ddc84,emissiveIntensity:.9}),[X-.01,2.65,-4.5],null,{cast:false});
  mesh(box(.04,.1,.14),new T.MeshStandardMaterial({color:0xffff00,emissive:0xffff00,emissiveIntensity:.9}),[X-.01,2.65,-3.9],null,{cast:false});

  /* 5. 6-Jack OFC Audio Block with gold rings (Z ~ -2.0) */
  const m4=frontSix(shell,texMat(audioBlockTex));
  mesh(box(1.5,2.5,1.8),m4,[X+.75,1.4,-2.0]);
  const audioJacks=[
    [2.15,-2.45],[1.40,-2.45],[0.65,-2.45],
    [2.15,-1.55],[1.40,-1.55],[0.65,-1.55]
  ];
  audioJacks.forEach(([y,z])=>{
    const gRing=mesh(new T.TorusGeometry(.22,.038,12,24),goldRing,[X-.01,y,z]); gRing.rotation.y=Math.PI/2;
  });
})();
