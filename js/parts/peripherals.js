/* ---------------- peripherals: USB keyboard, USB mouse, HDMI monitor ----------------
   Keyboard and mouse sit on the desk behind the case, the monitor past its front panel.
   They plug into the ports at the back:
   the board's rear I/O (USB, HDMI) and the graphics card's bracket (HDMI, DisplayPort). */
const periG=new T.Group(); periG.visible=false; scene.add(periG);
const periBlack=new T.MeshStandardMaterial({color:0x17181b,roughness:.55}), periGrey=new T.MeshStandardMaterial({color:0x2a2c31,metalness:.3,roughness:.5});
const plugMetal=new T.MeshStandardMaterial({color:0xc4c9cf,metalness:.9,roughness:.3});

/* keyboard (behind the case, clear of the desk space where its plug lies) and mouse (beyond the bottom).
   1 unit = 1 cm. The keyboard's long side runs along z; the typist sits at −x, so its back (F-row, cable) faces +x and the case. */
const KB_POS=V3(-44,0,L.z-20), MOUSE_POS=V3(-43,0,L.z+10), MOUSE_YAW=.12;   // mouse on the typist's right (+z), beside the number pad
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
// keyboard lights: backlit legends and the lock LEDs stay dark until the PC powers on (keyboardLights)
let kbLegendMat=null; const kbLeds=[];
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
  const lz=z0+19.2*KB_U, lx=x0-.5*KB_U;                                                           // lock LEDs, above the number pad
  const S_=2048/KB_W, px=z=>(z+KB_W/2)*S_, py=x=>(KB_D/2-x)*S_;
  const legend=canvasTex(2048,Math.round(2048*KB_D/KB_W),(g)=>{ g.fillStyle="#d9dce1"; g.textBaseline="top";
    keys.forEach(k=>{ if(!k.lab) return; const tl=(k.w*KB_U-gap-taper)/2, th=(k.h*KB_U-gap-taper)/2, cx=px(k.z), cy=py(k.x-.06);
      const big=[...k.lab].length===1&&k.row>0, arrow="←↓→↑".includes(k.lab);
      g.font=(big?"600 ":"500 ")+Math.round((big?.5:k.lab.length>3?.27:.32)*S_)+"px 'Barlow Semi Condensed', Arial";
      if(arrow){ g.textAlign="center"; g.textBaseline="middle"; g.fillText(k.lab,cx,cy); g.textBaseline="top"; }
      else if(big){ g.textAlign="left"; g.fillText(k.lab,cx-(tl-.22)*S_,cy-(th-.18)*S_); }
      else { g.textAlign="left"; g.textBaseline="bottom"; g.fillText(k.lab,cx-(tl-.2)*S_,cy+(th-.2)*S_); g.textBaseline="top"; } });
    // lock LEDs above the number pad (the lights themselves are meshes, below)
    g.font="500 "+Math.round(.26*S_)+"px Barlow, Arial"; g.textAlign="center";
    [["1",0],["A",1.3],["⇩",2.6]].forEach(([l,o])=>{ g.fillStyle="#8e939b"; g.fillText(l,px(lz+o),py(lx-.1)); }); });
  const lg=new T.PlaneGeometry(KB_W,KB_D); lg.rotateX(-Math.PI/2); lg.rotateY(-Math.PI/2);          // image x → +z, image top → +x (back)
  kbLegendMat=new T.MeshStandardMaterial({map:legend,transparent:true,depthWrite:false,color:0x8a8e94,roughness:.7,emissive:0xffffff,emissiveMap:legend,emissiveIntensity:0});
  mesh(lg,kbLegendMat,[0,KB_PLATE-.12+capH+.004,0],kbG,{cast:false});
  const ledGeo=new T.CircleGeometry(.13,16); ledGeo.rotateX(-Math.PI/2);                          // Num / Caps / Scroll lock LEDs
  [0,1.3,2.6].forEach(o=>{ const m=new T.MeshBasicMaterial({color:0x13201a}); kbLeds.push(m); mesh(ledGeo,m,[lx+.25,KB_PLATE-.12+capH+.008,lz+o],kbG,{cast:false}); });
  const sr=mesh(new T.CylinderGeometry(.28,.36,.9,14),periBlack,[KB_D/2+.3,.55,13],kbG); sr.rotation.z=Math.PI/2;   // cable strain relief at the back
})();
/* mouse: Razer Viper V4 Pro style, 12.7 × 6.1 × 3.85 cm. White shell built from its top-view outline (squared nose,
   near-parallel sides, wide palm, round tail) and a side profile, with steep rounded walls. Black diamond grip tape on both
   buttons and both sides, white wheel housing with a black ribbed wheel, 2 white thumb buttons, grey snake mark on the palm.
   The green status LED in front of the wheel lights once the PC is on (updateMouseLed, loop.js). */
