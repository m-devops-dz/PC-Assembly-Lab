/* ---------------- "from the explanation" checks ----------------
   Some students build without reading the step text. On these steps, the student's first try at the step's action
   (lowering the part, the first click on a cable's plug, the first cooler screw) first asks one question whose answer is a sentence of
   that step's explanation. It uses the part quiz's card (quiz.js, text prefix "k_"): a wrong answer is a mistake, the
   right one lets the action go on by itself. Asked once per step; the part quiz's switch (S.quiz) turns both off; skips
   (Ctrl+H, the sidebar) don't ask. Text: k_<step> (the question), k_<step>_a (right), _b, _c.
   S.checkOk / S.checkBad: answers, for the teacher's panel (classroom.js). */
// cable steps ask what happens if that cable is forgotten (the last sentence of their explanation). None on the PSU step
// (it asks the CPU cable question) or the front panel; dataMb is dataSsd's cable; the fan steps ask which header
const STEP_CHECK=["placeCpu","ram1","paste","coolerScrews","board","gpu","dataSsd","sataPower","atx24","cpu8","gpuPower","frontUsb"];
// retry: the action to run again once the right answer is picked
function checkOk(retry){
  const id=STEP_IDS[S.step];
  if(!BUILD_MODE||!S.quiz||!STEP_CHECK.includes(id)||S.checkDone[id]) return true;
  quizAsk(id,retry,"k_"); return false;
}
