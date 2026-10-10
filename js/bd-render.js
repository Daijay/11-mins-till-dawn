/* Base Defence drawing: road, core, buildings, remnants, pickups. Called from draw() in render.js.
   sx/sy convert world px to screen px. Per-building art registers itself in BDART[id] = (b,x,y,w,h,t) => void,
   where x,y,w,h is the building's screen rect. Anything without art falls back to bdGenericArt. */
const BDART={};

function bdDrawGround(sx,sy){
  const T=BDT,x0=sx(BD_ROAD.x0),x1=sx(BD_ROAD.x1),y0=sy(0),y1=sy(BDD.road.len*T);
  ctx.fillStyle='rgba(24,28,44,.62)';ctx.fillRect(x0,y0,x1-x0,y1-y0);
  ctx.fillStyle='rgba(255,255,255,.04)';
  for(let r=0;r<BDD.road.len;r++){ctx.fillRect(x0,sy(r*T)+T-1,x1-x0,1);}
  for(let c=1;c<BDD.road.cols;c++){ctx.fillRect(x0+c*T-.5,y0,1,y1-y0);}
  ctx.fillStyle='#ffb36b';ctx.globalAlpha=.7;ctx.fillRect(x0-3,y0,3,y1-y0);ctx.fillRect(x1,y0,3,y1-y0);ctx.globalAlpha=1;
  /* spawn gate marker */
  const gy=sy(0);
  ctx.fillStyle='rgba(255,77,109,.35)';ctx.fillRect(x0,gy,x1-x0,6);
  bdDrawCore(sx,sy);
}
function bdDrawCore(sx,sy){
  const C=G.bd.core,x=sx(BD_CORE.x),y=sy(BD_CORE.y),w=BD_CORE.w,h=BD_CORE.h,k=C.hp/C.max;
  ctx.globalCompositeOperation='lighter';gl(x+w/2,y+h/2,150,'#5be7ff',.22+.08*Math.sin(G.t*2));ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;
  ctx.fillStyle='#10163a';ctx.strokeStyle=C.fl>0?'#ffffff':'#5be7ff';ctx.lineWidth=3;
  ctx.beginPath();ctx.roundRect?ctx.roundRect(x+2,y+2,w-4,h-4,10):ctx.rect(x+2,y+2,w-4,h-4);ctx.fill();ctx.stroke();
  const cx=x+w/2,cy=y+h/2,s=26+4*Math.sin(G.t*3);
  ctx.fillStyle=k>.3?'#7df9ff':'#ff5d73';ctx.strokeStyle='#06122e';ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(cx,cy-s);ctx.lineTo(cx+s*.7,cy);ctx.lineTo(cx,cy+s);ctx.lineTo(cx-s*.7,cy);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.fillStyle='rgba(255,255,255,.7)';ctx.beginPath();ctx.arc(cx-s*.15,cy-s*.2,4,0,6.283);ctx.fill();
}

