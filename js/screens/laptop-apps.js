/* ---------------- the laptop's screen (install mode, phase 1: make the install USB) ----------------
   A small desktop, inspired by Windows but not a copy of it, with three apps:
   Ventoy   pick the device, set the partition style, Install (it wipes the device)
   Browser  a search page, its results (one is an ad) and the official download page
   Files    Downloads and the drives: drag the ISO onto the stick, or Copy / Paste
   One app at a time fills the screen, so it works the same on a phone. The order is free: after every action
   inCheck() (install.js) moves the steps on when the current one is done. Mistakes go through inMistake().
   MBR is allowed: the stick then only boots in Legacy mode, and phase 2 finds that out (pc-boot.js). */
const ISO_GB=5.6;
// what is on the stick: boot style "MBR"/"GPT" (null: never prepared), the install it came from (IN.gen), the ISO
const STICK={boot:null, gen:0, iso:false};
const LAP={app:null, note:null, tray:false, dlg:null, menu:false,
  dev:"D", style:"MBR", tool:"idle", toolP:0,                       // Ventoy: the device list starts on the backup drive, like a real tool would
  web:{page:"home", q:"", rel:true, found:false, ed:"", edOk:false, lng:"", lngOk:false},
  dl:-1, iso:null,                                                  // download: -1 not started, then 0..1
  files:{loc:"dl", sel:null, clip:null}, copy:-1, ejected:false};
/* the car challenge: a stick of audio files formatted NTFS, which the car's screen can't read. The files go to the Desktop
   first (loose, or in a new folder), then the stick is formatted exFAT (right-click the drive → Format…) and they go back.
   SONGS are ids (names: song_<id> in i18n); CAR.stick / CAR.desk / CAR.folders[].files: the ids in each place. */
const SONGS=["s1","s2","s3","s4","s5"];
const songName=id=>t("song_"+id)+".mp3";
const CAR={stick:[...SONGS], desk:[], folders:[], nf:0, fs:"NTFS", label:"MUSIC"};
const carFolder=id=>CAR.folders.find(f=>f.id===id);
const carSaved=()=>SONGS.every(s=>CAR.desk.includes(s)||CAR.folders.some(f=>f.files.includes(s)));   // every file has a copy on the Desktop
const carOn=()=>IN.sc==="car";
const LAP_LANGS=[["ar","Arabic"],["en","English"],["fr","French"],["de","German"],["tr","Turkish"]];
const svgI=(d,extra="")=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"${extra}>${d}</svg>`;
const OS_ICON={
  tool:`<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="5" fill="#2a6fdb"/><rect x="9" y="4.5" width="6" height="4" rx=".6" fill="#cfd8e3"/><rect x="7.5" y="8" width="9" height="11.5" rx="2" fill="#fff"/><path d="M11 11.2v5.2l4-2.6z" fill="#2a6fdb"/></svg>`,
  web:`<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="#1f9d8b"/><path d="M2.5 12h19M12 2c3 3 3 17 0 20M12 2c-3 3-3 17 0 20" fill="none" stroke="#e8fbf6" stroke-width="1.5"/></svg>`,
  files:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 6.5A2.5 2.5 0 0 1 4.5 4h4.2l2 2.2h8.8A2.5 2.5 0 0 1 22 8.7V18a2.5 2.5 0 0 1-2.5 2.5h-15A2.5 2.5 0 0 1 2 18z" fill="#f2b636"/><path d="M2 9.5h20V18a2.5 2.5 0 0 1-2.5 2.5h-15A2.5 2.5 0 0 1 2 18z" fill="#ffd25e"/></svg>`,
  folder:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 6.5A2.5 2.5 0 0 1 4.5 4h4.2l2 2.2h8.8A2.5 2.5 0 0 1 22 8.7V18a2.5 2.5 0 0 1-2.5 2.5h-15A2.5 2.5 0 0 1 2 18z" fill="#f2b636"/><path d="M2 9.5h20V18a2.5 2.5 0 0 1-2.5 2.5h-15A2.5 2.5 0 0 1 2 18z" fill="#ffd25e"/></svg>`,
  dl:svgI(`<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>`),
  drive:`<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2.5" y="7" width="19" height="10" rx="2" fill="#8d96a3"/><rect x="2.5" y="13" width="19" height="4" rx="1.5" fill="#5f6875"/><circle cx="18" cy="15" r="1" fill="#3ecf6e"/></svg>`,
  usb:`<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="7" y="2.5" width="10" height="7" rx="1" fill="#b9c0c9"/><rect x="9" y="4.5" width="2" height="2" fill="#5f6875"/><rect x="13" y="4.5" width="2" height="2" fill="#5f6875"/><rect x="5.5" y="9" width="13" height="12.5" rx="2.5" fill="#d0313a"/></svg>`,
  iso:`<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="#c7d3e3"/><circle cx="12" cy="12" r="10" fill="none" stroke="#7b8ba3" stroke-width="1"/><circle cx="12" cy="12" r="3" fill="#fff" stroke="#7b8ba3"/><path d="M5.5 9a7 7 0 0 1 4-4" stroke="#fff" stroke-width="1.6" fill="none"/></svg>`,
  file:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 2.5h8l4.5 4.5v14.5H6z" fill="#fff" stroke="#9aa5b4"/><path d="M14 2.5V7h4.5" fill="none" stroke="#9aa5b4"/></svg>`,
  eject:svgI(`<path d="M5 15h14L12 6z" fill="currentColor"/><path d="M5 19h14"/>`),
  music:`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 2.5h8l4.5 4.5v14.5H6z" fill="#fff" stroke="#9aa5b4"/><path d="M11 17.5V10l4-1v6.5" fill="none" stroke="#e0612b" stroke-width="1.6"/><circle cx="9.8" cy="17.6" r="1.6" fill="#e0612b"/><circle cx="13.8" cy="15.6" r="1.6" fill="#e0612b"/></svg>`,
  desk:`<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2.5" y="4" width="19" height="13" rx="1.5" fill="#2f7f8f"/><rect x="8" y="18.5" width="8" height="1.6" rx=".8" fill="#5f6875"/></svg>`,
  pc:`<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2.5" y="3.5" width="19" height="13" rx="1.5" fill="#3b78d8"/><rect x="4.5" y="5.5" width="15" height="9" rx=".8" fill="#9cc4ff"/><rect x="9" y="17.5" width="6" height="2" fill="#5f6875"/><rect x="6.5" y="19.5" width="11" height="1.6" rx=".8" fill="#5f6875"/></svg>`
};
// the files on each drive. E: changes: personal files at first, empty once Ventoy is on it, then the ISO
function lapFiles(loc){
  const F=(n,s,k)=>({n,s,k:k||"file"});
  if(carOn()){ const song=id=>({n:id,lb:songName(id),s:(18+SONGS.indexOf(id)*6.5).toFixed(1)+" MB",k:"music"});
    if(loc==="e") return CAR.stick.map(song);
    if(loc==="desk") return [...CAR.folders.map(f=>({n:f.id,lb:f.name,s:"",k:"folder"})),...CAR.desk.map(song)];
    if(carFolder(loc)) return carFolder(loc).files.map(song); }
  if(loc==="dl") return [F("invoice_2026.pdf","0.2 MB"),F("trip_photo.jpg","4.1 MB"),...(LAP.dl>=1?[F(LAP.iso,ISO_GB+" GB","iso")]:[])];
  if(loc==="c") return [F("Program Files","","folder"),F("Users","","folder"),F("Windows","","folder")];
  if(loc==="d") return [F(t("fl_d1"),"","folder"),F(t("fl_d2"),"","folder"),F(t("fl_d3"),"","folder")];
  if(!STICK.boot) return [F("old_slides.pptx","12 MB"),F("song.mp3","6 MB")];
  return STICK.iso?[F(LAP.iso,ISO_GB+" GB","iso")]:[];
}
const stickIn=()=>IN.stick==="laptop"&&!LAP.ejected;
const eName=()=>carOn()?(CAR.label||t("fl_usb"))+" (E:)":t(STICK.boot?"fl_eB":"fl_e");
const isoName=()=>"Win11_25H2_"+(LAP_LANGS.find(l=>l[0]===LAP.web.lng)||LAP_LANGS[1])[1]+"_x64.iso";

