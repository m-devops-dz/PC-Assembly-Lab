/* ---------------- red LED rear exhaust fan ----------------
   Black frame with white corner pads, clear red blades, a ring of red LEDs around the frame, black hub.
   It runs off SYS_FAN1, so it lights up only when the PC is on AND that cable is plugged in 
   (troubleshooting case "case fan not spinning" leaves it dark). S.rgb (Settings) turns the LEDs off. updateCaseRgb runs from the render loop. */
const fanBlack=new T.MeshStandardMaterial({color:0x111214,roughness:.55,metalness:.1});
const fanPad=new T.MeshStandardMaterial({color:0xf2f4f6,roughness:.5});
const bladeRed=new T.MeshStandardMaterial({color:0x6a1a1a,roughness:.3,transparent:true,opacity:.72,side:T.DoubleSide,emissive:0xff0000,emissiveIntensity:0,toneMapped:false});   // not tone-mapped: lit red stays red, not salmon
const ledRed=new T.MeshBasicMaterial({color:0x3a1212,toneMapped:false});
const ringRed=new T.MeshStandardMaterial({color:0x4a1010,roughness:.4,transparent:true,opacity:.8,emissive:0xff0000,emissiveIntensity:0,toneMapped:false});
const FAN_R=5.35, FAN_HALF=6, FAN_D=2.4;
// frame: a rounded 12 cm square with the round opening, extruded along z
const fanFrameGeo=(()=>{ const h=FAN_HALF, r=1.4, s=new T.Shape();
  s.moveTo(-h+r,-h); s.lineTo(h-r,-h); s.quadraticCurveTo(h,-h,h,-h+r); s.lineTo(h,h-r); s.quadraticCurveTo(h,h,h-r,h);
  s.lineTo(-h+r,h); s.quadraticCurveTo(-h,h,-h,h-r); s.lineTo(-h,-h+r); s.quadraticCurveTo(-h,-h,-h+r,-h);
  const hole=new T.Path(); hole.absarc(0,0,FAN_R+.15,0,Math.PI*2,true); s.holes.push(hole);
  const g=new T.ExtrudeGeometry(s,{depth:FAN_D,bevelEnabled:false,curveSegments:48}); g.translate(0,0,-FAN_D/2); return g; })();
// one swept blade, hub to tip, curving with the spin
const fanBladeGeo=(()=>{ const s=new T.Shape(), lead=[], trail=[], r0=1.75, r1=FAN_R-.2, N=14;
  for(let i=0;i<=N;i++){ const k=i/N, r=r0+(r1-r0)*k, a=.95*k*k+.25*k, w=.3+.12*k;
    lead.push([Math.cos(a)*r,Math.sin(a)*r]); trail.push([Math.cos(a+w)*r,Math.sin(a+w)*r]); }
  s.moveTo(...lead[0]); lead.slice(1).forEach(p=>s.lineTo(...p)); trail.reverse().forEach(p=>s.lineTo(...p)); s.closePath();
  return new T.ExtrudeGeometry(s,{depth:.06,bevelEnabled:false}); })();
// builds a fan facing ±z in `frameParent`; the blades go in `rotorParent` (so the rotor turns with rearBlades, loop.js)
function redFan(frameParent,rotorParent){
  const f=new T.Group(); frameParent.add(f);
  mesh(fanFrameGeo,fanBlack,[0,0,0],f);
  [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([sx,sy])=>[-1,1].forEach(sz=>{
    const p=mesh(new T.CylinderGeometry(.95,.95,.1,20),fanPad,[sx*(FAN_HALF-1.05),sy*(FAN_HALF-1.05),sz*(FAN_D/2+.03)],f,{cast:false}); p.rotation.x=Math.PI/2;
    const h=mesh(new T.CylinderGeometry(.32,.32,.12,14),fanBlack,[sx*(FAN_HALF-1.05),sy*(FAN_HALF-1.05),sz*(FAN_D/2+.05)],f,{cast:false}); h.rotation.x=Math.PI/2; }));
  [-1,1].forEach(sz=>{ mesh(new T.TorusGeometry(FAN_R+.1,.12,8,64),ringRed,[0,0,sz*(FAN_D/2-.1)],f,{cast:false});
    for(let i=0;i<15;i++){ const a=i/15*Math.PI*2; mesh(new T.SphereGeometry(.13,8,6),ledRed,[Math.cos(a)*(FAN_R+.55),Math.sin(a)*(FAN_R+.55),sz*(FAN_D/2+.02)],f,{cast:false}); } });
  // the 4 spokes holding the motor, behind the blades
  for(let i=0;i<4;i++){ const sp=new T.Group(); sp.rotation.z=i*Math.PI/2+.4; f.add(sp); mesh(box(FAN_R,.25,.2),fanBlack,[FAN_R/2,0,-FAN_D/2+.15],sp,{cast:false}); }
  const rot=new T.Group(); (rotorParent||f).add(rot);
  const hub=mesh(new T.CylinderGeometry(1.75,1.75,1.5,32),fanBlack,[0,0,0],rot); hub.rotation.x=Math.PI/2;
  mesh(new T.TorusGeometry(1.8,.08,8,40),ringRed,[0,0,.72],rot,{cast:false});
  for(let i=0;i<13;i++){ const b=mesh(fanBladeGeo,bladeRed,[0,0,-.03],rot,{cast:false}); b.rotation.set(-.08,0,i*Math.PI*2/13); }
  return {f,rot};
}
// rear exhaust: swap the plain fan for the same red LED one, facing along x; its rotor turns with rearBlades (loop.js)
fanRing.visible=false; rearFan.children.forEach(o=>{ if(o!==rearBlades) o.visible=false; }); rearBlades.children.forEach(o=>o.visible=false);
(function(){ const fr=new T.Group(); fr.rotation.y=Math.PI/2; rearFan.add(fr);
  const rr=new T.Group(); rr.rotation.y=Math.PI/2; rearBlades.add(rr); redFan(fr,rr); })();
// red light on the white inside of the case while the fans are lit
const caseGlow=new T.PointLight(0xff2020,0,70,1.4); caseGlow.position.set(6,12,L.z-4); caseG.add(caseGlow);
const ledOff=new T.Color(0x3a1212), ledOn=new T.Color(0xff3030), bladeOff=new T.Color(0x6a1a1a), bladeOn=new T.Color(0x3a0000);
function updateCaseRgb(now,dt){
  const on=S.powered&&S.caseFanOn&&S.rgb!==false, k=on?.85+.15*Math.sin(now/600):0;
  ledRed.color.copy(on?ledOn:ledOff);
  bladeRed.color.copy(on?bladeOn:bladeOff); bladeRed.emissiveIntensity=.75*k; ringRed.emissiveIntensity=k;
  caseGlow.intensity=1.2*k;
}
