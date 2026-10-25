/* ---------------- Windows Setup (install mode, phases 4, 5 and 6) ----------------
   The Windows 11 Setup of 24H2 and later (see wsRender for its pages), then restart (countdown) → oobe (first start:
   "Is this the right country or region?"). Inspired by the real one, not a copy. Drawn by pcRender (pc-boot.js) while
   PC.mode is "setup".
   Two disk layouts (wsSetDisks): "fresh" (a new PC: only Disk 0, the empty M.2; its SATA SSD's power plug is off (install.js), so it isn't listed) and "used"
   (the customer challenge, on purpose: Disk 0 is the SATA SSD with the customer's files, its partition carrying the
   name the student gave it; Disk 1 is the M.2 with the old Windows). Windows doesn't promise the M.2 is Disk 0, so
   the size and the name tell them apart, not the number. Setup also selects the first row by itself.
   The install stick is listed too, as the last disk (Ventoy and VTOYEFI): it can't be touched or installed to.
   WS.m2 is the M.2's drive number; Windows always goes there.
   On every page before the disks, the control to click next glows (wsHl) while hints are on.
   The M.2's layout follows the plan the student picks (IN.plan, install.js): 1 Windows only, 2 Windows + files,
   3 Windows + room for Linux (left unallocated: its installer makes its own ext4 partitions) + files. Create Partition
   opens a "Size in MB" row filled with the largest size (as Setup does); the size is checked against the plan before the
   partition is made. The plan's sizes and what was wrong show in the note under the window, not in Setup itself; in the
   challenges a size that doesn't fit the plan is a mistake.
   Next on a Windows partition under 200 GB (WIN_REC) asks first; under 64 GB (WIN_MIN, Windows 11's minimum) Setup refuses.
   New partitions get ids from a counter (WS.pid): ids stay unique after Delete and New again.
   The System and MSR partitions Windows adds get arrows until they've been clicked (their note explains them), but
   Next doesn't wait for that: it counts the diskParts step as seen.
   Partitions after the first are made unformatted (raw): Format here, or the new Windows asks for it when D: is opened.
   Mistakes: Next on the customer's partition; Delete or Format it is the serious one: a 60 s wait (inPenalty).
   A note under the window explains whatever row is selected. */
const M2_GB=931.5, SATA_GB=447.1, WIN_MIN=64, WIN_REC=200, WIN_MAX=400, LINUX_MIN=100;   // GB
const WS={page:"lang", started:false, noKey:false, key:"", ed:-1, license:false, custom:false, msg:null, dlg:null, size:"",
  disks:"used", drives:[], m2:1, sel:"d0p1", parts:[], cleaned:false, seen:{}, installing:false, prog:0, copied:false, left:0, oobeDone:false, region:0, user:"", draft:""};
function wsSetDisks(kind){
  WS.disks=kind;
  WS.pid=0;
  if(kind==="fresh"){ Object.assign(WS,{drives:[M2_GB],m2:0,parts:[],sel:"d0u",cleaned:true}); return; }
  Object.assign(WS,{drives:[SATA_GB,M2_GB],m2:1,sel:"d0p1",cleaned:false,parts:[{id:"d0p1",drive:0,gb:SATA_GB,free:83.4,type:"Primary",data:true},
    {id:"d1a",drive:1,gb:.0977,free:.0664,type:"System",old:true},{id:"d1b",drive:1,gb:.0156,free:.0156,type:"MSR",old:true},
    {id:"d1c",drive:1,gb:930.79,free:810.3,type:"Primary",old:true},{id:"d1d",drive:1,gb:.5947,free:.082,type:"Recovery",old:true}]}); }