const mouseG=new T.Group(); mouseG.position.copy(MOUSE_POS); mouseG.rotation.y=MOUSE_YAW; periG.add(mouseG);
let mouseLedMat=null;
(function mouse(){
  // x along the length (nose +x), z across, cm. halfW: top-view half width; topH: height along the centre line.
  const XN=6.35, XT=-6.35, B=.35;
  const halfW=x=>{ if(x>=XN||x<=XT) return 0; let w=3.03-.009*(x+2)*(x+2);
    if(x>5) w*=Math.pow(1-((x-5)/(XN-5))**3,1/3);                                   // squared nose, rounded corners
    if(x<-4.3) w*=Math.pow(1-((-4.3-x)/(-4.3-XT))**2.2,1/2.2);                      // round tail
    return w; };
  const topH=x=>3.85-(x>-1?.028:.016)*(x+1)*(x+1);                               // hump just behind the middle, full tail
  const edge=r=>r>=1?0:Math.pow(1-Math.pow(r,2.6),1/2.4);                            // 1 on top → 0 at the rim, vertical wall at r 1
  // outline radius from the origin in direction a (bisection: is the point inside the outline?)
  const rad=a=>{ const c=Math.cos(a), s=Math.abs(Math.sin(a)); let lo=0, hi=7;
    for(let i=0;i<30;i++){ const m=(lo+hi)/2; (m*s<halfW(m*c))?lo=m:hi=m; } return lo; };
  const hAt=(x,r)=>B+(topH(x)-B)*edge(r);
  const heightAt=(x,z)=>hAt(x,Math.hypot(x,z)/rad(Math.atan2(z,x)));
  // shell: rings r 0 → 1 (packed toward the rim where the wall bends), then a skirt down to the desk. Seam at the tail.
  const NR=40, NT=180, pos=[], uv=[], idx=[], rs=[];
  for(let i=0;i<=NR;i++) rs.push(1-Math.pow(1-i/NR,2.2));
  const RA=[]; for(let j=0;j<=NT;j++) RA.push(rad(Math.PI+2*Math.PI*j/NT));
  rs.concat([1]).forEach((r,i)=>{ for(let j=0;j<=NT;j++){ const a=Math.PI+2*Math.PI*j/NT, x=r*RA[j]*Math.cos(a), z=r*RA[j]*Math.sin(a);
    pos.push(x,i>NR?0:hAt(x,r),z); uv.push(j/NT,r); } });
  for(let i=0;i<=NR;i++) for(let j=0;j<NT;j++){ const k=i*(NT+1)+j, n=k+NT+1; idx.push(k,k+1,n,k+1,n+1,n); }
  const geo=new T.BufferGeometry(); geo.setAttribute("position",new T.Float32BufferAttribute(pos,3)); geo.setAttribute("uv",new T.Float32BufferAttribute(uv,2));
  geo.setIndex(idx); geo.computeVertexNormals();
  { const nm=geo.attributes.normal;                                                  // weld the normals across the seam and at the centre
    for(let i=0;i<=NR+1;i++){ const k=i*(NT+1), m=k+NT, v=V3(nm.getX(k)+nm.getX(m),nm.getY(k)+nm.getY(m),nm.getZ(k)+nm.getZ(m)).normalize(); nm.setXYZ(k,v.x,v.y,v.z); nm.setXYZ(m,v.x,v.y,v.z); }
    for(let j=0;j<=NT;j++) nm.setXYZ(j,0,1,0); }
  // skin, painted in (angle, r) space: each texel is turned back into x, z, height to decide pad / grip / white
  // also a roughness map, so the grip tape is matte and the white plastic has a soft sheen
  let rough=null;
  const skin=canvasTex(2048,1536,(g,W,H)=>{ const cw=g.canvas.width, ch=g.canvas.height, img=g.createImageData(cw,ch), px=img.data;
    const rc=document.createElement("canvas"); rc.width=cw; rc.height=ch; const rg=rc.getContext("2d"), rimg=rg.createImageData(cw,ch), rp=rimg.data;
    const cols=[]; for(let c=0;c<cw;c++){ const a=Math.PI+2*Math.PI*(c+.5)/cw; cols.push([Math.cos(a),Math.sin(a),rad(a)]); }
    const dia=(p,q,P)=>{ const f1=((p+q)/P%1+1)%1, f2=((p-q)/P%1+1)%1; return (f1<.16||f2<.16)?[34,36,40]:[12,13,15]; };
    const RR=.35, XB=.48;                                                                  // pad corner radius, pad back edge
    for(let row=0;row<ch;row++){ const r=1-(row+.5)/ch;
      for(let c=0;c<cw;c++){ const [ca,sa,R0]=cols[c], x=r*R0*ca, z=r*R0*sa, az=Math.abs(z), y=hAt(x,r);
        let v=[236,237,239];
        // button pads: inner edge at the wheel housing (wide) then the button split (thin); outer edge just inside the outline
        const zin=x>2.7?.43:x>2.2?.07+.36*(x-2.2)/.5:.07, zout=halfW(x)-.2;
        const qx=Math.max(XB+RR-x,0), qz=Math.max(zin+RR-az,0,az-(zout-RR));
        if(r<.93&&x>XB&&az>zin&&az<zout&&Math.hypot(qx,qz)<RR&&halfW(x+.2)>az) v=dia(x,z,.22);
        // side grips: lower wall, rounded ends
        else if(r>.8&&y>.6&&y<.6+1.6*Math.sqrt(Math.max(0,1-((x+2)/3.4)**6))) v=dia(x,y,.22);
        const i=(row*cw+c)*4, ro=v[0]<60?240:120; px[i]=v[0]; px[i+1]=v[1]; px[i+2]=v[2]; px[i+3]=255; rp[i]=rp[i+1]=rp[i+2]=ro; rp[i+3]=255; } }
    g.putImageData(img,0,0); rg.putImageData(rimg,0,0); rough=new T.CanvasTexture(rc); });
  mesh(geo,new T.MeshStandardMaterial({map:skin,roughnessMap:rough,roughness:1,metalness:0}),[0,0,0],mouseG);
  // snake mark: a small decal laid on the palm (u → +z, v → nose, so it reads from the typist's seat)
  const LX=-3.6, LS=2.0, logo=canvasTex(256,256,(g,W,H)=>{ g.translate(W/2,H/2); g.scale(2.4,2.4); g.strokeStyle="#7c7f86"; g.fillStyle="#7c7f86"; g.lineWidth=2.4; g.lineCap="round";
    for(let k=0;k<3;k++){ g.save(); g.rotate(k*Math.PI*2/3); g.beginPath(); g.moveTo(0,-6); g.bezierCurveTo(16,-14,4,-30,20,-40); g.bezierCurveTo(28,-45,34,-38,30,-32); g.stroke();
      g.beginPath(); g.arc(30,-32,3.4,0,Math.PI*2); g.fill(); g.restore(); }
    g.beginPath(); g.arc(0,0,7,0,Math.PI*2); g.stroke(); });
  const lg=new T.PlaneGeometry(LS,LS,10,10), lp=lg.attributes.position;
  for(let i=0;i<lp.count;i++){ const z=lp.getX(i), x=LX+lp.getY(i); lp.setXYZ(i,x,heightAt(x,z)+.015,z); }
  lg.computeVertexNormals();
  mesh(lg,new T.MeshStandardMaterial({map:logo,transparent:true,depthWrite:false,roughness:.5,polygonOffset:true,polygonOffsetFactor:-2}),null,mouseG,{cast:false});
  // scroll wheel in its slot in the housing: black ribbed tyre
  const WX=2.9, wy=heightAt(WX,0), slope=Math.atan2(heightAt(WX+.3,0)-heightAt(WX-.3,0),.6);
  const slot=new T.MeshStandardMaterial({color:0x060607,roughness:.9}),
    rib=canvasTex(256,32,(g,W,H)=>{ g.fillStyle="#1d1e21"; g.fillRect(0,0,W,H); g.fillStyle="#060607"; for(let x=0;x<W;x+=8) g.fillRect(x,0,4,H); });
  rib.wrapS=T.RepeatWrapping; rib.repeat.set(3,1);
  mesh(box(1.5,.3,.56),slot,[WX,wy-.165,0],mouseG,{cast:false}).rotation.z=slope;
  const wheel=mesh(new T.CylinderGeometry(.55,.55,.38,28),[new T.MeshStandardMaterial({map:rib,roughness:.85}),slot,slot],[WX,wy-.25,0],mouseG); wheel.rotation.x=Math.PI/2;
  // green status LED in front of the wheel
  const LDX=5.5, ledGeo=new T.CircleGeometry(.09,16); ledGeo.rotateX(-Math.PI/2);
  mouseLedMat=new T.MeshBasicMaterial({color:0x16241a,toneMapped:false});
  mesh(ledGeo,mouseLedMat,[LDX,heightAt(LDX,0)+.02,0],mouseG,{cast:false}).rotation.z=Math.atan2(heightAt(LDX+.2,0)-heightAt(LDX-.2,0),.4);
  // white thumb buttons on the left wall (−z), at 2.4 cm up
  const shellWhite=new T.MeshStandardMaterial({color:0xeeeff1,roughness:.5});
  [[2.05,1.5],[-.3,1.15]].forEach(([x,len])=>{ let z=-halfW(x); while(heightAt(x,z)<2.4&&z<0) z+=.02;
    const b=mesh(new T.CapsuleGeometry(.17,len,4,10),shellWhite,[x,2.4,z+.02],mouseG); b.rotation.z=Math.PI/2; b.scale.set(1,1,.45); });
})();
// the status LED shows green while the PC is on
function updateMouseLed(){ mouseLedMat.color.setHex(S.powered?0x2bff6a:0x16241a); }
/* monitor past the case's front panel and off beyond its top edge, screen turned toward the finishing camera */
const MON_POS=V3(52,0,L.z-46), MON_YAW=-.5;
const monG=new T.Group(); monG.position.copy(MON_POS); monG.rotation.y=MON_YAW; periG.add(monG);
const screenOff=canvasTex(1024,576,(g,W,H)=>{ g.fillStyle="#050608"; g.fillRect(0,0,W,H); g.fillStyle="#3a3f47"; g.font="600 40px Barlow, Arial"; g.textAlign="center"; g.fillText("No signal",W/2,H/2); });
const screenOn=canvasTex(1024,576,(g,W,H)=>{ const gr=g.createLinearGradient(0,0,0,H); gr.addColorStop(0,"#0b0c10"); gr.addColorStop(1,"#1a0a0c"); g.fillStyle=gr; g.fillRect(0,0,W,H);
  g.fillStyle="#d22630"; g.font="800 150px 'Barlow Semi Condensed', Arial"; g.textAlign="center"; g.fillText("MSI",W/2,H*.5);
  g.fillStyle="#c9ced4"; g.font="600 34px Barlow, Arial"; g.fillText("B450 GAMING PLUS MAX",W/2,H*.62);
  g.fillStyle="#8a9099"; g.font="500 26px Barlow, Arial"; g.fillText("Press DEL to run BIOS setup",W/2,H*.9); });
