/* ---------------- the PC's monitor (install mode, phase 2: start the PC from the stick) ----------------
   post    MSI logo: a few seconds to press F11 (boot menu) or DEL (BIOS setup); a bar shows the time running out
   menu    the boot menu. A GPT stick shows as "UEFI: SanDisk…". An MBR (Legacy) stick doesn't show at all: this PC boots
           UEFI only (CSM off, as Windows 11 needs), so picking anything there explains that and sends the student
           back to the laptop to remake it (inRedo)
   bios    BIOS setup (the EZ-mode picture from peripherals.js); Esc or F10 restarts
   ventoy  BootUSB's menu: the ISO files on the stick; with one ISO it starts it after a few seconds by itself
   nodisk  a new PC with nothing to start from (no stick, empty drives)
   load    spinner; oldwin: the old Windows on the M.2 (old-windows.js): phase 2 on purpose, or no F11 / picked from the menu
   setup   Windows Setup (win-setup.js)
   Keys: the real keyboard, or the key row under the screen (phones). The BIOS screens stay in English, as on the real board. */
const POST_MS=7000;
const PC={mode:"off", k:0, boot:0, sel:0, menuSeen:false, ventoySeen:false, setup:false};
// power symbol (the bundled fonts don't have ⏻)
const PWR_SVG=`<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true" style="vertical-align:-2px"><path d="M12 3v8"/><path d="M6.3 6.8a8 8 0 1 0 11.4 0"/></svg>`;
const PC_KEY_MODES=["post","wait","menu","bios","ventoy"];   // the key row shows only before Windows; after it, the mouse does the work
const PC_KEYS=[["Escape","Esc"],["Delete","Del"],["F10","F10"],["F11","F11"],["ArrowUp","↑"],["ArrowDown","↓"],["Enter","Enter ↵"]];
const stickUefi=()=>IN.stick==="pc"&&STICK.boot==="GPT";
function pcEntries(){ return [...(WS.disks==="used"?[{id:"win",l:"Windows Boot Manager (Samsung SSD 980 PRO 1TB)"}]:[]),
  ...(stickUefi()?[{id:"usb",l:"UEFI: SanDisk Ultra 32GB 1.00, Partition 1"}]:[]), {id:"setup",l:"Enter Setup"}]; }
// press the case's power button: the PC starts, the camera goes to the monitor, the MSI logo comes up
function pcPowerOn(){
  S.busy=true;
  tween(260,k=>{ powerBtn.position.x=CX1+.17-.12*Math.sin(k*Math.PI); },()=>{ S.busy=false; powerUp(); openScreen("pc"); pcPost(950); });
}
function pcPost(delay=0){
  const id=++PC.boot, dur=IN.stick==="pc"?POST_MS:3500; PC.mode="post"; PC.k=0; OW.view="lock"; OW.app=OW.start=OW.renaming=false; showScreen(screenOn); renderScreen();
  setTimeout(()=>{ if(PC.boot!==id) return;
    tween(dur,k=>{ if(PC.boot===id&&PC.mode==="post"){ PC.k=k; pcBar(); } },()=>{ if(PC.boot===id&&PC.mode==="post") pcBootDisk(true); }); },delay);
}
// the PC starts from the M.2: on purpose in phase 2 (no stick in), or because nobody pressed F11 / Windows Boot Manager was picked (mistakes).
// A new PC has nothing on its drives: it falls through to the stick by itself (a note, not a mistake), or has nothing to start.
function pcBootDisk(missed){
  if(WS.disks==="fresh"){
    if(stickUefi()&&STICK.iso){ toast(t("in_autoUsb")); pcVentoy(); }
    else { PC.mode="nodisk"; renderScreen(); }
    return; }
  const id=PC.boot, wrong=IN.stick==="pc"&&IN.step>=IS.powerF11; PC.mode="load"; PC.loadMsg=""; showScreen(screenOff,.9); renderScreen();
  setTimeout(()=>{ if(PC.boot!==id) return; PC.mode="oldwin"; OW.view="lock"; renderScreen(); if(wrong) inMistake(missed?"in_m_noF11":"in_m_oldWin"); },2400);
}
function pcOff(){ PC.boot++; PC.mode="off"; S.powered=false; powerLedMat.color.setHex(0x1a2330); keyboardLights(false); showScreen(screenOff,0); }
function pcWait(next){ const id=PC.boot; PC.mode="wait"; renderScreen(); setTimeout(()=>{ if(PC.boot===id) next(); },800); }
function pcKey(k){
  startClock();
  if(PC.mode==="post"){
    if(k==="F11") pcWait(()=>{ PC.mode="menu"; PC.sel=0; PC.menuSeen=true; renderScreen(); inCheck(); });
    else if(k==="Delete") pcWait(pcBios);
    return; }
  if(PC.mode==="menu"){ const n=pcEntries().length;
    if(k==="ArrowUp") PC.sel=(PC.sel+n-1)%n; else if(k==="ArrowDown") PC.sel=(PC.sel+1)%n;
    else if(k==="Enter"){ pcChoose(PC.sel); return; } else if(k==="Escape"){ pcChoose(0); return; }   // Esc: boot using defaults
    renderScreen(); return; }
  if(PC.mode==="bios"){ if(k==="Escape"||k==="F10") pcPost(); return; }
  if(PC.mode==="ventoy"&&k==="Enter") pcIso();
}
function pcBios(){ PC.mode="bios"; const tex=pcBiosTex(); showScreen(tex); renderScreen(); }
const pcBiosCache={};
function pcBiosTex(){ const k=stickUefi()?"usb":"none"; return pcBiosCache[k]||(pcBiosCache[k]=biosTex(stickUefi()?{usb:"ok"}:{})); }
function pcChoose(i){
  const e=pcEntries()[i];
  if(IN.stick==="pc"&&STICK.boot!=="GPT"){ IN.mbrFails++; inMistake("in_m_mbrMissing",()=>inRedo(true)); return; }   // the stick should be in this list, and isn't
  if(e.id==="setup"){ pcBios(); return; }
  if(e.id==="win"){ pcBootDisk(false); return; }
  if(!STICK.iso){ inMistake("in_m_noIso",()=>inRedo(false)); return; }
  pcVentoy();
}
// BootUSB's menu, with a countdown to start the only ISO on the stick
function pcVentoy(){ const id=PC.boot; PC.mode="ventoy"; PC.ventoySeen=true; PC.vt=4; renderScreen(); inCheck();
  clearInterval(pcVentoy.timer);
  pcVentoy.timer=setInterval(()=>{ if(PC.boot!==id||PC.mode!=="ventoy"||WS.installing){ clearInterval(pcVentoy.timer); return; }
    if(!inCardEl.hidden) return; PC.vt--; if(PC.vt<=0){ clearInterval(pcVentoy.timer); pcIso(); } else renderScreen(); },1000); }
