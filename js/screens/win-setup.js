/* ---------------- Windows Setup (install mode, phases 4, 5 and 6) ----------------
   Pages: lang → start (Install now) → key (I don't have a product key) → edition → license → type (Custom) → disk →
   installing (copy progress) → restart (countdown) → oobe (first start: "Is this the right country or region?").
   Inspired by the classic Setup, not a copy. Drawn by pcRender (pc-boot.js) while PC.mode is "setup".
   Two disk layouts (wsSetDisks): "fresh" (a new PC: Drive 0 the empty M.2, Drive 1 the empty SATA SSD) and "used"
   (the customer challenge, on purpose: Drive 0 is the SATA SSD with the customer's files, its partition carrying the
   name the student gave it; Drive 1 is the M.2 with the old Windows). Windows doesn't promise the M.2 is Drive 0, so
   the size and the name tell them apart, not the number. Setup also selects the first row by itself.
   WS.m2 is the M.2's drive number; Windows always goes there.
   On every page before the disks, the button to click next glows (wsHl) while hints are on.
   The M.2's layout follows the plan the student picks (IN.plan, install.js): 1 Windows only, 2 Windows + files,
   3 Windows + room for Linux (left unallocated: its installer makes its own ext4 partitions) + files. Sizes are typed in
   New's dialog and checked against the plan (WS_PLAN) before the partition is made.
   Mistakes: Next on the customer's partition; Delete or Format it is the serious one: a 60 s wait (inPenalty).
   A note under the window explains whatever row is selected. */
const M2_GB=931.5, SATA_GB=476.9, WIN_MIN=120, WIN_MAX=400, LINUX_MIN=100;   // GB
const WS={page:"lang", started:false, noKey:false, key:"", ed:-1, license:false, custom:false, msg:null, dlg:null, size:"",
  disks:"used", drives:[], m2:1, sel:"d0p1", parts:[], cleaned:false, seen:{}, installing:false, prog:0, copied:false, left:0, oobeDone:false, region:0, user:"", draft:""};