wsSetDisks("used");
const WS_EDITIONS=["Home","Home N","Home Single Language","Education","Education N","Pro","Pro N","Pro Education","Pro Education N","Pro for Workstations","Pro N for Workstations"];
const WS_PRO=5, COPY_STAGES=["ws_copy","ws_files","ws_feat","ws_upd","ws_fin"];
const gbFmt=g=>g<1?(g*1024).toFixed(1)+" MB":g.toFixed(1)+" GB";
const driveFree=d=>WS.drives[d]-WS.parts.filter(p=>p.drive===d).reduce((a,p)=>a+p.gb,0);
const m2Parts=()=>WS.parts.filter(p=>p.drive===WS.m2), m2Free=()=>driveFree(WS.m2), m2U=()=>"d"+WS.m2+"u";
const m2Prim=()=>m2Parts().filter(p=>p.type==="Primary"&&!p.old);      // the new Primary partitions: Windows first, then files
const restartS=()=>IN.cfg.trap?30:10;                                   // long enough to pull the stick out in the challenge
// does the M.2 match the plan? (diskFiles is done when it does)
function wsLayoutOk(){ const pr=m2Prim(), free=m2Free(), plan=IN.plan;
  if(!plan||!m2Parts().some(p=>p.type==="System"&&!p.old)) return false;
  if(plan===1) return pr.length===1&&free<1;
  return pr.length===2&&pr[0].gb>=WIN_MIN&&pr[0].gb<=WIN_MAX&&(plan===2?free<1:free>=LINUX_MIN); }
// the rows Setup lists: each drive's partitions, then its unallocated space
function wsRows(){
  const rows=[];
  WS.drives.forEach((gb,d)=>{ const ps=WS.parts.filter(p=>p.drive===d);
    ps.forEach((p,i)=>rows.push({...p,name:`${t("ws_drive",{n:d})} ${t("ws_part",{n:i+1})}${p.data&&IN.label?": "+IN.label:""}`}));
    const free=driveFree(d);
    if(free>.05) rows.push({id:"d"+d+"u",drive:d,gb:free,free,type:"",unalloc:true,name:`${t("ws_drive",{n:d})} ${t("ws_unalloc")}`}); });
  if(IN.stick==="pc"){ const d=WS.drives.length, n=k=>`${t("ws_drive",{n:d})} ${t("ws_part",{n:k})}`;   // the install stick itself, last
    rows.push({id:"us1",drive:d,gb:28.6,free:28.6-ISO_GB,type:"Primary",usb:true,name:n(1)+": Ventoy"},{id:"us2",drive:d,gb:.03125,free:.0195,type:"Primary",usb:true,name:n(2)+": VTOYEFI"}); }
  return rows;
}
const wsRow=id=>wsRows().find(r=>r.id===id);
const typeName=k=>({System:t("ws_tSystem"),MSR:t("ws_tMsr"),Primary:t("ws_tPrimary"),Recovery:t("ws_tRecovery")}[k]||"");
// the control to click next on this page (hints on): it glows (class "hl")
function wsHl(){ if(!S.hints||!S.glow) return ""; const p=WS.page;
  return {lang:"langNext",kb:"kbNext",option:WS.agree?"optNext":"agree",key:"nokey",edition:WS.ed===WS_PRO?"edNext":"ed"+WS_PRO,license:"licYes",ready:"install"}[p]||""; }
// the disk page's toolbar icons (svgI paths, laptop-apps.js)
const WS_TOOL_ICON={refresh:`<path d="M20 12a8 8 0 1 1-2.3-5.7"/><path d="M20 4v5h-5"/>`, load:`<path d="M12 4v10M7 9l5 5 5-5M5 20h14"/>`,
  online:`<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M12 9v6M9 12h6"/>`, delete:`<path d="M6 6l12 12M18 6L6 18"/>`,
  format:`<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 9h8M8 13h8M8 17h5"/>`, new:`<path d="M12 5v14M5 12h14"/>`,
  extend:`<path d="M3 12h18M7 8l-4 4 4 4M17 8l4 4-4 4"/>`};
