/* ---------------- download for offline use ----------------
   Packs the running app into one .zip: this page, every local <script> and stylesheet it loads (the libraries
   and fonts are in vendor/, so nothing needs the internet), the fonts named in vendor/fonts/fonts.css, and the
   built-in photo themes with their .zip.js copies (a page opened from a file can't fetch() the .zip).
   The list comes from the page itself, so new files are picked up without editing this. Needs http(s): a page
   opened from a file is already the offline copy. */
async function offlineFiles(){
  const local=u=>u&&!/^[a-z]+:/i.test(u);
  const files=["index.html",
    ...[...document.querySelectorAll("script[src]")].map(s=>s.getAttribute("src")),
    ...[...document.querySelectorAll('link[rel="stylesheet"]')].map(l=>l.getAttribute("href"))].filter(local);
  try{ const css=await (await fetch("vendor/fonts/fonts.css")).text();                  // font files, relative to the stylesheet
    for(const m of css.matchAll(/url\(([^)]+)\)/g)) files.push("vendor/fonts/"+m[1].replace(/['"]/g,"")); }catch(e){}
  Object.values(BUILTIN_THEMES).forEach(f=>files.push("themes/"+f,"themes/"+f+".js"));
  return [...new Set(files)];
}
async function downloadOffline(){
  const b=document.getElementById("offlineBtn");
  if(location.protocol==="file:"){ toast(t("off_file")); return; }
  if(b.disabled) return; b.disabled=true; toast(t("off_busy"));
  try{
    const zip=new JSZip(), root=zip.folder("pc-assembly-lab"), list=await offlineFiles(); let n=0;
    await Promise.all(list.map(async f=>{ const r=await fetch(f).catch(()=>null); if(!r||!r.ok) return;   // skip what isn't there (a theme not shipped yet)
      root.file(f,await r.arrayBuffer()); n++; }));
    root.file("READ ME.txt",t("off_readme")+"\r\n");
    const blob=await zip.generateAsync({type:"blob",compression:"DEFLATE",compressionOptions:{level:6}});
    const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download="pc-assembly-lab.zip"; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(()=>URL.revokeObjectURL(a.href),60000);
    toast(t("off_done",{n,mb:(blob.size/1048576).toFixed(1)}),"ok");
  }catch(e){ toast(t("off_err"),"err"); }
  b.disabled=false;
}
document.getElementById("offlineBtn").onclick=downloadOffline;
