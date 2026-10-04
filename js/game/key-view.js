/* ---------------- key view: small window showing how a keyed part lines up ----------------
   SATA plug held: the plug face and the port face, both as seen from in front of the port, so a match looks identical.
   USB plug held: the same two faces; the plug's plastic insert has to fill the half of the port its tongue leaves empty.
   HDMI / power-cord plug held: plug face and port face, cut corners on both.
   RAM stick held: the stick's edge above the slot, notch over key. Shown only while the part is in hand. */
const keyView=document.getElementById("keyView");
function sataKeySvg(job){
  const {len,housing:[h,wd]}=job.port, s=84/wd, pts=lPts(len).map(([z,y])=>(z*s).toFixed(1)+","+(-y*s).toFixed(1)).join(" "), pw=(len+.1)*s, ph=.36*s;
  const fig=(cap,body)=>`<figure><svg viewBox="-60 -45 120 90" aria-hidden="true">${body}</svg><figcaption>${cap}</figcaption></figure>`;
  return fig(t("kv_plug"),`<g class="kv-turn"><rect class="kv-body ${job.c.id}" x="${-pw/2}" y="${-ph/2}" width="${pw}" height="${ph}" rx="2"/><polygon class="kv-slot ${job.c.id}" points="${pts}"/></g>`)
    +fig(t("kv_port"),`<rect class="kv-housing" x="${-wd*s/2}" y="${-h*s/2}" width="${wd*s}" height="${h*s}" rx="2"/><polygon class="kv-tongue" points="${pts}"/>`);
}
// USB-A, face on. Plug: steel shell, insert along the bottom at roll 0. Port: tongue along the top.
function usbKeySvg(){
  const fig=(cap,body)=>`<figure><svg viewBox="-60 -45 120 90" aria-hidden="true">${body}</svg><figcaption>${cap}</figcaption></figure>`;
  const shell=`<rect class="kv-usbshell" x="-42" y="-16" width="84" height="32" rx="2"/><rect class="kv-usbhole" x="-38" y="-12" width="76" height="24"/>`;
  const pins=y=>[0,1,2,3].map(i=>`<rect class="kv-gold" x="${-27+i*15}" y="${y}" width="9" height="3"/>`).join("");
  return fig(t("kv_plug"),`<g class="kv-turn">${shell}<rect class="kv-usbins" x="-36" y="0" width="72" height="10"/>${pins(0)}</g>`)
    +fig(t("kv_port"),`${shell}<rect class="kv-usbins" x="-36" y="-10" width="72" height="10"/>${pins(-3)}`);
}
// HDMI and the IEC power cord, face on: the same keyed outline (two cut corners) on plug and port. At roll 0 they match.
// HDMI is wide with the cut corners along the bottom; the PSU inlet stands on end (portrait) with its cut corners on the left.
function cutPath(w,h,c,side){ const a=-w/2, b=w/2, t=-h/2, u=h/2;
  return side==="left"?`M${a+c} ${t}H${b}V${u}H${a+c}L${a} ${u-c}V${t+c}z`:`M${a} ${t}H${b}V${u-c}L${b-c} ${u}H${a+c}L${a} ${u-c}z`; }
