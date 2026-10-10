/* bd-tur-ground: per-frame behaviour of the ground turrets. Each registers BDTUR[id](b,dt).
   Numbers come from BDD.turrets[id] (bd-data.js and bd-data-ground.js only).
   Per-building state: b.cd (cooldown), b.aim (radians toward target), b.flash (muzzle flash timer),
   b.ramp (machine gun ramp 0..1), b.idle (machine gun time with no target), b.ph (freeze pulse clock), b.pAcc (flame puff accumulator).
   Effects live on G.bd.fxG (tracers, beams, bolts, flame puffs, acid lobs) and G.bd.puddles (acid puddles).
   Both are created lazily on G.bd, so they die with the run. Enemy angle passed to hurtEnemy is the direction from the
   enemy toward the turret (same convention as beam() in combat.js), which is the side a shielder has to face. */

/* G.bd effect list, created on demand. null outside Base Defence. */
function bdgFx(){const B=G.bd;if(!B)return null;if(!B.fxG)B.fxG=[];return B.fxG;}

/* per-frame housekeeping shared by every ground turret */
function bdgTick(b,dt){
  if(b.cd===undefined)b.cd=0;
  if(b.aim===undefined)b.aim=0;
  if(b.ramp===undefined)b.ramp=0;
  b.flash=Math.max(0,(b.flash||0)-dt);
}
/* point the turret at e, centre c */
function bdgAim(b,e,c){b.aim=Math.atan2(e.y-c.y,e.x-c.x);}
/* direction from enemy e toward turret centre c */
const bdgFrom=(e,c)=>Math.atan2(c.y-e.y,c.x-e.x);

/* cooldown shots: dt is subtracted every frame, and while a target exists each shot calls fire(tg) and adds interval.
   Overshoot carries over, so rapid fire keeps its true rate. Without a target the cooldown does not bank up. */
function bdgCool(b,dt,tg,interval,fire){
  b.cd-=dt;
  if(!tg){b.cd=Math.max(0,b.cd);return 0;}
  let n=0;
  while(b.cd<=0&&n<4&&tg&&!tg.dead){fire(tg);b.cd+=interval;n++;}
  return n;
}

function bdgTracer(c,e,col,w,life){
  const fx=bdgFx();if(!fx)return;
  fx.push({type:'tracer',x1:c.x,y1:c.y,x2:e.x,y2:e.y,col,w,life,t:0});
}

/* jagged polyline through pts (flat x,y array). Each segment is cut into roughly BDD seg tiles and jittered. */
function bdgJag(pts,jag,seg){
  const out=[],step=seg*BDT;
  for(let i=0;i+3<pts.length;i+=2){
    const x1=pts[i],y1=pts[i+1],x2=pts[i+2],y2=pts[i+3];
    const n=Math.max(1,Math.round(Math.hypot(x2-x1,y2-y1)/step));
    for(let k=0;k<n;k++){
      const t=k/n,jx=k?rand(-jag,jag):0,jy=k?rand(-jag,jag):0;
      out.push(x1+(x2-x1)*t+jx,y1+(y2-y1)*t+jy);
    }
  }
  out.push(pts[pts.length-2],pts[pts.length-1]);
  return out;
}

/* ---------- pistol: hitscan, short tracer ---------- */
BDTUR.pistol=(b,dt)=>{
  bdgTick(b,dt);
  const T=BDD.turrets.pistol,tg=bdTarget(b),c=bdCenter(b);
  if(tg)bdgAim(b,tg,c);
  bdgCool(b,dt,tg,1/(T.rate*bdStat(b,'rate')),e=>{
    hurtEnemy(e,T.dmg*bdStat(b,'dmg'),false,bdgFrom(e,c));
    bdgTracer(c,e,T.col,T.tracerW,T.tracer);
    b.flash=T.flash;
  });
};

