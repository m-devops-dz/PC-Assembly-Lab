/* ---------------- the old Windows on the M.2 (install mode, phase 2: check the PC's drives) ----------------
   Before reinstalling, look at what's on the PC. With no stick in, the PC starts the old Windows by itself. In File
   Explorer: C: is the old system (M.2, 931 GB), D: is the SATA SSD (477 GB) full of the customer's files. Renaming D:
   ("My personal files") gives it a name Windows Setup shows later (win-setup.js), so it's easy to leave alone.
   Also shown when nobody presses F11 in phase 3 (lock screen; Start → Restart). Drawn by pcRender (pc-boot.js).
   OW.fresh: the new Windows at the end, same desktop with a new wallpaper and the drives from the student's plan:
   C: (Windows) and the files partition if there is one. On a new PC (WS.disks "fresh") the SATA SSD has no partition, so
   Windows gives it no letter: C: and D: (Data, empty). On the customer's PC, D: stays their drive and the files are E:.
   The files partition comes from Setup unformatted unless it was formatted there (raw, win-setup.js): opening it asks to
   format it first (OW.dlg). The install stick, while it's in the PC, is one more drive after the others (Ventoy, the ISO). */
const OW={view:"lock", seen:false, openedD:false, shut:false, app:false, dm:false, loc:"pc", sel:null, renaming:false, draft:"", start:false, fresh:false, checked:false};   // dm: Disk Management open (disk-mgmt.js)
// the drives This PC shows: sizes in GB (raw: never formatted; usb: the install stick)
function owDrives(){
  const ds=owDisks();
  if(IN.stick==="pc"){ const last=ds.map(d=>d.k).sort().pop(); ds.push({k:String.fromCharCode(last.charCodeAt(0)+1),size:28.6,free:28.6-(STICK.iso?ISO_GB:0)-.03,usb:true}); }
  return ds;
}
function owDisks(){
  if(IN.sc==="split") return dmDrives();                              // the one-partition challenge: what Disk Management made
  const d={k:"d",size:SATA_GB,free:83.4};                            // a 480 GB SSD shows as 447 GB in Windows
  if(!OW.fresh) return [{k:"c",size:930.8,free:810.3},d];
  const pr=m2Prim(), c=pr[0]?pr[0].gb:931.4, used=WS.disks==="used";
  return [{k:"c",size:c,free:c-24.6},...(used?[d]:[]),...(pr[1]?[{k:used?"e":"d",size:pr[1].gb,free:pr[1].gb-.1,raw:pr[1].raw,label:pr[1].label,part:pr[1]}]:[])];
}
const owDrive=k=>owDrives().find(d=>d.k===k);
const owCustomer=k=>k==="d"&&(!OW.fresh||WS.disks==="used");      // D: is the customer's drive (their files, their name for it)
const owName=k=>{ const dp=IN.sc==="split"&&DM.parts.find(p=>p.letter===k.toUpperCase()&&p.kind==="d"); if(dp) return dmName(dp);
  const dr=owDrive(k); if(dr&&dr.usb) return t("ow_usb",{l:k.toUpperCase()});
  return owCustomer(k)?(IN.label||t("ow_disk"))+" (D:)":(dr&&dr.label||t("ow_disk"))+" ("+k.toUpperCase()+":)"; };
