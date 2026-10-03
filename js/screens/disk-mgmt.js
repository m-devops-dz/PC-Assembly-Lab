/* ---------------- Disk Management (install mode, challenge "split": a new PC with one partition) ----------------
   A new PC comes with one big C: (931 GB): Windows and the files together, so reinstalling Windows would take the files
   with it. In the new Windows (old-windows.js with OW.fresh), Start → Disk Management:
   select C: → Shrink Volume (Windows offers up to about half) → select the Unallocated space → New Simple Volume
   (size, letter D:, format NTFS with the label "ملفاتي" / "My files") → see D: in File Explorer.
   The EFI System Partition and the running C: can't be formatted or deleted here (as in Windows); a note under the
   disk says what the selected part is. Drawn into the desktop by owRender when OW.dm is set. */
const DM_GB=931.5, DM_LABELS=["ملفاتي","my files"];
const DM={opened:false, shrunk:false, made:false, checked:false, sel:null, dlg:null, fmt:-1,
  parts:[{id:"efi",gb:.0977,fs:"FAT32",kind:"efi"},{id:"c",gb:931.4,fs:"NTFS",letter:"C",label:"Windows",kind:"c"}]};
const DM_ICON=`<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2.5" y="5" width="19" height="14" rx="2" fill="#5f6875"/><rect x="4.5" y="8" width="6" height="8" rx="1" fill="#7fb0ff"/><rect x="11.5" y="8" width="8" height="8" rx="1" fill="#cfd8e3"/></svg>`;
const dmFree=()=>DM_GB-DM.parts.reduce((a,p)=>a+p.gb,0);
const dmPart=id=>id==="u"?{id:"u",gb:dmFree(),kind:"u"}:DM.parts.find(p=>p.id===id);
// what each part is called, in the volume list and on the disk bar
const dmName=p=>p.kind==="efi"?t("dm_efi"):p.kind==="u"?t("dm_unalloc"):`${p.label||t("ow_disk")} (${p.letter}:)`;
const dmStatus=p=>p.kind==="u"?"":DM.fmt>=0&&p.id==="d"?t("dm_formatting",{p:Math.round(DM.fmt*100)}):t({efi:"dm_stEfi",c:"dm_stC",d:"dm_stD"}[p.kind]);
// which actions the selected part allows
function dmCan(a){ const p=DM.sel&&dmPart(DM.sel); if(!p||DM.fmt>=0) return false;
  return a==="shrink"?p.kind==="c":a==="new"?p.kind==="u":(a==="format"||a==="del")?p.kind==="d":false; }
