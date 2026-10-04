/* ---------------- PSU cables view ----------------
   While the PSU waits on the parts mat, its four cables lie beside it, out of its cable hole: SATA power, 24-pin,
   CPU 4+4, PCIe 6+2 (the order they get plugged in later). The first click on the PSU or a plug (or the PSU in the
   parts bar) opens the view before the PSU is taken: the camera zooms in, one plug and its wires at a time are red
   (click a plug, or Prev / Next / arrow keys) and the card says where it goes, with a small picture: plug, power running
   along a wire, the part it feeds. The 4+4 and 6+2 plugs come apart and join again. Done unlocks once all four were
   seen; then the PSU is taken as usual. */
const psuInfo=document.getElementById("psuInfo");
const PI_ROWS=[
  {id:"cpu", plug:`<g class="pi-plug"><rect x="2" y="13" width="24" height="26" rx="2"/><g class="pi-pins">${[[8,19],[20,19],[8,31],[20,31]].map(([x,y])=>`<rect x="${x-3}" y="${y-3}" width="6" height="6"/>`).join("")}</g></g>
    <g class="pi-plug pi-half"><rect x="28" y="13" width="24" height="26" rx="2"/><g class="pi-pins">${[[34,19],[46,19],[34,31],[46,31]].map(([x,y])=>`<rect x="${x-3}" y="${y-3}" width="6" height="6"/>`).join("")}</g></g>
    <text class="pi-tag" x="27" y="9" text-anchor="middle">4+4</text>`,
   part:`<g class="pi-cpu"><rect x="150" y="9" width="32" height="32" rx="3"/>${[0,1,2,3,4].map(i=>`<rect x="${153+i*6}" y="5" width="2" height="4"/><rect x="${153+i*6}" y="41" width="2" height="4"/><rect x="146" y="${12+i*6}" width="4" height="2"/><rect x="182" y="${12+i*6}" width="4" height="2"/>`).join("")}<text x="166" y="29" text-anchor="middle">CPU</text></g>`},
  {id:"24", plug:`<g class="pi-plug"><rect x="2" y="14" width="56" height="24" rx="2"/><rect x="24" y="9" width="12" height="5"/><g class="pi-pins">${Array.from({length:24},(_,i)=>`<rect x="${5+(i%12)*4.4}" y="${i<12?18:28}" width="3" height="5"/>`).join("")}</g></g>
    <text class="pi-tag" x="30" y="48" text-anchor="middle">24-pin</text>`,
   part:`<g class="pi-mb"><rect x="142" y="6" width="50" height="38" rx="2"/><rect class="pi-mbsock" x="148" y="12" width="14" height="14"/><rect class="pi-mbslot" x="166" y="11" width="3" height="18"/><rect class="pi-mbslot" x="172" y="11" width="3" height="18"/><rect class="pi-mbslot" x="148" y="33" width="38" height="3"/><rect class="pi-mb24" x="184" y="11" width="5" height="16"/></g>`},
  {id:"sata", plug:`<g class="pi-plug"><path d="M4 18H54V34H12V28H4z"/><g class="pi-pins">${[0,1,2,3,4,5,6,7].map(i=>`<rect x="${15+i*4.6}" y="24" width="2.4" height="6"/>`).join("")}</g></g>
    <text class="pi-tag" x="30" y="48" text-anchor="middle">SATA</text>`,
   part:`<g class="pi-ssd"><rect x="144" y="10" width="46" height="30" rx="3"/><rect class="pi-ssdlbl" x="150" y="16" width="34" height="18" rx="2"/><text x="167" y="29" text-anchor="middle">SSD</text></g>`},
  {id:"gpu", plug:`<g class="pi-plug"><rect x="2" y="13" width="34" height="26" rx="2"/><g class="pi-pins">${[0,1,2].map(i=>`<rect x="${6+i*10}" y="16" width="6" height="6"/><rect x="${6+i*10}" y="30" width="6" height="6"/>`).join("")}</g></g>
    <g class="pi-plug pi-half"><rect x="38" y="13" width="14" height="26" rx="2"/><g class="pi-pins"><rect x="42" y="16" width="6" height="6"/><rect x="42" y="30" width="6" height="6"/></g></g>
    <text class="pi-tag" x="27" y="9" text-anchor="middle">6+2</text>`,
   part:`<g class="pi-gpu"><rect x="138" y="10" width="56" height="30" rx="3"/><g class="pi-fan"><circle cx="156" cy="25" r="11"/>${[0,72,144,216,288].map(a=>`<path d="M156 25l0-10a6 6 0 0 1 5 5z" transform="rotate(${a} 156 25)"/>`).join("")}</g><rect class="pi-gpuout" x="174" y="16" width="14" height="4"/><rect class="pi-gpuout" x="174" y="24" width="14" height="4"/><rect class="pi-gpugold" x="146" y="40" width="30" height="3"/></g>`}
];
const PI_BOLT=`<path d="M4 -9L-4 1H1L-2 9L6 -2H1z"/>`;
const PI_LIST=["sata","24","cpu","gpu"].map(id=>PI_ROWS.find(r=>r.id===id));
function piSvg(r){
  return `<svg viewBox="0 0 196 50" aria-hidden="true">${r.plug}<line class="pi-wire" x1="60" y1="26" x2="138" y2="26"/><line class="pi-flow" x1="60" y1="26" x2="138" y2="26"/>`
    +`<g class="pi-bolt">${PI_BOLT}</g>${r.part}</svg>`; }

