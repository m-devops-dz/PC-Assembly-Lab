function drawPasteLeg(i,A,B){
  const geo=new T.TubeGeometry(new T.LineCurve3(A,B),2,.13,10,false);
  if(!pasteLines[i]){ pasteLines[i]=new T.Mesh(geo,pasteMat); pasteLines[i].castShadow=false; boardRoot.add(pasteLines[i]); } else { pasteLines[i].geometry.dispose(); pasteLines[i].geometry=geo; }
  pasteLines[i].visible=true;
}
function applyPasteX(){
  const y=.86+.12, d=1.25, legs=[[V3(SX-d,y,SZ-d),V3(SX+d,y,SZ+d)],[V3(SX+d,y,SZ-d),V3(SX-d,y,SZ+d)]];
  const leg=i=>{
    if(i>=2){ tween(600,k=>{ pasteG.position.y=y+.05+k*8; pasteG.position.x=SX+d-k*6; },()=>{ pasteG.visible=false; S.busy=false; toast(t("ok_paste"),"ok"); setStep(ST.cooler); }); return; }
    const [A,B]=legs[i], p0=pasteG.position.clone(), p1=V3(A.x,y+.05,A.z);
    tween(450,k=>{ pasteG.position.lerpVectors(p0,p1,k); pasteG.position.y+=Math.sin(k*Math.PI)*.9; },()=>{
      tween(1000,k=>{ const P=A.clone().lerp(B,Math.max(k,.02)); pasteG.position.set(P.x,y+.05,P.z); drawPasteLeg(i,A,P); },()=>leg(i+1),k=>k); });
  };
  leg(0);
}
