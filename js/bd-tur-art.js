/* bd-tur-art: art for Base Defence walls, spikes and turrets. Registers BDART[id](b,x,y,w,h,t).
   Drawing only. Helpers are prefixed bta so they do not collide with other classic scripts. */

const BTA_CRACKS=[
  [[.18,0],[.3,.22],[.24,.42],[.4,.6]],
  [[.92,.12],[.7,.34],[.8,.56]],
  [[.52,1],[.56,.8],[.44,.62],[.62,.48]],
  [[0,.72],[.2,.76],[.14,.9]]
];

function btaAcc(b){const d=bdDef(b.kind,b.id);return (d&&d.col)||'#9fb4d8';}
function btaAim(b){return typeof b.aim==='number'?b.aim:Math.PI/2;}
/* 0 healthy, 1 cracked (below 60%), 2 badly damaged (below 30%) */
function btaStage(b){const k=b.max>0?b.hp/b.max:1;return k<.3?2:k<.6?1:0;}
function btaDamage(x,y,w,h,st){
  if(!st)return;
  ctx.fillStyle=st>=2?'rgba(0,0,0,.42)':'rgba(0,0,0,.22)';ctx.fillRect(x+1,y+1,w-2,h-2);
  const n=st>=2?4:2;
  ctx.strokeStyle='#05070f';ctx.lineWidth=1.6;ctx.lineJoin='round';ctx.beginPath();
  for(let i=0;i<n;i++){
    const p=BTA_CRACKS[i];ctx.moveTo(x+p[0][0]*w,y+p[0][1]*h);
    for(let k=1;k<p.length;k++)ctx.lineTo(x+p[k][0]*w,y+p[k][1]*h);
  }
  ctx.stroke();
  ctx.strokeStyle='rgba(200,215,240,.12)';ctx.lineWidth=1;ctx.beginPath();
  for(let i=0;i<n;i++){
    const p=BTA_CRACKS[i];ctx.moveTo(x+p[0][0]*w+1,y+p[0][1]*h+1);
    for(let k=1;k<p.length;k++)ctx.lineTo(x+p[k][0]*w+1,y+p[k][1]*h+1);
  }
  ctx.stroke();
}
/* shadow, flat fill and 2px dark outline for a wall or spike base */
function btaBox(x,y,w,h,fill,outline){
  ctx.fillStyle='rgba(0,0,0,.3)';ctx.fillRect(x+3,y+4,w-2,h-2);
  ctx.fillStyle=fill;ctx.fillRect(x+1,y+1,w-2,h-2);
  ctx.strokeStyle=outline||'#0b1030';ctx.lineWidth=2;ctx.strokeRect(x+1,y+1,w-2,h-2);
}
function btaRivet(x,y,r){
  ctx.fillStyle='#3d4659';ctx.beginPath();ctx.arc(x,y,r,0,6.283);ctx.fill();
  ctx.fillStyle='rgba(255,255,255,.55)';ctx.beginPath();ctx.arc(x-r*.3,y-r*.3,r*.4,0,6.283);ctx.fill();
}
/* turret pips: up to 4, top-right corner, filled per upgrade level */
function btaPips(b,x,y,w,acc){
  const L=Math.max(0,Math.min(4,b.lvl||0));
  for(let i=0;i<4;i++){
    const px=x+w-5-i*5,py=y+5;
    ctx.beginPath();ctx.arc(px,py,1.8,0,6.283);
    ctx.fillStyle=i<L?acc:'rgba(11,16,48,.9)';ctx.fill();
    ctx.strokeStyle='#0b1030';ctx.lineWidth=1;ctx.stroke();
  }
}
/* muzzle flash at tile point (tx,ty), scaled by b.flash/0.1 */
function btaFlash(b,tx,ty,acc){
  if(!(b.flash>0))return;
  const k=Math.min(1.6,b.flash/.1);
  ctx.globalCompositeOperation='lighter';
  gl(tx,ty,9+10*k,acc,Math.min(1,.5+.3*k));
  gl(tx,ty,4+4*k,'#ffffff',Math.min(1,.4+.4*k));
  ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;
}
/* turret housing: base plate with an accent rim */
function btaTurretBox(x,y,w,h,acc){
  btaBox(x,y,w,h,'#161d44','#0b1030');
  ctx.strokeStyle=acc;ctx.globalAlpha=.45;ctx.lineWidth=1;ctx.strokeRect(x+4.5,y+4.5,w-9,h-9);
  ctx.globalAlpha=1;
}
function btaHub(cx,cy,r,acc){
  ctx.fillStyle='#0b1030';ctx.beginPath();ctx.arc(cx,cy,r+2,0,6.283);ctx.fill();
  ctx.fillStyle='#262f5e';ctx.beginPath();ctx.arc(cx,cy,r,0,6.283);ctx.fill();
  ctx.strokeStyle=acc;ctx.lineWidth=2;ctx.stroke();
  ctx.fillStyle='rgba(255,255,255,.25)';ctx.beginPath();ctx.arc(cx-r*.3,cy-r*.3,r*.3,0,6.283);ctx.fill();
}
/* barrel laid along angle a from the pivot (cx,cy), starting x0 along the barrel */
function btaBarrel(cx,cy,a,x0,len,th,body,tip){
  ctx.save();ctx.translate(cx,cy);ctx.rotate(a);
  ctx.fillStyle=body;ctx.strokeStyle='#0b1030';ctx.lineWidth=1.5;
  ctx.fillRect(x0,-th/2,len,th);ctx.strokeRect(x0,-th/2,len,th);
  if(tip){ctx.fillStyle=tip;ctx.fillRect(x0+len-4,-th/2-.5,4,th+1);}
  ctx.restore();
}

