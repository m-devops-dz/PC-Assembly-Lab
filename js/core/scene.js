/* ---------------- renderer / scene ---------------- */
const vp=document.getElementById("viewport");
if(typeof THREE==="undefined") throw new Error("The three.js library didn't load. Check the internet connection and reload.");
if(!THREE.OrbitControls) throw new Error("The camera controls didn't load. Check the internet connection and reload.");
let renderer;
try{ renderer=new T.WebGLRenderer({antialias:!LOW||(window.devicePixelRatio||1)<2,alpha:true,powerPreference:"default"}); }
catch(e){ throw new Error("WebGL isn't available in this browser. Try Chrome or Safari, or turn off battery/data saver."); }
renderer.domElement.addEventListener("webglcontextlost",ev=>{ ev.preventDefault(); if(window.__showLoadError) window.__showLoadError("The phone ran out of graphics memory. Close other tabs and reload."); },false);
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,LOW?1.5:2));
renderer.outputEncoding=T.sRGBEncoding; renderer.toneMapping=T.ACESFilmicToneMapping; renderer.toneMappingExposure=1.1;
renderer.shadowMap.enabled=true; renderer.shadowMap.type=T.PCFSoftShadowMap; renderer.setClearColor(0,0);
vp.prepend(renderer.domElement);
const scene=new T.Scene();
const boardRoot=new T.Group(); scene.add(boardRoot);
const camera=new T.PerspectiveCamera(36,1,0.5,200);
const VIEWS={ cpu:{pos:[-0.6,25,6.2],tgt:[-2.5,0.6,-5]}, ram:{pos:[6.8,31,-3.8],tgt:[6.8,.5,-4.3]}, paste:{pos:[-4.6,23,-2.7],tgt:[-4.6,.5,-3.1]},
  bracket:{pos:[2.5,19,10],tgt:[-2.5,.5,-5]},                          // the whole socket and both bracket pieces, 45° from the front
  coolerTop:{pos:[-3,36,-2.4],tgt:[-3,1,-3]}, coolerDrop:{pos:[-1,24,19],tgt:[-1,1,-3]},   // placing the cooler: straight down; lowering it and the screws: 45° from the front
  fan:{pos:[9,13,1],tgt:[0,1,-8.5]},
  m2:{pos:[3,15,19],tgt:[-1,.5,5.5]}, m2Screw:{pos:[-2.6,7.5,12.5],tgt:[-5.4,.4,6.6]},   // close on the M.2 screw
  m2Table:{pos:[7,38,14],tgt:[7,0,-1]},                                // the M.2 socket and the screw lying on the parts mat
  psu:{pos:[-54,56,-1],tgt:[4,3,-37]}, "case":{pos:[-35,58.2,-47.4],tgt:[0,0,-25]}, caseClose:{pos:[-35,58.2,-47.4],tgt:[2,4,-47]},
  gpu:{pos:[-4.8,55,-32.2],tgt:[-5.1,6.4,-46.3]}, sata:{pos:[36,28,-16],tgt:[18,2,-40]}, sataTop:{pos:[22.5,34,-34.4],tgt:[22.5,.75,-35]}, all:{pos:[96,46,-24],tgt:[22,10,-70]},
  atx24:{pos:[33,40,-45],tgt:[13,2,-52]}, cpuPwr:{pos:[4,34,-48],tgt:[-8,3,-60]},
  battery:{pos:[-1.5,15,18],tgt:[-1.5,.5,9]}, boardTop:{pos:[2,46,-33],tgt:[0,1,-50]}, pcie:{pos:[5,12,-57],tgt:[-5,1,-47]},
  gpuPwr:{pos:[16,36,-22],tgt:[12,6,-46]}, gpuPwrPlug:{pos:[5.5,40,-25],tgt:[1,9,-48]}, frontPanel:{pos:[12.1,25.1,-38.3],tgt:[13,1.5,-41]}, caseFan:{pos:[18,38,-42],tgt:[-6,3,-58]},
  frontUsb:{pos:[24,27,-35],tgt:[13.9,1.5,-47.8]},
  rearIO:{pos:[-40,15,-49],tgt:[-16,3,-48]},
  periph:{pos:[-70,50,-64],tgt:[-32,0,-63]},                         // the whole keyboard, the mouse and the rear I/O
  powerBtn:{pos:[48,20,-57],tgt:[29.8,9,-64]}, fansOn:{pos:[24,38,-47],tgt:[-9,8,-57]},   // front power button; through the glass: CPU cooler and rear fan                         // the whole keyboard, the mouse and the rear I/O
  psuBack:{pos:[-56,25,-4],tgt:[-17,8,-30]},                       // outside, behind the case: the PSU's power inlet
  wifi:{pos:[-6.2,47.9,-35],tgt:[-8,3,-41]},
  tsFront:{pos:[46,46,-14],tgt:[4,4,-48]},                           // troubleshooting: the built PC from the front, through the glass
  antennas:{pos:[-40,17,-31],tgt:[-17,8,-40]} };                      // outside, behind the case: the Wi-Fi card's bracket                            // the x1 slots below the graphics card
