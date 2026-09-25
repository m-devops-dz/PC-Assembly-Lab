/* ---------------- photo textures ---------------- */
function applyPhoto(slot,src){
  const img=new Image();
  img.onload=()=>{ const tex=new T.Texture(img); tex.encoding=T.sRGBEncoding; tex.anisotropy=8; tex.needsUpdate=true;
    const mats={cpuTop:[ihsTopMat],ram:[ramLabelMat,ramPlainMat],board:[boardTopMat]}[slot]; if(!mats) return;
    mats.forEach(m=>{ m.map=tex; m.color.set(0xffffff); m.needsUpdate=true; }); drawThumbs(); };
  img.src=src;
}
Object.entries(PHOTO_URLS).forEach(([k,u])=>{ if(u) applyPhoto(k,u); });
document.querySelectorAll("[data-photo]").forEach(inp=>inp.addEventListener("change",()=>{ const f=inp.files&&inp.files[0]; if(!f) return; const r=new FileReader(); r.onload=()=>{ applyPhoto(inp.dataset.photo,r.result); toast(t("ok_photo"),"ok"); }; r.readAsDataURL(f); }));
