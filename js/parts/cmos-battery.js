/* ---------------- CMOS battery (CR2032) + BAT1 holder ---------------- */
const BAT_POS=V3(-1.5,0,9.4), BAT_SEAT=.37, BAT_HOVER=3;
(function holder(){ const x=BAT_POS.x, z=BAT_POS.z, rimMat=blackPlastic.clone(); rimMat.side=T.DoubleSide;
  mesh(new T.CylinderGeometry(1.14,1.14,.1,40),blackPlastic,[x,.15,z]);                                      // base
  mesh(new T.CylinderGeometry(1.16,1.16,.34,40,1,true,2.46,4.5),rimMat,[x,.37,z]);                             // rim, open toward +x where the clip is
  mesh(new T.CylinderGeometry(.3,.3,.03,16),screwMetal,[x,.215,z]);                                          // − contact
  mesh(box(.12,.46,.9),screwMetal,[x+1.22,.4,z]);                                                            // + clip post
  mesh(box(.5,.05,.9),screwMetal,[x+1.0,.62,z]); })();                                                       // + clip tongue, presses on the top
const batG=new T.Group(); batG.visible=false; boardRoot.add(batG);
const batFlip=new T.Group(); batG.add(batFlip);
const batTop=new T.MeshStandardMaterial({map:canvasTex(256,256,(g,W)=>{ const gr=g.createRadialGradient(W*.4,W*.35,10,W/2,W/2,W/2);
  gr.addColorStop(0,"#eef0f2"); gr.addColorStop(1,"#9aa0a7"); g.fillStyle=gr; g.beginPath(); g.arc(W/2,W/2,W/2,0,7); g.fill();
  g.fillStyle="#2b2e33"; g.textAlign="center"; g.font="700 64px 'Barlow Semi Condensed', Arial"; g.fillText("+",W/2,W*.34);
  g.font="700 50px 'Barlow Semi Condensed', Arial"; g.fillText("CR2032",W/2,W*.6); g.font="600 34px Barlow, Arial"; g.fillText("3V  LITHIUM",W/2,W*.76); }),metalness:.8,roughness:.3});
const batSide=new T.MeshStandardMaterial({color:0xc4c9cf,metalness:.9,roughness:.3}), batBottom=new T.MeshStandardMaterial({color:0x8e949b,metalness:.85,roughness:.35});
mesh(new T.CylinderGeometry(1.0,1.0,.32,40),[batSide,batTop,batBottom],[0,0,0],batFlip).userData.part="battery";
mesh(new T.CylinderGeometry(1.3,1.3,.9,16),new T.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}),[0,0,0],batG,{cast:false}).userData.part="battery";