/* ---- drawing ---- */
// an MBR stick already failed to boot once: MBR again is blocked, arrows lead to Options → GPT
const lapMbrAgain=()=>IN.mbrFails>0&&LAP.dev==="E"&&LAP.style==="MBR";
// the eject step is easy to miss: arrows on the taskbar's USB icon, then on "Eject" (hints on)
const lapPoint=()=>S.hints&&S.glow&&inCur()==="eject"&&!LAP.ejected&&(STICK.iso||carOn());
function lapRender(){
  if(SCR.dev!=="laptop") return;
  const focusQ=document.activeElement&&document.activeElement.id==="wbQ";
  scrBody.innerHTML=`<div class="os" data-app="${LAP.app||""}">
    <div class="os-desk"><button class="os-ico" data-a="openPc">${OS_ICON.pc}<span>${t("fl_pc")}</span></button>${["files","web","tool"].map(a=>`<button class="os-ico" data-a="open" data-v="${a}">${OS_ICON[a]}<span>${t("app_"+a)}</span></button>`).join("")}</div>
    ${LAP.app?lapWin():""}${LAP.dlg?lapDlg():""}${LAP.note?`<div class="os-note" role="status">${OS_ICON.usb}<div><b>${t(LAP.note[0])}</b><span>${t(LAP.note[1])}</span></div></div>`:""}
    <footer class="os-bar"><div class="os-apps">${["files","web","tool"].map(a=>`<button data-a="open" data-v="${a}" class="${LAP.app===a?"on":""}" title="${t("app_"+a)}" aria-label="${t("app_"+a)}">${OS_ICON[a]}</button>`).join("")}</div>
      <div class="os-tray">${stickIn()?`<button data-a="tray" class="${LAP.tray?"on":""}${lapPoint()&&!LAP.tray?" point":""}" title="${t("os_eject")}" aria-label="${t("os_eject")}">${OS_ICON.usb}</button>`:""}<span>14:32</span></div>
      ${LAP.tray?`<div class="os-trayp"><p>${t("os_eject")}</p><button data-a="eject" data-v="E"${lapPoint()?' class="point"':""}>${OS_ICON.eject}${t("os_ejectE")}</button><button data-a="eject" data-v="D">${OS_ICON.eject}${t("os_ejectD")}</button></div>`:""}</footer>
  </div>`;
  lapProg();
  if(focusQ){ const q=document.getElementById("wbQ"); if(q){ q.focus(); q.setSelectionRange(q.value.length,q.value.length); } }
}
function lapWin(){ const a=LAP.app;
  return `<section class="win"><header class="win-bar"><span class="win-ic">${OS_ICON[a]}</span><b>${t("app_"+a)}</b>
    <button data-a="min" title="${t("os_min")}" aria-label="${t("os_min")}">–</button><button data-a="min" class="x" title="${t("os_close")}" aria-label="${t("os_close")}">×</button></header>
    <div class="win-body">${a==="tool"?lapTool():a==="web"?lapWeb():lapFilesApp()}</div></section>`; }