/* ---------- walls ---------- */
BDART.wood=function(b,x,y,w,h,t){
  btaBox(x,y,w,h,BDD.walls.wood.col,'#0b1030');
  const n=4,ph=(h-2)/n;
  for(let i=0;i<n;i++){
    const py=y+1+i*ph;
    ctx.fillStyle=i%2?'#7a4d24':'#94602f';ctx.fillRect(x+1,py,w-2,ph);
    ctx.strokeStyle='rgba(30,16,4,.55)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x+1,py);ctx.lineTo(x+w-1,py);ctx.stroke();
    ctx.strokeStyle='rgba(40,20,6,.22)';ctx.beginPath();ctx.moveTo(x+4,py+ph*.6);ctx.lineTo(x+w-4,py+ph*.6+.5);ctx.stroke();
    ctx.fillStyle='#2a1a0c';
    ctx.beginPath();ctx.arc(x+5,py+ph/2,1.2,0,6.283);ctx.arc(x+w-5,py+ph/2,1.2,0,6.283);ctx.fill();
  }
  btaDamage(x,y,w,h,btaStage(b));
};

BDART.stone=function(b,x,y,w,h,t){
  btaBox(x,y,w,h,BDD.walls.stone.col,'#0b1030');
  const rows=4,rh=(h-2)/rows,bw=w/2;
  const shades=['#7d8698','#8c95a8','#6c7487'];
  ctx.save();ctx.beginPath();ctx.rect(x+1,y+1,w-2,h-2);ctx.clip();
  for(let r=0;r<rows;r++){
    const py=y+1+r*rh,off=r%2?bw/2:0;
    for(let k=-1;k<3;k++){
      const bx=x+1+off+k*bw;
      ctx.fillStyle=shades[(r*3+k+4+6)%3];ctx.fillRect(bx+1,py+1,bw-2,rh-2);
      ctx.strokeStyle='#3e4456';ctx.lineWidth=1.2;ctx.strokeRect(bx+1,py+1,bw-2,rh-2);
    }
  }
  ctx.restore();
  btaDamage(x,y,w,h,btaStage(b));
};

