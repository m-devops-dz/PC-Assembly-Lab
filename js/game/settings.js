/* ---------------- settings menu (header ⚙) ----------------
   Parts bar: off by default, the parts wait on the 3D table instead (table.js). RGB lights: the desk strip and
   the case fans' light rings. Part quiz: quiz.js. All are kept with the rest of the session (persist). */
const setBtn=document.getElementById("setBtn"), setPop=document.getElementById("setPop");
const setTray=document.getElementById("setTray"), setRgb=document.getElementById("setRgb"), setQuiz=document.getElementById("setQuiz"), setCard=document.getElementById("setCard");
function applySettings(){ document.body.classList.toggle("no-tray",!S.tray); setTray.checked=S.tray; setRgb.checked=S.rgb; setQuiz.checked=S.quiz; setCard.checked=S.card; }
function openSettings(open){ setPop.hidden=!open; setBtn.setAttribute("aria-expanded",open); }
setBtn.onclick=e=>{ e.stopPropagation(); openSettings(setPop.hidden); };
document.addEventListener("click",e=>{ if(!setPop.hidden&&!setPop.contains(e.target)) openSettings(false); });
document.addEventListener("keydown",e=>{ if(e.key==="Escape"&&!setPop.hidden){ openSettings(false); setBtn.focus(); } });
setTray.onchange=()=>{ S.tray=setTray.checked; persist(); applySettings(); updateTray(); };
setRgb.onchange=()=>{ S.rgb=setRgb.checked; persist(); applySettings(); };
setQuiz.onchange=()=>{ S.quiz=setQuiz.checked; persist(); };
setCard.onchange=()=>{ S.card=setCard.checked; persist(); };
applySettings();
// phones: the brightness slider and photo-theme picker move from the 3D view into this menu, to keep the view clear
const brightLbls=[...document.querySelectorAll(".view-btns .bright")], phoneMq=matchMedia("(max-width: 860px)");
function placeViewControls(){ const vb=document.querySelector(".view-btns"), glowB=document.getElementById("glowBtn");
  brightLbls.forEach(l=>phoneMq.matches?setPop.appendChild(l):vb.insertBefore(l,glowB)); }
(phoneMq.addEventListener?phoneMq.addEventListener("change",placeViewControls):phoneMq.addListener(placeViewControls)); placeViewControls();
