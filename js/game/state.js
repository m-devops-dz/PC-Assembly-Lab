/* ---------------- state machine ---------------- */
// step order. Code refers to steps by name (ST.gpu), never by number, so steps can be inserted freely.
// Step text lives in I18N as s_<id> (title) and s_<id>d (explanation).
const STEP_IDS=["leverUp","takeCpu","placeCpu","leverDown","clips","ram1","ram2","bracket","paste","cooler","coolerScrews","fanCable","m2Out","m2In","m2Screw","battery",
  "psu","board","boardScrews","pcieLatch","gpu","sata",
  "dataSsd","dataMb","sataPower","atx24","cpu8","gpuPower",
  "frontPanel","closeCase","usbKeyboard","usbMouse","hdmi","powerCord"];
const ST={}; STEP_IDS.forEach((id,i)=>ST[id]=i);
const STEPS=STEP_IDS.length;
// sidebar groups (first step of each) and lesson modules (first step, and the step that ends them)
const STEP_GROUPS=[[ST.leverUp,"g_desk"],[ST.psu,"g_case"],[ST.dataSsd,"g_power"],[ST.frontPanel,"g_finish"]];
const MODULES=[["m_mobo",ST.leverUp,ST.psu],["m_case",ST.psu,ST.dataSsd],["m_pwr",ST.dataSsd,ST.frontPanel],["m_cab",ST.frontPanel,STEPS]];
let saved={}; try{ saved=JSON.parse(sessionStorage.getItem("pclab")||"{}"); }catch(e){}
if(saved.lang==="ar") lang="ar";
const S={ step:0, busy:false, held:null, ram:-1, rot:{}, flips:0, snap:null, cable:null, mistakes:0, start:0, end:0,
  hints:saved.hints!==false, glow:saved.glow!==false, bright:saved.bright||1.1,
  used:{}, tightOrder:[], fanOn:false, m2screw:"standoff", batFlip:0, mbScrews:0 };
const mod=(v,n)=>((v%n)+n)%n;
const nearPt=(x,z,px,pz,r)=>Math.hypot(x-px,z-pz)<r;
function viewFor(n){
  if(n>=STEPS) return "all";
  if(n===ST.board&&S.held==="board") return "caseClose";
  if(n<=ST.leverDown) return "cpu";
  if(n<=ST.ram2) return "ram";
  if(n===ST.paste) return "paste";
  if(n===ST.fanCable) return "fan";
  if(n<=ST.coolerScrews) return "cooler";
  if(n<=ST.m2Screw) return "m2";
  if(n===ST.battery) return "battery";
  if(n===ST.psu) return "psu";
  if(n===ST.board) return "case";
  if(n===ST.boardScrews) return "boardTop";
  if(n===ST.pcieLatch) return "pcie";
  if(n===ST.gpu) return "gpu";
  if(n<=ST.sataPower) return "sata";
  if(n===ST.atx24) return "atx24";
  if(n===ST.cpu8) return "cpuPwr";
  if(n===ST.gpuPower) return "gpuPwr";
  if(n===ST.frontPanel) return "frontPanel";
  if(n===ST.closeCase) return "case";
  if(n===ST.powerCord) return "psuBack";
  return "rearIO";
}
function setStep(n){
  const prev=viewFor(S.step); S.step=n;
  if(viewFor(n)!==prev) focus(viewFor(n),n===ST.psu||n===ST.board||n===ST.closeCase?1400:900);
  if(n===ST.fanCable) spawnCable(CABLES.fan);
  if(n===ST.psu) showCase();
  if(n===ST.boardScrews) mbScrewHints.visible=true;
  if(n===ST.dataSsd) showConnCables();
  if(n===ST.frontPanel) spawnCable(CABLES.fp);
  if(n===ST.closeCase) showSidePanel();
  if(n===ST.usbKeyboard) showPeripherals();
  renderSteps(); renderModules(); updateTools(); updateTray();
  if(n===STEPS) finish();
}
function mistake(){ S.mistakes++; document.getElementById("mistakes").textContent=S.mistakes; }
function startClock(){ if(!S.start) S.start=performance.now(); }
const canManipulate=()=>!!S.held&&!S.busy&&!dragging;