BDART.iron=function(b,x,y,w,h,t){
  btaBox(x,y,w,h,BDD.walls.iron.col,'#0b1030');
  const cx=x+w/2,cy=y+h/2;
  ctx.strokeStyle='#5b6578';ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(cx,y+2);ctx.lineTo(cx,y+h-2);ctx.moveTo(x+2,cy);ctx.lineTo(x+w-2,cy);ctx.stroke();
  for(const [qx,qy] of [[x+6,y+6],[x+w-6,y+6],[x+6,y+h-6],[x+w-6,y+h-6]]){btaRivet(qx,qy,1.8);}
  for(const [qx,qy] of [[x+5,cy],[x+w-5,cy]]){btaRivet(qx,qy,1.3);}
  ctx.fillStyle='rgba(255,255,255,.3)';ctx.fillRect(x+2,y+2,w-4,2);
  ctx.fillStyle='rgba(0,0,0,.22)';ctx.fillRect(x+2,y+h-4,w-4,2);
  btaDamage(x,y,w,h,btaStage(b));
};

BDART.crystal=function(b,x,y,w,h,t){
  const col=BDD.walls.crystal.col,cx=x+w/2,cy=y+h/2;
  btaBox(x,y,w,h,'#0e2a4a','#0b1030');
  ctx.globalCompositeOperation='lighter';gl(cx,cy,w*.62,col,.2+.08*Math.sin(t*2.2));
  ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;
  const P=[[.5,.08],[.85,.33],[.8,.8],[.5,.94],[.2,.8],[.15,.33]];
  const FC=['#7dd3ff','#c4f0ff','#4aa8e0','#a7e6ff','#2f86c4','#8fdcff'];
  for(let i=0;i<P.length;i++){
    const p=P[i],q=P[(i+1)%P.length];
    ctx.fillStyle=FC[i];ctx.beginPath();
    ctx.moveTo(x+p[0]*w,y+p[1]*h);ctx.lineTo(x+q[0]*w,y+q[1]*h);ctx.lineTo(cx,cy);ctx.closePath();ctx.fill();
    ctx.strokeStyle='rgba(11,16,48,.6)';ctx.lineWidth=1;ctx.stroke();
  }
  /* shimmer sweep */
  const sw=((t*.45)%1.4)-.2,sx=x+w*sw;
  ctx.save();ctx.beginPath();ctx.rect(x+2,y+2,w-4,h-4);ctx.clip();
  ctx.strokeStyle='rgba(255,255,255,.7)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(sx-8,y+h);ctx.lineTo(sx+4,y);ctx.stroke();
  ctx.restore();
  btaDamage(x,y,w,h,btaStage(b));
};

BDART.obsidian=function(b,x,y,w,h,t){
  btaBox(x,y,w,h,BDD.walls.obsidian.col,'#0b1030');
  const S=[
    [[.1,.2],[.45,.1],[.38,.5]],
    [[.55,.6],[.9,.45],[.8,.9],[.5,.85]],
    [[.2,.6],[.4,.7],[.25,.92]]
  ],SC=['#2a1f40','#120b1f','#241838'];
  for(let i=0;i<S.length;i++){
    ctx.fillStyle=SC[i];ctx.beginPath();
    S[i].forEach((p,k)=>k?ctx.lineTo(x+p[0]*w,y+p[1]*h):ctx.moveTo(x+p[0]*w,y+p[1]*h));
    ctx.closePath();ctx.fill();
    ctx.strokeStyle='rgba(120,90,170,.35)';ctx.lineWidth=1;ctx.stroke();
  }
  ctx.strokeStyle='rgba(255,255,255,.18)';ctx.lineWidth=1.5;ctx.beginPath();
  ctx.moveTo(x+w*.12,y+h*.15);ctx.lineTo(x+w*.42,y+h*.05);ctx.stroke();
  /* purple glints */
  const G3=[[[.25,.35],[.32,.3]],[[.7,.3],[.76,.25]],[[.6,.75],[.66,.7]]];
  ctx.lineCap='round';ctx.lineWidth=1.6;
  for(let i=0;i<G3.length;i++){
    const a=.35+.5*(Math.sin(t*2.5+i*2)+1)/2;
    ctx.strokeStyle='rgba(197,139,255,'+a.toFixed(2)+')';ctx.beginPath();
    ctx.moveTo(x+G3[i][0][0]*w,y+G3[i][0][1]*h);ctx.lineTo(x+G3[i][1][0]*w,y+G3[i][1][1]*h);ctx.stroke();
  }
  btaDamage(x,y,w,h,btaStage(b));
};