// MSI Click BIOS 5, EZ mode: what this build shows on its first boot.
// troubleshooting variants: o.reset clock and settings lost (dead CMOS battery), o.noSata SATA SSD missing,
// o.cpuFan0 / o.sysFan0 a fan reads 0 RPM (CPU fan: "CPU Fan Error!"), o.usb "ok" a USB stick in the front port, "none" not detected
function biosTex(o={}){ return canvasTex(1024,576,(g,W,H)=>{
  g.fillStyle="#0c0e13"; g.fillRect(0,0,W,H);
  g.fillStyle="#1b1e25"; g.fillRect(0,0,W,58); g.fillStyle="#d22630"; g.fillRect(0,56,W,3);
  g.font="800 34px 'Barlow Semi Condensed', Arial"; g.fillStyle="#d22630"; g.fillText("msi",18,40);
  g.font="600 22px 'Barlow Semi Condensed', Arial"; g.fillStyle="#e3e6ea"; g.fillText("CLICK BIOS 5",82,38);
  g.fillStyle="#9aa1ab"; g.font="500 18px Barlow, Arial"; g.fillText("EZ Mode (F7)",262,37); g.textAlign="right"; if(o.reset) g.fillStyle="#ff5a5f"; g.fillText(o.reset?"00:00  Tue 01 Jan, 2019":"14:32  Tue 29 Sep, 2026",W-18,37); g.textAlign="left";
  const box=(x,y,w,h)=>{ g.fillStyle="#161920"; g.fillRect(x,y,w,h); g.strokeStyle="#2a2e37"; g.lineWidth=2; g.strokeRect(x,y,w,h); };
  box(18,74,300,150);
  g.fillStyle="#9aa1ab"; g.font="500 17px Barlow, Arial"; g.fillText("CPU Speed",34,104); g.fillText("DDR Speed",180,104);
  g.fillStyle="#f1f3f5"; g.font="700 34px 'Barlow Semi Condensed', Arial"; g.fillText("3.90 GHz",34,144); g.fillText("3200 MHz",180,144);
  g.fillStyle="#9aa1ab"; g.font="500 17px Barlow, Arial"; g.fillText("CPU Temp  38°C",34,186); g.fillText("MB Temp  33°C",180,186);
  [["GAME BOOST",34],["A-XMP",180]].forEach(([l,x])=>{ g.fillStyle="#2a2e37"; g.fillRect(x,198,110,18); g.fillStyle="#6e7580"; g.font="600 13px Barlow, Arial"; g.fillText(l+"  OFF",x+8,212); });
  box(334,74,672,150);
  g.font="500 17px Barlow, Arial";
  [["CPU","AMD Ryzen 5 5600G with Radeon Graphics"],["Memory Size","16384MB (2 × 8 GB, dual channel)"],["CPU Core Voltage","1.392V"],["DDR Voltage","1.352V"],
   ["BIOS Ver","E7C02AMS.2H0"],["BIOS Build Date","06/19/2023"]].forEach(([k,v],i)=>{ const y=100+i*21; g.fillStyle="#9aa1ab"; g.fillText(k+":",350,y); g.fillStyle="#e3e6ea"; g.fillText(v,520,y); });
  box(18,240,988,86);
  g.fillStyle="#9aa1ab"; g.font="600 16px Barlow, Arial"; g.fillText("Boot Priority",34,264);
  [["UEFI: NVMe SSD 1TB","#d22630"],...(o.noSata?[]:[["SATA SSD","#4d5561"]]),[o.usb==="ok"?"USB: SanDisk":"USB","#4d5561"],["Network","#4d5561"]].forEach(([l,c],i)=>{ const x=34+i*170;
    g.fillStyle=c; roundRect(g,x,276,150,38,6); g.fill(); g.fillStyle="#f1f3f5"; g.font="600 15px Barlow, Arial"; g.fillText(l,x+10,300); });
  box(18,342,300,200);
  ["M-Flash","Favorites","Hardware Monitor"].forEach((l,i)=>{ g.fillStyle="#1f232b"; g.fillRect(30,356+i*58,276,46); g.fillStyle="#e3e6ea"; g.font="600 18px Barlow, Arial"; g.fillText(l,46,385+i*58); });
  box(334,342,672,200);
  g.fillStyle="#9aa1ab"; g.font="600 16px Barlow, Arial"; g.fillText("Storage",350,368); g.fillText("Fan Info",690,368);
  g.fillStyle="#e3e6ea"; g.font="500 16px Barlow, Arial"; g.fillText("M2_1: Samsung SSD 980 PRO 1TB",350,396); if(o.noSata) g.fillStyle="#ff5a5f"; g.fillText(o.noSata?"SATA1: Not detected":"SATA1: SATA SSD",350,420);
  if(o.usb){ g.fillStyle=o.usb==="ok"?"#e3e6ea":"#ff5a5f"; g.fillText(o.usb==="ok"?"USB: SanDisk Ultra 32GB":"USB (front): Not detected",350,444); }
  [["CPU_FAN1",o.cpuFan0?"0 RPM":"2210 RPM",o.cpuFan0],["SYS_FAN1",o.sysFan0?"0 RPM":"1080 RPM",o.sysFan0]].forEach(([k,v,off],i)=>{ const y=396+i*24; g.fillStyle="#e3e6ea"; g.fillText(k,690,y); g.fillStyle=off?"#ff5a5f":"#3ecf6e"; g.fillText(v,800,y); });
  g.fillStyle="#6e7580"; g.font="500 15px Barlow, Arial"; g.textAlign="center"; g.fillText("F10: Save & Exit     F7: Advanced Mode     ESC: Exit",W/2,H-10);
  const warn=o.reset?["CMOS battery low. Settings reset to defaults.","Date and time are wrong. Press F1 to enter setup."]:o.cpuFan0?["CPU Fan Error!","Press F1 to Run SETUP"]:null;
  if(warn){ g.fillStyle="rgba(110,12,18,.96)"; roundRect(g,W/2-330,H/2-52,660,104,10); g.fill(); g.strokeStyle="#ff5a5f"; g.lineWidth=3; g.stroke();
    g.fillStyle="#fff"; g.font="700 26px 'Barlow Semi Condensed', Arial"; g.fillText(warn[0],W/2,H/2-8);
    g.font="500 18px Barlow, Arial"; g.fillText(warn[1],W/2,H/2+24); } }); }