const OW_RECYCLE=`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 7h12l-1.2 13.2a1.5 1.5 0 0 1-1.5 1.3H8.7a1.5 1.5 0 0 1-1.5-1.3z" fill="#cfe3f5" stroke="#6f8aa3"/><path d="M4.5 7h15M9.5 4h5" stroke="#6f8aa3" stroke-width="1.5" stroke-linecap="round"/></svg>`;
function owFiles(loc){
  if(loc==="c") return [["Program Files"],["Users"],["Windows"]].map(([n])=>({n,k:"folder"}));
  const dr=owDrive(loc); if(dr&&dr.usb) return STICK.iso?[{n:LAP.iso,k:"iso",s:ISO_GB+" GB"}]:[];
  if(loc!=="c"&&!owCustomer(loc)) return [];                          // a new, empty partition
  return [{n:t("fl_d1"),k:"folder"},{n:t("ow_docs"),k:"folder"},{n:t("ow_uni"),k:"folder"},{n:t("fl_d2"),k:"folder"},
    {n:t("ow_cv")+".docx",k:"file",s:"48 KB"},{n:t("ow_tax")+".xlsx",k:"file",s:"220 KB"}];
}
// the "Shut down the PC" step: Shut down is the only way out (a restart would only start this Windows again)
const owOffOnly=()=>inCur()==="oldShutdown";
function owRender(){
  if(OW.view==="lock") return `<div class="pc lock" data-o="unlock"><b>14:35</b><span>${t("pc_date")}</span><p>${t("pc_oldUser")} · ${t("ow_click")}</p>${owOffOnly()?`<button class="pc-power" data-o="shutdown">${PWR_SVG} ${t("ow_shutdown")}</button>`:`<button class="pc-power" data-k="restart">${PWR_SVG} ${t("pc_restart")}</button>`}</div>`;
  return `<div class="os old${OW.fresh?" fresh":""}">
    <div class="os-desk"><button class="os-ico" data-o="open">${OS_ICON.files}<span>${t("ow_explorer")}</span></button><button class="os-ico" data-o="bin">${OW_RECYCLE}<span>${t("ow_bin")}</span></button></div>
    ${OW.dm?dmWindow():OW.wu?wuWindow():OW.app?owExplorer():""}
    ${OW.start?owStartMenu():""}
    ${OW.net?netFlyout():""}
    ${OW.winx?owWinX():""}
    <footer class="os-bar"><div class="os-apps"><button data-o="start" class="${OW.start?"on":""} ow-startbtn" title="${t("ow_startMenu")}" aria-label="${t("ow_startMenu")}">${WIN_LOGO}</button>
      <button data-o="open" class="${OW.app&&!OW.dm&&!OW.wu?"on":""}" title="${t("ow_explorer")}" aria-label="${t("ow_explorer")}">${OS_ICON.files}</button>${OW.dm?`<button data-o="dm" class="on" title="${t("dm_title")}" aria-label="${t("dm_title")}">${DM_ICON}</button>`:""}${OW.wu?`<button data-o="set" class="on" title="${t("wu_set")}" aria-label="${t("wu_set")}">${SM_ICON.set}</button>`:""}</div>
      <div class="os-tray">${IN.cfg.wifi&&OW.fresh?netBtn():""}<span>14:36</span></div></footer></div>`;
}
/* Start: a classic two-column menu (programs on the left, places and Shut down on a blue column on the right).
   Settings opens the Settings window (Windows Update is in its list, in-challenges.js). Disk Management isn't here:
   it's in the right-click menu of Start (Win+X, owWinX), as in Windows. What the task doesn't need only says so. */
const WIN_LOGO=`<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#0a74da" d="M3 3h8.5v8.5H3zM12.5 3H21v8.5h-8.5zM3 12.5h8.5V21H3zM12.5 12.5H21V21h-8.5z"/></svg>`;
const SM_ICON={
  calc:`<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="2" width="16" height="20" rx="2" fill="#5a6573"/><rect x="6.5" y="4.5" width="11" height="4" rx=".6" fill="#cfe3d0"/>${[0,1,2].map(r=>[0,1,2].map(c=>`<rect x="${6.5+c*4}" y="${10.5+r*3.6}" width="3" height="2.6" rx=".5" fill="${c===2&&r===2?"#f08a24":"#e9edf2"}"/>`).join("")).join("")}</svg>`,
  paint:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5C6.5 2.5 2.5 6.6 2.5 11.6c0 4.3 3 7.9 7 7.9 1.6 0 1.6-1.6.8-2.6-.9-1.2.1-2.6 1.6-2.6h3c3.6 0 6.6-2 6.6-5.4C21.5 5.6 17.3 2.5 12 2.5z" fill="#f4d9a8"/><circle cx="7.5" cy="10" r="1.7" fill="#e23b3b"/><circle cx="11" cy="6.6" r="1.7" fill="#2a6fdb"/><circle cx="15.6" cy="7.2" r="1.7" fill="#2fb34a"/><circle cx="17.6" cy="11" r="1.7" fill="#f3b61f"/></svg>`,
  note:`<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4.5" y="3" width="15" height="18.5" rx="1.5" fill="#fff" stroke="#2a6fdb" stroke-width="1.4"/><rect x="4.5" y="3" width="15" height="3.5" fill="#2a6fdb"/><path d="M7.5 10h9M7.5 13h9M7.5 16h6" stroke="#7d8896" stroke-width="1.2"/></svg>`,
  set:`<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#5f6875" d="M10.3 2h3.4l.5 2.6 1.6.7 2.2-1.5 2.4 2.4-1.5 2.2.7 1.6 2.4.5v3.4l-2.6.5-.7 1.6 1.5 2.2-2.4 2.4-2.2-1.5-1.6.7-.5 2.6h-3.4l-.5-2.6-1.6-.7-2.2 1.5-2.4-2.4 1.5-2.2-.7-1.6L2 13.7v-3.4l2.6-.5.7-1.6-1.5-2.2 2.4-2.4 2.2 1.5 1.6-.7z"/><circle cx="12" cy="12" r="3.6" fill="#2a6fdb" stroke="#fff" stroke-width="1.6"/></svg>`,
  all:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h3M4 12h3M4 18h3M10 6h10M10 12h10M10 18h10" stroke="#3b434d" stroke-width="2" stroke-linecap="round"/></svg>`,
  find:`<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6" fill="none" stroke="#6b7480" stroke-width="2"/><path d="M15 15l5 5" stroke="#6b7480" stroke-width="2" stroke-linecap="round"/></svg>`};
