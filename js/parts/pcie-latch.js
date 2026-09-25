/* ---------------- PCI_E1 retention latch ----------------
   Sits past the end of the x16 slot (the slot runs x -14.3 … -5.4 at z 3.2). Pushed down to open; it snaps shut on the card's notch. */
const PCIE_OPEN=-.55;
const pcieLatchMat=new T.MeshStandardMaterial({color:0x1b1c20,roughness:.5});
const pcieLatch=new T.Group(); pcieLatch.position.set(-5.3,.95,3.2); boardRoot.add(pcieLatch);
[mesh(box(.95,.28,.72),pcieLatchMat,[.47,0,0],pcieLatch),                     // lever arm
 mesh(box(.28,.42,.72),pcieLatchMat,[.88,.14,0],pcieLatch),                    // thumb tab at the end
 mesh(box(.16,.3,.72),pcieLatchMat,[.08,.22,0],pcieLatch),                     // hook that grabs the card
 mesh(box(1.6,1.2,1.4),new T.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}),[.5,.1,0],pcieLatch,{cast:false})
].forEach(m=>m.userData.part="pcieLatch");
mesh(box(.5,.8,.8),blackPlastic,[-5.3,.5,3.2]);                                // hinge block on the board
function setPcieLatch(open,dur=400,done){ animTo(pcieLatch.rotation,"z",open?PCIE_OPEN:0,dur,done); }
