/* ---------------- parts table ----------------
   Every part waits on the parts mat beside the board (desk.js), as a copy of the real 3D part (same geometry
   and materials, so photo themes show here too). Clicking one pops it up and spins it with its name over it;
   if it's the part the step needs it then flies to the build (the take function starts it from that spot,
   S.fromTable), otherwise it drops back down and the take function's message says why.
   While a step needs a part and the parts bar is off (Settings), the camera glides over to the table.
   A copy disappears once its part is used, or its step is past (skipped steps, troubleshooting). */
VIEWS.table={pos:[39.5,46,37],tgt:[39.5,0,-4.5]};
const TABLE_ITEMS=[
  // id (S.used key), name key, take, last step it's needed in, spot on the mat (x,z), pose turns [[axis,angle],...]
  {id:"cpu",name:"p_cpu",take:()=>takeCPU(),until:"takeCpu",src:()=>cpuYaw,at:[21,10]},
  {id:"battery",name:"p_battery",take:()=>takeBattery(),until:"battery",src:()=>batG,at:[21,4.5]},
  {id:"paste",name:"p_paste",take:()=>takePaste(),until:"paste",src:()=>pasteG,at:[21,0],pose:[["z",Math.PI/2]]},
  {id:"m2",name:"p_m2",take:()=>takeM2(),until:"m2In",src:()=>m2G,at:[21,-4.5]},
  {id:"screws",name:"p_screws",take:()=>takeScrews(),until:"boardScrews",src:screwDish,at:[21,-10]},
  {id:"ram0",name:"p_ram",num:1,take:()=>takeRAM(0),until:"ram2",src:()=>rams[0].yaw,at:[27,9],pose:[["z",Math.PI/2]]},
  {id:"ram1",name:"p_ram",num:2,take:()=>takeRAM(1),until:"ram2",src:()=>rams[1].yaw,at:[30.6,9],pose:[["z",Math.PI/2]]},
  {id:"cooler",name:"p_cooler",take:()=>takeCooler(),until:"cooler",src:()=>coolerYaw,at:[29,-4.5]},
  {id:"wifi",name:"p_wifi",take:()=>takeWifi(),until:"wifi",src:()=>wifiG,at:[29.5,-18.5],pose:[["x",-Math.PI/2]]},
  {id:"antennas",name:"p_antennas",take:()=>takeAntennas(),until:"antennas",src:antennaPair,at:[21,-18]},
  {id:"gpu",name:"p_gpu",take:()=>takeGPU(),until:"gpu",src:()=>gpuG,at:[40.5,-1],pose:[["x",-Math.PI/2],["y",Math.PI/2]]},
  {id:"sata",name:"p_sata",take:()=>takeSata(),until:"sata",src:()=>sataG,at:[54,11]},
  {id:"psu",name:"p_psu",take:()=>takePSU(),until:"psu",src:()=>psuG,at:[54.5,-7],pose:[["x",Math.PI/2]]}];
// the screws come in a little magnetic dish; the antennas are two plain rods (their real meshes hang off the Wi-Fi card)
function screwDish(){ const g=new T.Group();
  mesh(new T.CylinderGeometry(2.4,2,.5,32),new T.MeshStandardMaterial({color:0x2458d8,roughness:.5}),[0,.25,0],g);
  [[0,0],[1,.6],[-1,.5],[.4,-1.1],[-.7,-.9],[1.3,-.5],[-1.4,-.2],[.2,1.3],[-.3,.1]].forEach(([x,z],i)=>{
    const s=mesh(new T.CylinderGeometry(.34,.36,.2,20),[screwMetal,screwHeadMat,screwMetal],[x,.62,z],g); s.rotation.set((i%3-1)*.25,i,(i%2)*.3); });
  return g; }
function antennaPair(){ const g=new T.Group(), black=new T.MeshStandardMaterial({color:0x111214,roughness:.6}), gold=new T.MeshStandardMaterial({color:0xd4af37,metalness:.9,roughness:.3});
  [-.9,.9].forEach(x=>{ const r=mesh(new T.CylinderGeometry(.42,.32,9,16),black,[x,.42,-.5],g); r.rotation.x=Math.PI/2;
    const n=mesh(new T.CylinderGeometry(.35,.35,1.2,16),gold,[x,.42,4.6],g); n.rotation.x=Math.PI/2; });
  return g; }
