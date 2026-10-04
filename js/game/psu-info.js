/* ---------------- PSU cables: inspect mode ----------------
   The first click on the PSU (table or parts bar) opens this before the PSU is taken: the camera zooms to the PSU on the
   parts mat and its four plugs come out on wires and lie beside it, in the order they get plugged in later:
   SATA power, 24-pin, CPU 4+4, PCIe 6+2. One plug and its wire at a time are red (click a plug, or Prev / Next / arrow keys) and the
   card says where it goes, with a small picture: plug, power running along a wire, the part it feeds. The 4+4 and 6+2
   plugs come apart and join again. Done unlocks once all four were seen; then the PSU is taken as usual. */
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

/* 3D: the real Mini-Fit / SATA plug models (connector-cables.js) at 1.3×, lying on the desk in a column beside the PSU's
   cable face (+x on the table), pin faces turned out toward the camera. Wires are drawn like the build's PSU cables
   (drawBundle): one per pin, gathered into a bundle at the PSU, so the loose half of a 4+4 / 6+2 plug takes its own
   wires with it when it comes off. The SATA power plug has one round cable. `half` is the piece that comes off, `gap` how far. */
const PI_SCALE=1.3, PI_YAW=-.5, PI_FACE=V3(Math.cos(PI_YAW),0,-Math.sin(PI_YAW));   // pin faces: out to the right and toward the camera
// camera: the PSU, its wires and plugs, nudged away from the card (it sits at the inline end: left in Arabic, right in English)
function piCam(){ const x=isPhone()?64:lang==="ar"?62.5:69, tgt=V3(x,.5,-6); return {pos:tgt.clone().add(V3(0,33,30)),tgt}; }
const PI={on:false,sel:0,seen:new Set(),from:null,sets:[],built:false};
const piRed=new T.MeshStandardMaterial({color:0xa80c12,emissive:0xff0a00,emissiveIntensity:.3,roughness:.5});
const piWireMat=new T.MeshStandardMaterial({color:0x18191c,roughness:.6});
function piSet(id){
  const g=new T.Group(); g.visible=false; g.rotation.y=PI_YAW; g.scale.setScalar(PI_SCALE); scene.add(g);
  const plugs=[], add=(p,z)=>{ p.outer.visible=true; p.outer.position.set(0,0,z); g.add(p.outer); plugs.push(p); return p.outer; };
  const pw=n=>n*MF_P+.16;                                                     // Mini-Fit body width for n columns
  let half=null, gap=0;
  if(id==="sata") add(makePlug(1.9,0x141518,0xdddddd,"pi"),0);
  if(id==="24") add(makePinPlug(2,12,"pi"),0);
  if(id==="cpu"){ add(makePinPlug(2,2,"pi"),-pw(2)/2); half=add(makePinPlug(2,2,"pi"),pw(2)/2); gap=.7; }
  if(id==="gpu"){ add(makePinPlug(2,3,"pi"),-pw(1)/2); half=add(makePinPlug(2,1,"pi"),pw(3)/2); gap=.6; }
  const k=PI_LIST.findIndex(r=>r.id===id), meshes=[];
  g.traverse(o=>{ if(!o.isMesh) return; o.userData={part:"psuPlug",k}; if(o.material.opacity!==0) meshes.push(o); });
  meshes.forEach(m=>m.userData.m0=m.material);
  // size from the plug meshes only (the invisible click boxes are bigger): how high it sits to lie on the desk, how much room it takes along z
  const bb=new T.Box3(), b=new T.Box3(); g.updateMatrixWorld(true);
  meshes.forEach(m=>{ if(!m.geometry.boundingBox) m.geometry.computeBoundingBox(); bb.union(b.copy(m.geometry.boundingBox).applyMatrix4(m.matrixWorld)); });
  return {id,k,g,half,half0:half?half.position.z:0,gap,meshes,y:DESK.y+.02-bb.min.y,w:bb.max.z-bb.min.z+(half?gap*PI_SCALE:0),
    back:id==="sata"?-1.05:-1.3,plugs,home:V3(0,0,0),curve:null,wires:[],E:null};
}
PI.sets=PI_LIST.map(r=>piSet(r.id));
// the PSU's spot on the mat (its table copy, table.js) and size; the cable face is its +x side
const piPsu=()=>{ const it=tableItem("psu"); return it?{p:it.rest.clone(),s:it.size.clone()}:{p:V3(54.5,4.3,-7),s:V3(14,8.6,15)}; };
// first open: plugs in a column beside the PSU (first one farthest back, so the list reads top to bottom), and a wire to each
function piBuild(){ if(PI.built) return; PI.built=true;
  const {p,s}=piPsu(), face=p.x+s.x/2, gapZ=1.6, tot=PI.sets.reduce((a,st)=>a+st.w,0)+gapZ*(PI.sets.length-1); let z=p.z-tot/2;
  PI.sets.forEach((st,i)=>{
    st.home.set(face+7.5+i*.6,st.y,z+st.w/2); z+=st.w+gapZ;
    st.g.position.copy(st.home); st.g.updateMatrixWorld(true);
    const B=st.g.localToWorld(V3(st.back,0,0)), E=V3(face,DESK.y+1.4+i*.5,p.z+(i-1.5)*2.2); st.E=E;
    // the bundle's middle line: the plug slides out along it, the power beads run along it
    st.curve=new T.CatmullRomCurve3([E,E.clone().add(V3(1.6,-.5,0)),V3((E.x+B.x)/2,.4,(E.z*.4+B.z*.6)),B.clone().addScaledVector(PI_FACE,-1.4).setY(Math.max(.4,B.y-.1)),B]);
    st.off=st.home.clone().sub(B);                                               // plug centre relative to the wire's end
    piDraw(st); st.wires.forEach(m=>{ m.userData.m0=piWireMat; st.meshes.push(m); });
  });
}
// (re)draw a set's wires from the PSU face to its plug(s), wherever the plug is now
function piDraw(st){
  st.g.updateMatrixWorld(true); const E=st.E, da=V3(1,0,0), mid=st.curve.getPoint(.5); let n=0;
  const wire=(pts,r)=>{ const geo=cableGeo(pts,r*PI_SCALE,30,5); let m=st.wires[n++];
    if(!m){ m=new T.Mesh(geo,piWireMat); m.castShadow=true; m.userData={part:"psuPlug",k:st.k,m0:piWireMat}; scene.add(m); st.wires.push(m); }
    else { m.geometry.dispose(); m.geometry=geo; } };
  st.plugs.forEach(P=>{ const db=plugBackDir(P);
    if(!P.pins){ const b=plugBack(P); wire([E,E.clone().addScaledVector(da,1.6),mid,b.clone().addScaledVector(db,1.4),b],.16); return; }
    P.pins.forEach(pin=>{ const tip=P.inner.localToWorld(pin.clone()), oP=V3(0,pin.y*.45,pin.z*.45).multiplyScalar(PI_SCALE);
      const oMid=oP.clone().lerp(tip.clone().sub(P.inner.localToWorld(V3(pin.x,0,0))),.4);
      wire([E.clone().add(oP),E.clone().addScaledVector(da,1.6).add(oP),mid.clone().add(oMid),tip.clone().addScaledVector(db,1.8),tip],.085); });
  });
}
const piSetOf=k=>PI.sets.find(s=>s.k===mod(k,PI_LIST.length));
function piSelect(k){ if(!PI.on) return; PI.sel=mod(k,PI_LIST.length); PI.seen.add(PI.sel);
  PI.sets.forEach(st=>{ const on=st.k===PI.sel; st.meshes.forEach(m=>m.material=on?piRed:m.userData.m0); if(st.half){ st.half.position.z=st.half0; piDraw(st); } });
  renderPsuInfo(); }
