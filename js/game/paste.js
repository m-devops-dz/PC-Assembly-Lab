function drawPasteLeg(i,A,B){
  const geo=new T.TubeGeometry(new T.LineCurve3(A,B),2,.13,10,false);
  if(!pasteLines[i]){ pasteLines[i]=new T.Mesh(geo,pasteMat); pasteLines[i].castShadow=false; boardRoot.add(pasteLines[i]); } else { pasteLines[i].geometry.dispose(); pasteLines[i].geometry=geo; }
  pasteLines[i].visible=true;
}
function applyPasteX(){
  const y=.86+.12, d=1.25, legs=[[V3(SX-d,y,SZ-d),V3(SX+d,y,SZ+d)],[V3(SX+d,y,SZ-d),V3(SX-d,y,SZ+d)]];
  const leg=i=>{
    if(i>=2){ tween(600,k=>{ pasteG.position.y=y+.05+k*8; pasteG.position.x=SX+d-k*6; },()=>{ pasteG.visible=false; S.busy=false; toast(t("ok_paste"),"ok"); setStep(ST.cooler); }); return; }
    const [A,B]=legs[i], p0=pasteG.position.clone(), p1=V3(A.x,y+.05,A.z);
    tween(450,k=>{ pasteG.position.lerpVectors(p0,p1,k); pasteG.position.y+=Math.sin(k*Math.PI)*.9; },()=>{
      tween(1000,k=>{ const P=A.clone().lerp(B,Math.max(k,.02)); pasteG.position.set(P.x,y+.05,P.z); drawPasteLeg(i,A,P); },()=>leg(i+1),k=>k); });
  };
  leg(0);
}
/* paste demo: when the cooler goes down, a small card plays how the X of paste is pressed flat (side view on the left,
   seen from above on the right). Plays twice, then stays on the last frame until OK. */
const pasteDemo=document.getElementById("pasteDemo"), pdCv=pasteDemo.querySelector("canvas"), PD_MS=4200;
let pdT0=0, pdRaf=0;
const clamp01=v=>Math.max(0,Math.min(1,v));
function drawPasteDemo(k){
  const g=pdCv.getContext("2d"), d=easeInOut(clamp01((k-.12)/.25)), p=easeInOut(clamp01((k-.37)/.35));
  g.clearRect(0,0,320,150); g.fillStyle="#0f1416"; g.fillRect(0,0,320,150);
  // side view: substrate, lid (IHS), the paste, the cooler's base coming down
  const h=14-11*p, w=Math.min(116,520/h), top=100-h, base=top-46*(1-d);
  g.fillStyle="#2e6b3a"; g.fillRect(10,112,140,8); g.fillStyle="#b9bec4"; g.fillRect(20,100,120,12);
  g.fillStyle="#9aa0a6"; g.beginPath(); g.ellipse(80,100,w/2,h,0,Math.PI,0); g.fill();
  g.fillStyle="#7d858d"; g.fillRect(15,base-30,130,30); g.fillStyle="#5d646b"; for(let x=20;x<145;x+=9) g.fillRect(x,base-48,4,18);
  if(d<1){ g.strokeStyle="#ffc400"; g.lineWidth=3; g.beginPath(); g.moveTo(80,base-44); g.lineTo(80,base-8); g.moveTo(72,base-16); g.lineTo(80,base-8); g.lineTo(88,base-16); g.stroke(); }
  g.fillStyle="#cfd4d8"; g.font="600 11px Barlow, Arial"; g.textAlign="center"; g.fillText("CPU",80,135);
  // top view: the lid, the X getting wider until it covers it
  g.fillStyle="#b9bec4"; g.fillRect(185,20,110,110);
  g.save(); g.beginPath(); g.rect(189,24,102,102); g.clip(); g.strokeStyle="#8d949b"; g.lineCap="round"; g.lineWidth=9+90*p;
  g.beginPath(); g.moveTo(210,45); g.lineTo(270,105); g.moveTo(270,45); g.lineTo(210,105); g.stroke(); g.restore();
  g.strokeStyle="rgba(255,255,255,.25)"; g.setLineDash([4,4]); g.strokeRect(160.5,.5,0,150); g.setLineDash([]);
}
function pdFrame(now){ const e=now-pdT0, k=e<PD_MS*2?(e%PD_MS)/PD_MS:1; drawPasteDemo(k); pdRaf=e<PD_MS*2&&!pasteDemo.hidden?requestAnimationFrame(pdFrame):0; }
function showPasteDemo(){ hideStepCard(); pasteDemo.hidden=false; document.getElementById("pdOk").focus({preventScroll:true}); pdT0=performance.now(); cancelAnimationFrame(pdRaf); pdRaf=requestAnimationFrame(pdFrame); }
function hidePasteDemo(){ pasteDemo.hidden=true; cancelAnimationFrame(pdRaf); pdRaf=0; }
document.getElementById("pdOk").onclick=()=>{ hidePasteDemo(); if(S.card&&(window.innerWidth<=860||isFs())) showStepCard(); };   // then the screws step's own card
pasteDemo.addEventListener("keydown",e=>{ if(e.key==="Escape") document.getElementById("pdOk").click(); });
