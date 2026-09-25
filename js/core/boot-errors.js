/* Show load problems on screen instead of a silent blank view (helps on phones, where there is no console). */
(function(){
  function show(msg){ var el=document.getElementById("loadMsg"); if(!el||el.classList.contains("err")) return; el.classList.add("err"); // keep the first error: later files fail only because an earlier one did el.style.display="grid";
    el.innerHTML="<div><b>The 3D view couldn't start on this device.</b><br><span>"+String(msg).replace(/[<>&]/g,"")+"</span><br><button onclick='location.reload()'>Reload</button></div>"; }
  window.__showLoadError=show;
  window.addEventListener("error",function(e){ if(!window.__sceneReady) show(e.message||"Script error"); });
  window.addEventListener("unhandledrejection",function(e){ if(!window.__sceneReady) show((e.reason&&e.reason.message)||"Error"); });
})();