// power running down the red wire: three bright beads from the PSU to the plug
const piBeads=[0,1,2].map(()=>{ const m=new T.Mesh(new T.SphereGeometry(.34,12,10),new T.MeshBasicMaterial({color:0xffd21f,toneMapped:false})); m.visible=false; m.raycast=()=>{}; scene.add(m); return m; });
function openPsuInspect(){
  if(PI.on) return; PI.on=true; PI.from=S.fromTable?S.fromTable.clone():null; PI.seen=new Set();
  const cam=piCam(); focusPoint(cam.pos,cam.tgt,1100); view="psuCables"; piBuild();
  // each plug comes out of the PSU along its bundle's line, its wires following it
  const at=(st,k)=>{ st.g.position.copy(st.curve.getPoint(k)).add(st.off); piDraw(st); };
  PI.sets.forEach((st,i)=>{ st.g.visible=true; st.wires.forEach(m=>m.visible=true); at(st,.02);
    setTimeout(()=>tween(800,k=>at(st,.02+.98*k),()=>{ st.g.position.copy(st.home); piDraw(st); },easeOut),150+i*160); });
  psuInfo.hidden=false; piSelect(0);
}
function closePsuInspect(take){
  if(!PI.on){ psuInfo.hidden=true; psuInfo.innerHTML=""; return; }
  PI.on=false; psuInfo.hidden=true; psuInfo.innerHTML=""; piBeads.forEach(b=>b.visible=false);
  PI.sets.forEach(st=>{ st.g.visible=false; st.wires.forEach(m=>m.visible=false); st.meshes.forEach(m=>m.material=m.userData.m0); });
  if(take){ S.psuSeen=true; S.fromTable=PI.from; takePSU(); S.fromTable=null; focus(viewFor(S.step),1000); }
}
const hidePsuInfo=()=>closePsuInspect(false);
// the yellow arrow (hints.js) stands over the red plug
function piArrowPos(){ return piSetOf(PI.sel).g.position.clone().add(V3(0,1.1*PI_SCALE,0)); }
// called every frame from the render loop: the red plug glows, beads run down its wire, a split plug's loose half slides off and back
function psuInspectFrame(now){
  if(!PI.on) return;
  piRed.emissiveIntensity=.15+.3*Math.abs(Math.sin(now/380));
  const st=piSetOf(PI.sel);
  piBeads.forEach((b,i)=>{ b.visible=!!st.curve; if(st.curve) b.position.copy(st.curve.getPoint(((now/1500)+i/3)%1)); });
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
