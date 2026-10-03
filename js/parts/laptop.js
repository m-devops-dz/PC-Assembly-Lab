/* ---------------- laptop, backup drive and the install USB stick (install mode only) ----------------
   A space-grey laptop on the parts mat, facing the student (+x), lid hinge at −x. The USB stick for the Windows
   installer lies beside it and plugs into the laptop's right side (−z, the typist's right). An external backup drive is
   already plugged into its left side: the USB tool lists both drives, and picking the backup drive is the mistake
   to avoid (install.js, laptop-apps.js). The screen shows a desktop picture; up close, the HTML screen takes over. */
const LAP_POS=V3(42,DESK.y,-5), LAP_D=22, LAP_W=32, LAP_H=1.5, LAP_TILT=.28;
const lapG=new T.Group(); lapG.position.copy(LAP_POS); lapG.visible=false; scene.add(lapG);
const lapGrey=new T.MeshStandardMaterial({color:0x4a4e55,metalness:.65,roughness:.38});
const lapDark=new T.MeshStandardMaterial({color:0x111215,roughness:.5});
// rounded slab, w along x, d along z, h tall, bottom at y 0
function roundSlab(w,d,h,r){ const s=new T.Shape(), x=w/2, z=d/2;
  s.moveTo(-x+r,-z); s.lineTo(x-r,-z); s.quadraticCurveTo(x,-z,x,-z+r); s.lineTo(x,z-r); s.quadraticCurveTo(x,z,x-r,z);
  s.lineTo(-x+r,z); s.quadraticCurveTo(-x,z,-x,z-r); s.lineTo(-x,-z+r); s.quadraticCurveTo(-x,-z,-x+r,-z);
  const g=new T.ExtrudeGeometry(s,{depth:h,bevelEnabled:false,curveSegments:6}); g.rotateX(Math.PI/2); g.translate(0,h,0); return g; }
// keyboard deck: image top = the hinge side (−x), image left→right = typist's left→right (+z → −z)
const lapDeckTex=canvasTex(1024,694,(g,W,H)=>{ g.fillStyle="#44484f"; g.fillRect(0,0,W,H);
  g.fillStyle="#1a1b1f"; roundRect(g,60,40,W-120,370,14); g.fill();
  const rows=[14,14,13,12,11];
  rows.forEach((n,r)=>{ const w=(W-150)/n; for(let i=0;i<n;i++){ g.fillStyle="#2b2d33"; roundRect(g,75+i*w+3,55+r*70+3,w-6,62,6); g.fill(); } });
  g.fillStyle="#3c4047"; roundRect(g,W/2-190,450,380,215,16); g.fill();                                  // touchpad
  g.strokeStyle="#565b63"; g.lineWidth=3; roundRect(g,W/2-190,450,380,215,16); g.stroke(); });
// what the screen shows when not up close: a plain desktop (the HTML screen draws the real one)
const lapScreenTex=canvasTex(1024,640,(g,W,H)=>{ const gr=g.createLinearGradient(0,0,W,H); gr.addColorStop(0,"#1d4e6b"); gr.addColorStop(.55,"#2f7f8f"); gr.addColorStop(1,"#a4d0c4");
  g.fillStyle=gr; g.fillRect(0,0,W,H);
  g.fillStyle="rgba(255,255,255,.14)"; g.beginPath(); g.ellipse(W*.68,H*.62,W*.42,H*.28,-.3,0,Math.PI*2); g.fill();
  g.fillStyle="rgba(255,255,255,.1)"; g.beginPath(); g.ellipse(W*.3,H*.25,W*.3,H*.16,.2,0,Math.PI*2); g.fill();
  [0,1,2].forEach(i=>{ g.fillStyle="rgba(255,255,255,.85)"; roundRect(g,26,30+i*96,56,50,8); g.fill(); });   // desktop icons
  g.fillStyle="rgba(240,243,246,.9)"; g.fillRect(0,H-48,W,48);
  [-2,-1,0,1,2].forEach(i=>{ g.fillStyle=i?"#5b6470":"#2f7f8f"; roundRect(g,W/2-17+i*52,H-40,34,32,7); g.fill(); }); });