const screenBios=biosTex();
const screenMat=new T.MeshStandardMaterial({map:screenOff,roughness:.3,metalness:.1,emissive:0xffffff,emissiveMap:screenOff,emissiveIntensity:.0});
(function monitor(){
  mesh(box(12,.6,18),periGrey,[0,.3,0],monG);                                                           // foot
  mesh(box(2,20,4),periGrey,[-1,10,0],monG);                                                            // neck
  mesh(box(2,33,56),periBlack,[.4,26,0],monG);                                                          // bezel
  const s=mesh(new T.PlaneGeometry(53,30),screenMat,[1.42,26,0],monG,{cast:false}); s.rotation.y=Math.PI/2;
  monG.traverse(o=>{ o.castShadow=false; }); })();   // its shadow falls past the edge of the sun's shadow area and showed as a cut-off dark rectangle on the desk
function showScreen(tex,glow=.9){ screenMat.map=tex; screenMat.emissiveMap=tex; screenMat.emissiveIntensity=glow; screenMat.needsUpdate=true; }
// monitor centre and a camera spot square in front of it (a little above, inside the orbit controls' lowest angle)
function screenView(){ monG.updateMatrixWorld(true); const c=monG.localToWorld(V3(1.42,26,0)), n=monG.localToWorld(V3(2.42,26,0)).sub(c);
  return {pos:c.clone().addScaledVector(n,60).add(V3(0,12,0)),tgt:c}; }
