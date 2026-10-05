/* ---------------- UI ---------------- */
const SVG={
 paste:'<svg viewBox="0 0 96 54"><path d="M18 44 L64 12" stroke="#cfd4da" stroke-width="11" stroke-linecap="round"/><path d="M30 36 L40 29" stroke="#2f6bff" stroke-width="12"/><path d="M64 12 L80 4" stroke="#9aa3ad" stroke-width="5" stroke-linecap="round"/></svg>',
 cooler:'<svg viewBox="0 0 96 54"><rect x="20" y="4" width="56" height="46" rx="5" fill="#1d1e21"/><circle cx="48" cy="27" r="20" fill="#34373c"/><circle cx="48" cy="27" r="8" fill="#1d1e21"/><path d="M48 27 L60 13 M48 27 L66 32 M48 27 L42 45 M48 27 L30 22" stroke="#50545b" stroke-width="5"/></svg>',
 m2:'<svg viewBox="0 0 96 54"><rect x="6" y="18" width="84" height="18" rx="2" fill="#141518"/><rect x="14" y="20" width="56" height="14" rx="2" fill="#e8e9eb"/><rect x="82" y="19" width="8" height="16" fill="#e2b95a"/><circle cx="6" cy="27" r="3" fill="#0a0a0a"/></svg>',
 psu:'<svg viewBox="0 0 96 54"><rect x="18" y="4" width="60" height="46" rx="3" fill="#151619"/><circle cx="48" cy="27" r="17" fill="none" stroke="#6a6e75" stroke-width="3"/><circle cx="48" cy="27" r="9" fill="none" stroke="#6a6e75" stroke-width="3"/><path d="M31 27h34M48 10v34" stroke="#6a6e75" stroke-width="2"/></svg>',
 gpu:'<svg viewBox="0 0 96 54"><rect x="6" y="10" width="84" height="30" rx="4" fill="#2a2c31"/><circle cx="30" cy="25" r="12" fill="#0b0b0c"/><circle cx="66" cy="25" r="12" fill="#0b0b0c"/><rect x="14" y="40" width="30" height="5" fill="#e2b95a"/><rect x="4" y="6" width="3" height="40" fill="#c4c9cf"/></svg>',
 battery:'<svg viewBox="0 0 96 54"><circle cx="48" cy="27" r="22" fill="#c4c9cf"/><circle cx="48" cy="27" r="18" fill="#dfe3e7"/><text x="48" y="25" font-size="11" font-weight="700" text-anchor="middle" fill="#2b2e33" font-family="Arial">+</text><text x="48" y="36" font-size="8" font-weight="700" text-anchor="middle" fill="#2b2e33" font-family="Arial">CR2032</text></svg>',
 screws:'<svg viewBox="0 0 96 54"><g fill="#c4c9cf"><circle cx="28" cy="18" r="7"/><circle cx="48" cy="30" r="7"/><circle cx="68" cy="18" r="7"/></g><g stroke="#6a6e75" stroke-width="2"><path d="M24 18h8M28 14v8M44 30h8M48 26v8M64 18h8M68 14v8"/></g><path d="M20 46h56" stroke="#e8b33a" stroke-width="4" stroke-linecap="round"/></svg>',
 wifi:'<svg viewBox="0 0 96 54"><rect x="30" y="20" width="48" height="26" rx="2" fill="#1b1d22"/><rect x="36" y="23" width="38" height="20" rx="2" fill="#121316"/><path d="M40 28h30M40 32h30M40 36h30M40 40h30" stroke="#34373c" stroke-width="2"/><rect x="36" y="46" width="14" height="4" fill="#e2b95a"/><rect x="24" y="4" width="3" height="46" fill="#c4c9cf"/><circle cx="21" cy="18" r="2.5" fill="#d4af37"/><circle cx="21" cy="34" r="2.5" fill="#d4af37"/></svg>',
 antennas:'<svg viewBox="0 0 96 54"><path d="M14 20L80 12M14 38L80 30" stroke="#0e0f11" stroke-width="5" stroke-linecap="round"/><rect x="8" y="16" width="8" height="8" rx="1" fill="#d4af37"/><rect x="8" y="34" width="8" height="8" rx="1" fill="#d4af37"/></svg>',
 sata:'<svg viewBox="0 0 96 54"><rect x="12" y="6" width="72" height="42" rx="3" fill="#2e3136"/><rect x="22" y="16" width="52" height="22" rx="3" fill="#e9eaec"/><rect x="6" y="14" width="6" height="8" fill="#111"/><rect x="6" y="26" width="6" height="14" fill="#111"/></svg>'
};
let cpuThumb="", ramThumb="";
function drawThumbs(){
  const lid=ihsTopMat.map.image, sub=subTopMat.map.image;
  cpuThumb=makeCanvas(192,108,(g,W,H)=>{ const iso=(s,dy)=>g.setTransform(.62*s,.33*s,-.62*s,.33*s,W/2,H/2+dy);
    g.fillStyle="rgba(0,0,0,.25)"; iso(.11,8); g.fillRect(-512,-512,1024,1024); g.fillStyle="#0f3d22"; iso(.11,4); g.fillRect(-512,-512,1024,1024);
    iso(.11,0); g.drawImage(sub,-512,-512,1024,1024); g.fillStyle="#7f868d"; iso(.094,-4); g.fillRect(-512,-512,1024,1024); iso(.094,-9); g.drawImage(lid,-512,-512,1024,1024);
    g.fillStyle="#ffc400"; iso(.11,.5); g.beginPath(); g.moveTo(-505,505); g.lineTo(-505,390); g.lineTo(-390,505); g.fill(); }).toDataURL();
  const hs=ramLabelMat.map.image;
  ramThumb=makeCanvas(192,108,(g,W,H)=>{ g.fillStyle="#17563a"; g.fillRect(8,30,176,50); g.drawImage(hs,8,26,176,40); g.fillStyle="#d8b25c"; for(let x=10;x<182;x+=3){ if(Math.abs(x-104)<3) continue; g.fillRect(x,72,2,8); } }).toDataURL();
  updateTray();
}
function updateTray(){
  const el=document.getElementById("tray"), keep=el.scrollTop; el.innerHTML="";
  const free=!S.held&&!S.busy;
  const items=[
    {id:"cpu",label:t("p_cpu"),img:`<img alt="" src="${cpuThumb}">`,on:S.step===ST.takeCpu,fn:takeCPU},
    {id:"ram0",label:t("p_ram")+" #1",img:`<img alt="" src="${ramThumb}">`,on:(S.step===ST.ram1||S.step===ST.ram2),fn:()=>takeRAM(0)},
    {id:"ram1",label:t("p_ram")+" #2",img:`<img alt="" src="${ramThumb}">`,on:(S.step===ST.ram1||S.step===ST.ram2),fn:()=>takeRAM(1)},
    {id:"paste",label:t("p_paste"),img:SVG.paste,on:S.step===ST.paste,fn:takePaste},
    {id:"cooler",label:t("p_cooler"),img:SVG.cooler,on:S.step===ST.cooler,fn:takeCooler},
    {id:"m2",label:t("p_m2"),img:SVG.m2,on:S.step===ST.m2In,fn:takeM2},
    {id:"battery",label:t("p_battery"),img:SVG.battery,on:S.step===ST.battery,fn:takeBattery},
    {id:"psu",label:t("p_psu"),img:SVG.psu,on:S.step===ST.psu,fn:takePSU},
    {id:"screws",label:t("p_screws"),img:SVG.screws,on:S.step===ST.boardScrews,fn:takeScrews},
    {id:"gpu",label:t("p_gpu"),img:SVG.gpu,on:S.step===ST.gpu,fn:takeGPU},
    {id:"sata",label:t("p_sata"),img:SVG.sata,on:S.step===ST.sata,fn:takeSata},
    {id:"wifi",label:t("p_wifi"),img:SVG.wifi,on:S.step===ST.wifi,fn:takeWifi},
    {id:"antennas",label:t("p_antennas"),img:SVG.antennas,on:S.step===ST.antennas,fn:takeAntennas}];
  let want=null;
  items.forEach(it=>{ const used=!!S.used[it.id]; const b=document.createElement("button");
    b.className="part"+(used?" used":"")+(!used&&it.on&&free&&S.glow?" pulse":""); b.innerHTML=it.img+`<span>${it.label}</span>`; b.setAttribute("aria-label",it.label); b.dataset.id=it.id; b.onclick=it.fn; el.appendChild(b); if(!used&&it.on&&!want) want=b; });
  el.scrollTop=keep;                                      // rebuilding the buttons would otherwise jump back to the first row
  if(want&&(want.offsetTop<el.scrollTop||want.offsetTop+want.offsetHeight>el.scrollTop+el.clientHeight)) el.scrollTo({top:want.offsetTop-2,behavior:"smooth"});
}
function renderSteps(){
  const ol=document.getElementById("steps"), exp=renderSteps.exp||(renderSteps.exp=document.querySelector("aside > .explain"));
  const box=document.createElement("li"); box.className="exp"; box.appendChild(exp);   // the explanation sits right under the current step
  ol.innerHTML="";
  for(let i=0;i<STEPS;i++){
    const grp=STEP_GROUPS.find(([at])=>at===i); if(grp){ const g=document.createElement("li"); g.className="group"; g.textContent=t(grp[1]); ol.appendChild(g); }
    const li=document.createElement("li"); li.className=i<S.step?(S.skipped[i]?"skipped":"done"):i===S.step?"current":"todo"; li.innerHTML=`<span>${t("s_"+STEP_IDS[i])}</span>`; ol.appendChild(li);
    if(i<S.step&&!S.skipped[i]){ const m=stepMark(i); if(m) li.classList.add(m); li.title=t("stepStat",{t:fmtTime(stepTime(i)),m:S.stepMis[i]||0}); }
    if(i<S.step&&S.skipped[i]) li.title=t("stepSkipped");
    if(i>S.step&&BUILD_MODE&&clMaySkip(i)){ li.classList.add("jump"); li.title=t("stepJump"); li.onclick=()=>skipTo(i); }   // build mode: click to skip ahead to it
    if(i>=CL_MAX&&i>S.step){ li.classList.add("locked"); li.title=t("cl_locked"); }   // classroom: not open yet
    if(i===S.step){ renderSteps.cur=li; ol.appendChild(box); } }
  if(S.step>=STEPS) renderSteps.cur=null; updateStepMark();
  const fin=S.step>=STEPS; if(fin) ol.appendChild(box);
  document.getElementById("expTitle").textContent=fin?t("doneTitle"):t("s_"+STEP_IDS[S.step]);
  document.getElementById("expText").textContent=fin?t("doneText",{t:fmtTime(S.end-S.start),m:S.mistakes}):t("s_"+STEP_IDS[S.step]+"d");
  if(BUILD_MODE) document.getElementById("fsStep").textContent=fin?t("doneTitle"):(S.step+1)+"/"+STEPS+" · "+t("s_"+STEP_IDS[S.step]);
  if(window.innerWidth>860&&!document.body.classList.contains("fs")) box.scrollIntoView({block:"center"});
  if(S.step!==renderSteps.shown){ renderSteps.shown=S.step;
    if(S.step===ST.leverDown&&!S.fsAsked&&!isFs()&&BUILD_MODE){ S.fsAsked=true; persist(); fsAsk.hidden=false; document.getElementById("faYes").focus({preventScroll:true}); }
    else if(S.card&&!fin&&(window.innerWidth<=860||isFs())) showStepCard(); }
  else if(!stepCard.hidden) showStepCard();   // language change: redraw it
}
// step pop-up: on phones and in full screen the sidebar isn't in sight, so each new step's instructions open in a card
// with an OK button (Settings can turn it off). Tapping the step name in the full-screen bar opens it again.
const stepCard=document.getElementById("stepCard");
function showStepCard(){
  if(!BUILD_MODE||S.step>=STEPS) return;
  document.getElementById("scNum").textContent=t("stepN",{n:S.step+1,m:STEPS});
  document.getElementById("scTitle").textContent=t("s_"+STEP_IDS[S.step]);
  document.getElementById("scText").textContent=t("s_"+STEP_IDS[S.step]+"d");
  const was=stepCard.hidden; stepCard.hidden=false; if(was) document.getElementById("scOk").focus({preventScroll:true}); }