// the pages before the disk list and where Back goes from each
const WS_BACK={kb:"lang",option:"kb",key:"option",edition:"key",license:"edition",disk:"license",ready:"disk"};
/* Windows 11 Setup as it looks since 24H2: a light window with a big title, Back / Next at the bottom right and
   Microsoft · Support · Legal at the bottom left. Pages: lang → kb → option (Install Windows 11, "I agree everything will be
   deleted…") → key → edition ("Select image") → license (Accept) → disk ("Select location to install Windows 11",
   Create Partition opens a size row above the list, filled with the largest size) → ready → installing → restart. */
function wsRender(){
  const p=WS.page, hl=wsHl(), H=w=>hl===w?" hl":"";
  if(p==="oobe") return wsOobe();
  if(p==="user") return `<div class="pc oobe"><div class="oobe-card"><div class="oobe-art" aria-hidden="true"><i></i><i></i><i></i></div><div class="oobe-main">
    <h2>${t("ob_userH")}</h2><p class="ws-small">${t("ob_userP")}</p><input class="ws-key" id="wsUser" maxlength="20" value="${WS.draft.replace(/"/g,"&quot;")}" placeholder="${t("ob_userPh")}" aria-label="${t("ob_userH")}" autocomplete="off" style="direction:inherit">
    <span style="flex:1"></span><footer><button class="ws-next" data-w="userNext">${t("ws_next")}</button></footer></div></div></div>`;
  if(p==="hi") return `<div class="pc hi"><h2>${t("ob_hi",{n:WS.user})}</h2><div class="pc-spin" aria-hidden="true">${"<i></i>".repeat(5)}</div><p>${t("ob_hiP")}</p></div>`;
  const iso=t("lang_"+(LAP.web.lng||"en")), sel=(k,v)=>`<label class="ws-f"><span>${t(k)}</span><select><option>${v}</option></select></label>`;
  let head="", body="", next=null, nextL="ws_next", extra="";
  if(p==="lang"||p==="again"){ head="ws_langH"; body=sel("ws_langI",iso)+sel("ws_time",iso); next=p==="again"?"againNext":"langNext"; }
  else if(p==="kb"){ head="ws_kbH"; body=sel("ws_kb",lang==="ar"?t("lang_ar"):"US")+`<p><button class="ws-link" data-w="kbAdd">${t("ws_kbAdd")}</button></p>`; next="kbNext"; }
  else if(p==="option"){ head="ws_optH";
    body=`${[["install","ws_optInstall"],["repair","ws_optRepair"]].map(([v,k])=>`<label class="ws-radio"><input type="radio" name="wsOpt" data-w="opt" data-v="${v}"${(WS.opt||"install")===v?" checked":""}> ${t(k)}</label>`).join("")}
      <label class="ws-chk${H("agree")}"><input type="checkbox" id="wsAgree"${WS.agree?" checked":""}> ${t("ws_agree")}</label>`;
    extra=`<button class="ws-link" data-w="prev">${t("ws_prev")}</button>`; next="optNext"; }
  else if(p==="key"){ head="ws_keyH"; body=`<p>${t("ws_keyP")}</p><p class="ws-small">${t("ws_keyEx")}</p>
      <input class="ws-key" id="wsKey" value="${WS.key}" placeholder="XXXXX-XXXXX-XXXXX-XXXXX-XXXXX" aria-label="${t("ws_keyH")}" autocomplete="off">`;
    extra=`<button class="ws-link${H("nokey")}" data-w="nokey">${t("ws_noKey")}</button>`; next="keyNext"; }
  else if(p==="edition"){ head="ws_edH"; body=`<div class="ws-table">${WS_EDITIONS.map((e,i)=>`<button class="ws-tr ed${WS.ed===i?" on":""}${H("ed"+i)}" data-w="ed" data-v="${i}"><span>Windows 11 ${e}</span></button>`).join("")}</div>`; next="edNext"; }
  else if(p==="license"){ head="ws_licH"; body=`<div class="ws-lic">${t("ws_licText").split("\n").map(l=>`<p>${l}</p>`).join("")}</div>`; }
  else if(p==="disk"){ head="ws_diskH"; const rows=wsRows(), s=wsRow(WS.sel), d=WS.dlg&&WS.dlg.kind==="new"?WS.dlg:null;
    const tool=(a,k,ic,off)=>`<button class="ws-tool" data-w="${a}"${off?" disabled":""}>${svgI(WS_TOOL_ICON[ic])}${t(k)}</button>`;
    const offOf=a=>!s||s.usb&&a!=="refresh"||(a==="delete"||a==="format")&&s.unalloc||a==="format"&&(s.type==="System"||s.type==="MSR")||a==="new"&&!s.unalloc||a==="extend"||a==="online";   // EFI and MSR: never formatted by hand
    body=`<div class="ws-tools ws-tools1">${tool("refresh","ws_refresh","refresh",false)}${tool("load","ws_load","load",false)}${tool("online","ws_online","online",true)}</div>
      <div class="ws-tools">${tool("delete","ws_delete","delete",offOf("delete"))}${tool("format","ws_format","format",offOf("format"))}${tool("new","ws_new","new",offOf("new")||!!d)}${tool("extend","ws_extend","extend",true)}</div>
      ${d?`<div class="ws-size"><label for="wsSize">${t("ws_size")}</label><input id="wsSize" inputmode="numeric" value="${WS.size}"><button class="ws-next ghost" data-w="dlgOk">${t("ws_apply")}</button><button class="ws-next ghost" data-w="dlgNo">${t("ws_cancel")}</button></div>`:""}
      <div class="ws-table disk"><div class="ws-th"><span>${t("ws_name")}</span><span>${t("ws_total")}</span><span>${t("ws_free")}</span><span>${t("ws_type")}</span></div>
      ${rows.map(r=>`<button class="ws-tr${WS.sel===r.id?" on":""}${wsPoint(r)?" point":""}" data-w="sel" data-v="${r.id}"><span>${r.usb?OS_ICON.usb:OS_ICON.drive}${r.name}</span><span>${gbFmt(r.gb)}</span><span>${gbFmt(r.free)}</span><span>${r.unalloc?t("ws_unalloc"):typeName(r.type)}</span></button>`).join("")}</div>`;
    next="diskNext"; }
  else if(p==="ready"){ head="ws_readyH"; const r=m2Prim()[0];
    body=`<ul class="ws-ready"><li>${t("ws_readyP",{e:WS_EDITIONS[WS.ed]||"Pro"})}</li><li>${t("ws_readyKeep")}</li>${r?`<li>${t("ws_readyAt",{d:wsRow(r.id).name,g:gbFmt(r.gb)})}</li>`:""}</ul>`; next="install"; nextL="ws_install"; }
  else if(p==="installing"){ head="ws_instH";
    body=`<p class="ws-pct">${t("ws_instPct",{n:Math.floor(WS.prog*100)})}</p><div class="ws-bar"><i style="width:${(WS.prog*100).toFixed(1)}%"></i></div><p class="ws-small">${t("ws_instNote")}</p>${IN.slow?`<p class="ws-small">${t("ws_slow")}</p>`:""}`; }
  else if(p==="restart"){ head="ws_rsH"; body=`<p>${t("ws_rsP",{s:WS.left})}</p><div class="ws-bar"><i style="width:${(100-WS.left/restartS()*100).toFixed(1)}%"></i></div>`; next="restartNow"; nextL="ws_rsNow"; }
  const note=p==="disk"?wsNote():p==="option"?`<p class="ws-note">ⓘ ${inT("in_optNote")}</p>`:p==="again"?`<p class="ws-note bad">⚠ ${t("in_againNote")}</p>`:"";
  const back=WS_BACK[p]?`<button class="ws-next ghost" data-w="back">${t("ws_back")}</button>`:"";
  const btns=p==="license"?`<button class="ws-next ghost" data-w="licNo">${t("ws_licNo")}</button><button class="ws-next${H("licYes")}" data-w="licYes">${t("ws_licYes")}</button>`
    :back+(next?`<button class="ws-next${H(next)}" data-w="${next}">${t(nextL)}</button>`:"");
  return `<div class="pc ws"><div class="ws-win"><header><span>${t("ws_title")}</span><i class="ws-ctl" aria-hidden="true"></i></header>
    <div class="ws-body"><h2>${t(head)}</h2>${body}</div>${WS.msg?`<p class="ws-msg">${t(WS.msg)}</p>`:""}
    <footer><span class="ws-ms"><b class="ws-logo4" aria-hidden="true"><i></i><i></i><i></i><i></i></b>${t("ws_ms")}<u>${t("ws_support")}</u><u>${t("ws_legal")}</u>${extra}</span><span class="ws-btns">${btns}</span></footer>
    ${WS.dlg&&WS.dlg.kind!=="new"?wsDlg():""}</div>${note}</div>`;
}
// first start after the install: the out-of-box screens begin with the region
const OOBE_REGIONS=["dz","sa","eg","ma","ae","us"];
function wsOobe(){
  return `<div class="pc oobe"><div class="oobe-card"><div class="oobe-art" aria-hidden="true"><i></i><i></i><i></i></div><div class="oobe-main">
    <h2>${t("ob_h")}</h2><div class="oobe-list">${OOBE_REGIONS.map((r,i)=>`<button class="${WS.region===i?"on":""}" data-w="region" data-v="${i}">${t("rg_"+r)}</button>`).join("")}</div>
    <footer><button class="ws-next" data-w="oobeYes">${t("ob_yes")}</button></footer></div></div></div>`;
}
// an arrow on the System and MSR partitions Windows added, until each one has been clicked
const wsPoint=r=>S.glow&&S.hints&&!r.old&&(r.type==="System"&&!WS.seen.sys||r.type==="MSR"&&!WS.seen.msr);
// the teaching note under the window: what the selected row is; while the size row is open, what size to type
function wsNote(){
  const d=WS.dlg; if(d&&d.kind==="new") return `<p class="ws-note${d.err?" bad":""}">${d.err?"⚠ "+d.err+"<br>":"ⓘ "}${t("ws_sizeMax",{n:Math.floor(wsNewRoom()*1024)})}${IN.plan?" "+t("ws_sizeHelp"+IN.plan):""}</p>`;
  const r=wsRow(WS.sel); if(!r) return "";
  const pr=m2Prim(), k=r.usb?"in_ex_usb":r.data?"in_ex_data":r.old?"in_ex_old":r.unalloc&&r.drive!==WS.m2?"in_ex_sata":r.unalloc?(IN.plan===3&&pr.length===2?"in_ex_linux":"in_ex_free")
    :r.type==="Primary"?(pr[0]&&r.id===pr[0].id?"in_ex_pri":"in_ex_files"):{System:"in_ex_sys",MSR:"in_ex_msr"}[r.type];
  return `<p class="ws-note">ⓘ ${inT(k,{n:r.drive})}${k==="in_ex_files"&&r.raw?" "+t("in_ex_raw"):""}</p>`; }
