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
  if(!SCR.dev) return; const sc=SCREENS[SCR.dev]; SCR.dev=null;
  scrEl.classList.remove("show"); document.body.classList.remove("scr-open"); setTimeout(()=>{ if(!SCR.dev){ scrEl.hidden=true; scrBody.innerHTML=""; } },260);
  if(sc.back) sc.back();
}
function renderScreen(){ if(SCR.dev) SCREENS[SCR.dev].render(); }
document.getElementById("scrBack").onclick=closeScreen;