/* 3D: the real Mini-Fit / SATA plug models (connector-cables.js) at 1.3×, lying on the desk beside the PSU's copy on the
   parts mat, pin faces turned toward the camera. They're there the whole time the PSU waits on the mat. Wires are drawn
   like the build's PSU cables (drawBundle): one per pin, leaving through the round cable hole on the PSU's side, so the
   loose half of a 4+4 / 6+2 plug takes its own wires with it. The SATA power plug has one round cable.
   `half` is the piece that comes off, `gap` how far. */
const PI_SCALE=1.3, PI_YAW=-.5, PI_FACE=V3(Math.cos(PI_YAW),0,-Math.sin(PI_YAW));   // pin faces: out to the right and toward the camera
const PI_HOLE=V3(7.1,3,-2);                                                         // the cable hole on psuG's +x face (psu.js)
// camera: the PSU, its wires and plugs, nudged away from the card (it sits at the inline end: left in Arabic, right in English)
function piCam(){ return {pos:V3(89.6,34.2,19.1),tgt:V3(65,.5,-5)}; }
const PI={on:false,sel:0,seen:new Set(),sets:[],built:false,shown:false};
const piRed=new T.MeshStandardMaterial({color:0xa80c12,emissive:0xff0a00,emissiveIntensity:.3,roughness:.5});
const piWireMat=new T.MeshStandardMaterial({color:0x18191c,roughness:.6});
function piSet(id,sc=PI_SCALE,yaw=PI_YAW,part="psuPlug"){
  const g=new T.Group(); g.visible=false; g.rotation.y=yaw; g.scale.setScalar(sc); scene.add(g);
  const plugs=[], add=(p,z)=>{ p.outer.visible=true; p.outer.position.set(0,0,z); g.add(p.outer); plugs.push(p); return p.outer; };
  const pw=n=>n*MF_P+.16;                                                     // Mini-Fit body width for n columns
  let half=null, gap=0;
  if(id==="sata") add(makePlug(1.9,0x141518,0xdddddd,"pi"),0);
  if(id==="24") add(makePinPlug(2,12,"pi"),0);
  if(id==="cpu"){ add(makePinPlug(2,2,"pi"),-pw(2)/2); half=add(makePinPlug(2,2,"pi"),pw(2)/2); gap=.7; }
  if(id==="gpu"){ add(makePinPlug(2,3,"pi"),-pw(1)/2); half=add(makePinPlug(2,1,"pi"),pw(3)/2); gap=.6; }
  const k=PI_LIST.findIndex(r=>r.id===id), meshes=[];
  g.traverse(o=>{ if(!o.isMesh) return; o.userData={part,k}; if(o.material.opacity!==0) meshes.push(o); });
  meshes.forEach(m=>m.userData.m0=m.material);
  // size from the plug meshes only (the invisible click boxes are bigger): how high it sits to lie on the desk, how much room it takes along z
  const bb=new T.Box3(), b=new T.Box3(); g.updateMatrixWorld(true);
  meshes.forEach(m=>{ if(!m.geometry.boundingBox) m.geometry.computeBoundingBox(); bb.union(b.copy(m.geometry.boundingBox).applyMatrix4(m.matrixWorld)); });
  return {id,k,g,sc,part,half,half0:half?half.position.z:0,gap,meshes,plugs,y:DESK.y+.02-bb.min.y,lift:-bb.min.y,w:bb.max.z-bb.min.z+(half?gap*sc:0),
    home:V3(0,0,0),curve:null,wires:[],E:null,da:null};
}
PI.sets=PI_LIST.map(r=>piSet(r.id));
const piItem=()=>typeof tableItem==="function"?tableItem("psu"):null;
// first frame with the parts table ready: plugs fanned out on the desk to the right of the PSU (first one farthest back,
// so the list reads top to bottom), each on a long wire out of the cable hole
function piBuild(){ const it=piItem(); if(PI.built||!it) return; PI.built=true;
  const c=it.pivot.children[0]; it.pivot.updateMatrixWorld(true);
  const hole=c.localToWorld(PI_HOLE.clone()), da=c.localToWorld(PI_HOLE.clone().add(V3(1,0,0))).sub(hole).normalize();
  const face=it.rest.x+it.size.x/2, gapZ=2.2, tot=PI.sets.reduce((a,st)=>a+st.w,0)+gapZ*(PI.sets.length-1); let z=it.rest.z+4-tot/2;
  PI.sets.forEach((st,i)=>{
    st.home.set(face+7+i*1.2,st.y,z+st.w/2); z+=st.w+gapZ;
    st.g.position.copy(st.home); st.g.updateMatrixWorld(true);
    const B=st.g.localToWorld(V3(st.id==="sata"?-1.05:-1.3,0,0));
    st.E=hole.clone().add(V3(0,(i%2-.5)*.5,(i-1.5)*.35)); st.da=da;             // four bundles side by side in the hole
    // the bundle's middle line: out of the hole, down onto the desk, along it, up into the plug's back. The power beads run along it.
    const out=st.E.clone().addScaledVector(da,2.2), low=V3(out.x+2.5,.35,out.z*.7+B.z*.3);
    st.curve=new T.CatmullRomCurve3([st.E,out,low,V3((low.x+B.x)/2,.35,(low.z+B.z)/2),B.clone().addScaledVector(PI_FACE,-1.6).setY(.4),B],false,"centripetal");
    piDraw(st); st.wires.forEach(m=>{ m.userData.m0=piWireMat; st.meshes.push(m); });
  });
}
// (re)draw a set's wires from the cable hole to its plug(s), wherever the plug (or its loose half) is now
function piDraw(st){
  st.g.updateMatrixWorld(true); const E=st.E, da=st.da, pts=st.curve.points; let n=0;
  const wire=(p,r)=>{ const geo=cableGeo(p,r*st.sc,40,5); let m=st.wires[n++];
    if(!m){ m=new T.Mesh(geo,piWireMat); m.castShadow=true; m.userData={part:st.part,k:st.k,m0:piWireMat}; m.visible=st.g.visible; scene.add(m); st.wires.push(m); }
    else { m.geometry.dispose(); m.geometry=geo; } };
  st.plugs.forEach(P=>{ const db=plugBackDir(P);
    const mid=st.curve.getPoint(.5);
    if(!P.pins){ const b=plugBack(P); wire([E,pts[1],mid,b.clone().addScaledVector(db,2.6),b],.16); return; }
    P.pins.forEach(pin=>{ const tip=P.inner.localToWorld(pin.clone()), o=V3(0,pin.y*.3,pin.z*.3).multiplyScalar(st.sc);   // tight in the hole, spreading toward the plug
      const spread=tip.clone().sub(P.inner.localToWorld(V3(pin.x,0,0)));
      wire([E.clone().add(o),pts[1].clone().add(o),mid.clone().add(o.clone().lerp(spread,.5)),tip.clone().addScaledVector(db,2.6),tip],.085); });   // straight into each pin, no loop
  });
}
/* the real PSU (psuG) from "Put the PSU in the case" until the build's own connector cables take over (the SATA steps,
   showConnCables): its own set of the same cables, real size, fixed to it, so they come along while it's carried and
   flipped. Laid out for the seated PSU: out of the cable hole (+x face, toward the case's middle) and down onto the
   board tray, fanned out flat between the PSU and the drive mount (clear of where the motherboard goes). Built once with psuG parked off the desk (no floor to lift the wires), then attached to psuG.
   Clicking them grabs the PSU, like its box. */