/* ---------- machine gun: ramps fire rate while it keeps shooting ---------- */
BDTUR.mg=(b,dt)=>{
  bdgTick(b,dt);
  const T=BDD.turrets.mg,tg=bdTarget(b),c=bdCenter(b);
  if(tg){
    bdgAim(b,tg,c);
    b.idle=0;
    b.ramp=Math.min(1,b.ramp+dt/T.ramp);
  }else{
    b.idle=(b.idle||0)+dt;
    if(b.idle>=T.reset)b.ramp=0;
  }
  const rate=(T.rate+(T.rateMax-T.rate)*b.ramp)*bdStat(b,'rate');
  bdgCool(b,dt,tg,1/rate,e=>{
    hurtEnemy(e,T.dmg*bdStat(b,'dmg'),false,bdgFrom(e,c));
    bdgTracer(c,e,T.col,T.tracerW,T.tracer);
    b.flash=T.flash;
  });
};

/* ---------- flame: cone of damage, burning, glow puffs ---------- */
BDTUR.flame=(b,dt)=>{
  bdgTick(b,dt);
  const T=BDD.turrets.flame,tg=bdTarget(b),c=bdCenter(b),R=bdRange(b),fx=bdgFx();
  if(!tg||!fx)return;
  bdgAim(b,tg,c);
  b.flash=T.flash;
  const dmg=T.dps*dt*bdStat(b,'dmg');
  for(const e of G.E){
    if(e.dead||e.fly)continue;
    const dx=e.x-c.x,dy=e.y-c.y,dd=Math.hypot(dx,dy);
    if(dd-e.r>R)continue;
    let df=Math.atan2(dy,dx)-b.aim;
    df=Math.atan2(Math.sin(df),Math.cos(df));
    /* the cone is widened by the enemy's own angular size */
    if(Math.abs(df)>T.cone+Math.atan2(e.r,dd))continue;
    hurtEnemy(e,dmg,true,bdgFrom(e,c));
    e.burn=T.burn;e.bd=T.burnDps;
  }
  /* glow puffs along the cone */
  b.pAcc=(b.pAcc||0)+T.puffRate*dt;
  while(b.pAcc>=1){
    b.pAcc-=1;
    if(fx.length>=T.maxFx)break;
    const a=b.aim+rand(-T.cone,T.cone),d=rand(.3,1)*R;
    fx.push({type:'puff',x:c.x+Math.cos(a)*d*.5,y:c.y+Math.sin(a)*d*.5,vx:Math.cos(a)*T.puffSpeed,vy:Math.sin(a)*T.puffSpeed,
      sz:T.puffSz*rand(.7,1.3),col:T.col,life:T.puffLife*rand(.7,1.2),t:0});
  }
};

/* ---------- laser: hits everything along a line out to range ---------- */
BDTUR.laser=(b,dt)=>{
  bdgTick(b,dt);
  const T=BDD.turrets.laser,tg=bdTarget(b),c=bdCenter(b),R=bdRange(b);
  if(tg)bdgAim(b,tg,c);
  bdgCool(b,dt,tg,T.every/bdStat(b,'rate'),e=>{
    const a=Math.atan2(e.y-c.y,e.x-c.x),dmg=T.dmg*bdStat(b,'dmg');
    for(const h of lineHits(c.x,c.y,a,0)){
      if(h[0]>R||h[1].fly)continue;
      hurtEnemy(h[1],dmg,false,bdgFrom(h[1],c));
    }
    const fx=bdgFx();
    if(fx)fx.push({type:'beam',x1:c.x,y1:c.y,x2:c.x+Math.cos(a)*R,y2:c.y+Math.sin(a)*R,w:T.beamW,col:T.col,life:T.beamLife,t:0});
    b.flash=T.flash;
  });
};

/* ---------- freeze: continuous slow and chip damage in range ---------- */
BDTUR.freeze=(b,dt)=>{
  bdgTick(b,dt);
  const T=BDD.turrets.freeze;
  b.ph=(b.ph||0)+dt;
  for(const e of bdTargets(b)){
    hurtEnemy(e,T.dps*dt*bdStat(b,'dmg'),true);
    e.slow=T.slowFor;e.slowAmt=T.slow;
  }
};

