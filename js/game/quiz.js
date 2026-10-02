/* ---------------- part quiz ----------------
   The first time a part is taken (tray or table), a card asks what that part does, with 3 answers in random order.
   Wrong: counts as a mistake, the screen shakes with a red flash and that answer is struck out. Right: the answer turns
   green and the part comes out as usual. Each take function asks quizOk(id, retry) right after gate(); it returns
   false while the card is up, and calls retry() once the right answer is picked. Text: q_<id>, q_<id>_a (right), _b, _c.
   Off in Settings (S.quiz) and in troubleshooting mode. */
const quizEl=document.getElementById("quiz"), quizChoices=document.getElementById("quizChoices"), quizMsg=document.getElementById("quizMsg");
let quiz=null;   // {id, retry, from (S.fromTable when it was asked), order, wrong:Set, right}
function quizOk(id,retry){
  if(!S.quiz||S.quizDone[id]||TS.on) return true;
  quiz={id,retry,from:S.fromTable&&S.fromTable.clone(),order:["a","b","c"].sort(()=>Math.random()-.5),wrong:new Set(),right:false};
  S.busy=true; quizEl.hidden=false; renderQuiz(); quizChoices.firstChild.focus();
  return false;
}
function renderQuiz(){
  if(!quiz) return;
  document.getElementById("quizPart").textContent=t("q_"+quiz.id);
  quizChoices.innerHTML="";
  quiz.order.forEach((k,i)=>{ const b=document.createElement("button"); b.className="quiz-choice";
    b.innerHTML=`<b>${i+1}</b><span></span>`; b.lastChild.textContent=t(`q_${quiz.id}_${k}`);
    if(quiz.wrong.has(k)){ b.classList.add("wrong"); b.disabled=true; }
    if(quiz.right&&k==="a") b.classList.add("right");
    b.onclick=()=>answerQuiz(k); quizChoices.appendChild(b); });
  quizMsg.textContent=quiz.right?t("q_right"):quiz.wrong.size?t("q_wrong"):"";
  quizMsg.className="quiz-msg"+(quiz.right?" ok":quiz.wrong.size?" err":"");
  document.getElementById("quizX").setAttribute("aria-label",t("q_close"));
}
function answerQuiz(k){
  if(!quiz||quiz.right||quiz.wrong.has(k)) return;
  if(k!=="a"){ quiz.wrong.add(k); mistake(); shakeRed(); renderQuiz(); const free=quizChoices.querySelector(".quiz-choice:not(:disabled)"); if(free) free.focus(); return; }
  quiz.right=true; S.quizDone[quiz.id]=true; renderQuiz();
  const q=quiz; setTimeout(()=>{ if(quiz!==q) return; closeQuiz();
    S.fromTable=q.from; q.retry(); S.fromTable=null;
    if(q.from) focus(viewFor(S.step),1000); },1100);
}
function closeQuiz(){ quiz=null; quizEl.hidden=true; S.busy=false; }
// the whole page shakes and flashes red (no shake with reduced motion, just the flash)
const appEl=document.querySelector(".app"), redFlash=document.getElementById("redFlash");
function shakeRed(){
  [appEl,redFlash].forEach(el=>{ el.classList.remove("hit"); void el.offsetWidth; el.classList.add("hit"); });
}
[appEl,redFlash].forEach(el=>el.addEventListener("animationend",()=>el.classList.remove("hit")));
document.getElementById("quizX").onclick=closeQuiz;
window.addEventListener("keydown",e=>{ if(!quiz) return;
  if(e.key==="Escape"&&!quiz.right){ closeQuiz(); return; }
  const n=+e.key; if(n>=1&&n<=3&&!e.ctrlKey){ e.preventDefault(); answerQuiz(quiz.order[n-1]); } });