function hideStepCard(){ stepCard.hidden=true; fsAsk.hidden=true; }
document.getElementById("scOk").onclick=hideStepCard;
// once the CPU is placed, offer full screen once per session (S.fsAsked); then the step pop-up shows as usual
const fsAsk=document.getElementById("fsAsk");
function answerFsAsk(yes){ fsAsk.hidden=true; if(yes) setFs(true); if(S.card&&(window.innerWidth<=860||isFs())) showStepCard(); }
document.getElementById("faYes").onclick=()=>answerFsAsk(true);
document.getElementById("faNo").onclick=()=>answerFsAsk(false);
fsAsk.addEventListener("keydown",e=>{ if(e.key==="Escape") answerFsAsk(false); });
stepCard.addEventListener("keydown",e=>{ if(e.key==="Escape") hideStepCard(); });
document.getElementById("fsStep").onclick=()=>{ if(IN.on) inStepCard(); else if(BUILD_MODE) showStepCard(); };
// the current step's circle turns orange after 3 mistakes and red after a minute (checked live from the render loop)
function updateStepMark(){ const li=renderSteps.cur, fs=document.getElementById("fsStep"), m=li&&li.isConnected?stepMark(S.step):"";
  document.getElementById("fsMis").textContent=S.mistakes; if(S.start) document.getElementById("fsTime").textContent=fmtTime((S.end||performance.now())-S.start);
  [li,fs].forEach(el=>{ if(!el) return; el.classList.toggle("warn",m==="warn"); el.classList.toggle("slow",m==="slow"); }); }