function wsDlg(){ const d=WS.dlg;
  const txt={delete:"ws_delWarn",format:"ws_fmtWarn",small:"ws_smallWarn"}[d.kind];
  return `<div class="ws-dlg-bg"><div class="ws-dlg" role="alertdialog"><p>${t(txt,{g:d.kind==="small"?gbFmt(wsRow(d.id).gb):""})}</p>
    <div><button class="ws-next" data-w="dlgOk">${t("ok")}</button><button class="ws-next ghost" data-w="dlgNo">${t("ws_cancel")}</button></div></div></div>`; }
function wsAct(a,v){
  WS.msg=null;
  switch(a){
    case "langNext": WS.page="kb"; break;
    case "kbNext": WS.page="option"; break;
    case "kbAdd": toast(t("in_kbAdd")); return;
    case "opt": WS.opt=v; if(v==="repair") toast(t("in_repairNo")); break;
    case "prev": toast(t("in_prevSetup")); return;
    case "optNext": if((WS.opt||"install")!=="install"){ toast(t("in_repairNo")); return; } if(!WS.agree){ WS.msg="ws_agreeNeed"; break; } WS.started=true; WS.page="key"; break;
    case "nokey": WS.noKey=true; WS.page="edition"; break;
    case "keyNext": if(!WS.key.trim()){ toast(t("in_keyHint")); return; } WS.msg="ws_keyBad"; break;
    case "ed": WS.ed=+v; break;
    case "edNext": if(WS.ed<0){ toast(t("ms_pick")); return; } if(WS.ed!==WS_PRO){ toast(t("in_proOnly")); return; } WS.page="license"; break;
    case "licNo": WS.msg="ws_licNeed"; break;
    case "licYes": WS.license=WS.custom=true; WS.page="disk"; break;   // custom: on the disk page (the setupGo step is done)
    case "back": WS.dlg=null; WS.page=WS_BACK[WS.page]||WS.page; break;
    case "sel": WS.sel=v; { const r=wsRow(v), pr=m2Prim(); if(r&&!r.old&&!r.data&&!r.unalloc&&!r.usb) WS.seen[r.type==="System"?"sys":r.type==="MSR"?"msr":pr[0]&&r.id===pr[0].id?"pri":"files"]=1; } break;
    case "refresh": break;
    case "delete": case "format": WS.dlg={kind:a,id:WS.sel}; break;
    case "new": if(!inGate(m2Prim().length?"diskFiles":"diskWin")) return;   // the first one is the Windows partition if(wsRow(WS.sel).drive!==WS.m2){ toast(t("in_useM2")); return; }
      WS.dlg={kind:"new",id:WS.sel}; WS.size=String(Math.floor(wsNewRoom()*1024)); break;   // filled with the largest size, as Setup does
    case "load": toast(t("in_loadDrv")); return;
    case "dlgNo": WS.dlg=null; break;
    case "dlgOk": wsDlgOk(); return;
    case "diskNext": wsNext(); return;
    case "install": wsInstall(); return;
    case "restartNow": wsRestart(); return;
    case "region": WS.region=+v; break;
    case "oobeYes": WS.oobeDone=true; WS.page="user"; toast(t("in_oobeOk"),"ok"); break;
    case "userNext": wsUserDone(); return;
    case "againNext": toast(t("in_againHint"),"err"); return;
  }
  renderScreen(); inCheck();
}
// room for the next Primary partition: the free space, less System and MSR when Windows still has to add them
const wsNewRoom=()=>m2Free()-(m2Parts().some(p=>p.type==="System")?0:.0977+.0156);
function wsDlgOk(){
  const d=WS.dlg, r=wsRow(d.id);
  if(d.kind==="new"){ if(wsNew(parseFloat(WS.size)/1024)){ WS.dlg=null; inCheck(); } renderScreen(); return; }
  if(d.kind==="small"){ WS.dlg=null; WS.page="ready"; renderScreen(); return; }   // under 200 GB, and the student chose to go on
  WS.dlg=null;
  if(r&&r.data){ renderScreen(); inPenalty(d.kind==="delete"?"in_m_delData":"in_m_fmtData"); return; }   // the customer's files: nothing is really lost here
  if(d.kind==="format"&&r&&r.type==="Primary"&&!r.old){ const p=WS.parts.find(x=>x.id===d.id); if(p.raw){ p.raw=false; toast(t("in_fmtDone"),"ok"); } }
  if(d.kind==="delete"){ if(!inGate("diskClean")){ renderScreen(); return; } WS.parts=WS.parts.filter(p=>p.id!==d.id); WS.sel=wsRows()[0].id;
    if(!WS.parts.some(p=>p.drive===WS.m2&&p.old)) WS.cleaned=true; }
  renderScreen(); inCheck();
}
/* New on Drive 1's free space, gb big (clamped to the room there, as Setup does). Windows adds System (EFI) and MSR in
   front the first time. The size has to fit the plan; if it doesn't, a hint in the dialog says what to type (in the
   challenges it's a mistake) and nothing is made. */
