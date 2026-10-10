/* bd-skills: the five energy skills (shockwave, overcharge, mend, barrage, obsidian).
   bdSkillUse(id,wx,wy) fires one on click and returns true if it fired.
   bdSkillGhost(id,sx,sy) draws the cursor preview in world space. sx/sy are the world-to-screen functions from bd-render.js.
   All numbers come from BDD.skills (bd-data.js) and BDD.skillFx / extra keys (bd-data-skills.js). */

const bdSkDist=(ax,ay,bx,by)=>Math.hypot(ax-bx,ay-by);
/* lazily created transient arrays on G.bd */
function bdSkArr(name){const B=G.bd;if(!B[name])B[name]=[];return B[name];}
/* failed use: floating text at the target and a small puff */
function bdSkFail(x,y,text){
  if(!G.bd)return;
  bdSkArr('skTxt').push({x,y,text,col:BDD.skillFx.cBad,t:0});
  burst(x,y,6,'#ff7878',110);
}
/* barrage landing zone in px: the road plus margin on both sides, from the top of the map to the core */
function bdSkZone(){
  const m=BDD.skills.barrage.zoneMargin*BDT;
  return {xa:BD_ROAD.x0-m,xb:BD_ROAD.x1+m,ya:0,yb:BD_CORE.y};
}
/* obsidian placement check at tile (c,r) for the start tile of the 3-tile row. Returns an error string or null. */
function bdObsidianErr(c,r){
  const n=BDD.skills.obsidian.tiles,B=G.bd;
  for(let i=0;i<n;i++){
    const cc=c+i;
    if(!bdInGrid(cc,r))return 'Off the map';
    if(!bdIsRoad(cc,r))return 'Needs road tiles';
    if(bdIsCore(cc,r))return 'Core is in the way';
    if(B.tiles.has(bdKey(cc,r)))return 'Tile is occupied';
  }
  return null;
}
/* target checks per skill. Returns an error string or null when the use is valid. */
function bdSkCheck(id,wx,wy){
  switch(id){
    case 'mend':
      return bdSkDist(G.p.x,G.p.y,wx,wy)>BDD.skills.mend.reach*BDT?'Out of reach':null;
    case 'obsidian':
      return bdObsidianErr(bdTileC(wx),bdTileR(wy));
    default:
      return null;
  }
}

/* ---------- effects ---------- */
function bdSkShockwave(d){
  const p=G.p,R=d.radius*BDT;
  for(const e of G.E){
    if(e.dead)continue;
    const dx=e.x-p.x,dy=e.y-p.y,dist=Math.hypot(dx,dy);
    if(dist-e.r>R)continue;
    /* fromAngle points from the enemy back at the player, as in beam(), so shielders block the front */
    hurtEnemy(e,d.dmg,false,Math.atan2(p.y-e.y,p.x-e.x));
    if(e.type==='super'){e.pushT=d.sovPush;}
    else{const a=Math.atan2(dy,dx);e.kx+=Math.cos(a)*d.push;e.ky+=Math.sin(a)*d.push;}
  }
  G.R.push({x:p.x,y:p.y,r:0,max:R,t:0,life:d.ringLife,rgb:BDD.skillFx.cFire});
  burst(p.x,p.y,16,'#9fe9ff',240);
  G.shake=Math.max(G.shake,6);
}
function bdSkOvercharge(d){
  const B=G.bd;
  B.ocT=d.time;
  /* each eligible turret loses hpLoss of max HP over the duration. A recast refreshes the drain, it does not stack a second one. */
  for(const b of B.buildings){
    if(b.kind!=='turret'||d.excludeTypes.indexOf(b.id)>=0)continue;
    const amt=d.hpLoss*b.max;
    b.ocDrain=amt;
    b.ocRate=amt/d.time;
  }
}
function bdSkMend(d,wx,wy){
  const B=G.bd,R=d.radius*BDT;
  for(const b of B.buildings){
    const c=bdCenter(b);
    if(bdSkDist(c.x,c.y,wx,wy)>R)continue;
    const before=b.hp;
    b.hp=Math.min(b.max,b.hp+d.heal*b.max);
    if(b.hp>before)burst(c.x,c.y,6,'#5dffa0',90);
  }
  G.R.push({x:wx,y:wy,r:0,max:R,t:0,life:d.ringLife,rgb:BDD.skillFx.cGood});
}
function bdSkBarrage(d){
  const n=d.rockets,cols=Math.ceil(Math.sqrt(n)),rows=Math.ceil(n/cols);
  const z=bdSkZone(),cw=(z.xb-z.xa)/cols,ch=(z.yb-z.ya)/rows;
  /* one rocket per grid cell, launch order shuffled so the impacts are spread over the stagger window */
  const order=[];for(let i=0;i<n;i++)order.push(i);
  for(let i=order.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));const t=order[i];order[i]=order[j];order[j]=t;}
  const R=bdSkArr('skRockets');
  for(let k=0;k<n;k++){
    const i=order[k],col=i%cols,row=Math.floor(i/cols);
    const x=z.xa+(col+rand(.15,.85))*cw,y=z.ya+(row+rand(.15,.85))*ch;
    R.push({x,y,t:-(k+rand(0,1))/n*d.stagger,hit:false});
  }
}
/* rocket impact: hits ground and air enemies inside the blast, never buildings or the player */
function bdSkBlast(x,y,dmg,R){
  for(const e of G.E){
    if(e.dead)continue;
    if(bdSkDist(e.x,e.y,x,y)-e.r>R)continue;
    hurtEnemy(e,dmg,false);
  }
  G.R.push({x,y,r:0,max:R,t:0,life:.3,rgb:BDD.skillFx.cRocket});
  burst(x,y,14,'#ffb36b',190);
  G.shake=Math.max(G.shake,3);
}
function bdSkObsidian(c,r){
  const n=BDD.skills.obsidian.tiles;
  for(let i=0;i<n;i++)bdAdd('wall','obsidian',c+i,r);
  const x=(c+n/2)*BDT,y=(r+.5)*BDT;
  burst(x,y,14,'#b57bff',160);
  G.R.push({x,y,r:0,max:BDT*n*.6,t:0,life:.3,rgb:BDD.skillFx.cObs});
}