function renderModules(){
  const lock='<svg viewBox="0 0 16 16" fill="currentColor"><path d="M4 7V5a4 4 0 1 1 8 0v2h1v8H3V7zm2 0h4V5a2 2 0 1 0-4 0z"/></svg>', play='<svg viewBox="0 0 16 16" fill="currentColor"><path d="M4 2l10 6-10 6z"/></svg>', check='<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 8l3 3 7-7"/></svg>';
  document.getElementById("modules").innerHTML=MODULES.map(([k,from,to])=>{ const done=S.step>=to, act=S.step>=from&&!done;
    return `<li class="${act?"active":""}">${done?check:act?play:lock}${t(k)}</li>`; }).join("");
}
function updateTools(){
  const h=S.held, rot=h==="conn"||(!!h&&HELD[h]&&HELD[h].step>0);
  document.getElementById("rotL").disabled=!rot; document.getElementById("rotR").disabled=!rot;
  document.getElementById("dropBtn").disabled=!h;
  const flips=h==="cpu"||h==="battery";
  document.getElementById("flipBtn").disabled=!flips;
  document.getElementById("flipBtn").style.display=h&&!flips?"none":"";
  if(h!=="cpu") targetMat.opacity=0;
  renderKeyView();
}
let toastTimer=0;
// sticky: stays up with an OK button (long warnings); otherwise it hides after a time that grows with the text
function toast(msg,type,sticky){ const el=document.getElementById("toast"); el.textContent=msg; el.className="toast show"+(type?" "+type:"")+(sticky?" sticky":""); clearTimeout(toastTimer);
  if(sticky){ const b=document.createElement("button"); b.className="primary"; b.textContent=t("ok"); b.onclick=()=>el.classList.remove("show"); el.appendChild(b); return; }
  toastTimer=setTimeout(()=>el.classList.remove("show"),Math.max(type==="err"?5500:3200,msg.length*65)); }