const PI_HAND={sets:[],built:false,shown:false};
// a tidy fan out of the cable hole, like a real PSU's cables laid flat: each plug at the end of its own straight spoke
// (each spoke straight from the hole to its plug), in hole order, so no cable crosses or bends and no
// plug touches another. All inside the tray strip between the PSU and the drive mount, clear of the board.
const PI_HAND_FAN={sata:[21,-4.6],"24":[23,-.6],cpu:[20,3.4],gpu:[15,4.1]};   // plug centres, psuG-local x / z: as far out as the strip allows
function piBuildHand(){ if(PI_HAND.built) return; PI_HAND.built=true;
  const pos=psuG.position.clone(), rot=psuG.rotation.clone(), vis=psuG.visible;
  psuG.position.set(300,0,0); psuG.rotation.set(0,0,0); psuG.updateMatrixWorld(true);
  const o=psuG.position, floor=CASE_FLOOR-PSU_POS.y, hole=o.clone().add(PI_HOLE);   // floor: the board tray, in psuG's frame
  PI_HAND.sets=PI_LIST.map((r,i)=>{ const [px,pz]=PI_HAND_FAN[r.id], a=Math.atan2(pz-PI_HOLE.z,px-PI_HOLE.x), d=Math.hypot(px-PI_HOLE.x,pz-PI_HOLE.z), dir=V3(Math.cos(a),0,Math.sin(a));
    const st=piSet(r.id,1,-a,"psu");                                          // pin face along the spoke, away from the PSU
    st.g.position.set(hole.x+dir.x*d,floor+st.lift+.02,hole.z+dir.z*d); st.g.updateMatrixWorld(true);
    const B=st.g.localToWorld(V3(st.id==="sata"?-1.05:-1.3,0,0));
    st.E=hole.clone().add(V3(0,(i%2-.5)*.4,(i-1.5)*.28)); st.da=dir;          // side by side in the hole, in spoke order
    // straight out along the spoke: leaving the hole, sagging down onto the tray, then flat into the plug's back
    const out=st.E.clone().addScaledVector(dir,1.4).add(V3(0,-.8,0)), mid=st.E.clone().lerp(B,.55).setY(floor+.35);
    st.curve=new T.CatmullRomCurve3([st.E,out,mid,B.clone().addScaledVector(dir,-1.5).setY(floor+.35),B],false,"centripetal");
    piDraw(st);
    psuG.attach(st.g); st.wires.forEach(m=>psuG.attach(m));                     // keep where they are, then move with the PSU
    return st; });
  psuG.position.copy(pos); psuG.rotation.copy(rot); psuG.visible=vis;
}
function piHandFrame(){
  const show=BUILD_MODE&&!!S.used.psu&&psuG.visible&&S.step>=ST.psu&&S.step<ST.dataSsd;
  if(show&&!PI_HAND.built) piBuildHand();
  if(show===PI_HAND.shown) return; PI_HAND.shown=show;
  PI_HAND.sets.forEach(st=>{ st.g.visible=show; st.wires.forEach(m=>m.visible=show); });
}
function piShow(on){ PI.shown=on; PI.sets.forEach(st=>{ st.g.visible=on; st.wires.forEach(m=>m.visible=on); }); }
const piSetOf=k=>PI.sets.find(s=>s.k===mod(k,PI_LIST.length));
function piPaint(){ PI.sets.forEach(st=>{ const on=PI.on&&st.k===PI.sel; st.meshes.forEach(m=>m.material=on?piRed:m.userData.m0); if(st.half&&st.half.position.z!==st.half0){ st.half.position.z=st.half0; piDraw(st); } }); }
function piSelect(k){ if(!PI.on) return; PI.sel=mod(k,PI_LIST.length); PI.seen.add(PI.sel); piPaint(); renderPsuInfo(); }
// power running down the red wire: three bright beads from the PSU to the plug
const piBeads=[0,1,2].map(()=>{ const m=new T.Mesh(new T.SphereGeometry(.34,12,10),new T.MeshBasicMaterial({color:0xffd21f,toneMapped:false})); m.visible=false; m.raycast=()=>{}; scene.add(m); return m; });
function openPsuInspect(){
  if(PI.on) return; piBuild(); PI.on=true; PI.seen=new Set();
  const cam=piCam(); focusPoint(cam.pos,cam.tgt,1100); view="psuCables";
  psuInfo.hidden=false; piSelect(0);
}
function closePsuInspect(take){
  psuInfo.hidden=true; psuInfo.innerHTML="";
  if(!PI.on) return;
  PI.on=false; piBeads.forEach(b=>b.visible=false); piPaint();
  if(take){ S.psuSeen=true; const it=piItem(); S.fromTable=it&&it.home.visible?it.pivot.getWorldPosition(V3(0,0,0)):null;   // it flies in from the mat
    takePSU(); S.fromTable=null; focus(viewFor(S.step),1000); }
}
const hidePsuInfo=()=>closePsuInspect(false);
// the yellow arrow (hints.js) stands over the red plug
function piArrowPos(){ return piSetOf(PI.sel).g.position.clone().add(V3(0,1.1*PI_SCALE,0)); }
// called every frame from the render loop: plugs and wires show while the PSU waits on the mat; while the view is open
// the red plug glows, beads run down its wire, and a split plug's loose half slides off and back
function psuInspectFrame(now){
  piHandFrame();
  if(!PI.built){ if(!BUILD_MODE||!piItem()) return; piBuild(); }
  const it=piItem(), show=PI.on||!!it&&it.home.visible&&!S.used.psu;
  if(show!==PI.shown) piShow(show);
  if(!PI.on) return;
  piRed.emissiveIntensity=.15+.3*Math.abs(Math.sin(now/380));
  const st=piSetOf(PI.sel);
  piBeads.forEach((b,i)=>{ b.visible=true; b.position.copy(st.curve.getPoint(((now/1700)+i/3)%1)); });
  if(!st.half) return;
  const k=(now%3200)/3200, out=k<.3?0:k<.45?(k-.3)/.15:k<.7?1:k<.85?1-(k-.7)/.15:0;
  const z=st.half0+st.gap*(out*out*(3-2*out)); if(z!==st.half.position.z){ st.half.position.z=z; piDraw(st); }   // its wires go with it
}
function renderPsuInfo(){ if(psuInfo.hidden||!PI.on) return;
  const r=PI_LIST[PI.sel], all=PI.seen.size===PI_LIST.length;
  psuInfo.innerHTML=`<div class="pi-head"><b>${t("pi_title")}</b><span class="pi-count">${PI.sel+1} / ${PI_LIST.length}</span></div>`
    +`<div class="pi-one pi-${r.id}">${piSvg(r)}</div><p class="pi-desc"><b>${t("pi_"+r.id)}</b> ${t("pi_"+r.id+"D")}</p>`
    +(r.id==="cpu"||r.id==="gpu"?`<p class="pi-note">${t("pi_split_"+r.id)}</p>`:"")
    +`<div class="pi-dots">${PI_LIST.map((x,i)=>`<button class="pi-dot${i===PI.sel?" cur":""}${PI.seen.has(i)?" seen":""}" data-k="${i}" aria-label="${t("pi_"+x.id)}"></button>`).join("")}</div>`
    +`<div class="pi-nav"><button id="piPrev">${t("pi_prev")}</button><button id="piNext">${t("pi_next")}</button>`
    +`<button class="primary" id="piDone"${all?"":" disabled"}>${t("pi_done")}</button></div>`
    +(all?"":`<p class="pi-note">${t("pi_seeAll")}</p>`);
  document.getElementById("piPrev").onclick=()=>piSelect(PI.sel-1);
  document.getElementById("piNext").onclick=()=>piSelect(PI.sel+1);
  document.getElementById("piDone").onclick=()=>closePsuInspect(true);
  psuInfo.querySelectorAll(".pi-dot").forEach(b=>b.onclick=()=>piSelect(+b.dataset.k));
}
window.addEventListener("keydown",e=>{ if(!PI.on||e.target.tagName==="INPUT") return;
  if(e.key==="ArrowRight"||e.key==="ArrowLeft"){ e.preventDefault(); piSelect(PI.sel+((e.key==="ArrowRight")===(lang!=="ar")?1:-1)); } });