function shapeKeySvg(kind){
  const fig=(cap,body)=>`<figure><svg viewBox="-60 -45 120 90" aria-hidden="true">${body}</svg><figcaption>${cap}</figcaption></figure>`;
  if(kind==="hdmi"){ const out=cutPath(84,30,10), hole=cutPath(72,20,7);
    return fig(t("kv_plug"),`<g class="kv-turn"><path class="kv-hdmishell" d="${out}"/><path class="kv-usbhole" d="${hole}"/><rect class="kv-gold" x="-28" y="-4" width="56" height="5"/></g>`)
      +fig(t("kv_port"),`<path class="kv-housing" d="${cutPath(92,38,12)}"/><path class="kv-usbhole" d="${out}"/><rect class="kv-tongue" x="-30" y="-5" width="60" height="7"/>`); }
  const out=cutPath(46,70,12,"left"), pins=[[-8,-16],[-8,16],[12,0]];   // C13 plug: three holes; C14 inlet: three pins
  return fig(t("kv_plug"),`<g class="kv-turn"><path class="kv-iecbody" d="${out}"/>${pins.map(([x,y])=>`<rect class="kv-usbhole" x="${x-3}" y="${y-8}" width="6" height="16"/>`).join("")}</g>`)
    +fig(t("kv_port"),`<path class="kv-housing" d="${cutPath(58,84,16,"left")}"/><path class="kv-usbhole" d="${out}"/>${pins.map(([x,y])=>`<rect class="kv-pin" x="${x-2.5}" y="${y-7}" width="5" height="14"/>`).join("")}`);
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
  const job=S.job, kind=S.held==="conn"&&job&&isLJob(job)?"sata":S.held==="conn"&&job&&job.choose==="usb"?"usb":S.held==="conn"&&job&&job.c.id==="hdmi"?"hdmi":S.held==="conn"&&job&&job.c.id==="ac"?"iec":S.held==="ram"&&S.ram>=0?"ram":null, was=!keyView.hidden;
  keyView.hidden=!kind; if(!kind) return;
  const faces=keyView.querySelector(".kv-faces"), id=(kind==="sata"?job.c.id+job.port.len:kind)+lang;
  if(keyView.dataset.id!==id){ keyView.dataset.id=id; faces.innerHTML=kind==="sata"?sataKeySvg(job):kind==="usb"?usbKeySvg():kind==="ram"?ramKeySvg():shapeKeySvg(kind); faces.classList.toggle("one",kind==="ram"); }
  const ok=kind==="ram"?!mod(S.rot.ram,2):mod(S.roll,4)===0, g=faces.querySelector(".kv-turn");
  if(!was) g.style.transition="none";                                          // appear already turned, don't spin in
  g.style.transform=kind==="ram"?`scaleX(${ok?1:-1})`:`rotate(${S.roll*90}deg)`;
  if(!was){ g.getBoundingClientRect(); g.style.transition=""; }
  if(kind==="ram") faces.querySelector(".kv-notchlbl").setAttribute("x",(ok?-1:1)*NOTCH*15.5);
  keyView.classList.toggle("ok",ok);
  keyView.querySelector(".kv-msg").textContent=t({sata:ok?"kv_ok":"kv_no",usb:ok?"kv_usbOk":"kv_usbNo",hdmi:ok?"kv_cutOk":"kv_cutNo",iec:ok?"kv_cutOk":"kv_cutNo",ram:ok?"kv_ramOk":"kv_ramNo"}[kind]);
}
// RAM in hand over a slot: two dotted lines in the 3D view. One rises from the slot's key, the other runs down the stick
// through its notch. Stick the right way round: they meet in one straight green line. Wrong way: the notch line is red and off to the side.
const ramGuideMat=c=>new T.MeshBasicMaterial({color:c,depthTest:false,depthWrite:false,transparent:true,opacity:.95,toneMapped:false});
function dotLine(parent,n,mat){ const g=new T.Group(); g.visible=false; parent.add(g);
  for(let i=0;i<n;i++){ const d=new T.Mesh(box(.08,.17,.08),mat); d.position.y=i*.3+.085; d.renderOrder=11; d.raycast=()=>{}; g.add(d); }
  return g; }
const keyGuideMat=ramGuideMat(0xffc400), notchGuideMat=ramGuideMat(0xff3b30);
const keyGuide=dotLine(boardRoot,Math.ceil((RAM_HOVER-.85)/.3),keyGuideMat);          // slot top up to the hovering stick
const notchGuides=rams.map(r=>{ const g=dotLine(r.yaw,12,notchGuideMat); g.position.z=NOTCH; return g; });   // stick's bottom edge up through the notch
function updateRamGuides(){
  const on=BUILD_MODE&&S.held==="ram"&&S.ram>=0&&!!S.snap&&S.snap.key!=null, ok=on&&!mod(S.rot.ram,2);
  keyGuide.visible=on; notchGuides.forEach((g,i)=>g.visible=on&&i===S.ram);
  if(!on) return;
  keyGuide.position.set(SLOT_X[S.snap.key],.85,SLOT_Z+NOTCH);
  keyGuideMat.color.set(ok?0x22d36b:0xffc400); notchGuideMat.color.set(ok?0x22d36b:0xff3b30);
}
