/* bd-tur-air: anti-air turrets (flak, seeker missiles) and the missile battery (air and ground).
   Registers BDTUR.flak, BDTUR.seeker, BDTUR.missile, one BDUPD system (homing missile flight and impact)
   and one BDFX system (missiles, tracers, muzzle flashes). Homing missiles live in G.bd.missiles (created lazily). */

/* does enemy e match a hits filter: 'air' flyers only, 'ground' walkers only, 'both' everything */
function bdAirHitOK(e,hits){
  if(hits==='air')return !!e.fly;
  if(hits==='ground')return !e.fly;
  return true;
}
/* is the body of enemy e within r px of (x,y)? Same measure as bdTargets: centre distance minus body radius */
const bdAirNear=(e,x,y,r)=>Math.hypot(e.x-x,e.y-y)-e.r<r;

/* a homing missile looks for the nearest eligible enemy within seekRange tiles */
function bdAirNearest(m){
  let best=null,bd=BDD.air.homing.seekRange*BDT;
  for(const e of G.E){
    if(e.dead||!bdAirHitOK(e,m.hits))continue;
    const d=Math.hypot(e.x-m.x,e.y-m.y);
    if(d<bd){bd=d;best=e;}
  }
  return best;
}
/* first eligible enemy the missile currently touches (proximity fuse), or null */
function bdAirTouch(m){
  for(const e of G.E){
    if(e.dead||!bdAirHitOK(e,m.hits))continue;
    if(bdAirNear(e,m.x,m.y,m.hitR))return e;
  }
  return null;
}
/* missile detonation: every eligible enemy inside the blast radius takes the full missile damage */
function bdAirBoom(m,x,y){
  const A=BDD.air;
  for(const e of G.E){
    if(e.dead||!bdAirHitOK(e,m.hits))continue;
    if(!bdAirNear(e,x,y,m.rad))continue;
    hurtEnemy(e,m.dmg,true,Math.atan2(y-e.y,x-e.x));
  }
  G.R.push({x,y,r:0,max:Math.max(A.boomRing,m.rad*A.ringMul),t:0,life:.22,rgb:m.rgb});
  burst(x,y,m.rad>m.hitR?10:6,m.col,170);
  G.shake=Math.max(G.shake,A.boomShake);
}
/* launch one homing missile from turret b at target t. k is its index of n, which fans the salvo out */
function bdAirLaunch(b,t,k,n,spec,dmg,hits,splashPx,col,rgb){
  const B=G.bd,c=bdCenter(b);
  if(!B.missiles)B.missiles=[];
  if(B.missiles.length>=BDD.air.maxInFlight)return;
  const a=Math.atan2(t.y-c.y,t.x-c.x)+(k-(n-1)/2)*spec.spread;
  B.missiles.push({x:c.x,y:c.y,ang:a,sp:spec.launch,spd:spec.spd,turn:spec.turn,life:spec.life,
    tgt:t,hits,dmg,hitR:spec.hitR,rad:Math.max(spec.hitR,splashPx||0),col,rgb,sm:0});
}

/* flak: hitscan flak burst on the closest flyer. Splash hurts other flyers near the burst. */
BDTUR.flak=function(b,dt){
  if(!G.bd)return;
  const D=BDD.turrets.flak,A=BDD.air.flak,c=bdCenter(b);
  b.flash=Math.max(0,(b.flash||0)-dt);
  b.cd=(b.cd||0)-dt;
  const t=bdTarget(b);
  if(!t){b.cd=0;return;}
  b.aim=Math.atan2(t.y-c.y,t.x-c.x);
  if(b.cd>0)return;
  b.cd=Math.max(0,b.cd+1/(D.rate*bdStat(b,'rate')));
  const dmg=D.dmg*bdStat(b,'dmg'),R=D.splash*BDT;
  hurtEnemy(t,dmg,true,Math.atan2(c.y-t.y,c.x-t.x));
  for(const e of G.E){
    if(e===t||e.dead||!e.fly)continue;
    if(!bdAirNear(e,t.x,t.y,R))continue;
    hurtEnemy(e,dmg*A.splashMul,true,Math.atan2(t.y-e.y,t.x-e.x));
  }
  b.tx=t.x;b.ty=t.y;b.flash=BDD.air.flashT;
  burst(t.x,t.y,A.puff,D.col,A.puffSpd);
};