/* ---------- spikes ---------- */
BDART.spikeWood=function(b,x,y,w,h,t){
  btaBox(x,y,w,h,'#5a3a1c','#0b1030');
  ctx.strokeStyle='rgba(20,10,2,.4)';ctx.lineWidth=1;ctx.beginPath();
  ctx.moveTo(x+2,y+h*.45);ctx.lineTo(x+w-2,y+h*.45);ctx.stroke();
  const col=BDD.walls.spikeWood.col;
  for(const cx of [x+10,x+20,x+30]){
    const apex=cx===x+20?y+3:y+6;
    ctx.fillStyle=col;ctx.strokeStyle='#2a1a0c';ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(cx-6,y+h-6);ctx.lineTo(cx+6,y+h-6);ctx.lineTo(cx,apex);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.strokeStyle='rgba(255,230,190,.45)';ctx.beginPath();ctx.moveTo(cx,apex+2);ctx.lineTo(cx-3,y+h-7);ctx.stroke();
  }
  btaDamage(x,y,w,h,btaStage(b));
};

BDART.spikeIron=function(b,x,y,w,h,t){
  btaBox(x,y,w,h,'#4f5a6e','#0b1030');
  btaRivet(x+5,y+5,1.4);btaRivet(x+w-5,y+5,1.4);btaRivet(x+5,y+h-5,1.4);btaRivet(x+w-5,y+h-5,1.4);
  const col=BDD.walls.spikeIron.col;
  for(const cx of [x+10,x+20,x+30]){
    const apex=cx===x+20?y+1:y+4;
    ctx.fillStyle=col;ctx.strokeStyle='#0b1030';ctx.lineWidth=1.2;
    ctx.beginPath();ctx.moveTo(cx-5,y+h-7);ctx.lineTo(cx+5,y+h-7);ctx.lineTo(cx,apex);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.fillStyle='rgba(255,255,255,.7)';ctx.fillRect(cx-1,apex+3,1.6,h-apex-10);
  }
  btaDamage(x,y,w,h,btaStage(b));
};

/* ---------- turrets ---------- */
BDART.pistol=function(b,x,y,w,h,t){
  const acc=btaAcc(b),cx=x+w/2,cy=y+h/2,a=btaAim(b),L=Math.min(w,h)*.5;
  btaTurretBox(x,y,w,h,acc);
  btaBarrel(cx,cy,a,0,L,6,'#2a3150',acc);
  btaHub(cx,cy,Math.min(w,h)*.2,acc);
  btaFlash(b,cx+Math.cos(a)*(L+3),cy+Math.sin(a)*(L+3),acc);
  btaPips(b,x,y,w,acc);
};

BDART.flak=function(b,x,y,w,h,t){
  const acc=btaAcc(b),cx=x+w/2,cy=y+h/2,a=btaAim(b),L=20;
  btaTurretBox(x,y,w,h,acc);
  ctx.save();ctx.translate(cx,cy);ctx.rotate(a);
  ctx.fillStyle='#6b5a30';ctx.strokeStyle='#0b1030';ctx.lineWidth=1.5;
  ctx.fillRect(0,-7,L,4);ctx.strokeRect(0,-7,L,4);
  ctx.fillRect(0,3,L,4);ctx.strokeRect(0,3,L,4);
  ctx.fillStyle=acc;ctx.fillRect(L-3,-7,3,14);
  ctx.restore();
  btaHub(cx,cy,6,acc);
  btaFlash(b,cx+Math.cos(a)*(L+3),cy+Math.sin(a)*(L+3),acc);
  btaPips(b,x,y,w,acc);
};