function fmtTime(ms){ const s=Math.max(0,Math.floor(ms/1000)); return Math.floor(s/60)+":"+String(s%60).padStart(2,"0"); }
function applyLang(){
  const root=document.documentElement; root.lang=lang; root.dir=lang==="ar"?"rtl":"ltr";
  document.querySelectorAll("[data-i18n]").forEach(el=>el.textContent=t(el.dataset.i18n));
  document.getElementById("langBtn").textContent=lang==="ar"?"English":"عربي";
  const gb=document.getElementById("glowBtn"); gb.textContent=t(S.glow?"glowOn":"glowOff"); gb.setAttribute("aria-pressed",S.glow); gb.classList.toggle("off",!S.glow);
  document.getElementById("brightLbl").textContent=t("bright");
  renderModeMenu(); if(typeof TS!=="undefined") renderTS(); if(typeof IN!=="undefined"){ renderIN(); renderScreen(); } if(typeof renderQuiz!=="undefined") renderQuiz();
  [["rotL","rotL"],["rotR","rotR"],["flipBtn","flip"],["dropBtn","drop"]].forEach(([id,k])=>{ const b=document.getElementById(id); b.title=t(k); b.setAttribute("aria-label",t(k)); });
  renderModules(); renderSteps(); updateTray(); renderPhotoUI(); renderKeyView(); renderPsuInfo(); if(typeof renderVerAsk==="function") renderVerAsk(); renderHintBtn(); renderFsBtn(); renderSheetBtn();
  if(S.step>=STEPS) document.getElementById("doneText").textContent=t("doneText",{t:fmtTime(S.end-S.start),m:S.mistakes});
}
/* mode menu (header): build, troubleshooting, Windows install. Every mode starts from a fresh page load. */
const modeBtn=document.getElementById("modeBtn"), modePop=document.getElementById("modePop");
function renderModeMenu(){ modeBtn.innerHTML=`<span>${t("mode_"+appMode)}</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>`;
  modePop.querySelectorAll("[data-mode]").forEach(b=>{ b.textContent=t("mode_"+b.dataset.mode); b.setAttribute("aria-current",b.dataset.mode===appMode); }); }