/* ---------- tesla: hit, then chain to nearby unhit ground enemies ---------- */
BDTUR.tesla=(b,dt)=>{
  bdgTick(b,dt);
  const T=BDD.turrets.tesla,tg=bdTarget(b),c=bdCenter(b),jumpPx=T.jump*BDT;
  if(tg)bdgAim(b,tg,c);
  bdgCool(b,dt,tg,1/(T.rate*bdStat(b,'rate')),e=>{
    let dmg=T.dmg*bdStat(b,'dmg'),from=e;
    const hit=new Set([e]),pts=[c.x,c.y,e.x,e.y];
    hurtEnemy(e,dmg,false,bdgFrom(e,c));
    for(let k=0;k<T.chain;k++){
      dmg*=T.falloff;
      let best=null,bestD=jumpPx;
      for(const o of G.E){
        if(o.dead||o.fly||hit.has(o))continue;
        const d=Math.hypot(o.x-from.x,o.y-from.y);
        if(d<=bestD){bestD=d;best=o;}
      }
      if(!best)break;
      hit.add(best);
      hurtEnemy(best,dmg,false,bdgFrom(best,from));
      pts.push(best.x,best.y);
      from=best;
    }
    const fx=bdgFx();
    if(fx)fx.push({type:'bolt',pts:bdgJag(pts,T.jag,T.seg),col:T.col,w:T.boltW,life:T.boltLife,t:0});
    b.flash=T.flash;
  });
};

/* ---------- sniper: highest HP target, heavy shot ---------- */
BDTUR.sniper=(b,dt)=>{
  bdgTick(b,dt);
  const T=BDD.turrets.sniper,tg=bdTarget(b,{highestHp:true}),c=bdCenter(b);
  if(tg)bdgAim(b,tg,c);
  bdgCool(b,dt,tg,T.every/bdStat(b,'rate'),e=>{
    hurtEnemy(e,T.dmg*bdStat(b,'dmg'),false,bdgFrom(e,c));
    bdgTracer(c,e,T.col,T.tracerW,T.tracer);
    b.flash=T.flash;
  });
};

/* ---------- acid: lob a puddle onto the target ---------- */
BDTUR.acid=(b,dt)=>{
  bdgTick(b,dt);
  const T=BDD.turrets.acid,tg=bdTarget(b),c=bdCenter(b);
  if(tg)bdgAim(b,tg,c);
  bdgCool(b,dt,tg,T.every/bdStat(b,'rate'),e=>{
    const fx=bdgFx();if(!fx)return;
    fx.push({type:'lob',x1:c.x,y1:c.y,x2:e.x,y2:e.y,arc:T.lobArc,sz:T.lobSize,col:T.col,
      dps:T.dps*bdStat(b,'dmg'),pf:T.puddleFor,life:T.lobTime,t:0});
    b.flash=T.flash;
  });
};

/* a lob that has landed becomes a puddle on G.bd.puddles */
function bdgLand(f){
  const B=G.bd;if(!B)return;
  if(!B.puddles)B.puddles=[];
  B.puddles.push({x:f.x2,y:f.y2,t:0,life:f.pf,dps:f.dps});
  burst(f.x2,f.y2,8,f.col,120);
}

/* effects and puddles: move, expire, and puddle damage */
BDUPD.push(dt=>{
  const B=G.bd;if(!B)return;
  if(B.fxG){
    const keep=[];
    for(const f of B.fxG){
      f.t+=dt;
      if(f.t<f.life){
        if(f.type==='puff'){f.x+=f.vx*dt;f.y+=f.vy*dt;}
        keep.push(f);
      }else if(f.type==='lob')bdgLand(f);
    }
    B.fxG=keep;
  }
  if(B.puddles){
    const half=BDD.turrets.acid.puddle*BDT/2;
    for(const p of B.puddles){
      p.t+=dt;
      for(const e of G.E){
        if(e.dead||e.fly)continue;
        if(Math.abs(e.x-p.x)<=half&&Math.abs(e.y-p.y)<=half)hurtEnemy(e,p.dps*dt,true);
      }
    }
    B.puddles=B.puddles.filter(p=>p.t<p.life);
  }
});