// bounds of the meshes that actually show (hidden bits, like the Wi-Fi card's antennas, don't count)
function visibleBox(root){ const bb=new T.Box3(), b=new T.Box3(); root.updateMatrixWorld(true);
  (function walk(o){ if(!o.visible) return; if(o.isMesh&&!o.isInstancedMesh){ if(!o.geometry.boundingBox) o.geometry.computeBoundingBox(); bb.union(b.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld)); } o.children.forEach(walk); })(root);
  return bb; }
const tableG=new T.Group(); scene.add(tableG);
const blobTex=canvasTex(128,128,(g,W)=>{ const gr=g.createRadialGradient(W/2,W/2,0,W/2,W/2,W/2); gr.addColorStop(0,"rgba(0,0,0,.5)"); gr.addColorStop(1,"rgba(0,0,0,0)"); g.fillStyle=gr; g.fillRect(0,0,W,W); });
TABLE_ITEMS.forEach(it=>{
  const src=it.src(), c=src.parent?src.clone(true):src;
  c.visible=true; c.position.set(0,0,0); c.rotation.set(0,0,0); c.scale.set(1,1,1);
  (it.pose||[]).forEach(([a,ang])=>c.quaternion.premultiply(new T.Quaternion().setFromAxisAngle(V3(a==="x"?1:0,a==="y"?1:0,a==="z"?1:0),ang)));
  const sprites=[]; c.traverse(o=>{ o.userData={part:"table",id:it.id}; if(o.isSprite) sprites.push(o); }); sprites.forEach(o=>o.parent.remove(o));
  const bb=visibleBox(c), ctr=bb.getCenter(V3(0,0,0)), size=bb.getSize(V3(0,0,0));
  c.position.sub(ctr);                                         // centred on the pivot, so it spins about its middle
  it.pivot=new T.Group(); it.pivot.add(c); it.rest=V3(it.at[0],DESK.y+size.y/2+.02,it.at[1]); it.pivot.position.copy(it.rest); it.size=size;
  it.home=new T.Group(); it.home.add(it.pivot); tableG.add(it.home);
  const blob=new T.Mesh(new T.PlaneGeometry(size.x+2,size.z+2),new T.MeshBasicMaterial({map:blobTex,transparent:true,depthWrite:false}));
  blob.rotation.x=-Math.PI/2; blob.position.set(it.at[0],DESK.y+.03,it.at[1]); blob.raycast=()=>{}; it.home.add(blob); it.blob=blob;
});
// glowing ring under the part the step needs, a burst ring when one is clicked, and a name tag
const tableRing=new T.Mesh(new T.RingGeometry(.9,1,48),new T.MeshBasicMaterial({color:0xffc400,transparent:true,depthWrite:false,toneMapped:false}));
tableRing.rotation.x=-Math.PI/2; tableRing.raycast=()=>{}; scene.add(tableRing);
const burstRing=new T.Mesh(new T.RingGeometry(.85,1,48),new T.MeshBasicMaterial({color:0x4ea1ff,transparent:true,opacity:0,depthWrite:false,toneMapped:false}));
burstRing.rotation.x=-Math.PI/2; burstRing.raycast=()=>{}; scene.add(burstRing);
const tagCanvas=document.createElement("canvas"); tagCanvas.width=512; tagCanvas.height=112;
const tagTex=new T.CanvasTexture(tagCanvas); tagTex.encoding=T.sRGBEncoding;
const tableTag=new T.Sprite(new T.SpriteMaterial({map:tagTex,depthTest:false,depthWrite:false,transparent:true,toneMapped:false}));
tableTag.center.set(.5,0); tableTag.renderOrder=13; tableTag.visible=false; tableTag.raycast=()=>{}; scene.add(tableTag);
let tagFor=null;
function tagText(it){ return t(it.name)+(it.num?" #"+it.num:""); }
function drawTag(it){ if(tagFor===it.id+lang) return; tagFor=it.id+lang; const g=tagCanvas.getContext("2d"), W=512, H=112, s=tagText(it);
  g.clearRect(0,0,W,H); g.font=`700 52px ${lang==="ar"?"'IBM Plex Sans Arabic'":"'Barlow Semi Condensed'"}, Arial`; g.direction=lang==="ar"?"rtl":"ltr";
  const w=Math.min(W-8,g.measureText(s).width+64); g.fillStyle="rgba(14,20,26,.88)"; roundRect(g,(W-w)/2,6,w,H-22,40); g.fill();
  g.strokeStyle="#4ea1ff"; g.lineWidth=5; g.stroke(); g.fillStyle="#fff"; g.textAlign="center"; g.textBaseline="middle"; g.fillText(s,W/2,6+(H-22)/2+2,W-40);
  tagTex.needsUpdate=true; }