function openModeMenu(open){ modePop.hidden=!open; modeBtn.setAttribute("aria-expanded",open); }
modeBtn.onclick=e=>{ e.stopPropagation(); openModeMenu(modePop.hidden); };
modePop.querySelectorAll("[data-mode]").forEach(b=>b.onclick=()=>{ openModeMenu(false); if(b.dataset.mode===appMode) return; appMode=b.dataset.mode; persist();
  try{ sessionStorage.setItem("pclabList","1"); }catch(e){}                // phones open the new mode on its list (sheetOnStart)
  location.reload(); });
document.addEventListener("click",e=>{ if(!modePop.hidden&&!modePop.contains(e.target)) openModeMenu(false); });
document.addEventListener("keydown",e=>{ if(e.key==="Escape"&&!modePop.hidden){ openModeMenu(false); modeBtn.focus(); } });
document.getElementById("langBtn").onclick=()=>{ lang=lang==="en"?"ar":"en"; persist(); applyLang(); };
document.getElementById("glowBtn").onclick=()=>{ S.glow=!S.glow; persist(); applyLang(); };
const brightIn=document.getElementById("bright"); brightIn.value=S.bright; renderer.toneMappingExposure=S.bright;
brightIn.oninput=()=>{ S.bright=+brightIn.value; renderer.toneMappingExposure=S.bright; persist(); };
document.getElementById("resetBtn").onclick=resetAll;
/* full screen: header and sidebar go away so the 3D view fills the screen (a small bar keeps the step, mistakes and time;
   its ☰ button opens the sidebar over the view). Uses the browser's Fullscreen API when there is one (not on iPhone). */