/* apply a skill whose check has already passed. Energy is paid by the caller. */
function bdSkApply(id,wx,wy){
  const d=BDD.skills[id];
  switch(id){
    case 'shockwave':bdSkShockwave(d);break;
    case 'overcharge':bdSkOvercharge(d);break;
    case 'mend':bdSkMend(d,wx,wy);break;
    case 'barrage':bdSkBarrage(d);break;
    case 'obsidian':bdSkObsidian(bdTileC(wx),bdTileR(wy));break;
  }
}

/* called by the UI on left click with the world coords of the mouse. True if the skill fired. */
function bdSkillUse(id,wx,wy){
  const B=G.bd,d=BDD.skills[id];
  if(!B||!d||B.over||B.dead)return false;
  if(B.energy<d.energy){bdSkFail(wx,wy,'Not enough energy');return false;}
  const err=bdSkCheck(id,wx,wy);
  if(err){bdSkFail(wx,wy,err);return false;}
  B.energy-=d.energy;
  bdSkApply(id,wx,wy);
  return true;
}

/* cursor preview in world space. Called by the UI while a skill is selected. */
function bdSkillGhost(id,sx,sy){
  const B=G.bd,d=BDD.skills[id];
  if(!B||!d)return;
  const cx=mouseWX(),cy=mouseWY(),p=G.p;
  ctx.save();
  if(id==='shockwave'){
    const x=sx(p.x),y=sy(p.y),R=d.radius*BDT;
    ctx.fillStyle='rgba(120,230,255,.08)';ctx.beginPath();ctx.arc(x,y,R,0,6.283);ctx.fill();
    ctx.strokeStyle='rgba(120,230,255,.7)';ctx.lineWidth=2;ctx.setLineDash([10,7]);
    ctx.beginPath();ctx.arc(x,y,R,0,6.283);ctx.stroke();
  }
  else if(id==='mend'){
    const inReach=bdSkDist(p.x,p.y,cx,cy)<=d.reach*BDT;
    const col=inReach?BDD.skillFx.cGood:BDD.skillFx.cBad,a=inReach?1:.35;
    /* reach ring around the player so the limit is visible */
    ctx.strokeStyle='rgba(255,255,255,.18)';ctx.lineWidth=1;ctx.setLineDash([4,6]);
    ctx.beginPath();ctx.arc(sx(p.x),sy(p.y),d.reach*BDT,0,6.283);ctx.stroke();
    ctx.setLineDash([]);
    const x=sx(cx),y=sy(cy),R=d.radius*BDT;
    ctx.fillStyle='rgba('+col+','+(.15*a)+')';ctx.beginPath();ctx.arc(x,y,R,0,6.283);ctx.fill();
    ctx.strokeStyle='rgba('+col+','+(.9*a)+')';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,R,0,6.283);ctx.stroke();
  }
  else if(id==='obsidian'){
    const c=bdTileC(cx),r=bdTileR(cy),n=d.tiles;
    const ok=!bdObsidianErr(c,r),col=ok?BDD.skillFx.cGood:BDD.skillFx.cBad;
    for(let i=0;i<n;i++){
      const x=sx((c+i)*BDT),y=sy(r*BDT);
      ctx.fillStyle='rgba('+col+',.3)';ctx.fillRect(x,y,BDT,BDT);
      ctx.strokeStyle='rgba('+col+',.9)';ctx.lineWidth=2;ctx.strokeRect(x+1,y+1,BDT-2,BDT-2);
    }
  }
  else if(id==='barrage'){
    const z=bdSkZone();
    ctx.strokeStyle='rgba('+BDD.skillFx.cRocket+',.5)';ctx.lineWidth=1.5;ctx.setLineDash([12,8]);
    ctx.strokeRect(sx(z.xa),sy(z.ya),z.xb-z.xa,z.yb-z.ya);
    ctx.setLineDash([]);
    ctx.strokeStyle='rgba('+BDD.skillFx.cRocket+',.6)';ctx.lineWidth=1.5;
    ctx.beginPath();ctx.arc(sx(cx),sy(cy),d.blast*BDT,0,6.283);ctx.stroke();
  }
  /* overcharge needs no target: no preview */
  ctx.restore();
}