const tableShown=it=>!TS.on&&!S.used[it.id]&&S.step<=ST[it.until];
// the part the current step takes from the table (the first free RAM stick for the RAM steps)
function tableNeed(){ if(S.step>=STEPS||TS.on) return null;
  return TABLE_ITEMS.find(it=>tableShown(it)&&(it.until===STEP_IDS[S.step]||it.until==="ram2"&&S.step===ST.ram1)&&(it.id!=="ram1"||S.used.ram0))||null; }
const tableItem=id=>TABLE_ITEMS.find(it=>it.id===id);
function tablePos(id){ const it=tableItem(id); return it?V3(it.rest.x,it.rest.y+it.size.y/2+.2,it.rest.z):null; }
let tablePop=null, tableHover=null;
function clickTablePart(id){
  const it=tableItem(id); if(!it||tablePop||!tableShown(it)) return;
  if(S.busy){ return; } if(S.held){ toast(t("e_oneAtATime")); return; }
  startClock(); tablePop=it; const p=it.pivot, y0=it.rest.y, lift=3+Math.max(it.size.x,it.size.z)*.35;
  burstRing.position.set(it.rest.x,DESK.y+.05,it.rest.z); const R=Math.max(it.size.x,it.size.z)*.6+1;
  tween(700,k=>{ burstRing.scale.setScalar(R*(1+1.6*k)); burstRing.material.opacity=1-k; },null,easeOut);
  tween(380,k=>{ p.position.y=y0+lift*k; },()=>{
    tween(1300,k=>{ p.rotation.y=k*Math.PI*2; p.rotation.x=Math.sin(k*Math.PI)*.45; p.position.y=y0+lift+Math.sin(k*Math.PI*2)*.35; },()=>{
      p.rotation.set(0,0,0);
      S.fromTable=p.getWorldPosition(V3(0,0,0)); const was=!!S.used[id]; it.take(); S.fromTable=null;
      if(!was&&S.used[id]){ tablePop=null; p.position.y=y0; focus(viewFor(S.step),1000); }
      else tween(450,k=>{ p.position.y=y0+lift*(1-k); },()=>{ tablePop=null; },easeOut);
    });
  },easeOut);
}
// called every frame from the render loop
let tableKey="", tableAt=0, tableWent=false;
function updateTable(now){
  TABLE_ITEMS.forEach(it=>{ it.home.visible=tableShown(it)||tablePop===it; });
  const need=tableNeed(), pulse=.5+.5*Math.sin(now/300);
  tableRing.visible=!!need&&S.glow&&!S.held&&tablePop!==need;
  if(tableRing.visible){ const r=Math.max(need.size.x,need.size.z)*.62+.8; tableRing.position.set(need.rest.x,DESK.y+.06,need.rest.z); tableRing.scale.setScalar(r*(1+.08*pulse)); tableRing.material.opacity=.45+.5*pulse; }
  TABLE_ITEMS.forEach(it=>{ if(tablePop!==it) it.pivot.position.y=it.rest.y+(it===need&&S.glow&&!S.held?.35+.35*Math.sin(now/260):0); });
  // name tag: over the part that's popping up, or the one under the pointer
  const tg=tablePop||(tableHover&&tableShown(tableHover)?tableHover:null);
  tableTag.visible=!!tg;
  if(tg){ drawTag(tg); const w=tg.pivot.getWorldPosition(V3(0,0,0)); w.y+=Math.max(tg.size.y,tg.size.x*.5,tg.size.z*.5)*.6+.6;
    const s=camera.position.distanceTo(w)*.05; tableTag.scale.set(s*4.57,s,1); tableTag.position.copy(w); }
  // camera: glide over to the table when the step needs a part (once per step and part, a moment after the step starts)
  const key=need&&!S.held?S.step+need.id:"";
  if(key!==tableKey){ tableKey=key; tableAt=now; tableWent=false; }
  if(key&&!tableWent&&!S.tray&&!S.busy&&!dragging&&now-tableAt>1600){ tableWent=true; focus("table",1300); }
}
vp.addEventListener("pointermove",e=>{ if(e.target!==renderer.domElement||dragging) return; const p=pick(e); tableHover=p&&p.d.part==="table"?tableItem(p.d.id):null; });
document.getElementById("tableBtn").onclick=()=>focus("table",900);
