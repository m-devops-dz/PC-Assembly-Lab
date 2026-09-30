/* ---------------- first boot: the power button ----------------
   Pressing the case's power button powers the PC: the fans start, the keyboard lights up, and the
   monitor (zoomed in) goes from "No signal" to the MSI logo to the BIOS. 10 s later the camera looks
   through the glass at the CPU cooler fan and the rear case fan spinning, then the build is done. */
function powerUp(){ S.powered=true; powerLedMat.color.setHex(0x4ea1ff); keyboardLights(true); }
function clickPowerBtn(){
  if(S.busy) return;
  if(S.step!==ST.powerOn){ toast(t(S.step<ST.powerOn?"e_powerFirst":"e_notNow")); return; }
  S.busy=true; startClock();
  tween(260,k=>{ powerBtn.position.x=CX1+.17-.12*Math.sin(k*Math.PI); },()=>{
    powerUp(); toast(t("ok_powerOn"),"ok");
    const v=screenView(); focusPoint(v.pos,v.tgt,1400);
    showScreen(screenOff);                                                    // the monitor wakes up before the PC sends a picture
    setTimeout(()=>showScreen(screenOn),2600);                                // MSI logo
    setTimeout(()=>showScreen(screenBios),4400);                              // BIOS
    setTimeout(()=>{ focus("fansOn",1600); toast(t("ok_fans"),"ok"); },14400);
    setTimeout(()=>{ S.busy=false; setStep(ST.powerOn+1); },20000);
  });
}
// skipping the step (Ctrl+H): straight to the powered-on state
function powerOnNow(){ powerUp(); showScreen(screenBios); }