function lapTool(){
  const busy=LAP.tool==="busy", inDev=LAP.dev==="E"&&stickIn()&&STICK.boot;
  const devs=[["D",t("dv_D")],...(stickIn()?[["E",t("dv_E")]]:[])];
  return `<div class="tl">
    <nav class="tl-menu"><button data-a="menu" aria-expanded="${LAP.menu}"${lapMbrAgain()&&!LAP.menu&&S.glow?' class="point"':""}>${t("tl_opt")} ▾</button><span>${t("tl_lang")}</span>
      ${LAP.menu?`<div class="tl-drop" role="menu"><p>${t("tl_style")}</p>${["MBR","GPT"].map(s=>`<button role="menuitemradio" aria-checked="${LAP.style===s}" data-a="style" data-v="${s}"${s==="GPT"&&lapMbrAgain()&&S.glow?' class="point"':""}><i>${LAP.style===s?"●":""}</i>${t("tl_"+s)}</button>`).join("")}<hr><p class="tl-sb">✓ ${t("tl_secure")}</p></div>`:""}</nav>
    <label class="tl-dev"><span>${t("tl_device")}</span><select data-a="dev"${busy?" disabled":""}>${devs.map(([v,l])=>`<option value="${v}"${LAP.dev===v?" selected":""}>${l}</option>`).join("")}</select></label>
    <div class="tl-ver"><div><small>${t("tl_pkg")}</small><b>1.0.99</b></div><div><small>${t("tl_dev")}</small><b>${inDev?"1.0.99":"—"}</b>${inDev?`<small class="pill">${STICK.boot}</small>`:""}</div></div>
    <p class="tl-style"><span class="pill ${LAP.style==="MBR"?"bad":"ok"}">${t("tl_style")}: ${LAP.style}</span><span class="pill">🔒 ${t("tl_secure")}</span></p>
    <p class="tl-status">${t("tl_status")}: <b data-ptxt="tool"></b></p>
    <div class="pbar"><i data-prog="tool"></i></div>
    <div class="tl-btns"><button class="os-btn pri" data-a="install"${busy?" disabled":""}>${t("tl_install")}</button><button class="os-btn" disabled>${t("tl_update")}</button></div>
  </div>`; }
function lapWeb(){ const w=LAP.web;
  const url={home:"lookup.example",results:"lookup.example/search?q="+encodeURIComponent(w.q||t("wb_sug")),ms:"https://www.microsoft.com/software-download/windows11"}[w.page];
  let page="";
  if(w.page==="home") page=`<div class="wb-home"><p class="wb-logo"><b>look</b>up</p>
      <form class="wb-search" data-f="search"><input id="wbQ" type="search" value="${w.q.replace(/"/g,"&quot;")}" placeholder="${t("wb_ph")}" aria-label="${t("wb_ph")}" autocomplete="off"><button class="os-btn pri" data-a="go">${t("wb_go")}</button></form>
      <button class="wb-sug" data-a="sug">🔍 ${t("wb_sug")}</button></div>`;
  else if(w.page==="results") page=`<div class="wb-res"><form class="wb-search small" data-f="search"><input id="wbQ" type="search" value="${w.q.replace(/"/g,"&quot;")}" aria-label="${t("wb_ph")}" autocomplete="off"><button class="os-btn pri" data-a="go">${t("wb_go")}</button></form>
      ${w.rel?`<p class="wb-count">${t("wb_count")}</p>`+[["ad",1],["ms",0],["fo",0]].map(([k,ad])=>`<button class="wb-r" data-a="res" data-v="${k}">${ad?`<em>${t("wb_ad")}</em>`:""}<small>${t("r_"+k+"_u")}</small><b>${t("r_"+k+"_t")}</b><span>${t("r_"+k+"_d")}</span></button>`).join("")
        :`<p class="wb-count">${t("in_noRes")}</p><button class="wb-sug" data-a="sug">🔍 ${t("wb_sug")}</button>`}</div>`;
  else page=`<div class="ms"><h2>${t("ms_h")}</h2><h3>${t("ms_iso")}</h3><p>${t("ms_isoD")}</p>
      <div class="ms-row"><select data-a="ed" aria-label="${t("ms_sel")}"${w.edOk?" disabled":""}><option value="">${t("ms_sel")}</option><option value="x64"${w.ed==="x64"?" selected":""}>${t("ms_ed1")}</option><option value="arm"${w.ed==="arm"?" selected":""}>${t("ms_ed2")}</option></select>
        <button class="os-btn pri" data-a="edOk"${w.edOk?" disabled":""}>${t("ms_ok")}</button></div>
      ${w.edOk?`<h3>${t("ms_lang")}</h3><div class="ms-row"><select data-a="lng" aria-label="${t("ms_lang")}"${w.lngOk?" disabled":""}><option value="">${t("ms_choose")}</option>${LAP_LANGS.map(([v])=>`<option value="${v}"${w.lng===v?" selected":""}>${t("lang_"+v)}</option>`).join("")}</select>
        <button class="os-btn pri" data-a="lngOk"${w.lngOk?" disabled":""}>${t("ms_ok")}</button></div>`:""}
      ${w.lngOk?`<h3>${t("ms_dlH")}</h3><p><button class="os-btn pri big" data-a="dl64">${OS_ICON.dl}${t("ms_dl64")}</button></p><p class="ms-small">${t("ms_valid")}</p>`:""}</div>`;
  return `<div class="wb"><div class="wb-bar"><button data-a="wback"${w.page==="home"?" disabled":""} aria-label="${t("wb_back")}" title="${t("wb_back")}">${svgI(`<path d="M15 5l-7 7 7 7"/>`)}</button>
      <div class="wb-url">${w.page==="ms"?"🔒 ":""}${url}</div></div>
    <div class="wb-page">${page}</div>
    ${LAP.dl>=0?`<div class="wb-dl">${OS_ICON.iso}<div><b>${LAP.iso}</b><small data-ptxt="dl"></small><div class="pbar"><i data-prog="dl"></i></div>${LAP.dl<1?`<small class="muted">${t("dl_fast")}</small>`:""}</div></div>`:""}</div>`; }