const fsBtn=document.getElementById("fsBtn"), panelBtn=document.getElementById("panelBtn");
const FS_ICON={on:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>',
  off:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/></svg>'};
const isFs=()=>document.body.classList.contains("fs");
function renderFsBtn(){ const on=isFs(); fsBtn.innerHTML=FS_ICON[on?"off":"on"]; fsBtn.title=t(on?"fsOff":"fsOn"); fsBtn.setAttribute("aria-label",fsBtn.title); fsBtn.setAttribute("aria-pressed",on);
  const open=document.body.classList.contains("fs-open"); panelBtn.title=t(open?"fsClose":"fsPanel"); panelBtn.setAttribute("aria-label",panelBtn.title); }
function setFs(on){
  document.body.classList.toggle("fs",on); showFsPanel(false); renderFsBtn();
  const d=document, el=d.documentElement, cur=d.fullscreenElement||d.webkitFullscreenElement;
  try{ if(on&&!cur){ const r=el.requestFullscreen?el.requestFullscreen():el.webkitRequestFullscreen&&el.webkitRequestFullscreen(); if(r&&r.catch) r.catch(()=>{}); }
    else if(!on&&cur){ const r=d.exitFullscreen?d.exitFullscreen():d.webkitExitFullscreen&&d.webkitExitFullscreen(); if(r&&r.catch) r.catch(()=>{}); } }catch(e){}
}
// the ☰ button turns into × while the panel is open, and the panel opens just below the bar so the button stays in sight
const PANEL_ICON={open:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"/></svg>',
  close:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>'};
function showFsPanel(open){ document.body.classList.toggle("fs-open",open); panelBtn.setAttribute("aria-expanded",open);
  panelBtn.innerHTML=PANEL_ICON[open?"close":"open"]; panelBtn.title=t(open?"fsClose":"fsPanel"); panelBtn.setAttribute("aria-label",panelBtn.title);
  document.querySelector("aside").style.top=open?Math.round(document.getElementById("fsBar").getBoundingClientRect().bottom+8)+"px":"";
  if(open&&renderSteps.cur&&BUILD_MODE) renderSteps.cur.scrollIntoView({block:"center"}); }
fsBtn.onclick=()=>setFs(!isFs());
panelBtn.onclick=e=>{ e.stopPropagation(); showFsPanel(!document.body.classList.contains("fs-open")); };
// leaving the browser's full screen (Esc, back gesture) also leaves ours
["fullscreenchange","webkitfullscreenchange"].forEach(ev=>document.addEventListener(ev,()=>{ if(!(document.fullscreenElement||document.webkitFullscreenElement)&&isFs()) setFs(false); }));
window.addEventListener("keydown",e=>{ if(e.key==="Escape"&&isFs()&&!document.fullscreenElement) setFs(false); });
// a tap on the 3D view closes the sidebar overlay
vp.addEventListener("pointerdown",e=>{ if(document.body.classList.contains("fs-open")&&e.target===renderer.domElement) showFsPanel(false); });
/* phones: the sidebar is below the 3D view, and few people find it by scrolling. A handle on its top edge peeks out under
   the view ("Steps and tasks ▲"); once the sidebar is up it stays pinned at the top and takes you back to the view. */
const sheetBtn=document.getElementById("sheetBtn"), workEl=document.querySelector(".work"), asideEl=document.querySelector("aside");
const sheetUp=()=>asideEl.getBoundingClientRect().top<=workEl.getBoundingClientRect().top+40;
function renderSheetBtn(){ const up=sheetUp(); sheetBtn.classList.toggle("up",up); sheetBtn.querySelector("span").textContent=t(up?"sh_close":"sh_open"); sheetBtn.setAttribute("aria-expanded",up); }
function sheetShow(el){ el=el||asideEl;                                  // scroll the sidebar (or a part of it) up under the pinned handle
  const top=workEl.scrollTop+el.getBoundingClientRect().top-workEl.getBoundingClientRect().top-(el===asideEl?0:sheetBtn.offsetHeight+8);
  workEl.scrollTo({top,behavior:"smooth"}); }
sheetBtn.onclick=()=>sheetUp()?workEl.scrollTo({top:0,behavior:"smooth"}):sheetShow();
workEl.addEventListener("scroll",renderSheetBtn,{passive:true});
// after a mode switch, phones start on that mode's list (challenges, cases, steps) instead of the 3D view
function sheetOnStart(){ let f=null; try{ f=sessionStorage.getItem("pclabList"); sessionStorage.removeItem("pclabList"); }catch(e){}
  if(f&&window.innerWidth<=860&&!isFs()) setTimeout(()=>sheetShow(IN.on?document.querySelector("#inPanel .in-ch"):TS.on?document.getElementById("tsPanel"):null),400); }
document.getElementById("againBtn").onclick=()=>{ document.getElementById("done").classList.remove("show"); };
document.getElementById("viewBtn").onclick=()=>focus(IN.on?"inDesk":viewFor(S.step),700);
document.getElementById("topBtn").onclick=()=>topView();
document.getElementById("rotL").onclick=()=>rotate(1);
document.getElementById("rotR").onclick=()=>rotate(-1);
document.getElementById("flipBtn").onclick=flip;
document.getElementById("dropBtn").onclick=drop;
const hintChk=document.getElementById("hintChk"); hintChk.checked=S.hints; hintChk.onchange=e=>{ S.hints=e.target.checked; persist(); };
// Ctrl+H skips the current step (checks e.code so it works on an Arabic keyboard layout too; holding the key doesn't repeat)
window.addEventListener("keydown",e=>{ if(!e.ctrlKey||e.code!=="KeyH") return; e.preventDefault(); if(!e.repeat) skipStep(); });
window.addEventListener("keydown",e=>{ if(e.target.tagName==="INPUT"||e.ctrlKey) return; const k=e.key.toLowerCase(); if(k==="q") rotate(1); else if(k==="e") rotate(-1); else if(k==="f") flip(); else if(e.key===" "&&S.held){ e.preventDefault(); drop(); } });
