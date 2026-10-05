/* ---------------- classroom (the teacher's PC runs classroom/server.py) ----------------
   Only on when that server served the page: it adds <script>window.CLASSROOM=true</script>. The live site, a file://
   copy and the offline zip don't have it, so everything below stays off there.
   The student types their name once per browser session (pclabStudent). The page then follows the teacher's panel over
   Server-Sent Events (/events): the mode, how far the build may go (CL_MAX: from that step on a card says to wait), the
   install challenge or troubleshooting case, "everyone to step N", pause, a message, and whether skipping is allowed.
   Progress goes back with a POST (/api/progress) every few seconds and after each step.
   A reload (a mode change from the teacher, F5) would lose the build, so the build's step is kept (pclabStep) and the
   page skips back up to it at start (clRestore).
   "New session" (st.session changes) or "Reset" for one student (st.resets[id]): the page forgets the name and all
   progress (clReset) and asks for a name again. */
const CL={on:!!window.CLASSROOM, st:{}, me:null, restoring:false, waiting:false, pendingGoto:0, dot:null, timer:0};
let CL_MAX=Infinity;                                        // build mode: steps from this index on wait for the teacher
// may the student skip up to step n (Ctrl+H, a sidebar click)? Always outside the classroom
function clMaySkip(n){ return !CL.on||(!!CL.st.skip&&n<=CL_MAX); }
const clLoad=k=>{ try{ return JSON.parse(sessionStorage.getItem(k)||"null"); }catch(e){ return null; } };
const clSave=(k,v)=>{ try{ sessionStorage.setItem(k,JSON.stringify(v)); }catch(e){} };

// full-page cards (name, wait, pause): over the sidebar too, so nothing can be clicked behind them
function clCover(id,html){
  let el=document.getElementById(id);
  if(!el){ el=document.createElement("div"); el.id=id; el.className="quiz step-card cl-cover"; el.hidden=true; document.body.appendChild(el); }
  if(html!==undefined) el.innerHTML=`<div class="quiz-card" role="dialog" aria-modal="true">${html}</div>`;
  return el;
}
function clAskName(done){
  const el=clCover("clName",`<h2>${t("cl_hiTitle")}</h2><p class="sc-text">${t("cl_hiText")}</p>
    <form class="cl-form"><label><span>${t("cl_full")}</span><input name="n" required maxlength="60" autocomplete="off"></label>
    <button class="primary">${t("cl_go")}</button></form>`);
  el.hidden=false; const f=el.querySelector("form"); f.n.focus();
  f.onsubmit=e=>{ e.preventDefault(); const n=f.n.value.trim().replace(/\s+/g," "); if(!n) return;
    CL.me={id:Date.now().toString(36)+Math.random().toString(36).slice(2,8), name:n, goto:0, msg:0};
    clSave("pclabStudent",CL.me); el.hidden=true; done(); };
}
// header chip: the student's name, green dot while the teacher's PC answers
function clChip(){
  const b=document.createElement("span"); b.className="chip-btn cl-chip"; b.innerHTML=`<i></i><span></span>`;
  b.querySelector("span").textContent=CL.me.name; document.getElementById("resetBtn").parentElement.prepend(b); CL.dot=b;
}
function clOnline(on){ if(CL.dot){ CL.dot.classList.toggle("on",on); CL.dot.title=t(on?"cl_on":"cl_off"); } }

function clStart(){
  if(!CL.on) return;
  document.body.classList.add("classroom");
  CL.me=clLoad("pclabStudent");
  if(CL.me&&CL.me.id) clGo(); else clAskName(clGo);
}
function clGo(){
  clChip(); clRestore();
  const es=new EventSource("/events");                     // reconnects by itself if the teacher's PC goes away
  es.onopen=()=>clOnline(true); es.onerror=()=>clOnline(false);
  es.onmessage=e=>{ let st; try{ st=JSON.parse(e.data); }catch(x){ return; } clOnline(true); clApply(st); };
  setInterval(clReport,5000); clReport();
}

