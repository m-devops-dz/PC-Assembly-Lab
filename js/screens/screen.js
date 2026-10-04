/* ---------------- HTML screens ----------------
   Up close, a 3D screen (the laptop's; later the PC's monitor) gives way to an HTML page that fills the view. That is
   much easier than drawing every screen into a texture, and Arabic (right to left) and phones work for free.
   openScreen(dev): the camera flies up to the screen, then the page fades in over it.
   closeScreen(): the page fades out and the camera goes back (the screen's back()).
   Each screen is SCREENS[dev] = {view() → {pos,tgt}, render(), back()}. */
const scrEl=document.getElementById("scr"), scrBody=document.getElementById("scrBody");
const SCR={dev:null};
const SCREENS={};
function openScreen(dev){
  if(SCR.dev===dev||S.busy) return;
  const sc=SCREENS[dev], v=sc.view(); S.busy=true;
  focusPoint(v.pos,v.tgt,900);
  setTimeout(()=>{ S.busy=false; SCR.dev=dev; scrEl.dataset.dev=dev; scrEl.hidden=false; document.body.classList.add("scr-open"); void scrEl.offsetWidth; scrEl.classList.add("show"); sc.render(); },950);
}
function closeScreen(){
  if(!SCR.dev) return; const sc=SCREENS[SCR.dev]; snapScreen(SCR.dev); SCR.dev=null;
  scrEl.classList.remove("show"); document.body.classList.remove("scr-open"); setTimeout(()=>{ if(!SCR.dev){ scrEl.hidden=true; scrBody.innerHTML=""; } },260);
  if(sc.back) sc.back();
}
function renderScreen(){ if(SCR.dev) SCREENS[SCR.dev].render(); }
/* snapshot: when a screen closes, the 3D monitor / laptop keeps showing what the page showed instead of a stock picture.
   The page is laid out at the 3D screen's size for a moment, copied into an SVG <foreignObject> with every element's
   computed style inlined (author CSS can't be read on file://), drawn into a canvas and used as the screen's texture.
   Any later showScreen() (power button, restart, boot) replaces it. If a copy takes too long, or the browser refuses it
   (Safari taints such canvases), snapshots stay off for the session. */
const SNAP={on:true, tex:{}, dflt:null}, SNAP_SIZE={pc:[1024,576],laptop:[1024,640]};
const SNAP_INHERIT=/^(color|font|line-height|letter-spacing|word-spacing|text-(align|transform|indent|shadow|rendering)|direction|white-space|visibility|cursor|list-style|word-break|overflow-wrap|hyphens|tab-size|quotes|writing-mode|-webkit-text|fill|stroke|paint-order|caret-color)/;
function snapDefaults(el){                                              // the browser's own default style for this tag (blank iframe)
  if(!SNAP.dflt){ const f=document.createElement("iframe"); f.setAttribute("aria-hidden","true"); f.style.cssText="position:absolute;width:0;height:0;border:0;visibility:hidden";
    document.body.appendChild(f); SNAP.dflt={doc:f.contentDocument,win:f.contentWindow,cache:{}}; }
  const k=el.namespaceURI+el.localName, D=SNAP.dflt; if(D.cache[k]) return D.cache[k];
  const e=D.doc.createElementNS(el.namespaceURI,el.localName); D.doc.body.appendChild(e);
  const cs=D.win.getComputedStyle(e), o={}; for(let i=0;i<cs.length;i++) o[cs[i]]=cs.getPropertyValue(cs[i]);
  e.remove(); return D.cache[k]=o; }
function snapClone(el,pst){                                             // pst: the parent's computed values
  if(el.nodeType===3) return document.createTextNode(el.nodeValue);
  if(el.nodeType!==1) return null;
  const cs=getComputedStyle(el); if(cs.display==="none") return null;
  const d=snapDefaults(el), my={}; let st="";
  for(let i=0;i<cs.length;i++){ const p=cs[i]; if(p.startsWith("--")) continue; const v=cs.getPropertyValue(p); my[p]=v;
    if(SNAP_INHERIT.test(p)?pst&&pst[p]===v:d[p]===v) continue;          // inherited: only where it changes; others: only if not the default
    st+=p+":"+v+";"; }
  const c=el.cloneNode(false); c.removeAttribute("id"); c.setAttribute("style",st+"transition:none;animation:none");
  if(el.localName==="input"||el.localName==="textarea") c.setAttribute("value",el.value);
  el.childNodes.forEach(n=>{ const k=snapClone(n,my); if(k) c.appendChild(k); });
  return c; }
function snapScreen(dev){
  if(!SNAP.on||!SNAP_SIZE[dev]||(dev==="pc"&&!S.powered)) return;
  const [W,H]=SNAP_SIZE[dev], n0=showScreen.n, t0=performance.now(), keep=scrBody.getAttribute("style");
  let svg;
  try{
    scrBody.style.cssText=`position:fixed;left:0;top:0;width:${W}px;height:${H}px;flex:none`;   // lay the page out at the 3D screen's size
    const root=snapClone(scrBody,null);
    svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><foreignObject width="100%" height="100%">${new XMLSerializer().serializeToString(root)}</foreignObject></svg>`;
  }catch(e){ SNAP.on=false; return; }
  finally{ keep===null?scrBody.removeAttribute("style"):scrBody.setAttribute("style",keep); }
  if(performance.now()-t0>250) SNAP.on=false;                           // too slow on this device: this one still lands, no more after it
  const img=new Image();
  img.onload=()=>{
    const cv=document.createElement("canvas"); cv.width=W; cv.height=H; const g=cv.getContext("2d");
    try{ g.drawImage(img,0,0); g.getImageData(0,0,1,1); }catch(e){ SNAP.on=false; return; }   // tainted: WebGL couldn't use it
    const tex=new T.CanvasTexture(cv); tex.encoding=T.sRGBEncoding; tex.anisotropy=LOW?2:8;
    // less glow than the stock pictures: these are bright pages and the screen is also lit by the room
    if(dev==="pc"){ if(showScreen.n!==n0||!S.powered){ tex.dispose(); return; } showScreen(tex,.5); }   // the power button (or a boot) got there first
    else { lapScreenMat.map=lapScreenMat.emissiveMap=tex; lapScreenMat.emissiveIntensity=.5; lapScreenMat.needsUpdate=true; }
    if(SNAP.tex[dev]) SNAP.tex[dev].dispose(); SNAP.tex[dev]=tex; };
  img.onerror=()=>{ SNAP.on=false; };
  img.src="data:image/svg+xml;charset=utf-8,"+encodeURIComponent(svg);
}
document.getElementById("scrBack").onclick=closeScreen;
