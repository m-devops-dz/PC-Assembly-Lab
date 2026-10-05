/* ---------------- the PC's monitor (install mode, phase 2: start the PC from the stick) ----------------
   post    MSI logo: a few seconds to press F11 (boot menu) or DEL (BIOS setup); a bar shows the time running out
   menu    the boot menu. A GPT stick shows as "UEFI: SanDisk…". An MBR (Legacy) stick doesn't show at all: this PC boots
           UEFI only (CSM off, as Windows 11 needs), so picking anything there explains that and sends the student
           back to the laptop to remake it (inRedo)
   bios    BIOS setup (the EZ-mode picture from peripherals.js); Esc or F10 restarts
   ventoy  Ventoy's menu: the ISO files on the stick; the student picks the Windows ISO
   nodisk  a new PC with nothing to start from (no stick, empty drives)
   load    spinner; oldwin: the old Windows on the M.2 (old-windows.js): phase 2 on purpose, or no F11 / picked from the menu
   setup   Windows Setup (win-setup.js)
   Keys: the real keyboard, or the key row under the screen (phones). The BIOS screens stay in English, as on the real board. */
const POST_MS=7000;
const PC={mode:"off", k:0, boot:0, sel:0, menuSeen:false, ventoySeen:false, setup:false};
// power symbol (the bundled fonts don't have ⏻)
const PWR_SVG=`<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true" style="vertical-align:-2px"><path d="M12 3v8"/><path d="M6.3 6.8a8 8 0 1 0 11.4 0"/></svg>`;
const PC_KEY_MODES=["post","wait","menu","bios","ventoy"];   // the key row shows only before Windows; after it, the mouse does the work
const PC_KEYS=[["Escape","Esc"],["Delete","Del"],["F7","F7"],["F10","F10"],["F11","F11"],["ArrowUp","↑"],["ArrowDown","↓"],["Enter","Enter ↵"]];
// the keys this PC has: F7 (BIOS advanced mode) only with the clickable BIOS, no F11 on the PC without a boot menu key
// the BIOS challenge's first start: the student only watches what the PC starts by itself, so no keys (inCur: install.js)
const pcKeysOff=()=>IN.sc==="bios"&&inCur()==="oldBoot";
const pcKeyList=()=>PC_KEYS.filter(([k])=>k==="F7"?IN.cfg.bios:k==="F11"?!IN.cfg.noF11:true);
const stickUefi=()=>IN.stick==="pc"&&STICK.boot==="GPT";
function pcEntries(){ return [...(WS.disks==="used"?[{id:"win",l:"Windows Boot Manager (Samsung SSD 980 PRO 1TB)"}]:[]),
  ...(stickUefi()?[{id:"usb",l:"UEFI: SanDisk Ultra 32GB 1.00, Partition 1"}]:[]), {id:"setup",l:"Enter Setup"}]; }
