/* ---------------- photo textures + photo themes ----------------
   A theme is a .zip of photos named after the slots below (board.jpg, cpuTop.png, ...), anywhere in the zip,
   optionally with a theme.json next to them: { "name": "...", "photos": { "board": "board.jpg", ... } }.
   Built-in themes live in themes/ (BUILTIN_THEMES) and are picked from the viewport's theme menu; the default is theme1.
   Photos the user adds themselves are kept in IndexedDB so they survive a reload, and show up in the menu as "My photos". */
const PHOTO_SLOTS={ board:[boardTopMat], cpuTop:[ihsTopMat], ram:[ramLabelMat,ramPlainMat], m2:[m2Top], sata:[sataTop], gpu:[gpuShroud], psu:[psuLabel] };
const PHOTO_EXT={ jpg:"image/jpeg", jpeg:"image/jpeg", png:"image/png", webp:"image/webp", gif:"image/gif", avif:"image/avif" };
const photoOrig=new Map(Object.values(PHOTO_SLOTS).flat().map(m=>[m,{map:m.map,color:m.color.getHex(),metalness:m.metalness,roughness:m.roughness}]));
const photoBlobs={};                                   // slot → Blob on screen (URL-config photos aren't stored)
let themeName="";

function loadImg(src){ return new Promise((ok,err)=>{ const img=new Image(); img.onload=()=>ok(img); img.onerror=()=>err(new Error("image")); img.src=src; }); }
function setSlotMap(slot,tex){
  PHOTO_SLOTS[slot].forEach(m=>{ const o=photoOrig.get(m); if(m.map!==o.map&&m.map!==tex) m.map.dispose();
    m.map=tex||o.map; m.color.set(tex?0xffffff:o.color); m.metalness=tex?Math.min(o.metalness,.25):o.metalness; m.roughness=tex?Math.max(o.roughness,.7):o.roughness; m.needsUpdate=true; });   // a photo already has its own lighting and reflections
}
async function applyPhoto(slot,src){
  if(!PHOTO_SLOTS[slot]) return false;
  const url=src instanceof Blob?URL.createObjectURL(src):src;
  const img=await loadImg(url);
  const tex=new T.Texture(img); tex.encoding=T.sRGBEncoding; tex.anisotropy=renderer.capabilities.getMaxAnisotropy(); tex.needsUpdate=true;
  setSlotMap(slot,tex);
  if(src instanceof Blob) photoBlobs[slot]=src; else delete photoBlobs[slot];
  return true;
}
function clearPhotos(){ Object.keys(PHOTO_SLOTS).forEach(s=>{ setSlotMap(s,null); delete photoBlobs[s]; }); themeName=""; }

/* IndexedDB: one record, {name, photos:{slot:Blob}}. Fails quietly where storage is blocked. */
function photoDB(mode,fn){ return new Promise(ok=>{ try{ const r=indexedDB.open("pcLabPhotos",1);
  r.onupgradeneeded=()=>r.result.createObjectStore("kv");
  r.onsuccess=()=>{ const tx=r.result.transaction("kv",mode), q=fn(tx.objectStore("kv")); tx.oncomplete=()=>ok(q&&q.result); tx.onerror=tx.onabort=()=>ok(); };
  r.onerror=()=>ok(); }catch(e){ ok(); } }); }
const savePhotos=()=>photoDB("readwrite",st=>st.put({name:themeName,photos:{...photoBlobs}},"theme"));

async function loadTheme(data,fileName){                // data: a Blob/File, or the zip as a base64 string
  if(typeof JSZip==="undefined") throw new Error("nozip");
  const zip=await JSZip.loadAsync(data,typeof data==="string"?{base64:true}:undefined), found={};
  let name=fileName.replace(/\.zip$/i,"");
  const manifest=zip.file(/(^|\/)theme\.json$/i)[0];
  if(manifest){ const j=JSON.parse(await manifest.async("string")), dir=manifest.name.replace(/[^/]*$/,"");
    if(j.name) name=String(j.name);
    Object.entries(j.photos||{}).forEach(([slot,p])=>{ const f=zip.file(dir+p); if(f&&PHOTO_SLOTS[slot]) found[slot]=f; }); }
  zip.forEach((path,f)=>{ const m=!f.dir&&path.match(/([^/]+)\.([a-z]+)$/i); if(!m||!PHOTO_EXT[m[2].toLowerCase()]) return;
    const slot=Object.keys(PHOTO_SLOTS).find(s=>s.toLowerCase()===m[1].toLowerCase()); if(slot&&!found[slot]) found[slot]=f; });
  const slots=Object.keys(found); if(!slots.length) throw new Error("empty");
  clearPhotos();
  for(const slot of slots){ const f=found[slot], ext=f.name.split(".").pop().toLowerCase();
    await applyPhoto(slot,new Blob([await f.async("arraybuffer")],{type:PHOTO_EXT[ext]})); }
  themeName=name; return slots.length;
}
async function downloadTheme(){
  const zip=new JSZip(), photos={};
  Object.entries(photoBlobs).forEach(([slot,b])=>{ const ext=(Object.entries(PHOTO_EXT).find(([,v])=>v===b.type)||["jpg"])[0]; photos[slot]=slot+"."+ext; zip.file(photos[slot],b); });
  zip.file("theme.json",JSON.stringify({name:themeName||"My parts",photos},null,2));
  const a=document.createElement("a"); a.href=URL.createObjectURL(await zip.generateAsync({type:"blob"}));
  a.download=(themeName||"pc-lab-theme").replace(/[^\w\- ]+/g,"_")+".zip"; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),5000);
}
function renderPhotoUI(){
  const n=Object.keys(photoBlobs).length;
  document.getElementById("themeName").textContent=n?t("themeActive",{n:themeName||t("themeCustom"),c:n}):"";
  document.getElementById("themeSave").disabled=!n; document.getElementById("photoClear").disabled=!n;
  renderThemeSel();
}
function photosChanged(){ hasCustom=Object.keys(photoBlobs).length>0; themeChoice=hasCustom?"custom":"none"; try{ localStorage.setItem("pcLabTheme",themeChoice); }catch(e){}
  drawThumbs(); renderPhotoUI(); savePhotos(); }   // anything the user loads or removes by hand becomes "My photos"

