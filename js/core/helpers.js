/* ---------------- helpers ---------------- */
if(typeof THREE==="undefined") throw new Error("The three.js library didn't load. Check the internet connection and reload.");
const T=THREE;
T.ColorManagement.legacyMode=false;   // hex colours are sRGB, like the canvas textures (r147 otherwise treats them as linear and they render washed-out)
function rng(seed){ return function(){ seed|=0; seed=seed+0x6D2B79F5|0; let x=Math.imul(seed^seed>>>15,1|seed); x=x+Math.imul(x^x>>>7,61|x)^x; return ((x^x>>>14)>>>0)/4294967296; }; }
/* Phones get half-resolution textures, a smaller shadow map and a lower pixel ratio:
   the full-quality scene needs more graphics memory than many phone browsers allow. */
const LOW=(window.matchMedia&&matchMedia("(pointer: coarse)").matches)||Math.min(screen.width,screen.height)<820;
const TEX_Q=LOW?.5:1;
function makeCanvas(w,h,draw){ const c=document.createElement("canvas"); c.width=w; c.height=h; draw(c.getContext("2d"),w,h); return c; }
function canvasTex(w,h,draw){
  const c=document.createElement("canvas"); c.width=Math.max(8,Math.round(w*TEX_Q)); c.height=Math.max(8,Math.round(h*TEX_Q));
  const g=c.getContext("2d"); g.scale(c.width/w,c.height/h); draw(g,w,h);
  const tex=new T.CanvasTexture(c); tex.encoding=T.sRGBEncoding; tex.anisotropy=LOW?2:8; return tex; }
const easeInOut=k=>k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2, easeOut=k=>1-Math.pow(1-k,3);
const tweens=[];
function tween(dur,fn,done,ease=easeInOut){ tweens.push({s:performance.now(),dur,fn,done,ease}); }
function animTo(obj,prop,to,dur,done,ease){ const from=obj[prop]; tween(dur,k=>{ obj[prop]=from+(to-from)*k; },done,ease); }
function roundRect(g,x,y,w,h,r){ g.beginPath(); g.moveTo(x+r,y); g.arcTo(x+w,y,x+w,y+h,r); g.arcTo(x+w,y+h,x,y+h,r); g.arcTo(x,y+h,x,y,r); g.arcTo(x,y,x+w,y,r); g.closePath(); }
function brushed(g,W,H,base,seed,n){ g.fillStyle=base; g.fillRect(0,0,W,H); const R=rng(seed); for(let i=0;i<n;i++){ const y=R()*H; g.strokeStyle=R()<.5?"rgba(255,255,255,.07)":"rgba(0,0,0,.09)"; g.lineWidth=1; g.beginPath(); g.moveTo(R()*W,y); g.lineTo(R()*W,y+R()*2-1); g.stroke(); } }
// keyed connector outline (HDMI, DisplayPort, IEC power): a w×h rectangle whose corners on the −y side are cut by cL (left) and cR (right).
// inset shrinks it evenly, for the hollow inside of a port shell.
function portShape(w,h,cL,cR,inset=0){ const s=new T.Shape(), a=-w/2+inset, b=w/2-inset, lo=-h/2+inset, hi=h/2-inset;
  s.moveTo(a+cL,lo); s.lineTo(b-cR,lo); s.lineTo(b,lo+cR); s.lineTo(b,hi); s.lineTo(a,hi); s.lineTo(a,lo+cL); s.lineTo(a+cL,lo); return s; }
