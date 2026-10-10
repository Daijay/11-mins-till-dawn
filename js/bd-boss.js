/* Base Defence boss logic. bdSovereign(e,dt) runs once per frame for the Sovereign (type 'super'),
   called from bdEnemies() in bd-enemies.js, which skips the normal AI for him.
   He walks down the road centre line, crushes everything his circle overlaps except
   hold walls (iron, crystal, obsidian). Those stop him per row until their hold time runs out.
   Touching the core starts a timed break. Hold state lives on the enemy: e.holdRow, e.holdT, e.holdTot. */

/* ---------- overlap scan ---------- */
/* buildings whose rect overlaps the Sovereign circle, split into hold walls and everything else */
function bdSovScan(e){
  const B=G.bd,r=e.r,x=e.x,y=e.y,crush=[],holds=[],seen=new Set();
  for(let rr=bdTileR(y-r);rr<=bdTileR(y+r);rr++)for(let cc=bdTileC(x-r);cc<=bdTileC(x+r);cc++){
    const b=B.tiles.get(bdKey(cc,rr));
    if(!b||b.dead||seen.has(b))continue;
    seen.add(b);
    const bx=b.c*BDT,by=b.r*BDT,bw=b.w*BDT,bh=b.h*BDT;
    const nx=clamp(x,bx,bx+bw),ny=clamp(y,by,by+bh);
    if((x-nx)*(x-nx)+(y-ny)*(y-ny)>=r*r)continue;
    const d=bdDef(b.kind,b.id);
    if(b.kind==='wall'&&d.hold>0)holds.push(b);else crush.push(b);
  }
  return {crush,holds};
}

/* front-most hold wall (smallest row, he comes from above) */
function bdSovFront(list){
  let best=null;
  for(const b of list){if(!best||b.r<best.r)best=b;}
  return best;
}

function bdSovereign(e,dt){
  const B=G.bd,p=G.p,S=BDD.boss.sovereign;
  if(!B)return;
  bdSovInstall();
  if(e.dead){if(!B.sovDead)B.sovDead=true;return;}

  const hits=bdSovScan(e);
  /* crush: everything except hold walls is destroyed on overlap */
  for(const b of hits.crush)if(!b.dead)bdDestroy(b);

  const slow=e.slow>0?1-(e.slowAmt||0):1;
  if(e.pushT>0){
    /* pushed back by Shockwave: no hold, no core break, move up the road */
    e.pushT-=dt;
    e.holdRow=undefined;e.holdT=0;
    e.y-=S.pushSpeed*dt;
    if(e.y<-S.r)e.y=-S.r;
  }else{
    let live=hits.holds.filter(b=>!b.dead);
    /* a running hold timer: when it runs out, destroy that row's hold walls and resume */
    if(e.holdRow!==undefined){
      e.holdT-=dt;
      if(e.holdT<=0){
        for(const b of live)if(b.r===e.holdRow&&!b.dead)bdDestroy(b);
        e.holdRow=undefined;e.holdT=0;e.holdTot=0;
        live=live.filter(b=>!b.dead);
      }
    }
    /* a new hold row starts when a hold wall is overlapped and no hold is running */
    if(e.holdRow===undefined&&live.length){
      const f=bdSovFront(live);
      e.holdRow=f.r;
      e.holdTot=bdDef(f.kind,f.id).hold;
      e.holdT=e.holdTot;
    }
    if(e.holdRow!==undefined){
      /* held: no movement this frame */
    }else if(bdHitsCore(e.x,e.y,e.r)){
      /* touching the core: break it in coreBreak seconds */
      bdDamageCore(G.bd.core.max/S.coreBreak*dt);
    }else{
      e.y+=e.spd*slow*dt;
    }
  }
  e.x=(BD_ROAD.x0+BD_ROAD.x1)/2;

  /* contact with the player (hurtPlayer handles invincibility frames) */
  if(!B.dead&&Math.hypot(p.x-e.x,p.y-e.y)<e.r+p.r)hurtPlayer(e.dmg);
}

/* ---------- hooks, installed once on the first call (BDFX and BDUPD are filled at runtime) ---------- */
let bdSovInstalled=false;
function bdSovInstall(){
  if(bdSovInstalled)return;
  bdSovInstalled=true;
  /* notice the Sovereign's death: hurtEnemy sets G.sovDead, the dead enemy is no longer visited */
  BDUPD.push(()=>{if(G.bd&&G.sovDead&&!G.bd.sovDead)G.bd.sovDead=true;});
  BDFX.push(bdSovDrawHold);
}

/* hint while held: a glowing band across the held row, a ring at his contact point and sparks */
function bdSovDrawHold(sx,sy){
  if(!G.bd||!G.E)return;
  const e=G.E.find(o=>o.type==='super'&&!o.dead&&o.holdRow!==undefined);
  if(!e)return;
  const y=sy(e.holdRow*BDT)+BDT/2,x0=sx(BD_ROAD.x0),x1=sx(BD_ROAD.x1),cx=sx(e.x);
  const k=e.holdTot>0?clamp(1-e.holdT/e.holdTot,0,1):0;
  ctx.save();
  ctx.globalCompositeOperation='lighter';
  ctx.fillStyle='rgba(255,170,90,'+(.18+.12*Math.sin(G.t*12))+')';
  ctx.fillRect(x0,y-BDT/2,x1-x0,BDT);
  ctx.strokeStyle='rgba(255,210,140,.85)';ctx.lineWidth=2;
  ctx.beginPath();ctx.arc(cx,y,22+30*k,0,Math.PI*2);ctx.stroke();
  ctx.fillStyle='rgba(255,236,190,.9)';
  for(let i=0;i<6;i++){
    const a=G.t*9+i*1.05;
    const px=cx+Math.cos(a)*(40+14*Math.sin(G.t*7+i)),py=y+Math.sin(a)*14;
    ctx.fillRect(px-1.5,py-1.5,3,3);
  }
  ctx.restore();
}