// the drives This PC shows (sizes in GB) and their names
const lapDrives=()=>[{k:"c",name:t("fl_c"),size:476.3,free:212.8},{k:"d",name:t("fl_d"),size:931.5,free:402.1},...(stickIn()?[{k:"e",name:eName(),size:28.6,free:carOn()?28.6-CAR.stick.length*.03:21.4,usb:true}]:[])];
function lapFilesApp(){ const f=LAP.files, car=carOn(), selOn=n=>f.sel==="*"||f.sel===n, fold=car&&carFolder(f.loc);
  const side=[...(car?[["desk",OS_ICON.desk,t("fl_desk")]]:[]),["dl",OS_ICON.dl,t("fl_dl")],["pc",OS_ICON.pc,t("fl_pc")],["c",OS_ICON.drive,t("fl_c")],["d",OS_ICON.drive,t("fl_d")],...(stickIn()?[["e",OS_ICON.usb,eName()]]:[])];
  const locName=fold?t("fl_desk")+" › "+fold.name:{desk:t("fl_desk"),dl:t("fl_dl"),pc:t("fl_pc"),c:t("fl_c"),d:t("fl_d"),e:eName()}[f.loc];
  const drive=k=>["c","d","e"].includes(k);
  let main;
  if(f.loc==="pc") main=`<div class="ow-drives">${lapDrives().map(d=>`<div class="ow-drive${d.k==="e"&&carPointFmt()?" point":""}" data-a="loc" data-v="${d.k}" data-ctx="${d.k}">${d.usb?OS_ICON.usb:OS_ICON.drive}<div><b>${d.name}</b><div class="pbar"><i style="width:${((1-d.free/d.size)*100).toFixed(1)}%"></i></div><small>${t("ow_free",{f:gbFmt(d.free),s:gbFmt(d.size)})}</small></div></div>`).join("")}</div>`;
  else { const list=lapFiles(f.loc);
    main=`<div class="fl-head"><span>${t("fl_name")}</span><span>${t("fl_size")}</span></div>`+(list.length?list.map(x=>{ const folder=x.k==="folder"&&car;
      const name=f.ren===x.n?`<span class="ow-ren"><input id="flRen" value="${(x.lb||x.n).replace(/"/g,"&quot;")}" maxlength="40" aria-label="${t("ow_rename")}"></span>`:`<span>${x.lb||x.n}</span>`;
      return `<button class="fl-item${selOn(x.n)?" on":""}" data-a="sel" data-v="${x.n}"${x.k==="iso"||x.k==="music"?` data-file="${x.n}"`:""}${folder?` data-drop="${x.n}" data-open="${x.n}" data-ctx="${x.n}"`:""}>${OS_ICON[x.k]}${name}<small>${x.s}</small></button>`; }).join(""):`<p class="fl-empty">${t("fl_empty")}</p>`); }
  const files=f.loc!=="pc";
  return `<div class="fl"><div class="fl-tools">${car&&f.loc==="desk"?`<button class="os-btn" data-a="fnew">${t("fl_new")}</button>`:""}${car&&files?`<button class="os-btn" data-a="fall">${t("fl_all")}</button>`:""}<button class="os-btn" data-a="fcopy"${f.sel&&files?"":" disabled"}>${t("fl_copy")}</button><button class="os-btn" data-a="fpaste"${f.clip&&files?"":" disabled"}>${t("fl_paste")}</button>
      <span class="fl-path">${f.loc==="dl"||f.loc==="desk"||f.loc==="pc"||fold?"":t("fl_pc")+" › "}${locName}</span></div>
    <div class="fl-main"><nav class="fl-side">${side.map(s=>`<button data-a="loc" data-v="${s[0]}" data-drop="${s[0]}"${drive(s[0])?` data-ctx="${s[0]}"`:""} class="${f.loc===s[0]||s[0]==="desk"&&fold?"on":""}${s[0]==="e"&&carPointFmt()?" point":""}">${s[1]}<span>${s[2]}</span></button>`).join("")}</nav>
      <div class="fl-list" data-drop="${f.loc}">${main}</div></div>
    <p class="fl-tip">${t(car?"fl_tipCar":"fl_tip")}</p></div>`; }