BDART.mg=function(b,x,y,w,h,t){
  const acc=btaAcc(b),cx=x+w/2,cy=y+h/2,a=btaAim(b),ramp=b.ramp||0,spin=t*(4+ramp*26);
  btaTurretBox(x,y,w,h,acc);
  ctx.save();ctx.translate(cx,cy);ctx.rotate(a);
  ctx.fillStyle='#c8a24a';ctx.strokeStyle='#0b1030';ctx.lineWidth=1.5;
  ctx.fillRect(-16,-4,10,8);ctx.strokeRect(-16,-4,10,8);
  ctx.fillStyle='#3a4260';ctx.fillRect(-4,-6,34,12);ctx.strokeRect(-4,-6,34,12);
  ctx.fillStyle=acc;ctx.fillRect(28,-6,6,12);
  /* spinner: three dots orbiting the axis, faster with ramp */
  ctx.fillStyle='#0b1030';ctx.beginPath();ctx.arc(-2,0,7,0,6.283);ctx.fill();
  for(let k=0;k<3;k++){
    const an=spin+k*2.094,s=Math.sin(an),c=Math.cos(an);
    ctx.fillStyle=c>0?acc:'#5a4a20';
    ctx.beginPath();ctx.arc(-2,s*5,1.6+(c+1)*.6,0,6.283);ctx.fill();
  }
  ctx.restore();
  if(ramp>.6){
    ctx.globalCompositeOperation='lighter';
    gl(cx+Math.cos(a)*34,cy+Math.sin(a)*34,8+ramp*6,'#ffb36b',ramp*.35);
    ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;
  }
  btaHub(cx,cy,9,acc);
  btaFlash(b,cx+Math.cos(a)*38,cy+Math.sin(a)*38,acc);
  btaPips(b,x,y,w,acc);
};

BDART.flame=function(b,x,y,w,h,t){
  const acc=btaAcc(b),cx=x+w/2,cy=y+h/2,a=btaAim(b);
  btaTurretBox(x,y,w,h,acc);
  ctx.save();ctx.translate(cx,cy);ctx.rotate(a);
  /* fuel tank behind the pivot */
  ctx.fillStyle='#8a3b1c';ctx.strokeStyle='#0b1030';ctx.lineWidth=1.5;
  ctx.fillRect(-26,-10,14,20);ctx.strokeRect(-26,-10,14,20);
  ctx.fillStyle='#ffb36b';ctx.fillRect(-22,-10,3,20);
  ctx.strokeStyle='#3a2a20';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(-12,0);ctx.lineTo(-2,0);ctx.stroke();
  /* nozzle */
  ctx.fillStyle='#4a3430';ctx.strokeStyle='#0b1030';ctx.lineWidth=1.5;
  ctx.beginPath();ctx.moveTo(-2,-5);ctx.lineTo(26,-10);ctx.lineTo(26,10);ctx.lineTo(-2,5);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.fillStyle=acc;ctx.fillRect(24,-10,4,20);
  if(b.flash>0){
    const k=Math.min(1.6,b.flash/.1);
    ctx.globalCompositeOperation='lighter';
    ctx.fillStyle='rgba(255,122,46,.5)';ctx.beginPath();
    ctx.moveTo(28,0);ctx.lineTo(28+36*k,-15*k);ctx.lineTo(28+36*k,15*k);ctx.closePath();ctx.fill();
    ctx.fillStyle='rgba(255,226,154,.7)';ctx.beginPath();
    ctx.moveTo(28,0);ctx.lineTo(28+20*k,-7*k);ctx.lineTo(28+20*k,7*k);ctx.closePath();ctx.fill();
    ctx.globalCompositeOperation='source-over';
  }
  ctx.restore();
  /* pilot light flicker at the nozzle */
  const tipX=cx+Math.cos(a)*(24),tipY=cy+Math.sin(a)*24;
  ctx.globalCompositeOperation='lighter';
  gl(tipX,tipY,4+1.5*Math.sin(t*22),acc,.6);
  ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;
  btaHub(cx,cy,8,acc);
  btaFlash(b,cx+Math.cos(a)*30,cy+Math.sin(a)*30,acc);
  btaPips(b,x,y,w,acc);
};

