/* ---------------- textures ---------------- */
function boardTexture(){
  return canvasTex(2048,1638,(g,W,H)=>{
    const R=rng(4), px=x=>(x+BW/2)/BW*W, pz=z=>(z+BD/2)/BD*H, U=W/BW;
    g.fillStyle="#101113"; g.fillRect(0,0,W,H);                      // matte black solder mask
    for(let i=0;i<16000;i++){ g.fillStyle=R()<.5?"rgba(255,255,255,.012)":"rgba(0,0,0,.25)"; g.fillRect(R()*W,R()*H,2,2); }
    g.lineCap="round"; g.lineJoin="round";
    for(let i=0;i<260;i++){ const x=R()*W,y=R()*H,n=3+(R()*8|0),vert=R()<.5,len=80+R()*420,turn=R()<.5?-1:1;
      g.strokeStyle=`rgba(48,51,57,${.35+R()*.3})`; g.lineWidth=2+R()*2;   // copper traces under black mask: barely lighter than the board
      for(let k=0;k<n;k++){ g.beginPath(); let a=x+(vert?k*9:0),b=y+(vert?0:k*9); g.moveTo(a,b);
        if(vert){ b+=len; g.lineTo(a,b); g.lineTo(a+turn*45,b+45); g.lineTo(a+turn*45,b+45+len*.5); } else { a+=len; g.lineTo(a,b); g.lineTo(a+45,b+turn*45); g.lineTo(a+45+len*.5,b+turn*45); } g.stroke(); } }
    // red accent graphics (angular, board-edge)
    g.strokeStyle="#b01c27"; g.lineWidth=5;
    [[[-15,11.2],[-6,11.2],[-5,10.2],[2,10.2]],[[15,-2],[15,5],[14,6],[14,11]],[[-15,-1],[-14.2,-0.2],[-14.2,2]]].forEach(pts=>{ g.beginPath(); pts.forEach(([x,z],k)=>k?g.lineTo(px(x),pz(z)):g.moveTo(px(x),pz(z))); g.stroke(); });
    // vias
    for(let i=0;i<900;i++){ const x=R()*W,y=R()*H; if(Math.abs(x-px(SX))<4*U&&Math.abs(y-pz(SZ))<4*U) continue; g.fillStyle="#3b3a37"; g.beginPath(); g.arc(x,y,2.6,0,7); g.fill(); g.fillStyle="#060607"; g.beginPath(); g.arc(x,y,1.1,0,7); g.fill(); }   // tented vias
    // silkscreen
    g.fillStyle="rgba(235,235,235,.92)"; g.strokeStyle="rgba(235,235,235,.8)"; g.lineWidth=3;
    g.font="600 26px Barlow, Arial, sans-serif";
    SLOT_X.forEach((x,i)=>{ g.save(); g.translate(px(x)-10,pz(3.0)); g.rotate(Math.PI/2); g.fillText(SLOT_NAMES[i],0,0); g.restore(); });
    [["PCI_E1",3.2,-5.2],["PCI_E2",5.0,-11.6],["PCI_E3",6.8,-11.6],["PCI_E4",8.6,-5.2],["PCI_E5",10.2,-11.6],["PCI_E6",11.6,-11.6]].forEach(([s,z,x])=>g.fillText(s,px(x),pz(z)+9)); g.fillText("M2_1",px(-4.2),pz(7.55));
    g.fillText("CPU_FAN1",px(0.4),pz(-11.7)); g.save(); g.translate(px(2.05),pz(-9.3)); g.rotate(Math.PI/2); g.fillText("SYS_FAN1",0,0); g.restore(); g.fillText("JPWR1",px(12.4),pz(-6.5)); g.fillText("CPU_PWR1",px(-11.1),pz(-11.9));
    g.fillText("BAT1",px(-3.2),pz(10.9)); g.fillText("SATA1_2",px(12.3),pz(5.75)); g.fillText("SATA3_4",px(12.3),pz(9.3)); g.fillText("JFP1",px(10.2),pz(11.95)); g.fillText("JAUD1",px(-11.4),pz(11.05)); g.fillText("JUSB1",px(4.3),pz(11.05)); g.fillText("JUSB2",px(6),pz(11.05)); g.save(); g.translate(px(13.2),pz(1.0)); g.rotate(Math.PI/2); g.fillText("JUSB3",0,0); g.restore();
    g.font="700 46px 'Barlow Semi Condensed', Arial"; g.fillText("B450 GAMING PLUS MAX",px(-3.6),pz(11.75));
    BOARD_HOLES.forEach(([x,z])=>{ g.fillStyle="#b9b3a3"; g.beginPath(); g.arc(px(x),pz(z),22,0,7); g.fill(); g.fillStyle="#2b2b2e"; g.beginPath(); g.arc(px(x),pz(z),12,0,7); g.fill(); });
    // tiny printed pads/parts: black bodies with tinned ends
    for(let i=0;i<600;i++){ const x=R()*W,y=R()*H; if(Math.abs(x-px(SX))<4.3*U&&Math.abs(y-pz(SZ))<4.3*U) continue; const w=R()<.5;
      g.fillStyle="#9a9ca0"; g.fillRect(x,y,w?9:5,w?5:9); g.fillStyle="#141416"; g.fillRect(x+(w?2:0),y+(w?0:2),w?5:5,w?5:5); }
  });
}
function socketTexture(){ // 4.8 cm cream AM4 top with hole grid
  return canvasTex(1024,1024,(g,W)=>{
    g.fillStyle="#e9e2cf"; g.fillRect(0,0,W,W);
    const R=rng(2); for(let i=0;i<3000;i++){ g.fillStyle="rgba(120,100,70,.05)"; g.fillRect(R()*W,R()*W,2,2); }
    const c=v=>(v+2.4)/4.8*W;
    g.fillStyle="#ddd4bd"; g.fillRect(c(-1.9),c(-1.9),c(1.9)-c(-1.9),c(1.9)-c(-1.9));
    for(let i=0;i<PIN_N;i++) for(let j=0;j<PIN_N;j++){ if(pinSkipped(i,j)) continue;
      const x=c((i-18)*PIN_P), y=c((j-18)*PIN_P); g.fillStyle="#3a342b"; g.beginPath(); g.arc(x,y,4.6,0,7); g.fill(); g.fillStyle="#6b5f4d"; g.beginPath(); g.arc(x+.8,y+.8,1.6,0,7); g.fill(); }
  });
}
function cpuTopTexture(){
  return canvasTex(1024,1024,(g,W)=>{
    g.fillStyle="#1c6a3b"; g.fillRect(0,0,W,W);
    const R=rng(5); for(let i=0;i<7000;i++){ g.fillStyle=R()<.5?"rgba(0,0,0,.07)":"rgba(160,220,170,.05)"; g.fillRect(R()*W,R()*W,3,1); }
    for(let i=0;i<24;i++){ const a=40+i*39; [[a,30],[a,W-46],[30,a],[W-46,a]].forEach(([x,y])=>{ if(R()<.55) return; g.fillStyle="#b98a52"; g.fillRect(x,y,20,10); g.fillStyle="#d2d6db"; g.fillRect(x,y,4,10); g.fillRect(x+16,y,4,10); }); }
    g.fillStyle="rgba(235,240,235,.75)"; g.font="600 20px Barlow, Arial"; g.fillText("9HA6154I10143",W*.6,W-12);
  });
}
function ihsTexture(){
  return canvasTex(1024,1024,(g,W)=>{
    brushed(g,W,W,"#c3c7cc",21,7000);
    const gr=g.createLinearGradient(0,0,W,W); gr.addColorStop(0,"rgba(255,255,255,.18)"); gr.addColorStop(.5,"rgba(0,0,0,.05)"); gr.addColorStop(1,"rgba(255,255,255,.12)"); g.fillStyle=gr; g.fillRect(0,0,W,W);
    g.fillStyle="rgba(62,66,74,.88)";
    g.font="700 150px 'Barlow Semi Condensed', Arial"; g.fillText("5600G",110,470);
    g.font="600 46px Barlow, Arial"; g.fillText("100-000000252",110,600); g.fillText("2129SUT",110,665); g.fillText("9HA6154I10143",110,730);
    g.fillText("DIFFUSED IN TAIWAN",110,830); g.fillText("MADE IN CHINA",110,890);
    const R=rng(8); for(let i=0;i<14;i++) for(let j=0;j<14;j++) if(R()<.5) g.fillRect(780+i*11,760+j*11,11,11);
  });
}
function ramHeatsinkTexture(label){ // side face, 13.1 x 2.5 cm
  return canvasTex(1310,250,(g,W,H)=>{
    brushed(g,W,H,"#3b3e44",label?31:32,2500);
    g.fillStyle="#2a2c31"; g.beginPath(); g.moveTo(0,0); g.lineTo(W*.38,0); g.lineTo(W*.30,H); g.lineTo(0,H); g.fill();
    g.fillStyle="#50545b"; g.beginPath(); g.moveTo(W*.40,0); g.lineTo(W*.43,0); g.lineTo(W*.35,H); g.lineTo(W*.32,H); g.fill();
    g.strokeStyle="rgba(200,205,212,.35)"; g.lineWidth=3; g.strokeRect(6,6,W-12,H-12);
    for(let i=0;i<8;i++){ g.fillStyle="rgba(0,0,0,.35)"; g.fillRect(W*.72+i*38,H*.18,20,H*.64); }
    if(label){
      g.fillStyle="#e9eaec"; roundRect(g,W*.42,H*.22,W*.25,H*.56,8); g.fill();
      g.fillStyle="#1d1f23"; g.font="700 40px 'Barlow Semi Condensed', Arial"; g.fillText("8GB DDR4 3200",W*.44,H*.47);
      g.font="500 22px Barlow, Arial"; g.fillText("PC4-25600  CL16  1.35V",W*.44,H*.63);
      const R=rng(3); let x=W*.44; while(x<W*.64){ const w=1+R()*4; g.fillRect(x,H*.67,w,H*.08); x+=w+1+R()*3; }
    }
  });
}
function fingerTexture(notchCanvasX){ // PCB side face, 13.3 x 3.1 cm
  return canvasTex(1330,310,(g,W,H)=>{
    g.fillStyle="#17563a"; g.fillRect(0,0,W,H);
    const top=H-35; for(let x=8;x<W-8;x+=9.2){ if(Math.abs(x-notchCanvasX)<11) continue; const gr=g.createLinearGradient(0,top,0,H); gr.addColorStop(0,"#f3d489"); gr.addColorStop(1,"#b98a2f"); g.fillStyle=gr; g.fillRect(x,top,6,H-top-2); }
    g.fillStyle="#0c0c0d"; g.fillRect(notchCanvasX-9,H-40,18,40);
  });
}
function slotTopTexture(col){ return canvasTex(64,1024,(g,W,H)=>{ g.fillStyle=col; g.fillRect(0,0,W,H); g.fillStyle="#040404"; g.fillRect(24,6,16,H-12); for(let y=12;y<H-12;y+=7){ g.fillStyle="#9c8446"; g.fillRect(24,y,2,3); g.fillRect(38,y,2,3); } const ky=(NOTCH+7)/14*H; g.fillStyle=col; g.fillRect(22,ky-7,20,14); }); }
function heatsinkTexture(seed,stripe){ return canvasTex(512,512,(g,W,H)=>{ brushed(g,W,H,"#1a1b1e",seed,1500); for(let y=20;y<H;y+=26){ g.fillStyle="rgba(0,0,0,.55)"; g.fillRect(0,y,W,8); g.fillStyle="rgba(255,255,255,.06)"; g.fillRect(0,y+8,W,2); } if(stripe){ g.fillStyle="#c21f2b"; g.beginPath(); g.moveTo(W*.1,0); g.lineTo(W*.22,0); g.lineTo(W*.12,H); g.lineTo(0,H); g.lineTo(0,H*.6); g.fill(); } }); }
function chipsetTexture(){ return canvasTex(512,512,(g,W)=>{ brushed(g,W,W,"#1b1c1f",41,1200); g.strokeStyle="#c21f2b"; g.lineWidth=10; g.beginPath(); g.moveTo(40,W-60); g.lineTo(W*.45,W*.3); g.lineTo(W-40,W*.3); g.stroke(); g.lineWidth=4; g.beginPath(); g.moveTo(40,W-100); g.lineTo(W*.4,W*.2); g.lineTo(W-40,W*.2); g.stroke(); g.fillStyle="rgba(200,200,205,.5)"; g.font="700 44px 'Barlow Semi Condensed', Arial"; g.fillText("B450",W*.58,W*.72); }); }
function shroudTexture(){ return canvasTex(256,512,(g,W,H)=>{ g.fillStyle="#1d1e21"; g.fillRect(0,0,W,H); g.strokeStyle="#c21f2b"; g.lineWidth=6; g.beginPath(); g.moveTo(W*.2,H); g.lineTo(W*.2,H*.4); g.lineTo(W*.6,H*.25); g.lineTo(W*.6,0); g.stroke(); g.strokeStyle="rgba(255,255,255,.08)"; g.lineWidth=2; for(let y=10;y<H;y+=14){ g.beginPath(); g.moveTo(W*.7,y); g.lineTo(W*.95,y); g.stroke(); } }); }
function holesTexture(cols,rows){ return canvasTex(cols*16,rows*16,(g,W,H)=>{ g.fillStyle="#141416"; g.fillRect(0,0,W,H); g.fillStyle="#050505"; for(let i=0;i<cols;i++) for(let j=0;j<rows;j++) g.fillRect(i*16+4,j*16+4,8,8); }); }