/* seeker missiles: a salvo of homing missiles every `every` s at flyers. Overcharge and upgrades shorten the wait. */
BDTUR.seeker=function(b,dt){
  if(!G.bd)return;
  const D=BDD.turrets.seeker,S=BDD.air.seeker,c=bdCenter(b);
  b.flash=Math.max(0,(b.flash||0)-dt);
  b.cd=(b.cd||0)-dt;
  const tg=bdTargets(b);
  if(!tg.length){b.cd=0;return;}
  b.aim=Math.atan2(tg[0].y-c.y,tg[0].x-c.x);
  if(b.cd>0)return;
  b.cd=Math.max(0,b.cd+D.every/bdStat(b,'rate'));
  const dmg=D.dmg*bdStat(b,'dmg');
  for(let k=0;k<D.missiles;k++)bdAirLaunch(b,tg[k%tg.length],k,D.missiles,S,dmg,'air',0,D.col,'127,255,212');
  b.tx=tg[0].x;b.ty=tg[0].y;b.flash=BDD.air.flashT;
  burst(c.x,c.y,4,D.col,90);
};

/* missile battery: a salvo of homing missiles every `every` s at air and ground enemies, with small splash on impact */
BDTUR.missile=function(b,dt){
  if(!G.bd)return;
  const D=BDD.turrets.missile,S=BDD.air.missile,c=bdCenter(b);
  b.flash=Math.max(0,(b.flash||0)-dt);
  b.cd=(b.cd||0)-dt;
  const tg=bdTargets(b);
  if(!tg.length){b.cd=0;return;}
  b.aim=Math.atan2(tg[0].y-c.y,tg[0].x-c.x);
  if(b.cd>0)return;
  b.cd=Math.max(0,b.cd+D.every/bdStat(b,'rate'));
  const dmg=D.dmg*bdStat(b,'dmg');
  for(let k=0;k<D.missiles;k++)bdAirLaunch(b,tg[k%tg.length],k,D.missiles,S,dmg,'both',D.splash*BDT,D.col,'255,154,60');
  b.tx=tg[0].x;b.ty=tg[0].y;b.flash=BDD.air.flashT;
  burst(c.x,c.y,4,D.col,90);
};

/* homing flight, retargeting, proximity detonation. Missiles keep flying straight if nothing is left to chase. */
BDUPD.push(dt=>{
  const B=G.bd;
  if(!B||!B.missiles||!B.missiles.length)return;
  const A=BDD.air,keep=[];
  for(const m of B.missiles){
    m.life-=dt;
    if(m.life<=0)continue;
    if(!m.tgt||m.tgt.dead)m.tgt=bdAirNearest(m);
    if(m.tgt){
      const want=Math.atan2(m.tgt.y-m.y,m.tgt.x-m.x);
      let df=want-m.ang;df=Math.atan2(Math.sin(df),Math.cos(df));
      m.ang+=clamp(df,-m.turn*dt,m.turn*dt);
    }
    m.sp+=(m.spd-m.sp)*Math.min(1,dt*3);
    m.x+=Math.cos(m.ang)*m.sp*dt;m.y+=Math.sin(m.ang)*m.sp*dt;
    m.sm-=dt;
    if(m.sm<=0){m.sm=A.smokeEvery;burst(m.x,m.y,1,'#cfd6e6',30);}
    if(bdAirTouch(m)){bdAirBoom(m,m.x,m.y);continue;}
    keep.push(m);
  }
  B.missiles=keep;
});

/* missiles, muzzle flashes and flak tracers. Runs above the buildings. */
BDFX.push((sx,sy)=>{
  const B=G.bd;
  if(!B)return;
  const A=BDD.air;
  ctx.globalAlpha=1;
  for(const m of B.missiles||[]){
    const x=sx(m.x),y=sy(m.y);
    if(x<-30||x>W+30||y<-30||y>H+30)continue;
    ctx.globalCompositeOperation='lighter';gl(x,y,9,m.col,.5);
    ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;
    const ca=Math.cos(m.ang),sa=Math.sin(m.ang);
    ctx.strokeStyle=m.col;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x-ca*7,y-sa*7);ctx.lineTo(x+ca*3,y+sa*3);ctx.stroke();
  }
  for(const b of B.buildings){
    if(b.kind!=='turret'||!(b.flash>0))continue;
    const k=b.flash/A.flashT,c=bdCenter(b),x=sx(c.x),y=sy(c.y);
    if(b.id==='flak'){
      ctx.strokeStyle=BDD.turrets.flak.col;ctx.lineWidth=1.5;ctx.globalAlpha=k;
      ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(sx(b.tx),sy(b.ty));ctx.stroke();
    }else{
      ctx.globalCompositeOperation='lighter';gl(x,y,4+12*k,BDD.turrets[b.id].col,k);
      ctx.globalCompositeOperation='source-over';
    }
    ctx.globalAlpha=1;
  }
  ctx.globalAlpha=1;
});