// in the car challenge the stick's drive glows (right-click it → Format…) once the files are safe on the Desktop
const carPointFmt=()=>S.hints&&S.glow&&inCur()==="carFormat"&&carSaved();
// right-click (or a long press) on a drive or a folder: its menu. The drive's menu has Format… in the car challenge.
function lapCtx(e,k){
  scrBody.querySelectorAll(".ow-ctx").forEach(m=>m.remove());
  const os=scrBody.querySelector(".os"), r=os.getBoundingClientRect(), m=document.createElement("div"), fold=carFolder(k);
  m.className="ow-ctx"; m.setAttribute("role","menu");
  m.innerHTML=`<button data-a="loc" data-v="${k}" role="menuitem">${t("ow_open")}</button>`
    +(fold?`<button data-a="fren" data-v="${k}" role="menuitem">${t("ow_rename")}</button>`:"")
    +(k==="e"&&carOn()?`<button data-a="fmt" role="menuitem"${carPointFmt()?' class="point"':""}>${t("fm_btn")}</button>`:"")
    +(k==="e"&&stickIn()?`<button data-a="eject" data-v="E" role="menuitem">${t("fl_eject")}</button>`:"");
  os.appendChild(m);
  m.style.left=Math.min(e.clientX-r.left,r.width-m.offsetWidth-6)+"px"; m.style.top=Math.min(e.clientY-r.top,r.height-m.offsetHeight-6)+"px";
}
// selection drawn in place: a redraw would swallow the double-click that opens a folder
function lapSelDom(){ const s=LAP.files.sel;
  scrBody.querySelectorAll(".fl-item").forEach(el=>el.classList.toggle("on",s==="*"||el.dataset.v===s));
  const c=scrBody.querySelector('[data-a="fcopy"]'); if(c) c.disabled=!s; }
function lapRenDone(){ const i=document.getElementById("flRen"), fold=carFolder(LAP.files.ren); if(!fold) return;
  const v=i?i.value.trim():""; if(v) fold.name=v; LAP.files.ren=null; lapRender(); }
function lapDlg(){ const d=LAP.dlg;
  if(d.kind==="warn") return `<div class="os-dlg-bg"><div class="os-dlg warn" role="alertdialog" aria-labelledby="dlgT"><h3 id="dlgT">⚠ ${t("tl_warnT")}</h3><p>${t("tl_warn")}</p><p class="dev"><b>${t(LAP.dev==="E"?"dv_E":"dv_D")}</b></p><p>${t("tl_warn2")}</p>
    <div class="os-dlg-btns"><button class="os-btn pri" data-a="wyes">${t("tl_yes")}</button><button class="os-btn" data-a="wno">${t("tl_no")}</button></div></div></div>`;
  if(d.kind==="format") return `<div class="os-dlg-bg"><div class="os-dlg fmt" role="dialog" aria-labelledby="dlgT"><h3 id="dlgT">${t("fm_title",{d:eName()})}</h3>
    <div class="dm-form"><span>${t("fm_cap")}</span><b>28.6 GB</b>
      <label for="fmtFs">${t("dm_fs")}</label><select id="fmtFs" data-a="fmtFs">${[["NTFS","NTFS ("+t("dm_default")+")"],["FAT32","FAT32"],["exFAT","exFAT"]].map(([v,l])=>`<option value="${v}"${d.fs===v?" selected":""}>${l}</option>`).join("")}</select>
      <span>${t("dm_alloc")}</span><b>${t("dm_default")}</b>
      <label for="fmtLabel">${t("dm_label")}</label><input id="fmtLabel" value="${d.label.replace(/"/g,"&quot;")}" maxlength="11"></div>
    <label class="ws-chk"><input type="checkbox" checked disabled> ${t("dm_quick")}</label>
    <div class="os-dlg-btns"><button class="os-btn pri" data-a="fmtStart">${t("fm_start")}</button><button class="os-btn" data-a="dok">${t("os_close")}</button></div></div></div>`;
  if(d.kind==="fmtWarn") return `<div class="os-dlg-bg"><div class="os-dlg warn" role="alertdialog" aria-labelledby="dlgT"><h3 id="dlgT">⚠ ${t("fm_title",{d:eName()})}</h3><p>${t("fm_warn")}</p>
    <div class="os-dlg-btns"><button class="os-btn pri" data-a="fmtOk">${t("ok")}</button><button class="os-btn" data-a="dok">${t("ws_cancel")}</button></div></div></div>`;
  if(d.kind==="busy") return `<div class="os-dlg-bg"><div class="os-dlg" role="dialog" aria-labelledby="dlgT"><h3 id="dlgT">${t(d.title,{n:d.n,d:d.d})}</h3><div class="pbar"><i data-prog="copy"></i></div></div></div>`;
  if(d.kind==="copy") return `<div class="os-dlg-bg"><div class="os-dlg" role="dialog" aria-labelledby="dlgT"><h3 id="dlgT">${t("fl_copying",{d:eName()})}</h3><p class="dev">${LAP.iso}</p><div class="pbar"><i data-prog="copy"></i></div><p class="muted" data-ptxt="copy"></p></div></div>`;
  return `<div class="os-dlg-bg"><div class="os-dlg" role="dialog" aria-labelledby="dlgT"><h3 id="dlgT">${t(d.title)}</h3><p>${t(d.text)}</p><div class="os-dlg-btns"><button class="os-btn pri" data-a="dok">${t("ok")}</button></div></div></div>`; }