const lapScreenMat=new T.MeshStandardMaterial({map:lapScreenTex,emissive:0xffffff,emissiveMap:lapScreenTex,emissiveIntensity:.85,roughness:.25});
const lapLid=new T.Group(); lapLid.position.set(-LAP_D/2+.4,LAP_H,0); lapLid.rotation.z=LAP_TILT; lapG.add(lapLid);
(function laptop(){
  const base=mesh(roundSlab(LAP_D,LAP_W,LAP_H,1.4),lapGrey,[0,0,0],lapG); base.userData={part:"laptop"};
  const deck=new T.PlaneGeometry(LAP_W-1,LAP_D-1); deck.rotateX(-Math.PI/2); deck.rotateY(Math.PI/2);
  mesh(deck,new T.MeshStandardMaterial({map:lapDeckTex,roughness:.55,metalness:.3}),[0,LAP_H+.01,0],lapG,{cast:false}).userData={part:"laptop"};
  const lid=mesh(roundSlab(LAP_W,21,.5,1.2),lapGrey,[0,0,0],lapLid); lid.rotation.x=Math.PI/2; lid.rotation.z=Math.PI/2; lid.position.set(0,10.6,0);   // the slab stood up: 21 tall, 32 wide
  lid.userData={part:"laptop"};
  mesh(box(.04,20.2,31.2),lapDark,[.02,10.6,0],lapLid,{cast:false}).userData={part:"laptop"};                 // black glass bezel
  const scr=mesh(new T.PlaneGeometry(29.6,18.5),lapScreenMat,[.05,10.9,0],lapLid,{cast:false}); scr.rotation.y=Math.PI/2; scr.userData={part:"laptop"};
  mesh(new T.CircleGeometry(.18,12),new T.MeshBasicMaterial({color:0x050506}),[.05,20.25,0],lapLid,{cast:false}).rotation.y=Math.PI/2;   // webcam
  // USB-A ports: right side (−z) for the stick, left side (+z) with the backup drive's cable
  [-1,1].forEach(sd=>{ const z=sd*(LAP_W/2+.005);
    mesh(box(1.3,.55,.03),lapDark,[3,.75,z],lapG,{cast:false});
    mesh(box(1.1,.16,.035),new T.MeshStandardMaterial({color:0x1f5fd1,roughness:.4}),[3,.86,z],lapG,{cast:false}); });   // blue tongue: USB 3
})();
const LAP_PORT=V3(3,.75,-LAP_W/2);                                   // the stick's port, laptop space; the stick goes in along +z
// external backup drive on the left, already plugged in
(function backupDrive(){
  const hdd=new T.Group(); hdd.position.set(2,0,LAP_W/2+10); hdd.rotation.y=.25; lapG.add(hdd);
  mesh(roundSlab(8,11.5,1.7,1.2),new T.MeshStandardMaterial({color:0x1d1f24,roughness:.45}),[0,0,0],hdd);
  const lbl=canvasTex(256,256,(g,W,H)=>{ g.fillStyle="#1d1f24"; g.fillRect(0,0,W,H); g.fillStyle="#c9ced4"; g.font="700 40px 'Barlow Semi Condensed', Arial"; g.textAlign="center";
    g.fillText("BACKUP",W/2,H/2-6); g.font="600 30px Barlow, Arial"; g.fillStyle="#8a9099"; g.fillText("1 TB",W/2,H/2+34); g.fillStyle="#3ecf6e"; g.beginPath(); g.arc(W/2,H-40,8,0,Math.PI*2); g.fill(); });
  const top=new T.PlaneGeometry(7,7); top.rotateX(-Math.PI/2); top.rotateY(Math.PI/2);
  mesh(top,new T.MeshStandardMaterial({map:lbl,roughness:.5}),[0,1.71,0],hdd,{cast:false});
  lapG.updateMatrixWorld(true);
  const a=V3(3,.75,LAP_W/2+.6), b=hdd.localToWorld(V3(0,.8,-5.9)).sub(lapG.position);   // laptop port → drive's back
  const path=new T.CatmullRomCurve3([V3(3,.75,LAP_W/2),a,V3(2.5,.35,LAP_W/2+3),V3(1.5,.35,LAP_W/2+5),b.clone().add(V3(0,-.4,-.8)),b]);
  mesh(new T.TubeGeometry(path,40,.17,8),periBlack,[0,0,0],lapG);
  mesh(box(1.6,.7,1.8),periBlack,[3,.75,LAP_W/2+.9],lapG);                                            // its plug
})();
// the install stick: insertion axis −x (metal shell at −x), lying flat. Same red as the one in troubleshooting.
const inStickMat=new T.MeshStandardMaterial({color:0xc8202a,roughness:.5});
const inStick=new T.Group(); inStick.visible=false; scene.add(inStick);
(function stick(){
  mesh(box(1.2,.45,1.2),new T.MeshStandardMaterial({color:0xb9bec5,metalness:.9,roughness:.3}),[-.6,0,0],inStick).userData={part:"inStick"};
  mesh(box(3.6,.8,1.8),inStickMat,[1.8,0,0],inStick).userData={part:"inStick"};
  const lbl=canvasTex(256,128,(g,W,H)=>{ g.fillStyle="#c8202a"; g.fillRect(0,0,W,H); g.fillStyle="#fff"; g.font="700 54px 'Barlow Semi Condensed', Arial"; g.textAlign="center"; g.fillText("32GB",W/2,H/2+18); });
  const top=new T.PlaneGeometry(3,1.5); top.rotateX(-Math.PI/2);
  mesh(top,new T.MeshBasicMaterial({map:lbl}),[1.9,.405,0],inStick,{cast:false}).userData={part:"inStick"};
})();
const STICK_DESK=V3(57,DESK.y+.4,-14);                               // where it lies on the mat at the start
// the stick's port on the laptop, in world space, and its way in (+z)
function lapPortWorld(){ lapG.updateMatrixWorld(true); return {p:lapG.localToWorld(LAP_PORT.clone()),in:V3(0,0,1).applyQuaternion(lapG.quaternion)}; }
// screen centre and a camera spot square in front of it
function laptopView(dist=34){ lapLid.updateMatrixWorld(true); const c=lapLid.localToWorld(V3(.05,10.9,0)), n=lapLid.localToWorld(V3(1.05,10.9,0)).sub(c);
  return {pos:c.clone().addScaledVector(n,dist),tgt:c}; }