function keyboardLights(on){ kbLegendMat.emissiveIntensity=on?.55:0; kbLeds[0].color.setHex(on?0x3ecf6e:0x13201a); }   // on boot only Num Lock is lit

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
// coil: the cable lies on the desk in n side-to-side bends, wide enough that it's about `ratio` × the straight distance
// between its ends (a long cable with slack, not one pulled tight). Bends stay outside the case's rear wall.
const coil=(ratio,n)=>(a,b)=>{ const a1=a.clone().setY(.3), b1=b.clone().setY(.3), d=b1.clone().sub(a1), side=V3(-d.z,0,d.x).normalize();
  const pts=A=>{ const r=[]; for(let i=1;i<=n;i++){ const p=a1.clone().addScaledVector(d,i/(n+1)).addScaledVector(side,A*(i%2?1:-1)); p.x=Math.min(p.x,CX0-1.2); r.push(p); } return r; };
  const len=A=>{ const q=[a,...pts(A),b]; let s=0; for(let i=1;i<q.length;i++) s+=q[i].distanceTo(q[i-1]); return s; };
  const want=ratio*a.distanceTo(b); let lo=0, hi=d.length()+5;
  for(let i=0;i<24;i++){ const m=(lo+hi)/2; len(m)<want?lo=m:hi=m; }
  return pts(lo); };