// progress bars and their text, updated in place while a tween runs (no full redraw)
function lapProg(){ const v={tool:LAP.toolP,dl:Math.max(0,LAP.dl),copy:Math.max(0,LAP.copy)};
  scrBody.querySelectorAll("[data-prog]").forEach(el=>{ el.style.width=(v[el.dataset.prog]*100).toFixed(1)+"%"; });
  scrBody.querySelectorAll("[data-ptxt]").forEach(el=>{ const k=el.dataset.ptxt;
    el.textContent=k==="tool"?(LAP.tool==="busy"?t("tl_busy",{p:Math.round(LAP.toolP*100)}):t(LAP.tool==="done"&&LAP.dev==="E"&&stickIn()?"tl_done":"tl_ready"))
      :k==="dl"?(LAP.dl>=1?t("dl_done",{b:ISO_GB}):t("dl_prog",{a:(LAP.dl*ISO_GB).toFixed(1),b:ISO_GB}))
      :t("fl_left",{p:Math.round(LAP.copy*100)}); }); }
function lapNote(title,text){ LAP.note=[title,text]; clearTimeout(lapNote.t); lapNote.t=setTimeout(()=>{ LAP.note=null; const n=scrBody.querySelector(".os-note"); if(n) n.remove(); },6000); }   // no redraw: it would close an open menu or field

/* ---- actions ---- */
// Ventoy installing, the ISO downloading, the ISO copying: the window can't be closed or swapped until it's done
const lapBusy=()=>LAP.tool==="busy"&&"tool"||LAP.dl>=0&&LAP.dl<1&&"web"||LAP.copy>=0&&LAP.copy<1&&"files"||LAP.dlg&&LAP.dlg.kind==="busy"&&"files"||"";
function lapAct(a,v){
  const busy=lapBusy();
  if(busy&&(a==="min"||a==="open"&&v!==busy)){ toast(t("in_busyWait"),"err"); return; }
  if(a!=="menu"&&a!=="style") LAP.menu=false;
  if(a!=="tray"&&a!=="eject") LAP.tray=false;
  switch(a){
    case "open": LAP.app=v; break;
    case "openPc": LAP.app="files"; LAP.files.loc="pc"; LAP.files.sel=null; break;
    case "fnew": { const n=++CAR.nf, id="f"+n; CAR.folders.push({id,name:t("fl_newFolder")+(n>1?" ("+n+")":""),files:[]}); LAP.files.ren=id; LAP.files.sel=null;
      lapRender(); const i=document.getElementById("flRen"); if(i){ i.focus(); i.select(); } return; }
    case "fren": LAP.files.loc="desk"; LAP.files.ren=v; lapRender(); { const i=document.getElementById("flRen"); if(i){ i.focus(); i.select(); } } return;
    case "min": LAP.app=null; break;
    case "menu": LAP.menu=!LAP.menu; break;
    case "style": if(LAP.tool!=="busy") LAP.style=v; LAP.menu=false; break;
    case "dev": LAP.dev=v; break;
    case "install": lapInstall(); return;
    case "wyes": lapWipe(); return;
    case "wno": LAP.dlg=null; toast(t("tl_cancel")); break;
    case "dok": LAP.dlg=null; break;
    case "go": lapSearch(); return;
    case "sug": LAP.web.q=t("wb_sug"); lapSearch(); return;
    case "res": lapResult(v); return;
    case "wback": LAP.web.page=LAP.web.page==="ms"?"results":"home"; break;
    case "ed": LAP.web.ed=v; break;
    case "edOk": if(!LAP.web.ed){ toast(t("ms_pick")); return; } if(LAP.web.ed==="arm"){ inMistake("in_m_arm"); return; } LAP.web.edOk=true; break;
    case "lng": LAP.web.lng=v; break;
    case "lngOk": if(!LAP.web.lng){ toast(t("ms_pick")); return; } LAP.web.lngOk=true; break;
    case "dl64": lapDownload(); return;
    case "loc": LAP.files.loc=v; LAP.files.sel=null; break;
    case "sel": LAP.files.sel=v; lapSelDom(); return;
    case "fall": LAP.files.sel="*"; break;
    case "fcopy": if(carOn()){ const names=carSel(); LAP.files.clip={from:LAP.files.loc,names}; toast(t("fl_copiedN",{n:names.length})); break; }
      LAP.files.clip=LAP.files.sel; toast(t("fl_copied",{f:LAP.files.sel})); break;
    case "fpaste": if(carOn()){ carPaste(LAP.files.clip,LAP.files.loc); return; } lapCopy(LAP.files.clip,LAP.files.loc); return;
    case "fmt": LAP.dlg={kind:"format",fs:"NTFS",label:CAR.label||"MUSIC"}; break;
    case "fmtFs": LAP.dlg.fs=v; return;
    case "fmtStart": if(LAP.dlg.fs==="NTFS"){ toast(t("in_carNtfs"),"err"); return; } if(LAP.dlg.fs==="FAT32"){ toast(t("in_carFat"),"err"); return; } LAP.dlg={...LAP.dlg,kind:"fmtWarn"}; break;
    case "fmtOk": carFormat(); return;
    case "tray": LAP.tray=!LAP.tray; break;
    case "eject": lapEject(v); return;
  }
  lapRender(); inCheck();
}
// Install always wipes the device first (also a stick that already has Ventoy on it: the ISO goes too)
function lapInstall(){
  if(LAP.tool==="busy"||!inGate("toolDevice")) return;
  if(lapMbrAgain()){ inCard(t("in_warn"),t("in_mbrAgain_t"),t("in_mbrAgain"),{cls:"info",onOk:lapRender}); return; }
  LAP.dlg={kind:"warn"}; lapRender();
}
// "Yes" in the wipe warning: the backup drive is a big mistake (nothing really happens to it); the stick gets Ventoy
function lapWipe(){
  LAP.dlg=null;
  if(LAP.dev==="D"){ lapRender(); inMistake("in_m_wipeD"); return; }
  LAP.tool="busy"; LAP.toolP=0; lapRender();
  STICK.boot=null; STICK.iso=false;
  tween(4200,k=>{ LAP.toolP=k; lapProg(); },()=>{ LAP.tool="done"; Object.assign(STICK,{boot:LAP.style,gen:IN.gen,iso:false}); LAP.files.sel=null; LAP.dlg={kind:"info",title:"app_tool",text:"tl_ok"}; lapRender(); inCheck(); });
}
function lapSearch(){ const q=(LAP.web.q||t("wb_sug")).toLowerCase();
  LAP.web.q=LAP.web.q||t("wb_sug"); LAP.web.rel=/win|وندوز|ويندوز/.test(q); LAP.web.page="results"; lapRender(); }