function pcIso(){
  if(WS.installing){ toast(t("in_stickIn2"),"err"); return; }            // Windows is already copied: starting Setup again would start over
  const id=PC.boot; PC.mode="load"; PC.loadMsg="pc_setupLoad"; renderScreen();
  setTimeout(()=>{ if(PC.boot!==id) return; PC.mode="setup"; PC.setup=true; WS.page="lang"; renderScreen(); inCheck(); },2600); }
function pcBar(){ const b=document.getElementById("pcBar"); if(b) b.style.width=((1-PC.k)*100).toFixed(1)+"%"; }
function pcRender(){
  if(SCR.dev!=="pc") return;
  const m=PC.mode; let s="";
  if(m==="post"||m==="wait") s=`<div class="pc post"><b class="pc-msi">MSI</b><small>B450 GAMING PLUS MAX</small>
      ${m==="wait"?`<p class="pc-hint on">Entering…</p>`:`<div class="pc-post-bar" title="${t("pc_window")}"><i id="pcBar"></i></div><p class="pc-hint">Press DEL key to enter SETUP, F11 to enter Boot Menu</p>`}</div>`;
  else if(m==="menu") s=`<div class="pc menu"><div class="pc-menu"><p>Please select boot device:</p><ul>${pcEntries().map((e,i)=>`<li><button data-k="pick" data-v="${i}" class="${i===PC.sel?"on":""}">${e.l}</button></li>`).join("")}</ul>
      <p class="pc-foot">↑ and ↓ to move selection<br>ENTER to select boot device<br>ESC to boot using defaults</p></div></div>`;
  else if(m==="bios") s=`<div class="pc bios"><img src="${pcBiosTex().image.toDataURL()}" alt="MSI Click BIOS 5"><p class="pc-note">${t("pc_biosNote")}</p></div>`;
  else if(m==="ventoy") s=`<div class="pc vt"><header>BootUSB 1.0.99 · UEFI</header><ul><li><button class="on" data-k="Enter"><span>${LAP.iso}</span><small>${ISO_GB} GB</small></button></li></ul><footer>${!WS.installing&&PC.vt>0?t("vt_auto",{s:PC.vt})+" · ":""}↑↓ Select · Enter Boot · F1 Help</footer></div>`;
  else if(m==="load") s=`<div class="pc load"><div class="pc-spin" aria-hidden="true">${"<i></i>".repeat(5)}</div>${PC.loadMsg?`<p>${t(PC.loadMsg)}</p>`:""}</div>`;
  else if(m==="oldwin") s=owRender();
  else if(m==="nodisk") s=`<div class="pc nodisk"><p>Reboot and Select proper Boot device<br>or Insert Boot Media in selected Boot device and press a key_</p><button class="pc-power" data-k="restart">↻ ${t("pc_restart")}</button></div>`;
  else if(m==="setup") s=wsRender();
  else s=`<div class="pc"></div>`;
  const keys=PC_KEY_MODES.includes(m)?`<div class="pc-keys"><span>${t("pc_kb")}</span>${PC_KEYS.map(([k,l])=>`<button data-k="${k}"${k==="F11"?' class="fk"':""}>${l}</button>`).join("")}</div>`:"";
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
  if(SCR.dev!=="pc"||!PC_KEY_MODES.includes(PC.mode)||/^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName)||!PC_KEYS.some(([k])=>k===e.key)) return;
  e.preventDefault(); e.stopImmediatePropagation(); if(!e.repeat) pcKey(e.key);
},true);
SCREENS.pc={view:()=>screenView(), render:pcRender, back:()=>focus("inDesk",900)};