const DM_ACTS=[["shrink","dm_shrink"],["new","dm_new"],["format","dm_format"],["del","dm_del"]];
function dmWindow(){
  const blocks=[...DM.parts,...(dmFree()>.05?[dmPart("u")]:[])], sel=DM.sel&&dmPart(DM.sel);
  const list=DM.parts.map(p=>`<div class="dm-row${DM.sel===p.id?" on":""}" data-dm="sel" data-v="${p.id}"><span>${p.kind==="efi"?"":dmName(p)}</span><span>${t("dm_simple")}</span><span>${t("dm_basic")}</span><span>${p.fs}</span><span>${dmStatus(p)}</span><span>${gbFmt(p.gb)}</span></div>`).join("");
  return `<section class="win dm"><header class="win-bar"><span class="win-ic">${DM_ICON}</span><b>${t("dm_title")}</b><button data-dm="close" class="x" aria-label="${t("os_close")}">×</button></header>
    <div class="win-body"><div class="dm-wrap">
      <div class="dm-tools">${DM_ACTS.map(([a,k])=>`<button class="os-btn" data-dm="${a}"${dmCan(a)?"":" disabled"}>${t(k)}</button>`).join("")}</div>
      <div class="dm-list"><div class="dm-row dm-head"><span>${t("dm_vol")}</span><span>${t("dm_layout")}</span><span>${t("dm_type")}</span><span>${t("dm_fs")}</span><span>${t("dm_status")}</span><span>${t("dm_cap")}</span></div>${list}</div>
      <div class="dm-disk"><div class="dm-dhead"><b>${t("dm_disk",{n:0})}</b><span>${t("dm_basic")}</span><span>${gbFmt(DM_GB)}</span><span>${t("dm_online")}</span></div>
        <div class="dm-bar">${blocks.map(b=>`<button class="dm-part ${b.kind}${DM.sel===b.id?" on":""}" data-dm="sel" data-v="${b.id}" style="flex:${Math.max(.1,b.gb/DM_GB)} 1 0"><b>${dmName(b)}</b><span>${gbFmt(b.gb)}${b.fs?" "+b.fs:""}</span><small>${b.kind==="u"?t("dm_unalloc"):dmStatus(b)}</small></button>`).join("")}</div></div>
      ${sel?`<p class="ws-note">ⓘ ${t("dm_n_"+sel.kind)}</p>`:`<p class="fl-tip">${t("dm_tip")}</p>`}
    </div></div>${DM.dlg?dmDlg():""}</section>`;
}
function dmDlg(){ const d=DM.dlg, c=dmPart("c");
  const wrap=(title,body,btns)=>`<div class="os-dlg-bg"><div class="os-dlg dm-dlg" role="dialog"><h3>${title}</h3>${body}<div class="os-dlg-btns">${btns}</div></div></div>`;
  const btn=(a,k,pri)=>`<button class="os-btn${pri?" pri":""}" data-dm="${a}">${t(k)}</button>`;
  if(d.kind==="shrink") return wrap(t("dm_shrinkT",{v:"C:"}),`<div class="dm-form">
      <span>${t("dm_before")}</span><b>${Math.floor(c.gb*1024)}</b>
      <span>${t("dm_avail")}</span><b>${Math.floor(dmShrinkMax()*1024)}</b>
      <label for="dmMb">${t("dm_amount")}</label><input id="dmMb" inputmode="numeric" value="${d.mb}">
      <span>${t("dm_after")}</span><b id="dmAfter">${Math.max(0,Math.floor(c.gb*1024-(+d.mb||0)))}</b></div>
      <p class="ws-small">${t("dm_shrinkHelp")}</p>`,btn("shrinkGo","dm_shrinkBtn",1)+btn("cancel","ws_cancel"));
  if(d.kind==="new"){
    const pages={1:`<p>${t("dm_wz1")}</p><div class="dm-form"><span>${t("dm_maxMb")}</span><b>${Math.floor(dmFree()*1024)}</b><label for="dmMb">${t("dm_sizeMb")}</label><input id="dmMb" inputmode="numeric" value="${d.mb}"></div>`,
      2:`<p>${t("dm_wz2")}</p><div class="dm-form"><label for="dmLetter">${t("dm_letter")}</label><select id="dmLetter">${["D","E","F","G"].map(l=>`<option${d.letter===l?" selected":""}>${l}</option>`).join("")}</select></div>`,
      3:`<p>${t("dm_wz3")}</p><div class="dm-form"><label for="dmFs">${t("dm_fs")}</label><select id="dmFs">${["NTFS","exFAT"].map(f=>`<option${d.fs===f?" selected":""}>${f}</option>`).join("")}</select>
        <span>${t("dm_alloc")}</span><b>${t("dm_default")}</b>
        <label for="dmLabel">${t("dm_label")}</label><input id="dmLabel" value="${d.label.replace(/"/g,"&quot;")}" maxlength="32"></div>
        <label class="ws-chk"><input type="checkbox" checked disabled> ${t("dm_quick")}</label>`};
    return wrap(t("dm_wzT")+` · ${d.page}/3`,pages[d.page],(d.page>1?btn("back","wb_back"):"")+(d.page<3?btn("next","ws_next",1):btn("finish","dm_finish",1))+btn("cancel","ws_cancel")); }
  if(d.kind==="format") return wrap(t("dm_fmtT",{v:dmName(dmPart("d"))}),`<div class="dm-form"><label for="dmLabel">${t("dm_label")}</label><input id="dmLabel" value="${d.label.replace(/"/g,"&quot;")}" maxlength="32">
      <label for="dmFs">${t("dm_fs")}</label><select id="dmFs">${["NTFS","exFAT"].map(f=>`<option${d.fs===f?" selected":""}>${f}</option>`).join("")}</select></div>`,btn("fmtGo","ok",1)+btn("cancel","ws_cancel"));
  if(d.kind==="fmtWarn") return wrap("⚠ "+t("dm_fmtT",{v:dmName(dmPart("d"))}),`<p>${t("dm_fmtWarn")}</p>`,btn("fmtOk","ok",1)+btn("cancel","ws_cancel"));
  if(d.kind==="del") return wrap("⚠ "+t("dm_delT"),`<p>${t("dm_delWarn")}</p>`,btn("delOk","tl_yes",1)+btn("cancel","tl_no"));
  return "";
}
// Windows can shrink C: by about half (files it can't move sit in the middle)
const dmShrinkMax=()=>Math.floor(dmPart("c").gb/2);
function dmAct(a,v){
  const d=DM.dlg;
  switch(a){
    case "close": OW.dm=false; DM.dlg=null; break;
    case "sel": DM.sel=v; break;
    case "cancel": DM.dlg=null; break;
    case "shrink": if(!dmCan(a)) return; DM.dlg={kind:"shrink",mb:String(Math.floor(dmShrinkMax()*1024))}; break;
    case "shrinkGo": { const gb=(parseFloat(d.mb)||0)/1024;
      if(gb<20){ toast(t("dm_tooSmall"),"err"); return; }
      if(gb>dmShrinkMax()+.01){ toast(t("dm_tooBig",{m:Math.floor(dmShrinkMax()*1024)}),"err"); return; }
      dmPart("c").gb-=gb; DM.shrunk=true; DM.dlg=null; DM.sel="u"; break; }
    case "new": if(!dmCan(a)||!inGate("dmNew")) return; DM.dlg={kind:"new",page:1,mb:String(Math.floor(dmFree()*1024)),letter:"D",fs:"NTFS",label:t("dm_newVol")}; break;
    case "next": if(d.page===1&&!((parseFloat(d.mb)||0)>=10240)){ toast(t("dm_sizeSmall"),"err"); return; } d.page++; break;
    case "back": d.page--; break;
    case "finish": if(!dmLabelOk(d)) return; dmCreate(d); return;
    case "format": if(!dmCan(a)) return; { const p=dmPart("d"); DM.dlg={kind:"format",label:p.label,fs:p.fs}; } break;
    case "fmtGo": if(!dmLabelOk(d)) return; DM.dlg={...d,kind:"fmtWarn"}; break;
    case "fmtOk": { const p=dmPart("d"); DM.dlg=null; dmFormat(()=>{ p.label=d.label.trim(); p.fs=d.fs; }); } return;
    case "del": if(!dmCan(a)) return; DM.dlg={kind:"del"}; break;
    case "delOk": DM.parts=DM.parts.filter(p=>p.id!=="d"); DM.made=false; DM.dlg=null; DM.sel="u"; break;
  }
  renderScreen(); inCheck();
}
// the files partition: NTFS (an internal drive) and the label from the lesson
function dmLabelOk(d){
  if(d.fs!=="NTFS"){ toast(t("dm_fsHint"),"err"); return false; }
  if(!DM_LABELS.includes(d.label.trim().toLowerCase())){ toast(t("dm_labelHint",{l:t("dm_labelSug")}),"err"); return false; }
  return true; }