function bdGenericArt(b,x,y,w,h){
  const d=bdDef(b.kind,b.id),col=d.col||'#9aa4d6';
  ctx.fillStyle='rgba(0,0,0,.3)';ctx.fillRect(x+3,y+4,w,h);
  ctx.fillStyle=col;ctx.fillRect(x+1,y+1,w-2,h-2);
  ctx.fillStyle='rgba(255,255,255,.14)';ctx.fillRect(x+1,y+1,w-2,4);
  ctx.strokeStyle='#0b1030';ctx.lineWidth=2;ctx.strokeRect(x+1,y+1,w-2,h-2);
  if(b.kind==='turret'){
    ctx.fillStyle='#0b1030';ctx.beginPath();ctx.arc(x+w/2,y+h/2,Math.min(w,h)*.28,0,6.283);ctx.fill();
    ctx.strokeStyle='#ffffff';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x+w/2,y+h/2);
    const a=b.aim||Math.PI/2,L=Math.min(w,h)*.5;ctx.lineTo(x+w/2+Math.cos(a)*L,y+h/2+Math.sin(a)*L);ctx.stroke();
  }
}
function bdDrawBuilding(b,sx,sy){
  const x=sx(b.c*BDT),y=sy(b.r*BDT),w=b.w*BDT,h=b.h*BDT;
  if(y>H+60||y+h<-60)return;
  const art=BDART[b.id]||bdGenericArt;
  art(b,x,y,w,h,G.t);
  if(b.fl>0){ctx.fillStyle='rgba(255,255,255,.35)';ctx.fillRect(x,y,w,h);}
  if(b.hp<b.max){
    const k=clamp(b.hp/b.max,0,1);
    ctx.fillStyle='rgba(5,8,25,.7)';ctx.fillRect(x+2,y+h-7,w-4,5);
    ctx.fillStyle=k>.5?'#7dffb2':k>.25?'#ffb020':'#ff4d6d';ctx.fillRect(x+2,y+h-7,(w-4)*k,5);
  }
  if(b.lvl>0){ctx.fillStyle='#ffd166';ctx.font='700 10px "Chakra Petch",sans-serif';ctx.textAlign='left';ctx.fillText('L'+(b.lvl+1),x+3,y+11);}
}
function bdDrawWorld(sx,sy){
  const B=G.bd;
  /* cables sit under everything */
  if(typeof bdDrawCables==='function')bdDrawCables(sx,sy);
  /* remnants */
  for(const r of B.remnants){
    const x=sx(r.c*BDT),y=sy(r.r*BDT),w=r.w*BDT,h=r.h*BDT;
    if(y>H+60||y+h<-60)continue;
    ctx.strokeStyle='rgba(255,179,107,.75)';ctx.lineWidth=2;ctx.setLineDash([6,5]);ctx.strokeRect(x+2,y+2,w-4,h-4);ctx.setLineDash([]);
    ctx.fillStyle='rgba(255,179,107,.12)';ctx.fillRect(x+2,y+2,w-4,h-4);
  }
  for(const b of B.buildings)bdDrawBuilding(b,sx,sy);
  for(const f of BDFX)f(sx,sy);
  /* crystals and energy crates */
  for(const c of B.cr){
    const x=sx(c.x),y=sy(c.y);if(y<-20||y>H+20)continue;
    ctx.globalCompositeOperation='lighter';gl(x,y,14,'#ff7bff',.45);ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;
    ctx.fillStyle='#ff9bff';ctx.strokeStyle='#2a0a3a';ctx.lineWidth=1.5;
    const s=c.v>=20?8:c.v>=4?6:4.5;
    ctx.beginPath();ctx.moveTo(x,y-s);ctx.lineTo(x+s*.7,y);ctx.lineTo(x,y+s);ctx.lineTo(x-s*.7,y);ctx.closePath();ctx.fill();ctx.stroke();
  }
  for(const c of B.crates){
    const x=sx(c.x),y=sy(c.y);if(y<-20||y>H+20)continue;
    if(c.life<5&&Math.floor(G.t*8)%2===0)continue;
    ctx.globalCompositeOperation='lighter';gl(x,y,18,'#5be7ff',.4);ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;
    ctx.fillStyle='#0b1030';ctx.strokeStyle='#5be7ff';ctx.lineWidth=2;ctx.fillRect(x-8,y-8,16,16);ctx.strokeRect(x-8,y-8,16,16);
    ctx.fillStyle='#5be7ff';ctx.beginPath();ctx.moveTo(x+2,y-6);ctx.lineTo(x-4,y+1);ctx.lineTo(x-.5,y+1);ctx.lineTo(x-2,y+6);ctx.lineTo(x+4,y-2);ctx.lineTo(x+.5,y-2);ctx.closePath();ctx.fill();
  }
}
/* ghost previews, range rings and skill cursors are drawn by bd-ui.js through bdDrawGhost */
function bdDrawOverlay(sx,sy){
  if(typeof bdDrawGhost==='function')bdDrawGhost(sx,sy);
}