let view="cpu";
camera.position.set(...VIEWS.cpu.pos);
const controls=new T.OrbitControls(camera,renderer.domElement);
controls.target.set(...VIEWS.cpu.tgt); controls.enableDamping=true; controls.dampingFactor=.08; controls.maxPolarAngle=1.42; controls.minDistance=4; controls.maxDistance=100; controls.update();
function focus(name,dur=900){ view=name; const p0=camera.position.clone(), t0=controls.target.clone(), p1=new T.Vector3(...VIEWS[name].pos), t1=new T.Vector3(...VIEWS[name].tgt); tween(dur,k=>{ camera.position.lerpVectors(p0,p1,k); controls.target.lerpVectors(t0,t1,k); }); }
// straight down onto whatever the camera is looking at, keeping the current distance
function topView(dur=700){ const t=controls.target.clone(), d=Math.max(camera.position.distanceTo(t),8); view="top";
  const p0=camera.position.clone(), p1=new T.Vector3(t.x,t.y+d,t.z+d*.02); tween(dur,k=>camera.position.lerpVectors(p0,p1,k)); }

(function makeEnv(){ const pm=new T.PMREMGenerator(renderer), s=new T.Scene();
  s.add(new T.Mesh(new T.BoxGeometry(20,20,20),new T.MeshBasicMaterial({color:0x2c3136,side:T.BackSide})));   // dim room, so metals reflect softboxes, not a grey haze
  const panel=(w,h,p,v)=>{ const m=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({color:new T.Color(v,v,v),side:T.DoubleSide})); m.position.set(...p); m.lookAt(0,0,0); s.add(m); };
  panel(9,9,[0,9.5,0],2.4); panel(7,3,[9.5,3,2],1.5); panel(6,3,[-9.5,4,-3],.9); panel(8,2,[0,2,9.5],.8);
  scene.environment=pm.fromScene(s,.03).texture; pm.dispose(); })();
scene.add(new T.HemisphereLight(0xffffff,0x2a3a3e,.7));
const sun=new T.DirectionalLight(0xffffff,2.4); sun.position.set(8,20,10); sun.castShadow=true; sun.shadow.mapSize.set(LOW?1024:2048,LOW?1024:2048);
Object.assign(sun.shadow.camera,{left:-20,right:20,top:20,bottom:-20,near:1,far:60}); sun.shadow.bias=-.0004; sun.shadow.normalBias=.02; scene.add(sun); scene.add(sun.target);
const fill=new T.DirectionalLight(0xcfe3ff,.8); fill.position.set(-10,8,-6); scene.add(fill);
const catcher=new T.Mesh(new T.PlaneGeometry(200,200),new T.ShadowMaterial({opacity:.3})); catcher.rotation.x=-Math.PI/2; catcher.position.y=-.11; catcher.receiveShadow=true; scene.add(catcher);

function mesh(geo,mat,pos,parent,opts={}){ const m=new T.Mesh(geo,mat); if(pos) m.position.set(...pos); m.castShadow=opts.cast!==false; m.receiveShadow=true; (parent||boardRoot).add(m); return m; }
const box=(w,h,d)=>new T.BoxGeometry(w,h,d);
const six=(side,top)=>[side,side,top,side,side,side];