/* per-frame: overcharge drain, rocket flight and impacts, floating text ageing */
BDUPD.push(dt=>{
  const B=G.bd;
  if(!B)return;
  for(const b of B.buildings){
    if(!(b.ocDrain>0))continue;
    const step=Math.min(b.ocDrain,b.ocRate*dt);
    b.ocDrain-=step;
    b.hp=Math.min(b.hp,Math.max(1,b.hp-step));
    if(b.ocDrain<1e-6)b.ocDrain=0;
  }
  const R=B.skRockets;
  if(R&&R.length){
    const fall=BDD.skills.barrage.fall,dmg=BDD.skills.barrage.dmg,blast=BDD.skills.barrage.blast*BDT;
    for(const r of R){
      r.t+=dt;
      if(!r.hit&&r.t>=fall){r.hit=true;bdSkBlast(r.x,r.y,dmg,blast);}
    }
    B.skRockets=R.filter(r=>r.t<fall);
  }
  const T=B.skTxt;
  if(T&&T.length){
    for(const f of T)f.t+=dt;
    B.skTxt=T.filter(f=>f.t<BDD.skillFx.txtLife);
  }
});

/* world-space drawing of the transient effects, above buildings */
BDFX.push((sx,sy)=>{
  const B=G.bd;
  if(!B)return;
  const R=B.skRockets;
  if(R&&R.length){
    const fall=BDD.skills.barrage.fall,H=BDD.skills.barrage.rocketH;
    for(const r of R){
      const x=sx(r.x),y=sy(r.y);
      if(r.t<0){
        /* waiting: a faint crosshair on the landing spot */
        ctx.strokeStyle='rgba('+BDD.skillFx.cRocket+',.35)';ctx.lineWidth=1.5;
        ctx.beginPath();ctx.moveTo(x-5,y);ctx.lineTo(x+5,y);ctx.moveTo(x,y-5);ctx.lineTo(x,y+5);ctx.stroke();
        continue;
      }
      const p=Math.min(1,r.t/fall),h=(1-p)*H;
      ctx.fillStyle='rgba(0,0,0,'+(.15+.35*p)+')';
      ctx.beginPath();ctx.ellipse(x,y,4+10*p,2+5*p,0,0,6.283);ctx.fill();
      ctx.globalCompositeOperation='lighter';gl(x,y-h,16,BDD.skillFx.cRocket,.55);
      ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;
      ctx.strokeStyle='#ffd9b0';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x,y-h-12);ctx.lineTo(x,y-h);ctx.stroke();
      ctx.fillStyle='#ffb36b';ctx.beginPath();ctx.arc(x,y-h,3,0,6.283);ctx.fill();
    }
  }
  const T=B.skTxt;
  if(T&&T.length){
    ctx.font=BDD.skillFx.txtFont;ctx.textAlign='center';
    for(const f of T){
      const k=f.t/BDD.skillFx.txtLife;
      ctx.globalAlpha=1-k;
      ctx.fillStyle='rgb('+f.col+')';
      ctx.fillText(f.text,sx(f.x),sy(f.y)-k*BDD.skillFx.txtRise-10);
    }
    ctx.globalAlpha=1;ctx.textAlign='start';
  }
});