function wsNew(gb,force){
  const room=wsNewRoom(), pr=m2Prim(), plan=IN.plan;
  const say=k=>{ if(WS.dlg) WS.dlg.err=t(k); else toast(t(k),"err"); return false; };
  if(!(gb>0)) return say("in_sizeNum");
  gb=Math.min(gb,room);
  const left=room-gb, hint=k=>{ if(IN.sc!=="main"){ mistake(); shakeRed(); } return say(k); };
  if(force);                                                            // Ctrl+H and a challenge's starting point
  else if(pr.length===0){
    if(plan===1&&left>1) return hint("in_size1");
    if(plan>1&&(gb<WIN_MIN||gb>WIN_MAX)) return hint("in_sizeWin");
  } else if(pr.length===1){
    if(plan===1) return hint("in_planOne");
    if(plan===2&&left>1) return hint("in_size2");
    if(plan===3&&left<LINUX_MIN) return hint("in_size3");
  } else return hint("in_planFull");
  const add=[];
  if(!m2Parts().some(p=>p.type==="System")) add.push({id:"n"+(++WS.pid),drive:WS.m2,gb:.0977,free:.0742,type:"System"},{id:"n"+(++WS.pid),drive:WS.m2,gb:.0156,free:.0156,type:"MSR"});
  const id="p"+(++WS.pid), first=!pr.length; add.push({id,drive:WS.m2,gb,free:gb-.1,type:"Primary",raw:!first});   // Windows formats its own; the others stay raw
  WS.parts=[...WS.parts,...add]; WS.sel=id; if(first) WS.seen.pri=1; else WS.seen.files=1;
  if(add.length>1&&!force) setTimeout(()=>inCard(t("in_note"),t("in_newParts_t"),t("in_newParts"),{cls:"info"}),300);
  return true;
}
function wsNext(){
  const r=wsRow(WS.sel); if(!r) return;
  if(r.usb){ WS.msg="ws_cant"; renderScreen(); return; }                // the install stick itself
  if(r.data){ inMistake("in_m_instData"); return; }
  if(inCur()==="diskParts"){ WS.seen={sys:1,msr:1,pri:1,files:1}; inCheck(); }   // the arrows explained System and MSR; not a must
  if(!inGate("diskInstall")) return;
  const pr=m2Prim();
  if(r.type==="Primary"&&pr[1]&&r.id===pr[1].id){ inCard(t("in_note"),t("in_bigPart_t"),t("in_bigPart",{g:gbFmt(r.gb),w:gbFmt(pr[0].gb)}),{cls:"info",wait:4}); return; }   // the files partition: Windows goes in the first one
  if(r.unalloc||r.type!=="Primary"){ WS.msg="ws_cant"; renderScreen(); return; }
  if(r.gb<WIN_MIN){ WS.msg="ws_tooSmall"; renderScreen(); return; }
  if(r.gb<WIN_REC){ WS.dlg={kind:"small",id:r.id}; renderScreen(); return; }
  WS.page="ready"; renderScreen();                                      // "Ready to install": Install starts the copy
}
function wsInstall(){ WS.installing=true; WS.page="installing"; WS.prog=0; renderScreen(); inCheck(); wsCopy(); }
/* phase 6: Setup copies from the stick (slower when it was kept in a USB 2.0 port), then counts down to a restart.
   Pulling the stick out before the copy ends is a mistake (install.js); leaving it in at the restart starts Setup again. */