BDART.laser=function(b,x,y,w,h,t){
  const acc=btaAcc(b),cx=x+w/2,cy=y+h/2,a=btaAim(b);
  btaTurretBox(x,y,w,h,acc);
  ctx.fillStyle='#2a0f1c';ctx.strokeStyle='#0b1030';ctx.lineWidth=2;
  ctx.fillRect(cx-14,cy-14,28,28);ctx.strokeRect(cx-14,cy-14,28,28);
  ctx.globalCompositeOperation='lighter';
  gl(cx,cy,16,acc,.3+.15*Math.sin(t*6));
  ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;
  btaBarrel(cx,cy,a,0,30,8,'#3a1424',acc);
  if(b.flash>0){
    const k=Math.min(1.6,b.flash/.1),ex=cx+Math.cos(a)*30,ey=cy+Math.sin(a)*30;
    ctx.globalCompositeOperation='lighter';
    ctx.strokeStyle=acc;ctx.lineWidth=3*Math.min(1,k);ctx.lineCap='round';
    ctx.beginPath();ctx.moveTo(ex,ey);ctx.lineTo(ex+Math.cos(a)*60*k,ey+Math.sin(a)*60*k);ctx.stroke();
    ctx.strokeStyle='#ffffff';ctx.lineWidth=1;ctx.stroke();
    ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;
  }
  btaFlash(b,cx+Math.cos(a)*32,cy+Math.sin(a)*32,acc);
  btaPips(b,x,y,w,acc);
};

BDART.freeze=function(b,x,y,w,h,t){
  const acc=btaAcc(b),cx=x+w/2,cy=y+h/2,a=btaAim(b);
  btaTurretBox(x,y,w,h,acc);
  ctx.globalCompositeOperation='lighter';
  gl(cx,cy,26,acc,.15+.05*Math.sin(t*2.2));
  ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;
  btaBarrel(cx,cy,a,0,30,8,'#2b4f7a',acc);
  /* orbiting frost arcs */
  ctx.strokeStyle=acc;ctx.lineWidth=2.5;ctx.lineCap='round';
  for(let k=0;k<6;k++){
    const an=t*.8+k*1.047;
    ctx.beginPath();ctx.arc(cx,cy,22,an,an+.6);ctx.stroke();
  }
  btaHub(cx,cy,12,acc);
  btaFlash(b,cx+Math.cos(a)*32,cy+Math.sin(a)*32,acc);
  btaPips(b,x,y,w,acc);
};

BDART.tesla=function(b,x,y,w,h,t){
  const acc=btaAcc(b),cx=x+w/2,cy=y+h/2,uid=b.uid||0,ox=cx,oy=cy-16;
  btaTurretBox(x,y,w,h,acc);
  /* coil: column with stacked discs */
  ctx.fillStyle='#2d2350';ctx.fillRect(cx-3,cy-12,6,26);
  for(const dy of [6,-2,14]){
    ctx.fillStyle='#241a40';ctx.strokeStyle=acc;ctx.lineWidth=1.5;
    ctx.beginPath();ctx.ellipse(cx,cy+dy,16,5,0,0,6.283);ctx.fill();ctx.stroke();
  }
  /* orb with flicker glow */
  ctx.globalCompositeOperation='lighter';
  gl(ox,oy,18,acc,.35+.2*Math.sin(t*9+uid));
  ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;
  ctx.fillStyle='#e2c8ff';ctx.strokeStyle='#0b1030';ctx.lineWidth=1.5;
  ctx.beginPath();ctx.arc(ox,oy,7,0,6.283);ctx.fill();ctx.stroke();
  /* jagged arcs: on a shot, or briefly now and then */
  if(b.flash>0||Math.sin(t*13+uid)>.85){
    ctx.globalCompositeOperation='lighter';ctx.strokeStyle=acc;ctx.lineWidth=1.5;ctx.lineJoin='round';
    for(let k=0;k<3;k++){
      const an=t*7+k*2.094+uid,j=Math.sin(t*40+k*3)*4;
      const p1x=ox+Math.cos(an)*14,p1y=oy+Math.sin(an)*14;
      const p2x=ox+Math.cos(an)*26+j,p2y=oy+Math.sin(an)*26-j;
      const p3x=ox+Math.cos(an)*36,p3y=oy+Math.sin(an)*36;
      ctx.beginPath();ctx.moveTo(ox,oy);ctx.lineTo(p1x,p1y);ctx.lineTo(p2x,p2y);ctx.lineTo(p3x,p3y);ctx.stroke();
    }
    ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;
  }
  btaPips(b,x,y,w,acc);
};

