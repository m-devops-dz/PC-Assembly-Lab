/* ---------------- part quiz ----------------
   The first time a part is taken (tray or table), a card asks what that part does, with 3 answers in random order.
   Wrong: counts as a mistake, the screen shakes with a red flash and that answer is struck out. Right: the answer turns
   green and the part comes out as usual. Each take function asks quizOk(id, retry) right after gate(); it returns
   false while the card is up, and calls retry() once the right answer is picked. Text: q_<id>, q_<id>_a (right), _b, _c.
   Off in Settings (S.quiz) and in troubleshooting mode.
   The same card asks the step checks (check.js, quizAsk with prefix "k_"): "From the step's explanation" on top, the
   question as the title, no × (it can't be closed), and retry() runs the step's action again. */
const quizEl=document.getElementById("quiz"), quizChoices=document.getElementById("quizChoices"), quizMsg=document.getElementById("quizMsg");
let quiz=null;   // {id, pre ("q_" part / "k_" step check), retry, from (S.fromTable when it was asked), order, wrong:Set, right}
function quizOk(id,retry){
  if(!S.quiz||S.quizDone[id]||!BUILD_MODE) return true;
  quizAsk(id,retry,"q_"); return false;
}
function quizAsk(id,retry,pre){
  quiz={id,pre,retry,from:pre==="q_"&&S.fromTable&&S.fromTable.clone(),order:["a","b","c"].sort(()=>Math.random()-.5),wrong:new Set(),right:false};
  S.busy=true; hideStepCard(); quizEl.hidden=false; renderQuiz(); quizChoices.firstChild.focus();
}
function renderQuiz(){
  if(!quiz) return;
  const chk=quiz.pre==="k_";
  document.getElementById("quizPart").textContent=chk?t("k_title"):t("q_"+quiz.id);
  document.getElementById("quizTitle").textContent=chk?t("k_"+quiz.id):t("q_title");
  document.getElementById("quizX").hidden=chk;
  quizChoices.innerHTML="";
  quiz.order.forEach((k,i)=>{ const b=document.createElement("button"); b.className="quiz-choice";
    b.innerHTML=`<b>${i+1}</b><span></span>`; b.lastChild.textContent=t(`${quiz.pre}${quiz.id}_${k}`);
    if(quiz.wrong.has(k)){ b.classList.add("wrong"); b.disabled=true; }
    if(quiz.right&&k==="a") b.classList.add("right");
    b.onclick=()=>answerQuiz(k); quizChoices.appendChild(b); });
  quizMsg.textContent=quiz.right?t("q_right"):quiz.wrong.size?t("q_wrong"):"";
  quizMsg.className="quiz-msg"+(quiz.right?" ok":quiz.wrong.size?" err":"");
  document.getElementById("quizX").setAttribute("aria-label",t("q_close"));
}
function answerQuiz(k){
  if(!quiz||quiz.right||quiz.wrong.has(k)) return;
  if(k!=="a"){ quiz.wrong.add(k); if(quiz.pre==="k_") S.checkBad++; mistake(); shakeRed(); renderQuiz(); const free=quizChoices.querySelector(".quiz-choice:not(:disabled)"); if(free) free.focus(); return; }
  quiz.right=true; if(quiz.pre==="k_"){ S.checkDone[quiz.id]=true; S.checkOk++; } else S.quizDone[quiz.id]=true; renderQuiz();
  const q=quiz; setTimeout(()=>{ if(quiz!==q) return; closeQuiz();
    S.fromTable=q.from; q.retry(); S.fromTable=null;
    if(q.from) stepView(1000); },1100);
}
function closeQuiz(){ quiz=null; quizEl.hidden=true; S.busy=false; }
// the whole page shakes and flashes red (no shake with reduced motion, just the flash)
const appEl=document.querySelector(".app"), redFlash=document.getElementById("redFlash");
function shakeRed(){
  [appEl,redFlash].forEach(el=>{ el.classList.remove("hit"); void el.offsetWidth; el.classList.add("hit"); });
}
[appEl,redFlash].forEach(el=>el.addEventListener("animationend",()=>el.classList.remove("hit")));
document.getElementById("quizX").onclick=()=>{ if(quiz&&quiz.pre==="q_") closeQuiz(); };
window.addEventListener("keydown",e=>{ if(!quiz) return;
  if(e.key==="Escape"&&!quiz.right&&quiz.pre==="q_"){ closeQuiz(); return; }
  const n=+e.key; if(n>=1&&n<=3&&!e.ctrlKey){ e.preventDefault(); answerQuiz(quiz.order[n-1]); } });