// WS.copyN: a blue screen (in-challenges.js) stops this copy; a new one starts after the restart
function wsCopy(){
  const dur=IN.slow?30000:14000, n0=WS.copyN=(WS.copyN||0)+1; let last=0;
  tween(dur,k=>{ if(WS.copyN!==n0) return; WS.prog=k; if(bsodNow(k)) return;
    const n=performance.now(); if(n-last>200){ last=n; if(WS.page==="installing") renderScreen(); } },()=>{ if(WS.copyN!==n0) return; WS.prog=1; wsCopied(); });
}
function wsCopied(){ WS.copied=true; WS.page="restart"; WS.left=restartS(); renderScreen(); inCheck();
  clearInterval(wsCopied.timer);
  wsCopied.timer=setInterval(()=>{ if(WS.page!=="restart"||PC.mode!=="setup") return;
    if(!inCardEl.hidden||!stepCard.hidden||IN.asking||S.busy) return;    // the countdown waits while a card is up, a question is asked or the stick is moving
    WS.left--; renderScreen(); if(WS.left<=0) wsRestart(); },1000); }
function wsRestart(){
  clearInterval(wsCopied.timer); if(WS.page!=="restart") return; WS.page="rebooting";
  const id=++PC.boot; PC.mode="load"; PC.loadMsg=""; renderScreen();
  setTimeout(()=>{ if(PC.boot!==id) return;
    if(IN.stick==="pc"&&IN.cfg.trap){ PC.mode="ventoy"; renderScreen();   // the challenge: the PC found the stick again, and Setup starts over
      setTimeout(()=>{ if(PC.boot!==id) return; PC.mode="setup"; WS.page="again"; renderScreen();
        mistake(); shakeRed(); inCard(t("in_err"),inT("in_m_stickIn_t"),inT("in_m_stickIn")+"\n"+inBootOrder(),{onOk:()=>{ if(SCR.dev) closeScreen(); setTimeout(inLookAtStick,950); }}); },2500); return; }   // inMistake, with the boot order
    // otherwise Setup has put Windows Boot Manager first in the boot order, so the new Windows starts even with the stick in
    pcFirstBoot(); },1600);
}
// Setup started over from the stick, the stick is out now: the case's power button restarts the PC into the new Windows
function pcRestartNew(){ S.busy=true;
  tween(260,k=>{ powerBtn.position.x=CX1+.17-.12*Math.sin(k*Math.PI); },()=>{ S.busy=false; WS.page="rebooting"; openScreen("pc"); pcFirstBoot(); }); }