const owPt=c=>S.glow&&S.hints&&c?" point":"";
const owSetNext=()=>inCur()==="wuCheck"&&!OW.wu;                       // the wifi challenge: Start › Settings › Windows Update
function owStartMenu(){
  const L=(o,ic,k,more,pt)=>`<button data-o="${o}" role="menuitem" class="${(pt||"").trim()}">${ic}<span>${t(k)}</span>${more?"<i>›</i>":""}</button>`;
  const R=(o,k,more,pt)=>`<button data-o="${o}" role="menuitem" class="${(pt||"").trim()}"><span>${t(k)}</span>${more?"<i>›</i>":""}</button>`;
  const user=OW.fresh?WS.user:t("ow_user"), restart=!owOffOnly();
  return `<div class="ow-start" role="menu"><div class="sm-l">
      ${L("open",OS_ICON.files,"ow_explorer")}${L("no",SM_ICON.calc,"sm_calc",1)}${L("no",SM_ICON.paint,"sm_paint",1)}${L("no",SM_ICON.note,"sm_note",1)}${L("set",SM_ICON.set,"wu_set",0,owPt(owSetNext()))}
      <span class="sm-gap"></span>${L("no",SM_ICON.all,"sm_all")}
      <label class="sm-find"><input placeholder="${t("sm_find")}" aria-label="${t("sm_find")}" readonly>${SM_ICON.find}</label></div>
    <div class="sm-r"><b class="sm-user" aria-hidden="true">${(user||"?").trim().charAt(0).toUpperCase()}</b><p>${user}</p>
      ${R("no","sm_docs")}${R("no","sm_pics")}${R("no","sm_music")}<hr>${R("no","sm_recent",1)}${R("open","fl_pc")}<hr>
      ${R("set","wu_set",0,owPt(owSetNext()))}${R("no","sm_cp",1)}${R("no","sm_dev")}${R("no","sm_def")}${R("no","sm_help")}${R("no","sm_run")}
      <span class="sm-gap"></span><div class="sm-pwr"><button data-o="shutdown" class="${owPt(owOffOnly()).trim()}">${t("ow_shutdown")}</button>${restart?`<button data-o="pwrMore" aria-label="${t("pc_restart")}">›</button>`:""}</div>
      ${OW.pwr&&restart?`<div class="sm-sub" role="menu"><button data-o="restart">${t("pc_restart")}</button><button data-o="shutdown">${t("ow_shutdown")}</button></div>`:""}</div></div>`;
}
// right-click Start (Win+X): Windows 11's power-user menu. Disk Management (the split challenge), Settings, File Explorer
// and Desktop work; Shut down or sign out opens the same Restart / Shut down
const WINX=[["no","wx_apps"],["no","wx_mob"],["no","wx_power"],["no","wx_event"],["no","wx_sys"],["no","wx_dev"],["no","wx_net"],["dm","dm_title"],["no","wx_cm"],["no","wx_term"],["no","wx_termA"],0,
  ["no","wx_task"],["set","wu_set"],["open","ow_explorer"],["no","wx_find"],["no","wx_run"],0,["pwrMore","wx_off",1],["desk","wx_desk"]];