/* draw: tracers, beams, bolts, puffs, lobs (additive) */
BDFX.push((sx,sy)=>{
  const B=G.bd;if(!B||!B.fxG||!B.fxG.length)return;
  ctx.save();ctx.globalCompositeOperation='lighter';
  for(const f of B.fxG){
    const k=f.t/f.life,a=1-k;
    if(f.type==='tracer'){
      ctx.globalAlpha=a;ctx.strokeStyle=f.col;ctx.lineWidth=f.w;
      ctx.beginPath();ctx.moveTo(sx(f.x1),sy(f.y1));ctx.lineTo(sx(f.x2),sy(f.y2));ctx.stroke();
    }else if(f.type==='beam'){
      ctx.strokeStyle=f.col;
      ctx.globalAlpha=a*.35;ctx.lineWidth=f.w*3;
      ctx.beginPath();ctx.moveTo(sx(f.x1),sy(f.y1));ctx.lineTo(sx(f.x2),sy(f.y2));ctx.stroke();
      ctx.globalAlpha=a;ctx.lineWidth=f.w;ctx.stroke();
    }else if(f.type==='bolt'){
      ctx.globalAlpha=a;ctx.strokeStyle=f.col;ctx.lineWidth=f.w;
      ctx.beginPath();ctx.moveTo(sx(f.pts[0]),sy(f.pts[1]));
      for(let i=2;i<f.pts.length;i+=2)ctx.lineTo(sx(f.pts[i]),sy(f.pts[i+1]));
      ctx.stroke();
    }else if(f.type==='puff'){
      gl(sx(f.x),sy(f.y),f.sz*(1+k),f.col,a*.6);
    }else if(f.type==='lob'){
      const x=f.x1+(f.x2-f.x1)*k,y=f.y1+(f.y2-f.y1)*k-Math.sin(Math.PI*k)*f.arc;
      gl(sx(x),sy(y),f.sz,f.col,1);
    }
  }
  ctx.restore();
});

/* draw: acid puddles, green squares with rising bubbles */
BDFX.push((sx,sy)=>{
  const B=G.bd;if(!B||!B.puddles||!B.puddles.length)return;
  const T=BDD.turrets.acid,half=T.puddle*BDT/2;
  ctx.save();
  for(const p of B.puddles){
    const a=Math.min(1,(p.life-p.t)/T.fade)*T.alpha;
    ctx.globalAlpha=a;ctx.fillStyle=T.col;
    ctx.fillRect(sx(p.x-half),sy(p.y-half),half*2,half*2);
    ctx.globalAlpha=Math.min(1,a*2);ctx.fillStyle='#f4ffd0';
    for(let i=0;i<T.bubbles;i++){
      const f=(p.t*T.bubbleRate+i/T.bubbles)%1;
      const bx=p.x+Math.cos(i*2.4)*half*.6,by=p.y+half*.7-f*half*1.4;
      ctx.beginPath();ctx.arc(sx(bx),sy(by),T.bubbleR,0,Math.PI*2);ctx.fill();
    }
  }
  ctx.restore();
});

/* draw: freeze turrets get a faint pulsing ice ring at their range */
BDFX.push((sx,sy)=>{
  const B=G.bd;if(!B)return;
  const T=BDD.turrets.freeze;
  for(const b of B.buildings){
    if(b.id!=='freeze')continue;
    const c=bdCenter(b),R=bdRange(b),pulse=.5+.5*Math.sin((b.ph||0)*T.pulseHz*Math.PI*2);
    ctx.save();
    ctx.globalAlpha=T.ringAlpha*(.5+.5*pulse);ctx.strokeStyle=T.col;ctx.lineWidth=T.ringW;
    ctx.beginPath();ctx.arc(sx(c.x),sy(c.y),R*(.96+.04*pulse),0,Math.PI*2);ctx.stroke();
    ctx.restore();
  }
});
