/* Sky colours, pre-rendered terrain, glow sprites, vignettes, floating motes. */
const NIGHT=[7,10,28],DEEP=[18,20,58],DUSK=[74,46,94],DAWN=[206,122,98];
const skyCol=p=>p<.5?mix(NIGHT,DEEP,p/.5):p<.8?mix(DEEP,DUSK,(p-.5)/.3):mix(DUSK,DAWN,(p-.8)/.2);
const stars=[];
/* ---------- terrain + light assets ---------- */
const md=(v,n)=>((v%n)+n)%n;
function rng(sd){return()=>{sd|=0;sd=sd+0x6D2B79F5|0;let t=Math.imul(sd^sd>>>15,1|sd);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function mkCv(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
function wrap(S,x,y,rad,fn){for(const ox of [-S,0,S])for(const oy of [-S,0,S]){if(x+ox+rad<0||x+ox-rad>S||y+oy+rad<0||y+oy-rad>S)continue;fn(x+ox,y+oy);}}
const TA=(()=>{
  const S=512,c=mkCv(S,S),g=c.getContext('2d'),R=rng(7);
  g.fillStyle='#444d5c';g.fillRect(0,0,S,S);
  for(let i=0;i<70;i++){
    const x=R()*S,y=R()*S,rad=50+R()*110,dk=R()<.5,a=.05+R()*.08,col=dk?'8,12,22':'125,140,162';
    wrap(S,x,y,rad,(px,py)=>{const gr=g.createRadialGradient(px,py,0,px,py,rad);gr.addColorStop(0,'rgba('+col+','+a+')');gr.addColorStop(1,'rgba('+col+',0)');g.fillStyle=gr;g.fillRect(px-rad,py-rad,rad*2,rad*2);});
  }
  for(let i=0;i<1500;i++){const x=R()*S,y=R()*S;g.fillStyle=R()<.5?'rgba(0,0,0,.15)':'rgba(190,205,225,.09)';g.fillRect(x,y,1+R()*1.6,1+R()*1.6);}
  g.lineCap='round';g.lineJoin='round';
  for(let i=0;i<16;i++){
    let x=R()*S,y=R()*S,a=R()*6.283;const pts=[[x,y]];
    for(let k=0;k<7+Math.floor(R()*4);k++){a+=(R()-.5)*1.1;x+=Math.cos(a)*(14+R()*18);y+=Math.sin(a)*(14+R()*18);pts.push([x,y]);}
    for(const ox of [-S,0,S])for(const oy of [-S,0,S]){
      g.strokeStyle='rgba(6,9,16,.5)';g.lineWidth=1.8;g.beginPath();pts.forEach((q,k)=>k?g.lineTo(q[0]+ox,q[1]+oy):g.moveTo(q[0]+ox,q[1]+oy));g.stroke();
      g.strokeStyle='rgba(180,195,220,.08)';g.lineWidth=1;g.beginPath();pts.forEach((q,k)=>k?g.lineTo(q[0]+ox+1.5,q[1]+oy+1.5):g.moveTo(q[0]+ox+1.5,q[1]+oy+1.5));g.stroke();
    }
  }
  for(let i=0;i<40;i++){
    const x=R()*S,y=R()*S,rx=2+R()*3.5,ry=rx*(.7+R()*.3);
    wrap(S,x,y,8,(px,py)=>{g.fillStyle='rgba(8,12,20,.45)';g.beginPath();g.ellipse(px+1.5,py+2,rx,ry,0,0,6.283);g.fill();g.fillStyle='#566277';g.beginPath();g.ellipse(px,py,rx,ry,0,0,6.283);g.fill();g.fillStyle='rgba(190,205,230,.28)';g.beginPath();g.ellipse(px-rx*.25,py-ry*.3,rx*.5,ry*.4,0,0,6.283);g.fill();});
  }
  return c;
})();
const MUSH=[];
const TB=(()=>{
  const S=1024,c=mkCv(S,S),g=c.getContext('2d'),R=rng(31);
  g.lineCap='round';g.lineJoin='round';
  for(let i=0;i<9;i++){
    const x=R()*S,y=R()*S,w=60+R()*50,h=38+R()*30,an=R()*6.283;
    wrap(S,x,y,130,(px,py)=>{
      g.save();g.translate(px,py);g.rotate(an);
      g.fillStyle='rgba(0,0,0,.3)';g.fillRect(-w/2+5,-h/2+7,w,h);
      g.fillStyle='#434c5c';g.fillRect(-w/2,-h/2,w,h);
      g.fillStyle='rgba(170,185,210,.1)';g.fillRect(-w/2,-h/2,w,3);
      g.strokeStyle='rgba(5,8,14,.55)';g.lineWidth=2;g.strokeRect(-w/2,-h/2,w,h);
      g.strokeStyle='rgba(5,8,14,.4)';g.lineWidth=1.3;g.beginPath();g.moveTo(-w*.1,-h/2);g.lineTo(w*.05,-h*.1);g.lineTo(-w*.05,h*.15);g.lineTo(w*.12,h/2);g.stroke();
      g.restore();
    });
  }
  for(let i=0;i<26;i++){
    const x=R()*S,y=R()*S,rad=9+R()*18,n=7,pts=[];
    for(let k=0;k<n;k++){const a=k/n*6.283,rr=rad*(.72+R()*.4);pts.push([Math.cos(a)*rr,Math.sin(a)*rr*.85]);}
    wrap(S,x,y,rad+10,(px,py)=>{
      g.fillStyle='rgba(0,0,0,.32)';g.beginPath();g.ellipse(px+rad*.25,py+rad*.55,rad*1.05,rad*.5,0,0,6.283);g.fill();
      g.fillStyle='#4a5365';g.beginPath();pts.forEach((q,k)=>k?g.lineTo(px+q[0],py+q[1]):g.moveTo(px+q[0],py+q[1]));g.closePath();g.fill();
      g.strokeStyle='rgba(6,9,16,.55)';g.lineWidth=2;g.stroke();
      g.fillStyle='rgba(165,182,210,.22)';g.beginPath();pts.forEach((q,k)=>k?g.lineTo(px+q[0]*.55-rad*.15,py+q[1]*.5-rad*.18):g.moveTo(px+q[0]*.55-rad*.15,py+q[1]*.5-rad*.18));g.closePath();g.fill();
    });
  }
  for(let i=0;i<110;i++){
    const x=R()*S,y=R()*S,nb=4+Math.floor(R()*3),cols=['#3b6657','#4b7d68','#34574c'];
    wrap(S,x,y,20,(px,py)=>{
      for(let k=0;k<nb;k++){const dx=(k-nb/2)*3.2+R()*2,len=7+R()*9;g.strokeStyle=cols[k%3];g.lineWidth=1.7;g.beginPath();g.moveTo(px+dx*.4,py);g.quadraticCurveTo(px+dx*.8,py-len*.6,px+dx*1.4,py-len);g.stroke();}
    });
  }
  for(let i=0;i<14;i++){
    const x=R()*S,y=R()*S;MUSH.push({x,y,ph:R()*6.283});
    wrap(S,x,y,10,(px,py)=>{g.fillStyle='rgba(0,0,0,.35)';g.beginPath();g.ellipse(px+1,py+3,5,2.4,0,0,6.283);g.fill();g.fillStyle='#4fe3c8';g.beginPath();g.arc(px,py,3.2,0,6.283);g.fill();g.fillStyle='#d6fff6';g.beginPath();g.arc(px-.8,py-.8,1.1,0,6.283);g.fill();});
  }
  return c;
})();
const GS={};
function glow(col){
  let c=GS[col];
  if(!c){c=mkCv(64,64);const g=c.getContext('2d');g.fillStyle=col;g.fillRect(0,0,64,64);g.globalCompositeOperation='destination-in';
    const gr=g.createRadialGradient(32,32,0,32,32,32);gr.addColorStop(0,'rgba(0,0,0,1)');gr.addColorStop(.3,'rgba(0,0,0,.55)');gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(0,0,64,64);GS[col]=c;}
  return c;
}
function gl(x,y,sz,col,a){ctx.globalAlpha=a;ctx.drawImage(glow(col),x-sz,y-sz,sz*2,sz*2);}
function mkVig(col){const c=mkCv(W+40,H+40),g=c.getContext('2d'),gr=g.createRadialGradient((W+40)/2,(H+40)/2,H*.34,(W+40)/2,(H+40)/2,Math.hypot(W,H)*.56);gr.addColorStop(0,'rgba('+col+',0)');gr.addColorStop(1,'rgba('+col+',.85)');g.fillStyle=gr;g.fillRect(0,0,W+40,H+40);return c;}
const VG=mkVig('2,3,12'),VR=mkVig('210,10,35');
const MO=Array.from({length:60},()=>({x:rand(0,2000),y:rand(0,2000),z:rand(.2,.9),ph:rand(0,6.28),s:rand(1,2.4)}));

