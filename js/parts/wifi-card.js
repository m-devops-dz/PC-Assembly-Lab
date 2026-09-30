/* ---------------- Wi-Fi 6E card (PCIe x1) ----------------
   Stands on end like the graphics card. Local x 0 is the middle of its gold finger, which sits over the x1 part
   of a slot (the first 2.5 cm from the bracket end); the bracket is at the rear wall (local x −2.75), the black
   finned heatsink on the +z face. Its two antennas come later (antenna step): they screw onto the jacks on the bracket, outside the case. */
const WIFI_SLOTS=[{name:"PCI_E2",z:5.0,err:"e_wifiCovered"},{name:"PCI_E3",z:6.8,err:"e_wifiFans"},
  {name:"PCI_E4",z:8.6,ok:true},{name:"PCI_E5",z:10.2,ok:true},{name:"PCI_E6",z:11.6,ok:true}];
const WIFI_X=L.x+PCIE_X0+1.25, WIFI_HOVER=L.y+8, WIFI_SEAT=L.y+.7, WIFI_BRACKET=CX0+.8-WIFI_X;
const wifiG=new T.Group(); wifiG.visible=false; scene.add(wifiG);
const wifiSink=new T.MeshStandardMaterial({metalness:.55,roughness:.45,map:canvasTex(512,384,(g,W,H)=>{ brushed(g,W,H,"#15161a",71,900);
  for(let y=18;y<H-10;y+=24){ g.fillStyle="rgba(0,0,0,.6)"; g.fillRect(W*.05,y,W*.8,10); g.fillStyle="rgba(255,255,255,.07)"; g.fillRect(W*.05,y+10,W*.8,2); }   // fins
  g.save(); g.translate(W*.95,H*.62); g.rotate(-Math.PI/2); g.fillStyle="#c9ced4"; g.font="700 40px 'Barlow Semi Condensed', Arial"; g.fillText("WIFI 6E",0,0); g.restore(); })});
const wifiBlack=new T.MeshStandardMaterial({color:0x121316,roughness:.5}), antennaMat=new T.MeshStandardMaterial({color:0x0e0f11,roughness:.7});
const wifiParts=[mesh(box(7.6,5.2,.16),new T.MeshStandardMaterial({color:0x1b1d22,roughness:.6}),[1.2,3.0,0],wifiG),                 // PCB
  mesh(box(2.5,.8,.18),new T.MeshStandardMaterial({color:0xe2b95a,metalness:.85,roughness:.3}),[0,.4,0],wifiG),                    // x1 gold finger
  mesh(box(5.8,4.3,.8),[wifiBlack,wifiBlack,wifiBlack,wifiBlack,wifiSink,wifiBlack],[1.7,3.15,.48],wifiG),                         // heatsink
  mesh(box(.14,12,1.6),bracketSteel,[WIFI_BRACKET,6.2,.1],wifiG)];                                                                   // full-height bracket, centred on its slot
// two RP-SMA jacks: through the case's slot opening (in line with the PCB, z ±0.45), sticking 0.7 cm out of the rear wall
const WIFI_JACK_Z=.1, WIFI_JACK_END=WIFI_BRACKET-1.55;
[3.6,7.8].forEach(y=>{ const jack=mesh(new T.CylinderGeometry(.28,.28,1.5,16),new T.MeshStandardMaterial({color:0xd4af37,metalness:.9,roughness:.3}),[WIFI_BRACKET-.8,y,WIFI_JACK_Z],wifiG);
  jack.rotation.z=Math.PI/2; wifiParts.push(jack); });
wifiParts.forEach(m=>m.userData.part="wifi");
/* antennas: hinged on the jacks and swung up, fanned apart so they clear each other. antennaAt(a,d) holds one d cm out from
   its jack, pointing straight out; antennaPose(a,k) swings it from there (k 0, just screwed on) to up (k 1). */
const WIFI_ANTENNAS=[[3.6,-.28],[7.8,.28]].map(([y,fan])=>{ const g=new T.Group(); g.visible=false; wifiG.add(g);
  mesh(new T.CylinderGeometry(.36,.36,.9,16),antennaMat,[0,.2,0],g); mesh(new T.CylinderGeometry(.26,.38,10.5,16),antennaMat,[0,5.9,0],g);
  return {g,y,fan}; });
function antennaAt(a,d,spin=0){ a.g.position.set(WIFI_JACK_END-.2-d,a.y,WIFI_JACK_Z); a.g.rotation.set(spin,0,Math.PI/2); }
function antennaPose(a,k){ a.g.position.set(WIFI_JACK_END-.2,a.y,WIFI_JACK_Z); a.g.rotation.set(a.fan*k,0,Math.PI/2+(.12-Math.PI/2)*k); }
mesh(box(8.8,6.4,2.4),new T.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}),[1.0,3.1,.6],wifiG,{cast:false}).userData.part="wifi";   // easier to grab
