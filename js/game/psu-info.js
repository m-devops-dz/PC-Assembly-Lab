/* ---------------- PSU cables: inspect mode ----------------
   The first click on the PSU (table or parts bar) opens this before the PSU is taken: the camera zooms to the PSU on the
   parts mat and its four plugs lie in a row in front of it (no wires), in the order they get plugged in later:
   SATA power, 24-pin, CPU 4+4, PCIe 6+2. One plug at a time is red (click a plug, or Prev / Next / arrow keys) and the
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

/* 3D plugs, real Mini-Fit / SATA models (connector-cables.js), 1.6× so they read from the camera. Each set lies on the mat
   with its pin face turned to the camera; `half` is the piece that comes off (4+4, 6+2) and `gap` how far it slides. */
const PI_SCALE=1.3, PI_Z=4.2, PI_Y=1;
// camera: the PSU and the row, nudged away from the card (it sits at the inline end: left in Arabic, right in English)
function piCam(){ const dx=isPhone()?0:lang==="ar"?-7:7, tgt=V3(54.5+dx,.5,0); return {pos:tgt.clone().add(V3(0,31,27)),tgt}; }
const PI={on:false,sel:0,seen:new Set(),from:null,sets:[]};
const piRed=new T.MeshStandardMaterial({color:0xa80c12,emissive:0xff0a00,emissiveIntensity:.3,roughness:.5});
function piSet(id,x){
  const g=new T.Group(); g.visible=false; g.rotation.y=-Math.PI/2; g.scale.setScalar(PI_SCALE); g.position.set(x,PI_Y,PI_Z); scene.add(g);
  const add=(p,z)=>{ p.outer.visible=true; p.outer.position.set(0,0,z); g.add(p.outer); return p.outer; };
  const pw=n=>n*MF_P+.16;                                                     // Mini-Fit body width for n columns
  let half=null, gap=0;
  if(id==="sata") add(makePlug(1.9,0x141518,0xdddddd,"pi"),0);
  if(id==="24") add(makePinPlug(2,12,"pi"),0);
  if(id==="cpu"){ add(makePinPlug(2,2,"pi"),-pw(2)/2); half=add(makePinPlug(2,2,"pi"),pw(2)/2); gap=.7; }
  if(id==="gpu"){ add(makePinPlug(2,3,"pi"),-pw(1)/2); half=add(makePinPlug(2,1,"pi"),pw(3)/2); gap=.6; }
  const meshes=[]; g.traverse(o=>{ if(!o.isMesh) return; o.userData={part:"psuPlug",k:PI_LIST.findIndex(r=>r.id===id)}; if(o.material.opacity!==0) meshes.push(o); });
  meshes.forEach(m=>m.userData.m0=m.material);
  // size from the plug meshes only (the invisible click boxes are bigger): lie flat on the mat, and how wide it is
  const bb=new T.Box3(), b=new T.Box3(); g.updateMatrixWorld(true);
  meshes.forEach(m=>{ if(!m.geometry.boundingBox) m.geometry.computeBoundingBox(); bb.union(b.copy(m.geometry.boundingBox).applyMatrix4(m.matrixWorld)); });
  const y=DESK.y+.02+(g.position.y-bb.min.y), w=bb.max.x-bb.min.x+(half?gap*PI_SCALE:0);
  return {id,g,half,half0:half?half.position.z:0,gap,meshes,y,w,home:V3(0,y,PI_Z)};
}
PI.sets=PI_LIST.map(r=>piSet(r.id,0));
// a row centred in front of the PSU, in reading order: left to right in English, right to left in Arabic
function piLayout(){ const gapX=1.4, tot=PI.sets.reduce((a,st)=>a+st.w,0)+gapX*(PI.sets.length-1); let x=54.5-tot/2;
  const order=lang==="ar"?[...PI.sets].reverse():PI.sets;
  order.forEach(st=>{ st.home.set(x+st.w/2,st.y,PI_Z); x+=st.w+gapX; }); }
const piSetOf=k=>PI.sets.find(s=>s.id===PI_LIST[k].id);
function piSelect(k){ if(!PI.on) return; PI.sel=mod(k,PI_LIST.length); PI.seen.add(PI.sel);
  PI.sets.forEach(st=>{ const on=st===piSetOf(PI.sel); st.meshes.forEach(m=>m.material=on?piRed:m.userData.m0); if(st.half) st.half.position.z=st.half0; });
  renderPsuInfo(); }
// the PSU's spot on the mat: the plugs slide out from there
const piPsuPos=()=>{ const it=tableItem("psu"); return it?it.pivot.getWorldPosition(V3(0,0,0)):V3(54.5,PI_Y,-7); };
function openPsuInspect(){
  if(PI.on) return; PI.on=true; PI.from=S.fromTable?S.fromTable.clone():null; PI.seen=new Set();
  const cam=piCam(); focusPoint(cam.pos,cam.tgt,1100); view="psuCables"; piLayout(); const src=piPsuPos();
  PI.sets.forEach((st,i)=>{ st.g.visible=true; st.g.position.copy(src); const to=st.home;
    setTimeout(()=>tween(650,k=>{ st.g.position.lerpVectors(src,to,k); st.g.position.y+=Math.sin(k*Math.PI)*2; },null,easeOut),150+i*140); });
  psuInfo.hidden=false; piSelect(0);
}
function closePsuInspect(take){
  if(!PI.on){ psuInfo.hidden=true; psuInfo.innerHTML=""; return; }
  PI.on=false; psuInfo.hidden=true; psuInfo.innerHTML="";
  PI.sets.forEach(st=>{ st.g.visible=false; st.meshes.forEach(m=>m.material=m.userData.m0); });
  if(take){ S.psuSeen=true; S.fromTable=PI.from; takePSU(); S.fromTable=null; focus(viewFor(S.step),1000); }
}
const hidePsuInfo=()=>closePsuInspect(false);
// the yellow arrow (hints.js) stands over the red plug
function piArrowPos(){ const st=piSetOf(PI.sel); return st.g.position.clone().add(V3(0,1.1*PI_SCALE,0)); }
// called every frame from the render loop: the red plug glows, a split plug's loose half slides off and back
function psuInspectFrame(now){
  if(!PI.on) return;
  piRed.emissiveIntensity=.15+.3*Math.abs(Math.sin(now/380));
  const st=piSetOf(PI.sel); if(!st.half) return;
  const k=(now%3200)/3200, out=k<.3?0:k<.45?(k-.3)/.15:k<.7?1:k<.85?1-(k-.7)/.15:0;
  st.half.position.z=st.half0+st.gap*(out*out*(3-2*out));
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
