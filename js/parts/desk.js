/* ---------------- the desk ----------------
   A wide light-oak desk under everything, with an RGB LED strip around its edge and a light-grey parts mat on the
   board's right, where the parts wait until they're needed (table.js). It replaces the plain shadow catcher. */
const DESK={x0:-78,x1:82,z0:-118,z1:42,y:-.13};
/* light oak top, drawn here so it works offline. The grain runs along x; every wave has a whole number of periods
   across the canvas, so the texture tiles without seams. */
const deskTop=new T.MeshStandardMaterial({color:0xa98466,roughness:.62,metalness:0,map:canvasTex(1024,1024,(g,W,H)=>{
  const R=rng(17), TAU=Math.PI*2;
  // colour bands across the grain
  for(let y=0;y<H;y++){ const v=.5+.22*Math.sin(y/H*TAU*3+1.3)+.14*Math.sin(y/H*TAU*7+.4)+.08*Math.sin(y/H*TAU*17);
    g.fillStyle=`rgb(${Math.round(196+30*v)},${Math.round(150+28*v)},${Math.round(108+22*v)})`; g.fillRect(0,y,W,1); }
  // fine grain streaks, gently wavy
  for(let i=0;i<900;i++){ const y0=R()*H, amp=1+R()*5, k=1+Math.floor(R()*3), ph=R()*TAU, dark=R()<.7;
    g.strokeStyle=dark?`rgba(120,72,36,${.05+R()*.12})`:`rgba(255,236,210,${.05+R()*.1})`; g.lineWidth=.6+R()*1.6;
    const x0=R()*W, len=W*(.25+R()*.75); g.beginPath();
    for(let x=0;x<=len;x+=8){ const xx=x0+x, y=y0+amp*Math.sin(xx/W*TAU*k+ph); x===0?g.moveTo(xx%W,y):g.lineTo(xx%W,y); if(xx%W<8&&x>0){ g.stroke(); g.beginPath(); g.moveTo(xx%W,y); } }
    g.stroke(); }
  // a few small knots
  for(let i=0;i<4;i++){ const x=R()*W, y=R()*H; for(let r=14;r>2;r-=3){ g.strokeStyle=`rgba(110,64,30,${.12+.04*(14-r)/3})`; g.lineWidth=1.4; g.beginPath(); g.ellipse(x,y,r*2.2,r*.7,0,0,TAU); g.stroke(); } } })});
deskTop.map.wrapS=deskTop.map.wrapT=T.RepeatWrapping; deskTop.map.repeat.set(3,5);
const deskSide=new T.MeshStandardMaterial({color:0x9c6b43,roughness:.6});
(function desk(){ const w=DESK.x1-DESK.x0, d=DESK.z1-DESK.z0, h=3;
  const top=mesh(box(w,h,d),[deskSide,deskSide,deskTop,deskSide,deskSide,deskSide],[(DESK.x0+DESK.x1)/2,DESK.y-h/2,(DESK.z0+DESK.z1)/2],scene);
  top.castShadow=false; catcher.visible=false; })();
// RGB strip around the desk edge: a scrolling rainbow
const deskRgbTex=canvasTex(512,8,(g,W,H)=>{ const gr=g.createLinearGradient(0,0,W,0);
  for(let i=0;i<=6;i++) gr.addColorStop(i/6,`hsl(${i*60},100%,60%)`); g.fillStyle=gr; g.fillRect(0,0,W,H); });
deskRgbTex.wrapS=T.RepeatWrapping;
const deskStrips=[];
(function strip(){ const y=DESK.y-1.2, e=.3, w=DESK.x1-DESK.x0, d=DESK.z1-DESK.z0;
  const side=(len,pos,ry,rep)=>{ const tex=deskRgbTex.clone(); tex.needsUpdate=true; tex.repeat.x=rep; const m=new T.Mesh(new T.PlaneGeometry(len,.6),new T.MeshBasicMaterial({map:tex,toneMapped:false}));
    m.position.set(...pos); m.rotation.y=ry; m.raycast=()=>{}; scene.add(m); deskStrips.push(m); };
  side(w,[(DESK.x0+DESK.x1)/2,y,DESK.z1+e],0,6); side(w,[(DESK.x0+DESK.x1)/2,y,DESK.z0-e],Math.PI,6);
  side(d,[DESK.x1+e,y,(DESK.z0+DESK.z1)/2],Math.PI/2,6); side(d,[DESK.x0-e,y,(DESK.z0+DESK.z1)/2],-Math.PI/2,6); })();
// parts mat: where the parts lie (table.js TABLE_SPOTS fit inside it)
const PARTS_MAT={x0:16,x1:63,z0:-26,z1:17};
(function partsMat(){ const w=PARTS_MAT.x1-PARTS_MAT.x0, d=PARTS_MAT.z1-PARTS_MAT.z0;
  const tex=canvasTex(1024,Math.round(1024*d/w),(g,W,H)=>{ g.fillStyle="#d9dee3"; roundRect(g,0,0,W,H,28); g.fill();
    g.strokeStyle="rgba(40,60,80,.12)"; g.lineWidth=2; for(let x=40;x<W;x+=40){ g.beginPath(); g.moveTo(x,10); g.lineTo(x,H-10); g.stroke(); } for(let y=40;y<H;y+=40){ g.beginPath(); g.moveTo(10,y); g.lineTo(W-10,y); g.stroke(); }
    g.strokeStyle="#2f8fd8"; g.lineWidth=8; roundRect(g,8,8,W-16,H-16,24); g.stroke(); });
  const m=mesh(new T.PlaneGeometry(w,d),new T.MeshStandardMaterial({map:tex,roughness:.9,transparent:true}),[(PARTS_MAT.x0+PARTS_MAT.x1)/2,DESK.y+.01,(PARTS_MAT.z0+PARTS_MAT.z1)/2],scene,{cast:false});
  m.rotation.x=-Math.PI/2; })();
function updateDeskRgb(dt){ const on=S.rgb!==false;
  deskStrips.forEach(m=>{ m.visible=on; m.material.map.offset.x=(m.material.map.offset.x+dt*.12)%1; }); }
