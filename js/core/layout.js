/* ---------------- layout constants (cm) ---------------- */
const BW=30.5, BD=24.4;                       // ATX board
const SX=-2.5, SZ=-5.0;                       // AM4 socket centre
const SLOT_X=[3.4,4.4,5.4,6.4], SLOT_Z=-4.3, SLOT_NAMES=["DIMMA1","DIMMA2","DIMMB1","DIMMB2"], GOOD=[1,3];
const CPU_HOVER=3.4, CPU_SEAT=0.51, RAM_HOVER=4.4, RAM_SEAT=0.35, NOTCH=0.7;
const PIN_N=37, PIN_P=0.1;
const pinSkipped=(i,j)=>(Math.abs(i-18)<6&&Math.abs(j-18)<6) || (i+(PIN_N-1-j))<2; // centre void + keyed corner