BDART.sniper=function(b,x,y,w,h,t){
  const acc=btaAcc(b),cx=x+w/2,cy=y+h/2,a=btaAim(b);
  btaTurretBox(x,y,w,h,acc);
  btaBarrel(cx,cy,a,0,38,6,'#c9d6e6',acc);
  /* scope on the barrel */
  ctx.save();ctx.translate(cx,cy);ctx.rotate(a);
  ctx.fillStyle='#0b1030';ctx.fillRect(8,-9,10,5);
  ctx.fillStyle='#7fe7ff';ctx.fillRect(16,-9,2,5);
  ctx.restore();
  btaHub(cx,cy,11,acc);
  btaFlash(b,cx+Math.cos(a)*41,cy+Math.sin(a)*41,acc);
  btaPips(b,x,y,w,acc);
};

BDART.missile=function(b,x,y,w,h,t){
  const acc=btaAcc(b),cx=x+w/2,cy=y+h/2,a=btaAim(b);
  btaTurretBox(x,y,w,h,acc);
  btaHub(cx,cy,10,acc);
  ctx.save();ctx.translate(cx,cy);ctx.rotate(a);
  for(const p of [-18,-6,6,18]){
    ctx.fillStyle='#4a4f66';ctx.strokeStyle='#0b1030';ctx.lineWidth=1.5;
    ctx.fillRect(-4,p-4,40,8);ctx.strokeRect(-4,p-4,40,8);
    ctx.fillStyle=acc;ctx.fillRect(34,p-4,6,8);
  }
  ctx.restore();
  btaFlash(b,cx+Math.cos(a)*44,cy+Math.sin(a)*44,acc);
  btaPips(b,x,y,w,acc);
};

BDART.acid=function(b,x,y,w,h,t){
  const acc=btaAcc(b),cx=x+w/2,cy=y+h/2,a=btaAim(b);
  btaTurretBox(x,y,w,h,acc);
  /* acid tank with rising bubbles */
  ctx.fillStyle='#2b4a1c';ctx.strokeStyle=acc;ctx.lineWidth=2;
  ctx.beginPath();ctx.arc(cx,cy,17,0,6.283);ctx.fill();ctx.stroke();
  for(let i=0;i<4;i++){
    const f=(t*.8+i*.27)%1;
    ctx.fillStyle='rgba(230,255,154,.8)';ctx.beginPath();
    ctx.arc(cx-8+i*5,cy+8-f*16,1.6,0,6.283);ctx.fill();
  }
  btaBarrel(cx,cy,a,10,26,7,'#33511f',acc);
  if(b.flash>0){
    const kk=Math.min(1.2,b.flash/.1);
    ctx.fillStyle=acc;
    for(let i=0;i<6;i++){
      const d=36+i*5,j=Math.sin(t*30+i*2)*4*kk;
      ctx.globalAlpha=.8*(1-i/8);
      ctx.beginPath();ctx.arc(cx+Math.cos(a)*d-Math.sin(a)*j,cy+Math.sin(a)*d+Math.cos(a)*j,2,0,6.283);ctx.fill();
    }
    ctx.globalAlpha=1;
  }
  btaHub(cx,cy,6,acc);
  btaFlash(b,cx+Math.cos(a)*36,cy+Math.sin(a)*36,acc);
  btaPips(b,x,y,w,acc);
};

