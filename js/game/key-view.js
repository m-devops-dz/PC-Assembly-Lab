/* ---------------- key view: small window showing how a keyed part lines up ----------------
   SATA plug held: the plug face and the port face, both as seen from in front of the port, so a match looks identical.
   RAM stick held: the stick's edge above the slot, notch over key. Shown only while the part is in hand. */
const keyView=document.getElementById("keyView");
function sataKeySvg(job){
  const {len,housing:[h,wd]}=job.port, s=84/wd, pts=lPts(len).map(([z,y])=>(z*s).toFixed(1)+","+(-y*s).toFixed(1)).join(" "), pw=(len+.1)*s, ph=.36*s;
  const fig=(cap,body)=>`<figure><svg viewBox="-60 -45 120 90" aria-hidden="true">${body}</svg><figcaption>${cap}</figcaption></figure>`;
  return fig(t("kv_plug"),`<g class="kv-turn"><rect class="kv-body ${job.c.id}" x="${-pw/2}" y="${-ph/2}" width="${pw}" height="${ph}" rx="2"/><polygon class="kv-slot ${job.c.id}" points="${pts}"/></g>`)
    +fig(t("kv_port"),`<rect class="kv-housing" x="${-wd*s/2}" y="${-h*s/2}" width="${wd*s}" height="${h*s}" rx="2"/><polygon class="kv-tongue" points="${pts}"/>`);
}
// side view along the slot (screen x = -z, the RAM view turned a quarter clockwise); the stick is drawn at rot 0, then mirrored for odd turns
function ramKeySvg(){
  const s=15.5, pw=13.3*s, sw=14*s, n=-NOTCH*s, nw=11;
  const stick=`<g class="kv-turn"><path class="kv-pcb" d="M${-pw/2} -44h${pw}v38H${n+nw/2}v-13h${-nw}v13H${-pw/2}z"/>`
    +`<path class="kv-gold" d="M${-pw/2+4} -12H${n-nw/2-3}v5H${-pw/2+4}z M${n+nw/2+3} -12H${pw/2-4}v5H${n+nw/2+3}z"/>`
    +`</g><text class="kv-lbl kv-notchlbl" x="${n}" y="-24" text-anchor="middle">${t("kv_notch")}</text>`;   // outside the mirrored group so it stays readable
  const slot=`<rect class="kv-slotbody" x="${-sw/2}" y="14" width="${sw}" height="22" rx="2"/><rect class="kv-groove" x="${-sw/2+6}" y="14" width="${sw-12}" height="8"/>`
    +`<rect class="kv-slotbody" x="${n-nw/2+1}" y="2" width="${nw-2}" height="20"/><text class="kv-lbl light" x="${n}" y="33" text-anchor="middle">${t("kv_key")}</text>`;
  return `<figure><svg viewBox="-112 -50 224 90" aria-hidden="true"><line class="kv-guide" x1="${n}" y1="-48" x2="${n}" y2="38"/>${stick}${slot}</svg><figcaption>${t("kv_ram")}</figcaption></figure>`;
}
function renderKeyView(){
  const job=S.job, kind=S.held==="conn"&&job&&isLJob(job)?"sata":S.held==="ram"&&S.ram>=0?"ram":null, was=!keyView.hidden;
  keyView.hidden=!kind; if(!kind) return;
  const faces=keyView.querySelector(".kv-faces"), id=(kind==="sata"?job.c.id+job.port.len:"ram")+lang;
  if(keyView.dataset.id!==id){ keyView.dataset.id=id; faces.innerHTML=kind==="sata"?sataKeySvg(job):ramKeySvg(); faces.classList.toggle("one",kind==="ram"); }
  const ok=kind==="sata"?mod(S.roll,4)===0:!mod(S.rot.ram,2), g=faces.querySelector(".kv-turn");
  if(!was) g.style.transition="none";                                          // appear already turned, don't spin in
  g.style.transform=kind==="sata"?`rotate(${S.roll*90}deg)`:`scaleX(${ok?1:-1})`;
  if(!was){ g.getBoundingClientRect(); g.style.transition=""; }
  if(kind==="ram") faces.querySelector(".kv-notchlbl").setAttribute("x",(ok?-1:1)*NOTCH*15.5);
  keyView.classList.toggle("ok",ok);
  keyView.querySelector(".kv-msg").textContent=t(kind==="sata"?(ok?"kv_ok":"kv_no"):(ok?"kv_ramOk":"kv_ramNo"));
}