function lapResult(k){
  if(k==="ad"){ inMistake("in_m_ad"); return; }
  if(k==="fo"){ toast(t("in_forum")); return; }
  LAP.web.page="ms"; LAP.web.found=true; lapRender(); inCheck();
}
function lapDownload(){
  if(LAP.dl>=0){ toast(t(LAP.dl>=1?"in_haveIso":"in_dlBusy")); return; }
  if(!inGate("isoDownload")) return;
  LAP.iso=isoName(); LAP.dl=0; lapRender();
  tween(7000,k=>{ LAP.dl=Math.min(k,.999); lapProg(); },()=>{ LAP.dl=1; lapRender(); inCheck(); });
}
// copy a file to a drive (Paste, or a drop). Only the ISO matters, and only the stick is right.
function lapCopy(f,dest){
  if(!f) return;
  if(f!==LAP.iso||LAP.dl<1){ toast(t("in_onlyIso")); return; }
  if(dest==="dl"){ toast(t("in_sameFolder")); return; }
  if(dest==="c"){ toast(t("in_cDisk")); return; }
  if(dest==="d"){ inMistake("in_m_copyD"); return; }
  if(STICK.iso){ toast(t("in_haveCopy")); return; }
  if(LAP.copy>=0||!inGate("isoCopy")) return;
  LAP.dlg={kind:"copy"}; LAP.copy=0; lapRender();
  tween(6000,k=>{ LAP.copy=Math.min(k,.999); lapProg(); },()=>{ LAP.copy=-1; STICK.iso=true; LAP.dlg=null; LAP.files.loc="e"; LAP.files.sel=null; LAP.files.clip=null; lapRender(); inCheck(); });
}
// the selection in Files: one song, or all of them (Select all)
const carSel=()=>LAP.files.sel==="*"?lapFiles(LAP.files.loc).map(x=>x.n):LAP.files.sel?[LAP.files.sel]:[];
// a folder in the selection stands for the files in it
const carExpand=names=>names.flatMap(n=>carFolder(n)?carFolder(n).files:[n]).filter(n=>SONGS.includes(n));
// copy songs (Paste, or a drop): from the stick to the Desktop, and back once the stick is exFAT
function carPaste(clip,to){
  if(!clip||!clip.names.length) return;
  if(clip.from===to){ toast(t("in_sameFolder2")); return; }
  const fold=carFolder(to);
  if(to!=="desk"&&to!=="e"&&!fold){ toast(t("in_carWhere")); return; }
  if(to==="e"&&!stickIn()) return;
  const names=to==="desk"?clip.names.filter(n=>SONGS.includes(n)||carFolder(n)&&n!==to):carExpand(clip.names);   // folders don't go into themselves
  if(!names.length){ toast(t("in_carWhere")); return; }
  const dest=to==="e"?CAR.stick:to==="desk"?CAR.desk:fold.files, n=carExpand(names).length;
  LAP.dlg={kind:"busy",title:"fl_copyingN",n,d:to==="e"?eName():fold?fold.name:t("fl_desk")}; LAP.copy=0; lapRender();
  tween(1600,k=>{ LAP.copy=Math.min(k,.999); lapProg(); },()=>{ LAP.copy=-1;
    names.forEach(x=>{ if(carFolder(x)) return; if(!dest.includes(x)) dest.push(x); }); dest.sort((a,b)=>SONGS.indexOf(a)-SONGS.indexOf(b));
    LAP.dlg=null; LAP.files.loc=to; LAP.files.sel=null; lapRender(); inCheck(); });
}
// format the stick: before the songs are safe on the Desktop it's a mistake (and nothing happens)
function carFormat(){ const d=LAP.dlg;
  if(!carSaved()){ LAP.dlg=null; lapRender(); inMistake("in_m_carLost"); return; }
  LAP.dlg={kind:"busy",title:"fm_busy"}; LAP.copy=0; lapRender();
  tween(1500,k=>{ LAP.copy=Math.min(k,.999); lapProg(); },()=>{ LAP.copy=-1; CAR.fs=d.fs; CAR.stick=[]; CAR.label=d.label.trim().toUpperCase();
    LAP.dlg={kind:"info",title:"fm_titleS",text:"fm_done"}; lapRender(); inCheck(); });
}
function lapEject(v){
  LAP.tray=false;
  if(v==="D"){ lapRender(); toast(t("in_ejectD")); return; }
  if(LAP.copy>=0&&LAP.copy<1||lapBusy()){ lapRender(); toast(t("in_ejectBusy"),"err"); return; }
  if(!inGate("eject")){ lapRender(); return; }
  LAP.ejected=true; LAP.dev="D"; LAP.tool="idle"; if(LAP.files.loc==="e") LAP.files.loc="dl";
  lapNote("os_safe","os_safeD"); lapRender(); toast(t("in_pullNow"),"ok");
  setTimeout(()=>{ if(SCR.dev==="laptop") closeScreen(); },2200);
}

