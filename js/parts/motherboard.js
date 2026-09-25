/* ---------------- motherboard ---------------- */
const boardTopMat=new T.MeshStandardMaterial({map:boardTexture(),roughness:.45,metalness:.1});
const boardEdge=new T.MeshStandardMaterial({color:0x121214,roughness:.7});
const boardPCB=mesh(box(BW,.2,BD),six(boardEdge,boardTopMat),[0,0,0]);
const blackPlastic=new T.MeshStandardMaterial({color:0x151518,roughness:.55});
const hsSide=new T.MeshStandardMaterial({map:heatsinkTexture(51,false),metalness:.6,roughness:.45});
const hsTop=new T.MeshStandardMaterial({map:heatsinkTexture(52,true),metalness:.6,roughness:.4});
mesh(box(1.9,2.1,7.2),[hsSide,hsSide,hsTop,hsSide,hsSide,hsSide],[-9,1.15,-5]);               // left VRM heatsink
mesh(box(7.4,2.1,1.8),[hsSide,hsSide,hsTop,hsSide,hsSide,hsSide],[-2.6,1.15,-11.2]);          // top VRM heatsink
const shroudMat=new T.MeshStandardMaterial({map:shroudTexture(),roughness:.5});
mesh(box(2.4,3.3,9.6),[shroudMat,blackPlastic,blackPlastic,blackPlastic,shroudMat,blackPlastic],[-12.7,1.75,-7.1]);