function owWinX(){
  const pt=o=>owPt(o==="dm"?inCur()==="dmOpen":o==="set"&&owSetNext());
  return `<div class="ow-winx" role="menu">${WINX.map(r=>r?`<button data-o="${r[0]}" role="menuitem" class="${pt(r[0]).trim()}"><span>${t(r[1])}</span>${r[2]?"<i>›</i>":""}</button>`:"<hr>").join("")}
    ${OW.pwr?`<div class="sm-sub wx-sub" role="menu">${owOffOnly()?"":`<button data-o="restart">${t("pc_restart")}</button>`}<button data-o="shutdown">${t("ow_shutdown")}</button></div>`:""}</div>`;
}
function owExplorer(){
  const drives=owDrives(); if(OW.loc!=="pc"&&!drives.some(d=>d.k===OW.loc)) OW.loc="pc";   // the stick was pulled out
  const loc=OW.loc, ico=d=>d.usb?OS_ICON.usb:OS_ICON.drive, side=[["pc",OS_ICON.drive,t("fl_pc")],...drives.map(d=>[d.k,ico(d),owName(d.k)])];
  let main;
  if(loc==="pc") main=`<div class="ow-drives">${drives.map(d=>{ const k=d.k, sel=OW.sel===k;
      const name=OW.renaming&&sel?`<span class="ow-ren"><input id="owName" value="${OW.draft.replace(/"/g,"&quot;")}" maxlength="32" aria-label="${t("ow_rename")}"><button class="os-btn pri" data-o="renOk">${t("ok")}</button></span>`:`<b>${owName(k)}</b>`;
      const use=d.raw?"":`<div class="pbar"><i style="width:${((1-d.free/d.size)*100).toFixed(1)}%"></i></div><small>${t("ow_free",{f:gbFmt(d.free),s:gbFmt(d.size)})}</small>`;   // raw: Windows can't tell what's free
      return `<div class="ow-drive${sel?" on":""}" data-o="sel" data-v="${k}">${ico(d)}<div>${name}${use}</div></div>`; }).join("")}</div>`;
  else main=`<div class="fl-head"><span>${t("fl_name")}</span><span>${t("fl_size")}</span></div>`+(owFiles(loc).map(x=>`<div class="fl-item">${OS_ICON[x.k]}<span>${x.n}</span><small>${x.s||""}</small></div>`).join("")||`<p class="fl-empty">${t("fl_empty")}</p>`);
  return `<section class="win"><header class="win-bar"><span class="win-ic">${OS_ICON.files}</span><b>${t("ow_explorer")}</b><button data-o="close" class="x" aria-label="${t("os_close")}">×</button></header>
    <div class="win-body"><div class="fl"><div class="fl-tools">${loc==="pc"?`<button class="os-btn" data-o="openSel"${OW.sel?"":" disabled"}>${t("ow_open")}</button><button class="os-btn" data-o="ren"${OW.sel?"":" disabled"}>${t("ow_rename")}</button>`:""}
      <span class="fl-path">${t("fl_pc")}${loc==="pc"?"":" › "+owName(loc)}</span></div>
      <div class="fl-main"><nav class="fl-side">${side.map(s=>`<button data-o="loc" data-v="${s[0]}" class="${loc===s[0]?"on":""}">${s[1]}<span>${s[2]}</span></button>`).join("")}</nav>
      <div class="fl-list">${main}</div></div>${loc==="pc"?`<p class="fl-tip">${t("ow_tip")}</p>`:""}</div></div>${OW.dlg?owDlg():""}</section>`;
}
// a drive that was never formatted: Windows asks to format it before it opens, then the Format dialog
function owDlg(){ const d=OW.dlg, n=owName(d.k);
  const wrap=(title,body,btns,cls="")=>`<div class="os-dlg-bg"><div class="os-dlg${cls}" role="dialog"><h3>${title}</h3>${body}${btns?`<div class="os-dlg-btns">${btns}</div>`:""}</div></div>`;
  const btn=(a,k,pri)=>`<button class="os-btn${pri?" pri":""}" data-o="${a}">${t(k)}</button>`;
  if(d.kind==="raw") return wrap(t("ow_rawT"),t("ow_raw",{d:d.k.toUpperCase()+":"}).split("\n").map(p=>`<p>${p}</p>`).join(""),btn("rawFmt","ow_rawFmt",1)+btn("dlgNo","ws_cancel")," warn");
  if(d.kind==="fmt") return wrap(t("fm_title",{d:n}),`<div class="dm-form"><span>${t("fm_cap")}</span><b>${gbFmt(owDrive(d.k).size)}</b>
      <span>${t("dm_fs")}</span><b>NTFS</b><span>${t("dm_alloc")}</span><b>${t("dm_default")}</b>
      <label for="owFmtLbl">${t("dm_label")}</label><input id="owFmtLbl" value="${d.label.replace(/"/g,"&quot;")}" maxlength="32"></div>
    <label class="ws-chk"><input type="checkbox" checked disabled> ${t("dm_quick")}</label>`,btn("fmtStart","fm_start",1)+btn("dlgNo","ws_cancel"));
  return wrap(t("fm_busy"),`<div class="pbar"><i id="owFmtBar" style="width:0%"></i></div>`,"");
}
function owFormat(){ const d=OW.dlg, p=owDrive(d.k).part; OW.dlg={kind:"busy",k:d.k}; renderScreen();
  tween(1600,k=>{ const b=document.getElementById("owFmtBar"); if(b) b.style.width=(k*100).toFixed(1)+"%"; },()=>{
    p.raw=false; p.label=d.label.trim(); OW.dlg=null; OW.loc="pc"; toast(t("ow_rawDone",{d:owName(d.k)}),"ok"); renderScreen(); inCheck(); }); }
function owAct(a,v){
  if(a==="pwrMore"){ OW.pwr=!OW.pwr; renderScreen(); return; }       // Shut down's › : Restart / Shut down, the menu stays open
  if(a!=="start") OW.start=false; OW.winx=OW.pwr=false;
  if(owChAct(a,v)){ renderScreen(); inCheck(); return; }               // network flyout, Windows Update (in-challenges.js)
  OW.net=false;
  switch(a){
    case "unlock": OW.view="desk"; OW.seen=true; break;
    case "open": OW.app=true; OW.dm=OW.wu=false; OW.loc="pc"; OW.sel=null; if(OW.fresh) OW.checked=true; if(DM.made) DM.checked=true; break;
    case "dm": if(IN.sc!=="split"){ toast(t("sm_no")); break; } OW.dm=true; OW.wu=false; DM.opened=true; break;
    case "desk": OW.app=OW.dm=OW.wu=false; break;
    case "no": toast(t("sm_no")); break;
    case "close": OW.app=OW.wu=false; OW.renaming=false; OW.dlg=null; break;
    case "bin": toast(t("ow_binEmpty")); return;
    case "start": OW.start=!OW.start; break;
    case "loc": if(owDrive(v)&&owDrive(v).raw){ OW.dlg={kind:"raw",k:v}; break; } OW.loc=v; OW.sel=null; OW.renaming=false; if(v==="d") OW.openedD=true; break;
    case "sel": if(OW.renaming) return; OW.sel=v; owSelDom(); return;    // in place: a redraw would flicker and swallow the double-click
    case "openSel": if(owDrive(OW.sel)&&owDrive(OW.sel).raw){ OW.dlg={kind:"raw",k:OW.sel}; break; } OW.loc=OW.sel; if(OW.sel==="d") OW.openedD=true; OW.sel=null; break;
    case "rawFmt": OW.dlg={kind:"fmt",k:OW.dlg.k,label:""}; break;
    case "dlgNo": OW.dlg=null; break;
    case "fmtStart": owFormat(); return;
    case "ren": if(OW.sel==="c"){ toast(t("in_renameC")); return; } if(!inGate("oldRename")) return; OW.renaming=true; OW.draft=IN.label||t("ow_disk"); break;
    case "renOk": owRenameDone(); return;
    case "restart": if(OW.fresh){ toast(t("sm_notNow")); break; } pcPost(); return;
    case "shutdown": if(OW.fresh){ toast(t("sm_notNow")); break; } owShutdown(); return;
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
scrBody.addEventListener("contextmenu",e=>{ if(SCR.dev!=="pc"||PC.mode!=="oldwin") return;
  if(e.target.closest(".ow-startbtn")){ e.preventDefault(); OW.start=OW.pwr=false; OW.winx=!OW.winx; renderScreen(); return; }   // right-click Start (Win+X): Disk Management lives here
  const el=e.target.closest(".ow-drive");
  if(!el||OW.renaming) return; e.preventDefault(); owCtx(e,el.dataset.v); });
scrBody.addEventListener("dblclick",e=>{ if(SCR.dev!=="pc"||PC.mode!=="oldwin") return; const el=e.target.closest(".ow-drive"); if(el&&!OW.renaming){ OW.sel=el.dataset.v; owAct("openSel"); } });
scrBody.addEventListener("input",e=>{ if(e.target.id==="owName") OW.draft=e.target.value; else if(e.target.id==="owFmtLbl"&&OW.dlg) OW.dlg.label=e.target.value; });
scrBody.addEventListener("keydown",e=>{ if(e.target.id!=="owName") return; if(e.key==="Enter"){ e.preventDefault(); owRenameDone(); } else if(e.key==="Escape"){ OW.renaming=false; renderScreen(); } });