/* ---- input: clicks (data-a), select changes, the search box, and dragging the ISO onto a drive ---- */
let lapNoClick=0;
scrBody.addEventListener("click",e=>{
  if(SCR.dev!=="laptop"||performance.now()<lapNoClick) return;
  scrBody.querySelectorAll(".ow-ctx").forEach(m=>{ if(!m.contains(e.target)) m.remove(); });
  if(e.target.id==="flRen") return;
  const el=e.target.closest("[data-a]");
  if(!el){ if(LAP.menu||LAP.tray){ LAP.menu=LAP.tray=false; lapRender(); } return; }
  if(el.tagName==="SELECT") return;
  e.preventDefault(); startClock(); lapAct(el.dataset.a,el.dataset.v);
});
scrBody.addEventListener("change",e=>{ const el=e.target; if(SCR.dev==="laptop"&&el.tagName==="SELECT"&&el.dataset.a) lapAct(el.dataset.a,el.value); });
scrBody.addEventListener("input",e=>{ if(e.target.id==="wbQ") LAP.web.q=e.target.value; else if(e.target.id==="fmtLabel"&&LAP.dlg) LAP.dlg.label=e.target.value; });
scrBody.addEventListener("submit",e=>{ e.preventDefault(); if(SCR.dev==="laptop") lapAct("go"); });
// right-click a drive (or a folder) for its menu; double-click a folder to open it; Enter names a new folder
scrBody.addEventListener("contextmenu",e=>{ if(SCR.dev!=="laptop") return; const el=e.target.closest("[data-ctx]"); if(!el) return; e.preventDefault(); lapCtx(e,el.dataset.ctx); });
scrBody.addEventListener("dblclick",e=>{ if(SCR.dev!=="laptop") return; const el=e.target.closest("[data-open]"); if(el&&!LAP.files.ren) lapAct("loc",el.dataset.open); });
scrBody.addEventListener("keydown",e=>{ if(e.target.id!=="flRen") return; if(e.key==="Enter"){ e.preventDefault(); lapRenDone(); } else if(e.key==="Escape"){ LAP.files.ren=null; lapRender(); } });
scrBody.addEventListener("focusout",e=>{ if(e.target.id==="flRen"&&LAP.files.ren) setTimeout(()=>{ if(LAP.files.ren) lapRenDone(); },0); });
let lapDrag=null;
scrBody.addEventListener("pointerdown",e=>{ const it=e.target.closest("[data-file]"); if(SCR.dev!=="laptop"||!it) return; lapDrag={f:it.dataset.file,x:e.clientX,y:e.clientY,ghost:null,over:null}; });
window.addEventListener("pointermove",e=>{
  const d=lapDrag; if(!d) return;
  if(!d.ghost){ if(Math.hypot(e.clientX-d.x,e.clientY-d.y)<8) return;
    d.ghost=document.createElement("div"); d.ghost.className="os-ghost"; d.ghost.innerHTML=carOn()?OS_ICON.music+`<span>${LAP.files.sel==="*"?t("fl_copyingN",{n:carExpand(carSel()).length,d:"…"}):songName(d.f)}</span>`:OS_ICON.iso+`<span>${d.f}</span>`; document.body.appendChild(d.ghost); scrBody.classList.add("dragging"); }
  d.ghost.style.transform=`translate(${e.clientX+12}px,${e.clientY+12}px)`;
  const el=document.elementFromPoint(e.clientX,e.clientY), over=el&&el.closest("[data-drop]");
  if(over!==d.over){ if(d.over) d.over.classList.remove("over"); if(over) over.classList.add("over"); d.over=over; }
});
window.addEventListener("pointerup",()=>{
  const d=lapDrag; lapDrag=null; if(!d||!d.ghost) return;
  d.ghost.remove(); scrBody.classList.remove("dragging"); lapNoClick=performance.now()+350;
  if(d.over){ d.over.classList.remove("over");
    if(carOn()){ const names=LAP.files.sel==="*"?carSel():[d.f]; carPaste({from:LAP.files.loc,names},d.over.dataset.drop); return; }
    LAP.files.sel=d.f; lapCopy(d.f,d.over.dataset.drop); }
});
SCREENS.laptop={view:()=>laptopView(), render:lapRender, back:()=>{ LAP.menu=LAP.tray=false; focus("inDesk",900); }};