const HELD={
  cpu:{obj:()=>cpuYaw,step:Math.PI/2,hover:CPU_HOVER,snap:(x,z)=>nearPt(x,z,SX,SZ,1.5)?{x:SX,z:SZ,key:"cpu",msg:t("ok_snap")}:null},
  ram:{obj:()=>rams[S.ram].yaw,step:Math.PI,hover:RAM_HOVER,snap:(x,z)=>{ for(let i=0;i<4;i++) if(Math.abs(x-SLOT_X[i])<.5&&Math.abs(z-SLOT_Z)<3.5) return {x:SLOT_X[i],z:SLOT_Z,key:i,msg:t("ok_snapRam",{s:SLOT_NAMES[i]})}; return null; }},
  paste:{obj:()=>pasteG,step:0,hover:PASTE_HOVER,snap:(x,z)=>nearPt(x,z,SX,SZ,.9)?{x:SX,z:SZ,key:"p",msg:t("ok_snapPaste")}:null},
  cooler:{obj:()=>coolerYaw,step:Math.PI/2,hover:COOLER_HOVER,snap:(x,z)=>nearPt(x,z,SX,SZ,1.5)?{x:SX,z:SZ,key:"c",msg:t("ok_snapCooler")}:null},
  m2:{obj:()=>m2G,step:Math.PI,hover:M2_HOVER,snap:(x,z)=>nearPt(x,z,M2_SEAT.x-2,M2_SEAT.z,3)?{x:M2_SEAT.x,z:M2_SEAT.z,key:"m",msg:t("ok_snapM2")}:null},
  psu:{obj:()=>psuG,step:Math.PI/2,hover:PSU_HOVER,snap:(x,z)=>nearPt(x,z,PSU_POS.x,PSU_POS.z,3.5)?{x:PSU_POS.x,z:PSU_POS.z,key:"u",msg:t("ok_snapPsu")}:null},
  board:{obj:()=>boardRoot,step:Math.PI,hover:L.y+21,snap:(x,z)=>nearPt(x,z,L.x,L.z,3.5)?{x:L.x,z:L.z,key:"b",msg:t("ok_snapBoard")}:null},
  gpu:{obj:()=>gpuG,step:Math.PI,hover:GPU_HOVER,snap:(x,z)=>{ for(const s of GPU_SLOTS) if(Math.abs(x-GPU_X-5)<7&&Math.abs(z-(L.z+s.z))<1.3) return {x:GPU_X,z:L.z+s.z,key:s.name,slot:s,msg:t("ok_snapGpu",{s:s.name})}; return null; }},
  sata:{obj:()=>sataG,step:Math.PI/2,hover:SATA_HOVER,snap:(x,z)=>nearPt(x,z,SATA_POS.x,SATA_POS.z,3)?{x:SATA_POS.x,z:SATA_POS.z,key:"d",msg:t("ok_snapSata")}:null},
  battery:{obj:()=>batG,step:0,hover:BAT_HOVER,snap:(x,z)=>nearPt(x,z,BAT_POS.x,BAT_POS.z,1.3)?{x:BAT_POS.x,z:BAT_POS.z,key:"bat",msg:t("ok_snapBat")}:null},
  // nearest target within the cable's snap radius (front-panel pin pairs are only a few mm apart)
  cable:{obj:()=>S.cable.plug,step:0,hover:0,snap:(x,z)=>{ let best=null, bd=S.cable.snapR||1.2;
    for(const tg of S.cable.tgts){ const d=Math.hypot(x-tg.x,z-tg.z); if(d<bd){ bd=d; best=tg; } }
    return best?{x:best.x,z:best.z,key:best.name,tg:best,msg:t("ok_snapHeader",{s:best.label||best.name})}:null; }}
};
function spawn(type,obj,from,to,rot,after){
  obj.visible=true; obj.position.copy(from); S.rot[type]=rot; const r1=rot*HELD[type].step; obj.rotation.y=r1+1.4;
  S.busy=true; S.snap=null; startClock();
  tween(900,k=>{ obj.position.lerpVectors(from,to,k); obj.rotation.y=r1+1.4*(1-k); },()=>{ S.busy=false; S.held=type; if(after) after(); updateTools(); updateTray(); },easeOut);
  updateTray();
}
function gate(need){
  if(S.busy) return false;
  if(S.held){ toast(t("e_oneAtATime")); return false; }
  if(S.step<need){ const s=S.step;
    toast(t(s<ST.clips?"e_cpuFirst":s<ST.bracket?"e_ramFirst":s<ST.psu?"e_mbFirst":s<ST.board?"e_psuFirst":s<ST.boardScrews?"e_boardFirst":
      s===ST.boardScrews?"e_boardScrewsFirst":s===ST.pcieLatch?"e_pcieLatchFirst":"e_notNow")); return false; }
  return true;
}