// the teacher's settings, on connect and after every change
function clApply(st){
  CL.st=st;
  if(st.app&&window.APP_VERSION&&st.app!==APP_VERSION&&clLoad("pclabVer")!==st.app){ clSave("pclabVer",st.app); location.reload(); return; }   // the app was updated: load the new copy (once)
  if(!CL.me.session){ CL.me.session=st.session; clSave("pclabStudent",CL.me); }
  if(CL.me.session!==st.session||(st.resets&&st.resets[CL.me.id])){ clReset(); return; }
  if(["build","trouble","install"].includes(st.mode)&&st.mode!==appMode){ appMode=st.mode; persist(); location.reload(); return; }
  if(IN.on&&IN_SCENARIOS[st.challenge]&&IN.sc!==st.challenge){ inGo(st.challenge); return; }
  if(TS.on&&TS_CASES[st.tsCase]&&TS.n!==st.tsCase){ tsGo(st.tsCase); return; }
  CL_MAX=BUILD_MODE&&st.to>0&&st.to<STEPS?st.to:Infinity;
  if(st.goto&&st.goto.seq>CL.me.goto){ CL.me.goto=st.goto.seq; clSave("pclabStudent",CL.me); clGoto(st.goto.n-1); }
  if(st.msg&&st.msg.seq>CL.me.msg){ CL.me.msg=st.msg.seq; clSave("pclabStudent",CL.me); if(st.msg.text) toast(t("cl_msg",{m:st.msg.text}),"",true); }
  const p=clCover("clPause",`<h2>${t("cl_pauseTitle")}</h2><p class="sc-text">${t("cl_pauseText")}</p>`); p.hidden=!st.pause;
  if(IN.on) renderIN(); if(TS.on) renderTS();
  renderSteps(); clWait();
}
// "everyone to step n": skip forward to it (never back)
function clGoto(n){
  if(!BUILD_MODE||n<=S.step) return;
  if(CL.restoring){ CL.pendingGoto=Math.max(CL.pendingGoto,n); return; }
  toast(t("cl_goto",{n:n+1})); skipTo(Math.min(n,STEPS-1),true,()=>{ clWait(); clReport(); });
}
// the open steps are done: wait for the teacher
function clWait(){
  const w=CL.on&&BUILD_MODE&&!CL.restoring&&S.step>=CL_MAX&&S.step<STEPS;
  const el=clCover("clWait",w?`<p class="quiz-part">${t("stepN",{n:S.step,m:STEPS})}</p><h2>${t("cl_waitTitle")}</h2><p class="sc-text">${t("cl_waitText",{n:CL_MAX,m:STEPS})}</p>`:undefined);
  el.hidden=!w; if(w) hideStepCard(); CL.waiting=w;
}
// the teacher picked the challenge / case: the sidebar list can't switch to another one (renderIN, renderTS)
function clLock(el){
  if(!CL.on) return;
  if(IN.on&&IN_SCENARIOS[CL.st.challenge]) el.querySelectorAll("[data-sc]").forEach(b=>b.disabled=b.dataset.sc!==CL.st.challenge);
  if(TS.on&&TS_CASES[CL.st.tsCase]) el.querySelectorAll("[data-case],[data-go],[data-act=list]").forEach(b=>b.disabled=true);
}
// setStep calls this after every step
function clStep(){
  if(!CL.on||!CL.me||!BUILD_MODE||CL.restoring) return;              // not before clStart: setStep(0) at start would wipe the saved build
  clSave("pclabStep",{step:S.step,mistakes:S.mistakes,stepMis:S.stepMis,skipped:S.skipped});
  clWait(); clearTimeout(CL.timer); CL.timer=setTimeout(clReport,300);
}
// build mode after a reload: skip back up to the saved step, then put back its marks (done, not skipped)
function clRestore(){
  const sv=clLoad("pclabStep"); if(!BUILD_MODE||!sv||!(sv.step>0)) return;
  CL.restoring=true; const c=clCover("clRestore",`<h2>${t("cl_restore")}</h2>`); c.hidden=false;
  skipTo(Math.min(sv.step,STEPS),true,()=>{
    S.skipped=sv.skipped||{}; S.stepMis=sv.stepMis||{}; S.mistakes=sv.mistakes||0; document.getElementById("mistakes").textContent=S.mistakes;
    CL.restoring=false; c.hidden=true; renderSteps(); clStep();
    if(CL.pendingGoto){ const n=CL.pendingGoto; CL.pendingGoto=0; clGoto(n); } });
}
// the teacher's new session / reset: a new name, from step 1, nothing solved (resetAll keeps only the settings)
function clReset(){ try{ sessionStorage.removeItem("pclabStudent"); }catch(e){} resetAll(); }
// Start over: the build starts again from step 1 (resetAll)
function clForget(){ try{ sessionStorage.removeItem("pclabStep"); }catch(e){} }

function clReport(){
  if(!CL.on||!CL.me) return;
  const r={id:CL.me.id, name:CL.me.name, session:CL.me.session, mode:appMode, mistakes:S.mistakes, time:S.start?Math.round(((S.end||performance.now())-S.start)/1000):0, wait:CL.waiting};
  if(BUILD_MODE){ r.step=S.step; r.steps=STEPS; r.stepId=STEP_IDS[S.step]||"done"; }
  if(IN.on){ r.sc=IN.sc; r.step=IN.step; r.steps=IN_STEPS.length; r.stepId=inCur()||"done"; r.done=IN.done; }
  if(TS.on){ r.tsCase=TS.n; r.phase=TS.phase; r.done=TS.done; }
  fetch("/api/progress",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(r),keepalive:true}).catch(()=>{});
}
