/* ---------------- settings menu (header ⚙) ----------------
   Parts bar: off by default, the parts wait on the 3D table instead (table.js). RGB lights: the desk strip and
   the case fans' light rings. Both are kept with the rest of the session (persist). */
const setBtn=document.getElementById("setBtn"), setPop=document.getElementById("setPop");
const setTray=document.getElementById("setTray"), setRgb=document.getElementById("setRgb");
function applySettings(){ document.body.classList.toggle("no-tray",!S.tray); setTray.checked=S.tray; setRgb.checked=S.rgb; }
function openSettings(open){ setPop.hidden=!open; setBtn.setAttribute("aria-expanded",open); }
setBtn.onclick=e=>{ e.stopPropagation(); openSettings(setPop.hidden); };
document.addEventListener("click",e=>{ if(!setPop.hidden&&!setPop.contains(e.target)) openSettings(false); });
document.addEventListener("keydown",e=>{ if(e.key==="Escape"&&!setPop.hidden){ openSettings(false); setBtn.focus(); } });
setTray.onchange=()=>{ S.tray=setTray.checked; persist(); applySettings(); updateTray(); };
setRgb.onchange=()=>{ S.rgb=setRgb.checked; persist(); applySettings(); };
applySettings();
