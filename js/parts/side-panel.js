/* ---------------- side panel (tempered glass in a steel frame) ----------------
   The case lies on its side, so the panel closes the open top. It drops on 1.5 cm behind its final spot,
   slides forward (toward the front, +x) to hook in, then 2 thumbscrews go in at the rear. */
const PANEL_Y=20.5, PANEL_W=CX1-CX0, PANEL_D=CZ1-CZ0;
const panelFrameMat=new T.MeshStandardMaterial({color:0x1c1d20,metalness:.5,roughness:.45});
const panelGlass=new T.MeshPhysicalMaterial({color:0x6f8190,metalness:.1,roughness:.05,transparent:true,opacity:.3,depthWrite:false});
const sideG=new T.Group(); sideG.visible=false; scene.add(sideG);
const SIDE_X=(CX0+CX1)/2, SIDE_Z=(CZ0+CZ1)/2;
(function(){ const f=1.6;
  [mesh(box(PANEL_W-2*f,.12,PANEL_D-2*f),panelGlass,[0,0,0],sideG,{cast:false}),
   mesh(box(PANEL_W,.3,f),panelFrameMat,[0,0,-PANEL_D/2+f/2],sideG), mesh(box(PANEL_W,.3,f),panelFrameMat,[0,0,PANEL_D/2-f/2],sideG),
   mesh(box(f,.3,PANEL_D-2*f),panelFrameMat,[-PANEL_W/2+f/2,0,0],sideG), mesh(box(f,.3,PANEL_D-2*f),panelFrameMat,[PANEL_W/2-f/2,0,0],sideG)
  ].forEach(m=>m.userData.part="sidePanel"); })();
// thumbscrews through the rear lip of the panel into the rear wall
const panelScrews=[L.z-10,L.z+14].map(z=>{ const g=new T.Group(); g.position.set(CX0-1.6,PANEL_Y-.6,z); g.visible=false; scene.add(g);
  const h=mesh(new T.CylinderGeometry(.45,.45,.5,18),panelFrameMat,[0,0,0],g); h.rotation.z=Math.PI/2;
  const s=mesh(new T.CylinderGeometry(.16,.16,1,10),screwMetal,[.7,0,0],g); s.rotation.z=Math.PI/2; return g; });
function showSidePanel(){ sideG.visible=true; sideG.position.set(SIDE_X-1.5,PANEL_Y+12,SIDE_Z); sideG.rotation.set(0,0,0); }
// instant=true for skipping: jump straight to the closed state
function closeSidePanel(instant,done){
  const fin=()=>{ panelScrews.forEach(g=>{ g.visible=true; g.position.x=CX0-.4; }); if(done) done(); };
  if(instant){ sideG.visible=true; sideG.position.set(SIDE_X,PANEL_Y,SIDE_Z); fin(); return; }
  const y0=sideG.position.y;
  tween(900,k=>{ sideG.position.y=y0+(PANEL_Y-y0)*k; },()=>{
    tween(500,k=>{ sideG.position.x=SIDE_X-1.5+1.5*k; },()=>{
      panelScrews.forEach((g,i)=>setTimeout(()=>{ g.visible=true; const x0=CX0-2.4;
        tween(500,k=>{ g.position.x=x0+(CX0-.4-x0)*k; g.rotation.x=k*Math.PI*5; }); },i*300));
      setTimeout(fin,1150); }); },easeOut);
}