Object.assign(CONN,{
  usbKb:{id:"usbKb",mat:periCable(0x1b1c1f),radius:.18,mesh:null,a:makeUsbPlug("usbKb"),outside:true,
    anchor:()=>V3(KB_POS.x+KB_D/2+.8,1.3,KB_POS.z+13), anchorDir:()=>V3(1,0,0), via:coil(2.2,5)},
  usbMouse:{id:"usbMouse",mat:periCable(0x1b1c1f),radius:.14,mesh:null,a:makeUsbPlug("usbMouse"),outside:true,
    anchor:()=>(mouseG.updateMatrixWorld(true),mouseG.localToWorld(V3(6.3,.5,0))), anchorDir:()=>V3(Math.cos(MOUSE_YAW),0,-Math.sin(MOUSE_YAW)), via:coil(2.2,5)},
  hdmi:{id:"hdmi",mat:periCable(0x111214),radius:.25,mesh:null,a:makeHdmiPlug("hdmi"),outside:true,
    anchor:()=>(monG.updateMatrixWorld(true),monG.localToWorld(V3(-2.1,12,0))), anchorDir:()=>V3(0,-1,0),
    via:()=>[monG.localToWorld(V3(-7.5,.4,10)),V3(CX1+2,.3,CZ0-4),V3(CX0-4,.3,CZ0-4)]},       // down the monitor's neck, off its foot, then along the desk around the top of the case
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
