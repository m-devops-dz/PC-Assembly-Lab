/* ---------------- PSU cables card ----------------
   When the PSU is taken, a card lists its cables and what each one powers: a plug, a wire with power running
   along it (a moving bolt), and the part at the end. The 4+4 CPU plug and the 6+2 GPU plug split and join again.
   It goes away with its × or when the PSU step is done. */
const psuInfo=document.getElementById("psuInfo");
const PI_ROWS=[
  {id:"cpu", plug:`<g class="pi-plug"><rect x="2" y="13" width="24" height="26" rx="2"/><g class="pi-pins">${[[8,19],[20,19],[8,31],[20,31]].map(([x,y])=>`<rect x="${x-3}" y="${y-3}" width="6" height="6"/>`).join("")}</g></g>
    <g class="pi-plug pi-half"><rect x="28" y="13" width="24" height="26" rx="2"/><g class="pi-pins">${[[34,19],[46,19],[34,31],[46,31]].map(([x,y])=>`<rect x="${x-3}" y="${y-3}" width="6" height="6"/>`).join("")}</g></g>
    <text class="pi-tag" x="27" y="9" text-anchor="middle">4+4</text>`,
   part:`<g class="pi-cpu"><rect x="150" y="9" width="32" height="32" rx="3"/>${[0,1,2,3,4].map(i=>`<rect x="${153+i*6}" y="5" width="2" height="4"/><rect x="${153+i*6}" y="41" width="2" height="4"/><rect x="146" y="${12+i*6}" width="4" height="2"/><rect x="182" y="${12+i*6}" width="4" height="2"/>`).join("")}<text x="166" y="29" text-anchor="middle">CPU</text></g>`},
  {id:"24", plug:`<g class="pi-plug"><rect x="2" y="14" width="56" height="24" rx="2"/><rect x="24" y="9" width="12" height="5"/><g class="pi-pins">${Array.from({length:24},(_,i)=>`<rect x="${5+(i%12)*4.4}" y="${i<12?18:28}" width="3" height="5"/>`).join("")}</g></g>
    <text class="pi-tag" x="30" y="48" text-anchor="middle">24-pin</text>`,
   part:`<g class="pi-mb"><rect x="142" y="6" width="50" height="38" rx="2"/><rect class="pi-mbsock" x="148" y="12" width="14" height="14"/><rect class="pi-mbslot" x="166" y="11" width="3" height="18"/><rect class="pi-mbslot" x="172" y="11" width="3" height="18"/><rect class="pi-mbslot" x="148" y="33" width="38" height="3"/><rect class="pi-mb24" x="184" y="11" width="5" height="16"/></g>`},
  {id:"sata", plug:`<g class="pi-plug"><path d="M4 18H54V34H12V28H4z"/><g class="pi-pins">${[0,1,2,3,4,5,6,7].map(i=>`<rect x="${15+i*4.6}" y="24" width="2.4" height="6"/>`).join("")}</g></g>
    <text class="pi-tag" x="30" y="48" text-anchor="middle">SATA</text>`,
   part:`<g class="pi-ssd"><rect x="144" y="10" width="46" height="30" rx="3"/><rect class="pi-ssdlbl" x="150" y="16" width="34" height="18" rx="2"/><text x="167" y="29" text-anchor="middle">SSD</text></g>`},
  {id:"gpu", plug:`<g class="pi-plug"><rect x="2" y="13" width="34" height="26" rx="2"/><g class="pi-pins">${[0,1,2].map(i=>`<rect x="${6+i*10}" y="16" width="6" height="6"/><rect x="${6+i*10}" y="30" width="6" height="6"/>`).join("")}</g></g>
    <g class="pi-plug pi-half"><rect x="38" y="13" width="14" height="26" rx="2"/><g class="pi-pins"><rect x="42" y="16" width="6" height="6"/><rect x="42" y="30" width="6" height="6"/></g></g>
    <text class="pi-tag" x="27" y="9" text-anchor="middle">6+2</text>`,
   part:`<g class="pi-gpu"><rect x="138" y="10" width="56" height="30" rx="3"/><g class="pi-fan"><circle cx="156" cy="25" r="11"/>${[0,72,144,216,288].map(a=>`<path d="M156 25l0-10a6 6 0 0 1 5 5z" transform="rotate(${a} 156 25)"/>`).join("")}</g><rect class="pi-gpuout" x="174" y="16" width="14" height="4"/><rect class="pi-gpuout" x="174" y="24" width="14" height="4"/><rect class="pi-gpugold" x="146" y="40" width="30" height="3"/></g>`}
];
const PI_BOLT=`<path d="M4 -9L-4 1H1L-2 9L6 -2H1z"/>`;
function piRow(r,i){
  const svg=`<svg viewBox="0 0 196 50" aria-hidden="true">${r.plug}<line class="pi-wire" x1="60" y1="26" x2="138" y2="26"/><line class="pi-flow" x1="60" y1="26" x2="138" y2="26"/>`
    +`<g class="pi-bolt" style="animation-delay:${-i*.35}s">${PI_BOLT}</g>${r.part}</svg>`;
  return `<li class="pi-row pi-${r.id}">${svg}<p><b>${t("pi_"+r.id)}</b> ${t("pi_"+r.id+"D")}</p></li>`;
}
function renderPsuInfo(){ if(psuInfo.hidden) return;
  psuInfo.innerHTML=`<div class="pi-head"><b>${t("pi_title")}</b><button class="pi-x" id="piX" aria-label="${t("pi_close")}">×</button></div><ol>${PI_ROWS.map(piRow).join("")}</ol><p class="pi-note">${t("pi_note")}</p>`;
  document.getElementById("piX").onclick=hidePsuInfo; }
function showPsuInfo(){ if(!BUILD_MODE) return; psuInfo.hidden=false; renderPsuInfo(); }
function hidePsuInfo(){ psuInfo.hidden=true; psuInfo.innerHTML=""; }
