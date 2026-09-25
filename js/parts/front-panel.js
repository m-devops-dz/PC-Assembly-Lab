/* ---------------- front-panel power button lead → JFP1 ----------------
   JFP1 (board space) is the 2×5 header at x 12.2, z 11.45, pin pitch 2.54 mm. MSI pinout:
   row nearer the CPU (−z): HDD LED (1,3), Reset SW (5,7), reserved (9)
   row nearer the edge (+z): Power LED (2,4), Power SW (6,8), no pin (10)
   Each pair is a target in WORLD space (the board is already in the case at this step). */
const JFP1={x:12.2,z:11.45,p:.26};
const FP_PAIRS=[{name:"PWR SW",label:"Power SW",col:2.5,row:1,ok:true},{name:"RST SW",label:"Reset SW",col:2.5,row:0},
  {name:"HDD LED",label:"HDD LED",col:.5,row:0},{name:"PWR LED",label:"Power LED",col:.5,row:1}];
const fpPairPos=pr=>V3(L.x+JFP1.x+(pr.col-2)*JFP1.p,0,L.z+JFP1.z+(pr.row-.5)*JFP1.p);
makeCable("fp",{parent:scene,color:0x1a1a1d,radius:.05,plugColor:0x141518,plugSize:[.52,.38,.26],maxLen:40,hoverY:L.y+2.6,floorY:L.y+.6,snapR:.4,
  anchor:()=>V3(CX1-1.2,8,L.z-11), outDir:()=>V3(-1.2,-.5,0),
  spawnPos:()=>{ const p=fpPairPos(FP_PAIRS[0]); return V3(p.x+3,L.y+2.6,p.z-2.5); },
  targets:()=>FP_PAIRS.map(pr=>{ const p=fpPairPos(pr); return {name:pr.name,label:pr.label,x:p.x,z:p.z,seatY:L.y+.42,rot:0,ok:!!pr.ok,err:"e_fpPins"}; }),
  okMsg:"ok_fp"});
(function(){ const c=CABLES.fp;                                           // "POWER SW" printed on the plug
  const lbl=new T.MeshBasicMaterial({map:canvasTex(256,128,(g,W,H)=>{ g.fillStyle="#141518"; g.fillRect(0,0,W,H); g.fillStyle="#e9eaec"; g.font="700 44px 'Barlow Semi Condensed', Arial"; g.textAlign="center"; g.fillText("POWER SW",W/2,H*.64); })});
  const m=mesh(new T.PlaneGeometry(.5,.24),lbl,[0,c.plugSize[1]+.002,0],c.plug,{cast:false}); m.rotation.x=-Math.PI/2; m.userData={part:"cable",cable:"fp"}; })();
// hint frame around the Power SW pair (glows during the step when hints are on)
const fpMarkMat=new T.MeshStandardMaterial({color:0x3a3c40,roughness:.5});
(function(){ const g=new T.Group(), pr=FP_PAIRS[0]; g.position.set(JFP1.x+(pr.col-2)*JFP1.p,.42,JFP1.z+(pr.row-.5)*JFP1.p); boardRoot.add(g);
  [[0,.2,.66,.04],[0,-.2,.66,.04],[.31,0,.04,.44],[-.31,0,.04,.44]].forEach(([x,z,w,d])=>mesh(box(w,.03,d),fpMarkMat,[x,0,z],g,{cast:false})); })();
