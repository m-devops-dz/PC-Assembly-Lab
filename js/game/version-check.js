/* ---------------- new version check ----------------
   A copy that isn't the live site (the "Download offline" zip opened from a file, or another server) reads version.js
   from the live site a few seconds after start. If that version is newer than APP_VERSION (version.js, loaded by this
   page), a card says so and offers to open the live site. No internet: nothing happens. "Later" hides it for that
   version until the next start; "Don't ask again" for that version for good (localStorage). */
const LIVE_URL="https://m-devops-dz.github.io/PC-Assembly-Lab/";
const verAsk=document.getElementById("verAsk");
// "2026.10.04.2" → [2026,10,4,2]; compared part by part, a missing part is 0
const verParts=v=>String(v).split(".").map(n=>parseInt(n,10)||0);
function verNewer(a,b){ const x=verParts(a), y=verParts(b); for(let i=0;i<Math.max(x.length,y.length);i++){ if((x[i]||0)!==(y[i]||0)) return (x[i]||0)>(y[i]||0); } return false; }
let verLatest=null;
async function checkVersion(){
  if(location.href.startsWith(LIVE_URL)||!window.APP_VERSION) return;
  try{
    const r=await fetch(LIVE_URL+"version.js?t="+Date.now(),{cache:"no-store"}); if(!r.ok) return;
    const m=(await r.text()).match(/APP_VERSION\s*=\s*["']([\d.]+)["']/); if(!m||!verNewer(m[1],APP_VERSION)) return;
    let skip=""; try{ skip=localStorage.getItem("pcLabSkipVer")||""; }catch(e){}
    if(skip===m[1]) return;
    verLatest=m[1]; renderVerAsk(); verAsk.hidden=false; document.getElementById("vaOpen").focus({preventScroll:true});
  }catch(e){}                                                             // offline or blocked: say nothing
}
function renderVerAsk(){ if(!verLatest) return; document.getElementById("vaText").textContent=t("va_text",{v:verLatest,c:APP_VERSION}); }
function answerVerAsk(how){ verAsk.hidden=true;
  if(how==="open") window.open(LIVE_URL,"_blank","noopener");
  if(how==="never") try{ localStorage.setItem("pcLabSkipVer",verLatest); }catch(e){} }
document.getElementById("vaOpen").onclick=()=>answerVerAsk("open");
document.getElementById("vaLater").onclick=()=>answerVerAsk("later");
document.getElementById("vaNever").onclick=()=>answerVerAsk("never");
verAsk.addEventListener("keydown",e=>{ if(e.key==="Escape") answerVerAsk("later"); });
setTimeout(checkVersion,3000);