// press the case's power button: the PC starts, the camera goes to the monitor, the MSI logo comes up
function pcPowerOn(){
  S.busy=true;
  tween(260,k=>{ powerBtn.position.x=CX1+.17-.12*Math.sin(k*Math.PI); },()=>{ S.busy=false; powerUp(); openScreen("pc"); pcPost(950); });
}
// main path: the logo stays up until F11 (an arrow points at it); elsewhere the few seconds run out
const pcWaitF11=()=>IN.sc==="main"&&!PC.setup&&["powerF11","bootPick"].includes(inCur());
function pcPost(delay=0){
  const id=++PC.boot, dur=IN.stick==="pc"&&!pcKeysOff()?POST_MS:3500;   // the logo stays longer only when there are keys to press
  if(pcWaitF11()){ PC.mode="post"; PC.k=0; OW.view="lock"; showScreen(screenOn); renderScreen(); return; } PC.mode="post"; PC.k=0; OW.view="lock"; OW.app=OW.start=OW.renaming=false; showScreen(screenOn); renderScreen();
  setTimeout(()=>{ if(PC.boot!==id) return;
    tween(dur,k=>{ if(PC.boot===id&&PC.mode==="post"){ PC.k=k; pcBar(); } },()=>{ if(PC.boot===id&&PC.mode==="post") pcPostEnd(); }); },delay);
}
// nobody pressed a key: the PC starts from the first device in its boot order (the stick, once the BIOS put it first)
function pcPostEnd(){
  if(IN.cfg.bsod){ bsodResume(); return; }                              // the blue-screen challenge: back into Setup's copy
  if(PC.usbFirst&&stickUefi()&&STICK.iso){ pcVentoy(); return; }
  pcBootDisk(true);
}
// the PC starts from the M.2: on purpose in phase 2 (no stick in), or because nobody pressed F11 / Windows Boot Manager was picked (mistakes).
// A new PC has nothing on its drives: it falls through to the stick by itself (a note, not a mistake), or has nothing to start.
function pcBootDisk(missed){
  if(WS.disks==="fresh"){
    if(stickUefi()&&STICK.iso){ toast(t("in_autoUsb")); pcVentoy(); }
    else { PC.mode="nodisk"; renderScreen(); }
    return; }
  const gate=IN.cfg.noF11?IS.biosEnter:IS.powerF11, wrong=IN.stick==="pc"&&IN.step>=gate;
  const id=PC.boot; PC.mode="load"; PC.loadMsg=""; showScreen(screenOff,.9); renderScreen();
  setTimeout(()=>{ if(PC.boot!==id) return; PC.mode="oldwin"; OW.view="lock"; renderScreen(); if(wrong) inMistake(IN.cfg.noF11?"in_m_noDel":missed?"in_m_noF11":"in_m_oldWin"); },2400);
}
function pcOff(){ PC.boot++; PC.mode="off"; S.powered=false; powerLedMat.color.setHex(0x1a2330); keyboardLights(false); showScreen(screenOff,0); }
function pcWait(next){ const id=PC.boot; PC.mode="wait"; renderScreen(); setTimeout(()=>{ if(PC.boot===id) next(); },800); }
function pcKey(k){
  startClock();
  if(pcKeysOff()){ toast(t("in_bx_watch")); return; }
  if(PC.mode==="post"){
    if(k==="F11"){ if(IN.cfg.noF11){ toast(t("in_noF11")); return; }   // this PC has no boot menu key: nothing happens
      pcWait(()=>{ PC.mode="menu"; PC.sel=0; PC.menuSeen=true; renderScreen(); inCheck(); }); }
    else if(k==="Delete") pcWait(pcBios);
    return; }
  if(PC.mode==="bios"&&IN.cfg.bios){ bxKey(k); return; }                // the clickable BIOS (in-challenges.js)
  if(PC.mode==="menu"){ const n=pcEntries().length;
    if(k==="ArrowUp") PC.sel=(PC.sel+n-1)%n; else if(k==="ArrowDown") PC.sel=(PC.sel+1)%n;
    else if(k==="Enter"){ pcChoose(PC.sel); return; } else if(k==="Escape"){ pcChoose(0); return; }   // Esc: boot using defaults
    renderScreen(); return; }
  if(PC.mode==="bios"){ if(k==="Escape"||k==="F10") pcPost(); return; }
  if(PC.mode==="ventoy"&&k==="Enter") pcIso();
}
function pcBios(){ PC.mode="bios"; PC.biosSeen=true; const tex=pcBiosTex(); showScreen(tex); renderScreen(); inCheck(); }
const pcBiosCache={};
function pcBiosTex(){ const k=stickUefi()?"usb":"none"; return pcBiosCache[k]||(pcBiosCache[k]=biosTex(stickUefi()?{usb:"ok"}:{})); }
function pcChoose(i){
  const e=pcEntries()[i];
  if(IN.stick==="pc"&&STICK.boot!=="GPT"){ IN.mbrFails++; mistake(); shakeRed();      // read why before going back: OK after 30 s
    inCard(t("in_err"),inT("in_m_mbrMissing_t"),inT("in_m_mbrMissing"),{wait:30,onOk:()=>inRedo(true)}); return; }   // the stick should be in this list, and isn't
  if(e.id==="setup"){ pcBios(); return; }
  if(e.id==="win"){ pcBootDisk(false); return; }
  if(!STICK.iso){ inMistake("in_m_noIso",()=>inRedo(false)); return; }
  pcVentoy();
}
// Ventoy's menu: the ISO files on the stick. It waits for the student to choose one (Enter or a click).
function pcVentoy(){ PC.mode="ventoy"; PC.ventoySeen=true; renderScreen(); inCheck(); }
function pcIso(){
  if(IN.sc==="usb"){ toast(t("in_usbDone"),"ok"); return; }            // the challenge was the stick: it boots, that's the end
  if(IN.cfg.bsod&&!WS.copied){ bsodResume(); return; }                  // the blue-screen challenge: the copy never finished, Setup picks it up again
  if(WS.installing){ toast(t("in_stickIn2"),"err"); return; }            // Windows is already copied: starting Setup again would start over
  const id=PC.boot; PC.mode="load"; PC.loadMsg="pc_setupLoad"; renderScreen();
  setTimeout(()=>{ if(PC.boot!==id) return; PC.mode="setup"; PC.setup=true; WS.page="lang"; renderScreen(); inCheck(); },2600); }