// the new Windows starts from the M.2 for the first time
function pcFirstBoot(){ const id=++PC.boot; PC.mode="load"; PC.loadMsg="pc_ready"; showScreen(screenOn); renderScreen();
  setTimeout(()=>{ if(PC.boot!==id) return; PC.loadMsg="pc_devices"; renderScreen(); },2200);
  setTimeout(()=>{ if(PC.boot!==id) return; PC.mode="setup"; WS.page="oobe"; renderScreen(); inCheck(); },4400); }
// the account name: "Hi <name>" for 5 s, then the new desktop
function wsUserDone(){
  const n=WS.draft.trim(); if(!n){ toast(t("in_userEmpty")); return; }
  WS.user=n; WS.page="hi"; renderScreen(); inCheck(); const id=++PC.boot;
  setTimeout(()=>{ if(PC.boot!==id) return; PC.mode="oldwin"; Object.assign(OW,{fresh:true,view:"desk",app:false,start:false,loc:"pc",sel:null,renaming:false}); renderScreen(); inCheck(); },5000);
}
scrBody.addEventListener("click",e=>{
  if(SCR.dev!=="pc"||PC.mode!=="setup") return;
  if(e.target.id==="wsAgree"){ WS.agree=e.target.checked; renderScreen(); return; }
  const el=e.target.closest("[data-w]"); if(!el||el.disabled) return;
  startClock(); wsAct(el.dataset.w,el.dataset.v);
});
scrBody.addEventListener("input",e=>{ if(e.target.id==="wsKey") WS.key=e.target.value; else if(e.target.id==="wsSize") WS.size=e.target.value.replace(/[^\d]/g,""); else if(e.target.id==="wsUser") WS.draft=e.target.value; });
scrBody.addEventListener("keydown",e=>{ if(e.key!=="Enter") return; if(e.target.id==="wsSize"){ e.preventDefault(); wsDlgOk(); } else if(e.target.id==="wsUser"){ e.preventDefault(); wsUserDone(); } });