Object.entries(PHOTO_URLS).forEach(([k,u])=>{ if(u) applyPhoto(k,u).then(drawThumbs,()=>{}); });
/* theme menu: built-in zips, none (generated surfaces), or the user's own photos from IndexedDB */
const BUILTIN_THEMES={ theme1:"real-parts.zip", theme2:"theme2.zip" };
const themeSel=document.getElementById("themeSel");
let themeChoice="theme1", hasCustom=false;
try{ themeChoice=localStorage.getItem("pcLabTheme")||"theme1"; }catch(e){}
function renderThemeSel(){
  themeSel.innerHTML=[...Object.keys(BUILTIN_THEMES),"none",...(hasCustom?["custom"]:[])].map(id=>`<option value="${id}">${t("th_"+id)}</option>`).join("");
  themeSel.value=themeChoice;
}
// fetch() works over http(s); a page opened from a file gets the zip from themes/<file>.js instead (see CLAUDE.md)
function themeZip(file){
  return fetch("themes/"+file).then(r=>{ if(!r.ok) throw new Error("missing"); return r.blob(); }).catch(()=>new Promise((ok,err)=>{
    const have=()=>window.THEME_ZIPS&&THEME_ZIPS[file]; if(have()) return ok(have());
    const s=document.createElement("script"); s.src="themes/"+file+".js";
    s.onload=()=>have()?ok(have()):err(new Error("missing")); s.onerror=()=>err(new Error("missing")); document.head.appendChild(s); }));
}
async function pickTheme(id,quiet){
  themeSel.disabled=true;
  try{
    if(id==="none") clearPhotos();
    else if(id==="custom"){ const rec=await photoDB("readonly",st=>st.get("theme")); clearPhotos();
      for(const [slot,b] of Object.entries(rec&&rec.photos||{})) await applyPhoto(slot,b).catch(()=>{});
      themeName=rec&&rec.name||""; }
    else await loadTheme(await themeZip(BUILTIN_THEMES[id]),BUILTIN_THEMES[id]);
    themeChoice=id; try{ localStorage.setItem("pcLabTheme",id); }catch(e){}
    drawThumbs(); renderPhotoUI();
    if(!quiet) toast(id==="none"?t("ok_photoClear"):t("ok_theme",{n:themeName||t("themeCustom"),c:Object.keys(photoBlobs).length}),"ok");
  }catch(e){ if(!quiet) toast(t(e.message==="nozip"?"e_themeLib":"e_themeMissing"),"err"); renderThemeSel(); }
  themeSel.disabled=false;
}
themeSel.onchange=()=>pickTheme(themeSel.value);
photoDB("readonly",st=>st.get("theme")).then(rec=>{
  hasCustom=!!(rec&&rec.photos&&Object.keys(rec.photos).length);
  if(themeChoice==="custom"&&!hasCustom) themeChoice="theme1";
  renderThemeSel(); pickTheme(themeChoice,true); });
document.querySelectorAll("[data-photo]").forEach(inp=>inp.addEventListener("change",async()=>{ const f=inp.files&&inp.files[0]; inp.value=""; if(!f) return;
  try{ await applyPhoto(inp.dataset.photo,f); photosChanged(); toast(t("ok_photo"),"ok"); }catch(e){ toast(t("e_photo"),"err"); } }));
document.getElementById("themeFile").addEventListener("change",async e=>{ const f=e.target.files&&e.target.files[0]; e.target.value=""; if(!f) return;
  try{ const c=await loadTheme(f,f.name); photosChanged(); toast(t("ok_theme",{n:themeName,c}),"ok"); }
  catch(err){ toast(t(err.message==="nozip"?"e_themeLib":err.message==="empty"?"e_themeEmpty":"e_theme"),"err"); } });
document.getElementById("themeSave").onclick=()=>{ if(typeof JSZip==="undefined") toast(t("e_themeLib"),"err"); else downloadTheme(); };
document.getElementById("photoClear").onclick=()=>{ clearPhotos(); photosChanged(); toast(t("ok_photoClear"),"ok"); };