function dmCreate(d){
  const gb=Math.min(dmFree(),(parseFloat(d.mb)||0)/1024);
  DM.parts.push({id:"d",gb,fs:d.fs,letter:d.letter,label:"",kind:"d"}); DM.dlg=null; DM.sel="d";
  dmFormat(()=>{ dmPart("d").label=d.label.trim(); DM.made=true; });
}
// "Formatting: n%" on the new volume, then Healthy
function dmFormat(done){ DM.fmt=0; renderScreen();
  tween(1800,k=>{ DM.fmt=k; const s=scrBody.querySelector(".dm-part.d small"); if(s) s.textContent=t("dm_formatting",{p:Math.round(k*100)}); },()=>{ DM.fmt=-1; done(); renderScreen(); inCheck(); }); }
// the drives File Explorer shows in this challenge
function dmDrives(){ return DM.parts.filter(p=>p.letter).map(p=>({k:p.letter.toLowerCase(),size:p.gb,free:p.kind==="c"?p.gb-24.6:p.gb-.1})); }
scrBody.addEventListener("click",e=>{
  if(SCR.dev!=="pc"||PC.mode!=="oldwin"||!OW.dm) return;
  dmCtxClose();
  const el=e.target.closest("[data-dm]"); if(!el||el.disabled) return;
  startClock(); dmAct(el.dataset.dm,el.dataset.v);
});
scrBody.addEventListener("input",e=>{ const d=DM.dlg; if(!d||SCR.dev!=="pc") return;
  if(e.target.id==="dmMb"){ d.mb=e.target.value.replace(/[^\d]/g,""); const a=document.getElementById("dmAfter"); if(a) a.textContent=Math.max(0,Math.floor(dmPart("c").gb*1024-(+d.mb||0))); }
  else if(e.target.id==="dmLabel") d.label=e.target.value; });
scrBody.addEventListener("change",e=>{ const d=DM.dlg; if(!d||SCR.dev!=="pc") return;
  if(e.target.id==="dmLetter") d.letter=e.target.value; else if(e.target.id==="dmFs") d.fs=e.target.value; });
// right-click a part on the disk: its actions (the ones it doesn't allow are greyed out)
scrBody.addEventListener("contextmenu",e=>{ if(SCR.dev!=="pc"||PC.mode!=="oldwin"||!OW.dm) return; const el=e.target.closest(".dm-part,.dm-row:not(.dm-head)"); if(!el) return;
  e.preventDefault(); dmCtxClose(); DM.sel=el.dataset.v; renderScreen();
  const os=scrBody.querySelector(".os"), r=os.getBoundingClientRect(), m=document.createElement("div"); m.className="ow-ctx"; m.setAttribute("role","menu");
  m.innerHTML=DM_ACTS.map(([a,k])=>`<button data-dm="${a}" role="menuitem"${dmCan(a)?"":" disabled"}>${t(k)}</button>`).join(""); os.appendChild(m);
  m.style.left=Math.min(e.clientX-r.left,r.width-m.offsetWidth-6)+"px"; m.style.top=Math.min(e.clientY-r.top,r.height-m.offsetHeight-6)+"px"; });
function dmCtxClose(){ scrBody.querySelectorAll(".ow-ctx").forEach(m=>m.remove()); }