function wsSetDisks(kind){
  WS.disks=kind;
  if(kind==="fresh"){ Object.assign(WS,{drives:[M2_GB,SATA_GB],m2:0,parts:[],sel:"d0u",cleaned:true}); return; }
  Object.assign(WS,{drives:[SATA_GB,M2_GB],m2:1,sel:"d0p1",cleaned:false,parts:[{id:"d0p1",drive:0,gb:476.9,free:112.4,type:"Primary",data:true},
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
// does Drive 1 match the plan? (diskNew is done when it does)
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
  return rows;
}
const wsRow=id=>wsRows().find(r=>r.id===id);
const typeName=k=>({System:t("ws_tSystem"),MSR:t("ws_tMsr"),Primary:t("ws_tPrimary"),Recovery:t("ws_tRecovery")}[k]||"");
// the control to click next on this page (hints on): it glows
function wsHl(){ if(!S.hints||!S.glow) return ""; const p=WS.page;
  return {lang:"langNext",start:"now",key:"nokey",edition:WS.ed===WS_PRO?"edNext":"ed"+WS_PRO,license:WS.license?"licNext":"lic",type:"custom"}[p]||""; }
function wsRender(){
  const p=WS.page; let body="", next=null, back=!["lang","start","installing","restart"].includes(p);
  if(p==="oobe") return wsOobe();
  if(p==="user") return `<div class="pc oobe"><div class="oobe-card"><div class="oobe-art" aria-hidden="true"><i></i><i></i><i></i></div><div class="oobe-main">
    <h2>${t("ob_userH")}</h2><p class="ws-small">${t("ob_userP")}</p><input class="ws-key" id="wsUser" maxlength="20" value="${WS.draft.replace(/"/g,"&quot;")}" placeholder="${t("ob_userPh")}" aria-label="${t("ob_userH")}" autocomplete="off" style="direction:inherit">
    <span style="flex:1"></span><footer><button class="ws-next" data-w="userNext">${t("ws_next")}</button></footer></div></div></div>`;
  if(p==="hi") return `<div class="pc hi"><h2>${t("ob_hi",{n:WS.user})}</h2><div class="pc-spin" aria-hidden="true">${"<i></i>".repeat(5)}</div><p>${t("ob_hiP")}</p></div>`;
  if(p==="lang"||p==="again"){ const iso=t("lang_"+(LAP.web.lng||"en"));
    body=`<div class="ws-logo">${t("ws_brand")}</div>${[["ws_langI",iso],["ws_time",iso],["ws_kb",lang==="ar"?t("lang_ar"):"US"]].map(([k,v])=>`<label class="ws-f"><span>${t(k)}</span><select><option>${v}</option></select></label>`).join("")}
      <p class="ws-small">${t("ws_langNote")}</p>`; next=p==="again"?"againNext":"langNext"; }
  else if(p==="start") body=`<div class="ws-logo big">${t("ws_brand")}</div><p class="ws-c"><button class="ws-now" data-w="now">${t("ws_now")}</button></p><p class="ws-c"><button class="ws-link" data-w="repair">${t("ws_repair")}</button></p>`;
  else if(p==="key"){ body=`<h2>${t("ws_keyH")}</h2><p>${t("ws_keyP")}</p><p class="ws-small">${t("ws_keyEx")}</p>
      <input class="ws-key" id="wsKey" value="${WS.key}" placeholder="XXXXX-XXXXX-XXXXX-XXXXX-XXXXX" aria-label="${t("ws_keyH")}" autocomplete="off">
      <p><button class="ws-link" data-w="nokey">${t("ws_noKey")}</button></p>`; next="keyNext"; }
  else if(p==="edition"){ body=`<h2>${t("ws_edH")}</h2><div class="ws-table"><div class="ws-th"><span>${t("ws_os")}</span><span>${t("ws_arch")}</span><span>${t("ws_date")}</span></div>
      ${WS_EDITIONS.map((e,i)=>`<button class="ws-tr${WS.ed===i?" on":""}" data-w="ed" data-v="${i}"><span>Windows 11 ${e}</span><span>x64</span><span>9/30/2025</span></button>`).join("")}</div>`; next="edNext"; }
  else if(p==="license"){ body=`<h2>${t("ws_licH")}</h2><div class="ws-lic">${t("ws_licText")}</div><label class="ws-chk"><input type="checkbox" id="wsLic"${WS.license?" checked":""}> ${t("ws_licAccept")}</label>`; next="licNext"; }
  else if(p==="type") body=`<h2>${t("ws_typeH")}</h2><button class="ws-opt" data-w="upgrade"><b>${t("ws_up")}</b><span>${t("ws_upD")}</span></button><button class="ws-opt" data-w="custom"><b>${t("ws_custom")}</b><span>${t("ws_customD")}</span></button>`;
  else if(p==="disk"){ const rows=wsRows(), sel=wsRow(WS.sel);
    body=`<h2>${t("ws_diskH")}</h2><div class="ws-table disk"><div class="ws-th"><span>${t("ws_name")}</span><span>${t("ws_total")}</span><span>${t("ws_free")}</span><span>${t("ws_type")}</span></div>
      ${rows.map(r=>`<button class="ws-tr${WS.sel===r.id?" on":""}" data-w="sel" data-v="${r.id}"><span>${OS_ICON.drive}${r.name}</span><span>${gbFmt(r.gb)}</span><span>${gbFmt(r.free)}</span><span>${typeName(r.type)}</span></button>`).join("")}</div>
      <div class="ws-tools">${[["refresh","ws_refresh"],["delete","ws_delete"],["format","ws_format"],["new","ws_new"],["load","ws_load"],["extend","ws_extend"]].map(([a,k])=>{
        const off=!sel||(a==="delete"||a==="format")&&sel.unalloc||a==="format"&&(sel.type==="System"||sel.type==="MSR")||a==="new"&&!sel.unalloc||a==="extend";   // EFI and MSR: never formatted by hand
        return `<button class="ws-link" data-w="${a}"${off?" disabled":""}>${t(k)}</button>`; }).join("")}</div>`; next="diskNext"; }
  else if(p==="installing"){ const k=WS.prog*COPY_STAGES.length, cur=Math.min(COPY_STAGES.length-1,Math.floor(k));
    body=`<h2>${t("ws_instH")}</h2><p>${t("ws_instP")}</p><ul class="ws-steps">${COPY_STAGES.map((s,i)=>`<li class="${i<cur?"done":i===cur?"cur":""}">${i<cur?"✓ ":""}${t(s)}${i===cur?` (${Math.floor((k-cur)*100)}%)`:""}</li>`).join("")}</ul>
      ${IN.slow?`<p class="ws-small">${t("ws_slow")}</p>`:""}<div class="ws-bar"><i style="width:${(WS.prog*100).toFixed(1)}%"></i></div>`; }
  else if(p==="restart") body=`<h2>${t("ws_rsH")}</h2><p>${t("ws_rsP",{s:WS.left})}</p><div class="ws-bar"><i style="width:${(100-WS.left/restartS()*100).toFixed(1)}%"></i></div>`;
  const note=p==="disk"?wsNote():p==="again"?`<p class="ws-note bad">⚠ ${t("in_againNote")}</p>`:"";
  const hl=wsHl();
  return `<div class="pc ws${hl?" hl-"+hl:""}"><div class="ws-win"><header>${back?`<button data-w="back" aria-label="${t("wb_back")}">←</button>`:""}<span>${t("ws_title")}</span></header>
    <div class="ws-body">${body}</div>${WS.msg?`<p class="ws-msg">${t(WS.msg)}</p>`:""}
    ${next?`<footer><button class="ws-next" data-w="${next}">${t("ws_next")}</button></footer>`:p==="restart"?`<footer><button class="ws-next" data-w="restartNow">${t("ws_rsNow")}</button></footer>`:""}
    ${WS.dlg?wsDlg():""}</div>${note}</div>`;
}
// first start after the install: the out-of-box screens begin with the region
const OOBE_REGIONS=["dz","sa","eg","ma","ae","us"];
function wsOobe(){
  return `<div class="pc oobe"><div class="oobe-card"><div class="oobe-art" aria-hidden="true"><i></i><i></i><i></i></div><div class="oobe-main">
    <h2>${t("ob_h")}</h2><div class="oobe-list">${OOBE_REGIONS.map((r,i)=>`<button class="${WS.region===i?"on":""}" data-w="region" data-v="${i}">${t("rg_"+r)}</button>`).join("")}</div>
    <footer><button class="ws-next" data-w="oobeYes">${t("ob_yes")}</button></footer></div></div></div>`;
}
// the teaching note under the window: what the selected row is
function wsNote(){ const r=wsRow(WS.sel); if(!r) return "";
  const pr=m2Prim(), k=r.data?"in_ex_data":r.old?"in_ex_old":r.unalloc&&r.drive!==WS.m2?"in_ex_sata":r.unalloc?(IN.plan===3&&pr.length===2?"in_ex_linux":"in_ex_free")
    :r.type==="Primary"?(pr[0]&&r.id===pr[0].id?"in_ex_pri":"in_ex_files"):{System:"in_ex_sys",MSR:"in_ex_msr"}[r.type];
  return `<p class="ws-note">ⓘ ${inT(k)}</p>`; }
function wsDlg(){ const d=WS.dlg;
  const txt={delete:"ws_delWarn",format:"ws_fmtWarn",new:"ws_newWarn"}[d.kind];
  return `<div class="ws-dlg-bg"><div class="ws-dlg" role="alertdialog"><p>${t(txt)}</p>${d.kind==="new"?`<label class="ws-f"><span>${t("ws_size")}</span><input id="wsSize" inputmode="numeric" value="${WS.size}"></label>${IN.plan?`<p class="ws-small">${t("ws_sizeHelp"+IN.plan)}</p>`:""}`:""}
    <div><button class="ws-next" data-w="dlgOk">${t(d.kind==="new"?"ws_apply":"ok")}</button><button class="ws-next ghost" data-w="dlgNo">${t("ws_cancel")}</button></div></div></div>`; }
function wsAct(a,v){
  WS.msg=null;
  switch(a){
    case "langNext": WS.page="start"; break;
    case "now": WS.started=true; WS.page="key"; break;
    case "repair": toast(t("in_repairNo")); return;
    case "nokey": if(!inGate("setupKey")) return; WS.noKey=true; WS.page="edition"; break;
    case "keyNext": if(!WS.key.trim()){ toast(t("in_keyHint")); return; } WS.msg="ws_keyBad"; break;
    case "ed": WS.ed=+v; break;
    case "edNext": if(WS.ed<0){ toast(t("ms_pick")); return; } if(WS.ed!==WS_PRO){ toast(t("in_proOnly")); return; } WS.page="license"; break;
    case "licNext": if(!WS.license){ WS.msg="ws_licNeed"; break; } WS.page="type"; break;
    case "upgrade": WS.msg="ws_upNo"; break;
    case "custom": if(!inGate("setupCustom")) return; WS.custom=true; WS.page="disk"; break;
    case "back": WS.page={key:"start",edition:"key",license:"edition",type:"license",disk:"type"}[WS.page]||WS.page; break;
    case "sel": WS.sel=v; { const r=wsRow(v), pr=m2Prim(); if(r&&!r.old&&!r.data&&!r.unalloc) WS.seen[r.type==="System"?"sys":r.type==="MSR"?"msr":pr[0]&&r.id===pr[0].id?"pri":"files"]=1; } break;
    case "refresh": break;
    case "delete": case "format": WS.dlg={kind:a,id:WS.sel}; break;
    case "new": if(!inGate("diskNew")) return; if(wsRow(WS.sel).drive!==WS.m2){ toast(t("in_useM2")); return; }
      WS.dlg={kind:"new",id:WS.sel}; WS.size=String(Math.floor(wsSuggest()*1024)); break;
    case "load": toast(t("in_loadDrv")); return;
    case "dlgNo": WS.dlg=null; break;
    case "dlgOk": wsDlgOk(); return;
    case "diskNext": wsNext(); return;
    case "restartNow": wsRestart(); return;
    case "region": WS.region=+v; break;
    case "oobeYes": WS.oobeDone=true; WS.page="user"; toast(t("in_oobeOk"),"ok"); break;
    case "userNext": wsUserDone(); return;
    case "againNext": toast(t("in_againHint"),"err"); return;
  }
  renderScreen(); inCheck();
}
// what New offers (GB): 200 for Windows when the plan has more than one partition, then the rest (plan 3: less 150 for Linux)
function wsSuggest(){ const room=wsNewRoom(), n=m2Prim().length;
  if(IN.plan>1&&n===0) return 200; if(IN.plan===3&&n===1) return Math.max(1,room-150); return room; }
// room for the next Primary partition: the free space, less System and MSR when Windows still has to add them
const wsNewRoom=()=>m2Free()-(m2Parts().some(p=>p.type==="System")?0:.0977+.0156);
function wsDlgOk(){
  const d=WS.dlg, r=wsRow(d.id);
  if(d.kind==="new"){ if(wsNew(parseFloat(WS.size)/1024)){ WS.dlg=null; renderScreen(); inCheck(); } return; }
  WS.dlg=null;
  if(r&&r.data){ renderScreen(); inPenalty(d.kind==="delete"?"in_m_delData":"in_m_fmtData"); return; }   // the customer's files: nothing is really lost here
  if(d.kind==="delete"){ if(!inGate("diskClean")){ renderScreen(); return; } WS.parts=WS.parts.filter(p=>p.id!==d.id); WS.sel=wsRows()[0].id;
    if(!WS.parts.some(p=>p.drive===WS.m2&&p.old)) WS.cleaned=true; }
  renderScreen(); inCheck();
}
/* New on Drive 1's free space, gb big (clamped to the room there, as Setup does). Windows adds System (EFI) and MSR in
   front the first time. The size has to fit the plan; if it doesn't, a hint says what to type and nothing is made. */
function wsNew(gb,force){
  const room=wsNewRoom(), pr=m2Prim(), plan=IN.plan;
  if(!(gb>0)) { toast(t("in_sizeNum")); return false; }
  gb=Math.min(gb,room);
  const left=room-gb, hint=k=>{ toast(t(k),"err"); return false; };
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
  if(!m2Parts().some(p=>p.type==="System")) add.push({id:"n1",drive:WS.m2,gb:.0977,free:.0742,type:"System"},{id:"n2",drive:WS.m2,gb:.0156,free:.0156,type:"MSR"});
  const id="p"+(pr.length+1); add.push({id,drive:WS.m2,gb,free:gb-.1,type:"Primary"});
  WS.parts=[...WS.parts,...add]; WS.sel=id; if(id==="p1") WS.seen.pri=1; else WS.seen.files=1;
  if(add.length>1&&!force) setTimeout(()=>inCard(t("in_note"),t("in_newParts_t"),t("in_newParts"),{cls:"info"}),300);
  return true;
}
function wsNext(){
  const r=wsRow(WS.sel); if(!r) return;
  if(r.data){ inMistake("in_m_instData"); return; }
  if(!inGate("diskInstall")) return;
  const pr=m2Prim();
  if(r.type==="Primary"&&pr[1]&&r.id===pr[1].id){ toast(t("in_filesPart"),"err"); return; }   // the files partition: Windows goes in the first one
  if(r.unalloc||r.type!=="Primary"){ WS.msg="ws_cant"; renderScreen(); return; }
  WS.installing=true; WS.page="installing"; WS.prog=0; renderScreen(); inCheck(); wsCopy();
}
/* phase 6: Setup copies from the stick (slower when it was kept in a USB 2.0 port), then counts down to a restart.
   Pulling the stick out before the copy ends is a mistake (install.js); leaving it in at the restart starts Setup again. */
function wsCopy(){
  const dur=IN.slow?30000:14000; let last=0;
  tween(dur,k=>{ WS.prog=k; const n=performance.now(); if(n-last>200){ last=n; if(WS.page==="installing") renderScreen(); } },()=>{ WS.prog=1; wsCopied(); });
}
function wsCopied(){ WS.copied=true; WS.page="restart"; WS.left=restartS(); renderScreen(); inCheck();
  clearInterval(wsCopied.timer);
  wsCopied.timer=setInterval(()=>{ if(WS.page!=="restart"||PC.mode!=="setup") return;
    if(!inCardEl.hidden) return;                                          // the countdown waits while a card is up
    WS.left--; renderScreen(); if(WS.left<=0) wsRestart(); },1000); }
function wsRestart(){
  clearInterval(wsCopied.timer); if(WS.page!=="restart") return; WS.page="rebooting";
  const id=++PC.boot; PC.mode="load"; PC.loadMsg=""; renderScreen();
  setTimeout(()=>{ if(PC.boot!==id) return;
    if(IN.stick==="pc"&&IN.cfg.trap){ PC.mode="ventoy"; renderScreen();   // the challenge: the PC found the stick again, and Setup starts over
      setTimeout(()=>{ if(PC.boot!==id) return; PC.mode="setup"; WS.page="again"; renderScreen();
        inMistake("in_m_stickIn",()=>{ if(SCR.dev) closeScreen(); setTimeout(inLookAtStick,950); }); },2500); return; }
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
  if(e.target.id==="wsLic"){ WS.license=e.target.checked; renderScreen(); return; }
  const el=e.target.closest("[data-w]"); if(!el||el.disabled) return;
  startClock(); wsAct(el.dataset.w,el.dataset.v);
});
scrBody.addEventListener("input",e=>{ if(e.target.id==="wsKey") WS.key=e.target.value; else if(e.target.id==="wsSize") WS.size=e.target.value.replace(/[^\d]/g,""); else if(e.target.id==="wsUser") WS.draft=e.target.value; });
scrBody.addEventListener("keydown",e=>{ if(e.key!=="Enter") return; if(e.target.id==="wsSize"){ e.preventDefault(); wsDlgOk(); } else if(e.target.id==="wsUser"){ e.preventDefault(); wsUserDone(); } });