function pcBar(){ const b=document.getElementById("pcBar"); if(b) b.style.width=((1-PC.k)*100).toFixed(1)+"%"; }
function pcRender(){
  if(SCR.dev!=="pc") return;
  const m=PC.mode; let s="";
  if(m==="post"||m==="wait") s=`<div class="pc post"><b class="pc-msi">MSI</b><small>B450 GAMING PLUS MAX</small>
      ${m==="wait"?`<p class="pc-hint on">Entering…</p>`:`${pcWaitF11()?`<p class="pc-f11">${t("pc_f11Now")}</p>`:`<div class="pc-post-bar" title="${t("pc_window")}"><i id="pcBar"></i></div>`}<p class="pc-hint">${IN.cfg.noF11?"Press DEL key to enter SETUP":"Press DEL key to enter SETUP, F11 to enter Boot Menu"}</p>`}</div>`;
  else if(m==="menu") s=`<div class="pc menu"><div class="pc-menu"><p>Please select boot device:</p><ul>${pcEntries().map((e,i)=>`<li><button data-k="pick" data-v="${i}" class="${i===PC.sel?"on":""}${e.id==="usb"&&IN.sc==="main"&&S.glow?" point":""}">${e.l}</button></li>`).join("")}</ul>
      <p class="pc-foot">↑ and ↓ to move selection<br>ENTER to select boot device<br>ESC to boot using defaults</p></div></div>`;
  else if(m==="bios"&&IN.cfg.bios) s=bxRender();
  else if(m==="bsod") s=bsodRender();
  else if(m==="bios") s=`<div class="pc bios"><img src="${pcBiosTex().image.toDataURL()}" alt="MSI Click BIOS 5"><p class="pc-note">${t("pc_biosNote")}</p></div>`;
  else if(m==="ventoy") s=`<div class="pc vt"><header>Ventoy 1.0.99 · UEFI</header><ul><li><button class="on${S.hints&&S.glow&&!WS.installing&&IN.sc!=="usb"?" point":""}" data-k="Enter"><span>${LAP.iso}</span><small>${ISO_GB} GB</small></button></li></ul><footer>↑↓ Select · Enter Boot · F1 Help</footer></div>`;
  else if(m==="load") s=`<div class="pc load"><div class="pc-spin" aria-hidden="true">${"<i></i>".repeat(5)}</div>${PC.loadMsg?`<p>${t(PC.loadMsg)}</p>`:""}</div>`;
  else if(m==="oldwin") s=owRender();
  else if(m==="nodisk") s=`<div class="pc nodisk"><p>Reboot and Select proper Boot device<br>or Insert Boot Media in selected Boot device and press a key_</p><button class="pc-power" data-k="restart">↻ ${t("pc_restart")}</button></div>`;
  else if(m==="setup") s=wsRender();
  else s=`<div class="pc"></div>`;
  const keys=PC_KEY_MODES.includes(m)&&!pcKeysOff()?`<div class="pc-keys"><span>${t("pc_kb")}</span>${pcKeyList().map(([k,l])=>`<button data-k="${k}"${k==="F11"?` class="fk${m==="post"&&pcWaitF11()?" point":""}"`:""}>${l}</button>`).join("")}</div>`:"";
  scrBody.innerHTML=`<div class="pcs">${s}${keys}</div>`;
  pcBar(); const ren=document.getElementById("owName"); if(ren){ ren.focus(); ren.select(); }
}
scrBody.addEventListener("click",e=>{
  if(SCR.dev!=="pc") return; const el=e.target.closest("[data-k]"); if(!el) return;
  const k=el.dataset.k;
  if(k==="pick"){ PC.sel=+el.dataset.v; pcChoose(PC.sel); }
  else if(k==="restart"){ startClock(); pcPost(); }
  else pcKey(k);
});
// the real keyboard (capture, so Esc doesn't also leave full screen and F11 doesn't reach the browser where it can be stopped)
window.addEventListener("keydown",e=>{
  if(SCR.dev!=="pc"||!PC_KEY_MODES.includes(PC.mode)||/^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName)||!PC_KEYS.some(([k])=>k===e.key)) return;   // F11 too where it does nothing: kept from the browser
  e.preventDefault(); e.stopImmediatePropagation(); if(!e.repeat) pcKey(e.key);
},true);
SCREENS.pc={view:()=>screenView(), render:pcRender, back:()=>focus("inDesk",900)};