BDART.seeker=function(b,x,y,w,h,t){
  const acc=btaAcc(b),cx=x+w/2,cy=y+h/2,a=btaAim(b);
  btaTurretBox(x,y,w,h,acc);
  /* radar ring */
  ctx.strokeStyle=acc;ctx.globalAlpha=.25+.15*Math.sin(t*3);ctx.lineWidth=1.5;
  ctx.beginPath();ctx.arc(cx,cy,30+2*Math.sin(t*3),0,6.283);ctx.stroke();
  ctx.globalAlpha=1;
  ctx.save();ctx.translate(cx,cy);ctx.rotate(a);
  for(const side of [-11,11]){
    ctx.fillStyle='#2c4a48';ctx.strokeStyle='#0b1030';ctx.lineWidth=1.5;
    ctx.fillRect(-6,side-5,34,10);ctx.strokeRect(-6,side-5,34,10);
    ctx.fillStyle=acc;ctx.beginPath();
    ctx.moveTo(28,side-5);ctx.lineTo(40,side);ctx.lineTo(28,side+5);ctx.closePath();ctx.fill();
  }
  ctx.restore();
  btaHub(cx,cy,9,acc);
  btaFlash(b,cx+Math.cos(a)*42,cy+Math.sin(a)*42,acc);
  btaPips(b,x,y,w,acc);
};

BDART.spikeTrap=function(b,x,y,w,h,t){
  const acc=BDD.turrets.spikeTrap.col,uid=b.uid||0;
  /* plate */
  btaBox(x,y,w,h,'#262b3a','#0b1030');
  ctx.strokeStyle=acc;ctx.globalAlpha=.4;ctx.lineWidth=1;ctx.strokeRect(x+4.5,y+4.5,w-9,h-9);ctx.globalAlpha=1;
  /* global cycle: spikes rise and sink, with small offsets per spike */
  const e=(Math.sin(t*1.8+uid)+1)/2;
  ctx.lineWidth=1;ctx.strokeStyle='#0b1030';
  for(let i=0;i<4;i++){
    for(let j=0;j<4;j++){
      const cx=x+10+i*20,cy=y+10+j*20;
      const se=Math.max(0,Math.min(1,e+.25*Math.sin(i*2.3+j*1.7)));
      const ht=3+13*se;
      ctx.fillStyle=se>.5?acc:'#5d6375';
      ctx.beginPath();ctx.moveTo(cx-4.5,cy+5);ctx.lineTo(cx+4.5,cy+5);ctx.lineTo(cx,cy+5-ht);ctx.closePath();
      ctx.fill();ctx.stroke();
    }
  }
  btaPips(b,x,y,w,acc);
};

BDART.repair=function(b,x,y,w,h,t){
  const acc=BDD.turrets.repair.col,cx=x+w/2,cy=y+h/2,p=(Math.sin(t*3)+1)/2;
  btaBox(x,y,w,h,'#0e2a22','#0b1030');
  ctx.globalCompositeOperation='lighter';
  gl(cx,cy,34,acc,.18+.12*p);
  ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;
  /* pulsing ring */
  ctx.strokeStyle=acc;ctx.globalAlpha=.35+.35*p;ctx.lineWidth=2;
  ctx.beginPath();ctx.arc(cx,cy,30+3*p,0,6.283);ctx.stroke();
  ctx.globalAlpha=1;
  /* green cross */
  ctx.fillStyle='#0b1030';
  ctx.fillRect(cx-7,cy-22,14,44);ctx.fillRect(cx-22,cy-7,44,14);
  ctx.fillStyle='#eafff3';
  ctx.fillRect(cx-5,cy-20,10,40);ctx.fillRect(cx-20,cy-5,40,10);
  ctx.fillStyle=acc;
  ctx.fillRect(cx-3,cy-18,6,36);ctx.fillRect(cx-18,cy-3,36,6);
  btaPips(b,x,y,w,acc);
};
