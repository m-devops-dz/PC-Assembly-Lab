/* ---------------- power supply ---------------- */
const PSU_POS=V3(-8.8,7.9,L.z+18.2);
const psuG=new T.Group(); psuG.visible=false; scene.add(psuG);
const psuBlack=new T.MeshStandardMaterial({color:0x151619,metalness:.5,roughness:.45});
const psuFan=new T.MeshStandardMaterial({map:canvasTex(512,512,(g,W,H)=>{ g.fillStyle="#151619"; g.fillRect(0,0,W,H); g.strokeStyle="#6a6e75"; g.lineWidth=5;
  for(let r=40;r<W*.44;r+=26){ g.beginPath(); g.arc(W/2,H/2,r,0,7); g.stroke(); } for(let a=0;a<8;a++){ g.beginPath(); g.moveTo(W/2,H/2); g.lineTo(W/2+Math.cos(a*.785)*W*.44,H/2+Math.sin(a*.785)*W*.44); g.stroke(); }
  g.fillStyle="#2a2c30"; g.beginPath(); g.arc(W/2,H/2,34,0,7); g.fill(); }),metalness:.4,roughness:.5});
const psuBack=new T.MeshStandardMaterial({map:canvasTex(512,512,(g,W,H)=>{ g.fillStyle="#151619"; g.fillRect(0,0,W,H); g.fillStyle="#050506";
  for(let y=20;y<H-20;y+=22) for(let x=(y/22%2)*11+20;x<W*.62;x+=22){ g.beginPath(); g.arc(x,y,8,0,7); g.fill(); }
  g.fillStyle="#2b2d31"; g.fillRect(W*.7,H*.25,W*.22,H*.24); g.fillStyle="#050506"; g.fillRect(W*.73,H*.29,W*.16,H*.16);
  g.fillStyle="#b3121e"; g.fillRect(W*.74,H*.6,W*.12,H*.14); g.fillStyle="#fff"; g.font="700 26px Barlow, Arial"; g.fillText("I / O",W*.745,H*.69); }),metalness:.4,roughness:.5});
const psuLabel=new T.MeshStandardMaterial({map:canvasTex(512,512,(g,W,H)=>{ g.fillStyle="#151619"; g.fillRect(0,0,W,H); g.fillStyle="#e9eaec"; roundRect(g,W*.1,H*.2,W*.8,H*.6,10); g.fill();
  g.fillStyle="#1b1d22"; g.font="700 64px 'Barlow Semi Condensed', Arial"; g.fillText("550 W",W*.18,H*.42); g.font="500 28px Barlow, Arial"; g.fillText("ATX12V  80 PLUS BRONZE",W*.18,H*.55); g.fillText("AC 220-240V  50/60Hz",W*.18,H*.65); }),roughness:.5});
// box faces: +x, -x, +y, -y, +z, -z  →  front(cables), back(socket), label, -, fan (case bottom), -
const psuBody=mesh(box(14,15,8.6),[psuBlack,psuBack,psuLabel,psuBlack,psuFan,psuBlack],[0,0,0],psuG); psuBody.userData.part="psu";
mesh(new T.CylinderGeometry(.9,.9,.4,16),psuBlack,[7.1,3,-2],psuG).rotation.z=Math.PI/2;
// threaded screw holes on the back, same pattern as the rear wall (they glow with the wall's holes during the PSU step)
PSU_HOLES.forEach(([dy,dz])=>{ const r=mesh(new T.RingGeometry(.2,.4,24),psuHoleMat,[-7.02,dy,dz],psuG,{cast:false}); r.rotation.y=-Math.PI/2;
  const d=mesh(new T.CircleGeometry(.2,20),holeDark,[-7.015,dy,dz],psuG,{cast:false}); d.rotation.y=-Math.PI/2; });
const PSU_HOVER=24;
