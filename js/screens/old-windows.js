/* ---------------- the old Windows on the M.2 (install mode, phase 2: check the PC's drives) ----------------
   Before reinstalling, look at what's on the PC. With no stick in, the PC starts the old Windows by itself. In File
   Explorer: C: is the old system (M.2, 931 GB), D: is the SATA SSD (477 GB) full of the customer's files. Renaming D:
   ("My personal files") gives it a name Windows Setup shows later (win-setup.js), so it's easy to leave alone.
   Also shown when nobody presses F11 in phase 3 (lock screen; Start → Restart). Drawn by pcRender (pc-boot.js).
   OW.fresh: the new Windows at the end of phase 6, same desktop with a new wallpaper and the drives from the student's
   plan: C: (Windows), D: the customer's SATA SSD (keeps its name), E: the files partition (plans 2 and 3). */
const OW={view:"lock", seen:false, openedD:false, shut:false, app:false, loc:"pc", sel:null, renaming:false, draft:"", start:false, fresh:false, checked:false};
// the drives This PC shows: sizes in GB
function owDrives(){
  const d={k:"d",size:476.9,free:112.4};
  if(!OW.fresh) return [{k:"c",size:930.8,free:810.3},d];
  const pr=m2Prim(), c=pr[0]?pr[0].gb:931.4;
  return [{k:"c",size:c,free:c-24.6},d,...(pr[1]?[{k:"e",size:pr[1].gb,free:pr[1].gb-.1}]:[])];
}
const owName=k=>k==="d"?(IN.label||t("ow_disk"))+" (D:)":t("ow_disk")+" ("+k.toUpperCase()+":)";
const OW_RECYCLE=`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 7h12l-1.2 13.2a1.5 1.5 0 0 1-1.5 1.3H8.7a1.5 1.5 0 0 1-1.5-1.3z" fill="#cfe3f5" stroke="#6f8aa3"/><path d="M4.5 7h15M9.5 4h5" stroke="#6f8aa3" stroke-width="1.5" stroke-linecap="round"/></svg>`;
function owFiles(loc){
  if(loc==="c") return [["Program Files"],["Users"],["Windows"]].map(([n])=>({n,k:"folder"}));
  if(loc==="e") return [];
  return [{n:t("fl_d1"),k:"folder"},{n:t("ow_docs"),k:"folder"},{n:t("ow_uni"),k:"folder"},{n:t("fl_d2"),k:"folder"},
    {n:t("ow_cv")+".docx",k:"file",s:"48 KB"},{n:t("ow_tax")+".xlsx",k:"file",s:"220 KB"}];
}
function owRender(){
  if(OW.view==="lock") return `<div class="pc lock" data-o="unlock"><b>14:35</b><span>${t("pc_date")}</span><p>${t("pc_oldUser")} · ${t("ow_click")}</p><button class="pc-power" data-k="restart">${PWR_SVG} ${t("pc_restart")}</button></div>`;
  return `<div class="os old${OW.fresh?" fresh":""}">
    <div class="os-desk"><button class="os-ico" data-o="open">${OS_ICON.files}<span>${t("ow_explorer")}</span></button><button class="os-ico" data-o="bin">${OW_RECYCLE}<span>${t("ow_bin")}</span></button></div>
    ${OW.app?owExplorer():""}
    ${OW.start?`<div class="ow-start" role="menu"><p>${OW.fresh?WS.user:t("ow_user")}</p>${OW.fresh?"":`<button data-o="restart">↻ ${t("pc_restart")}</button><button data-o="shutdown">${PWR_SVG} ${t("ow_shutdown")}</button>`}</div>`:""}
    <footer class="os-bar"><div class="os-apps"><button data-o="start" class="${OW.start?"on":""} ow-startbtn" title="${t("ow_startMenu")}" aria-label="${t("ow_startMenu")}"><i></i><i></i><i></i></button>
      <button data-o="open" class="${OW.app?"on":""}" title="${t("ow_explorer")}" aria-label="${t("ow_explorer")}">${OS_ICON.files}</button></div>
      <div class="os-tray"><span>14:36</span></div></footer></div>`;
}
function owExplorer(){
  const loc=OW.loc, drives=owDrives(), side=[["pc",OS_ICON.drive,t("fl_pc")],...drives.map(d=>[d.k,OS_ICON.drive,owName(d.k)])];
  let main;
  if(loc==="pc") main=`<div class="ow-drives">${drives.map(d=>{ const k=d.k, sel=OW.sel===k;
      const name=OW.renaming&&sel?`<span class="ow-ren"><input id="owName" value="${OW.draft.replace(/"/g,"&quot;")}" maxlength="32" aria-label="${t("ow_rename")}"><button class="os-btn pri" data-o="renOk">${t("ok")}</button></span>`:`<b>${owName(k)}</b>`;
      return `<div class="ow-drive${sel?" on":""}" data-o="sel" data-v="${k}">${OS_ICON.drive}<div>${name}<div class="pbar"><i style="width:${((1-d.free/d.size)*100).toFixed(1)}%"></i></div><small>${t("ow_free",{f:gbFmt(d.free),s:gbFmt(d.size)})}</small></div></div>`; }).join("")}</div>`;
  else main=`<div class="fl-head"><span>${t("fl_name")}</span><span>${t("fl_size")}</span></div>`+owFiles(loc).map(x=>`<div class="fl-item">${OS_ICON[x.k]}<span>${x.n}</span><small>${x.s||""}</small></div>`).join("");
  return `<section class="win"><header class="win-bar"><span class="win-ic">${OS_ICON.files}</span><b>${t("ow_explorer")}</b><button data-o="close" class="x" aria-label="${t("os_close")}">×</button></header>
    <div class="win-body"><div class="fl"><div class="fl-tools">${loc==="pc"?`<button class="os-btn" data-o="openSel"${OW.sel?"":" disabled"}>${t("ow_open")}</button><button class="os-btn" data-o="ren"${OW.sel?"":" disabled"}>${t("ow_rename")}</button>`:""}
      <span class="fl-path">${t("fl_pc")}${loc==="pc"?"":" › "+owName(loc)}</span></div>
      <div class="fl-main"><nav class="fl-side">${side.map(s=>`<button data-o="loc" data-v="${s[0]}" class="${loc===s[0]?"on":""}">${s[1]}<span>${s[2]}</span></button>`).join("")}</nav>
      <div class="fl-list">${main}</div></div>${loc==="pc"?`<p class="fl-tip">${t("ow_tip")}</p>`:""}</div></div></section>`;
}
function owAct(a,v){
  if(a!=="start") OW.start=false;
  switch(a){
    case "unlock": OW.view="desk"; OW.seen=true; break;
    case "open": OW.app=true; OW.loc="pc"; OW.sel=null; if(OW.fresh) OW.checked=true; break;
    case "close": OW.app=false; OW.renaming=false; break;
    case "bin": toast(t("ow_binEmpty")); return;
    case "start": OW.start=!OW.start; break;
    case "loc": OW.loc=v; OW.sel=null; OW.renaming=false; if(v==="d") OW.openedD=true; break;
    case "sel": if(OW.renaming) return; OW.sel=v; owSelDom(); return;    // in place: a redraw would flicker and swallow the double-click
    case "openSel": OW.loc=OW.sel; if(OW.sel==="d") OW.openedD=true; OW.sel=null; break;
    case "ren": if(OW.sel==="c"){ toast(t("in_renameC")); return; } if(!inGate("oldRename")) return; OW.renaming=true; OW.draft=IN.label||t("ow_disk"); break;
    case "renOk": owRenameDone(); return;
    case "restart": pcPost(); return;
    case "shutdown": owShutdown(); return;
  }
  renderScreen(); inCheck();
}
// selection drawn without a redraw: the tiles' highlight and the toolbar's Open / Rename
function owSelDom(){
  scrBody.querySelectorAll(".ow-drive").forEach(el=>el.classList.toggle("on",el.dataset.v===OW.sel));
  scrBody.querySelectorAll('[data-o="openSel"],[data-o="ren"]').forEach(b=>{ b.disabled=!OW.sel; }); }
// right-click (or a long press) on a drive: Open / Rename
function owCtx(e,v){
  owCtxClose(); OW.sel=v; owSelDom();
  const os=scrBody.querySelector(".os"), r=os.getBoundingClientRect(), m=document.createElement("div");
  m.className="ow-ctx"; m.setAttribute("role","menu");
  m.innerHTML=`<button data-o="openSel" role="menuitem">${t("ow_open")}</button><button data-o="ren" role="menuitem">${t("ow_rename")}</button>`;
  os.appendChild(m);
  m.style.left=Math.min(e.clientX-r.left,r.width-m.offsetWidth-6)+"px"; m.style.top=Math.min(e.clientY-r.top,r.height-m.offsetHeight-6)+"px"; }
function owCtxClose(){ scrBody.querySelectorAll(".ow-ctx").forEach(m=>m.remove()); }
function owRenameDone(){
  const v=OW.draft.trim();
  if(!v||v===t("ow_disk")){ toast(t("in_labelEmpty")); return; }
  IN.label=v; OW.renaming=false; renderScreen(); inCheck();
}
// Start → Shut down: the PC goes off and the camera comes back out
function owShutdown(now){
  OW.start=false; PC.mode="off"; renderScreen();
  const off=()=>{ pcOff(); OW.view="lock"; OW.app=false; OW.shut=true; if(!now) closeScreen(); inCheck(); };
  if(now) off(); else setTimeout(off,1200);
}
scrBody.addEventListener("click",e=>{
  if(SCR.dev!=="pc"||PC.mode!=="oldwin") return;
  const inCtx=!!e.target.closest(".ow-ctx"); owCtxClose();
  const el=e.target.closest("[data-o]"); if(!el||e.target.closest("[data-k]")) return;
  if(el.tagName==="INPUT"||e.target.tagName==="INPUT") return;
  if(inCtx&&el.dataset.o==="openSel"&&OW.loc!=="pc") return;
  startClock(); owAct(el.dataset.o,el.dataset.v);
});
scrBody.addEventListener("contextmenu",e=>{ if(SCR.dev!=="pc"||PC.mode!=="oldwin") return; const el=e.target.closest(".ow-drive");
  if(!el||OW.renaming) return; e.preventDefault(); owCtx(e,el.dataset.v); });
scrBody.addEventListener("dblclick",e=>{ if(SCR.dev!=="pc"||PC.mode!=="oldwin") return; const el=e.target.closest(".ow-drive"); if(el&&!OW.renaming){ OW.sel=el.dataset.v; owAct("openSel"); } });
scrBody.addEventListener("input",e=>{ if(e.target.id==="owName") OW.draft=e.target.value; });
scrBody.addEventListener("keydown",e=>{ if(e.target.id!=="owName") return; if(e.key==="Enter"){ e.preventDefault(); owRenameDone(); } else if(e.key==="Escape"){ OW.renaming=false; renderScreen(); } });
