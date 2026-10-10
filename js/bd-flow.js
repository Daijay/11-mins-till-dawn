/* Base Defence flow: per-frame bdUpdate(), waves and build phases, pickups, player movement limits,
   death and respawn, end screen. Called from update.js while G.bd is set. */

function bdUpdate(dt){
  const B=G.bd,p=G.p;
  if(B.over)return;
  /* economy */
  B.incomeT-=dt;
  while(B.incomeT<=0){B.incomeT+=BDD.eco.incomeEvery;B.crystals+=BDD.eco.income;}
  B.energy=Math.min(BDD.energy.max,B.energy+BDD.energy.regen*dt);
  B.core.fl=Math.max(0,B.core.fl-dt);
  for(const b of B.buildings)b.fl=Math.max(0,b.fl-dt);
  bdPickups(dt);
  bdEnemyShots();
  if(typeof bdTurrets==='function')bdTurrets(dt);
  if(typeof bdSystems==='function')bdSystems(dt);
  /* respawn */
  if(B.dead){
    B.respawnT-=dt;
    if(B.respawnT<=0)bdRespawn();
  }
  /* waves */
  if(B.phase==='build'){
    B.phaseT-=dt;
    if(B.phaseT<=0)bdStartWave();
  }else{
    B.waveT+=dt;B.clock+=dt;
    bdStreamSpawns(dt);
    if(B.timed&&B.clock>=DUR&&!B.over){finish(true);return;}
    const alive=G.E.some(e=>!e.dead);
    if(!B.queue.length&&B.spawnDone===undefined)B.spawnDone=B.waveT;
    const bossUp=G.E.some(e=>!e.dead&&(e.type==='boss'||e.type==='super'));
    if(!B.queue.length&&!bossUp&&(!alive||B.waveT-B.spawnDone>=BDD.wave.tail))bdEndWave();
  }
}

/* skip the build timer. Pays 0.5 crystals per second left. */
function bdSkipBuild(){
  const B=G.bd;
  if(!B||B.phase!=='build'||B.over)return;
  B.crystals+=Math.floor(B.phaseT*BDD.wave.skipRate);
  B.phaseT=0;
}

/* ---------- waves ---------- */
const bdIsBossWave=w=>w%BDD.boss.colossus.every===0;
function bdWaveTypes(w){
  const opts=[];
  const add=(t,wt)=>{if(BDD.unlock[t]<=w)opts.push([t,wt]);};
  add('grunt',10);add('runner',5+w*.4);add('splitter',3);add('spitter',2);add('charger',2.5);
  add('shielder',2.5);add('bomber',3);add('blinker',2);add('mender',1.5);add('brute',1.5+w*.3);
  return opts;
}
function bdStartWave(){
  const B=G.bd;
  B.wave++;B.phase='wave';B.waveT=0;B.spawnDone=undefined;B.spawnAcc=0;
  const w=B.wave,n=BDD.wave.count+BDD.wave.countPerWave*w;
  B.spawnDur=BDD.wave.stream+BDD.wave.streamPerWave*w;
  const opts=bdWaveTypes(w);let sum=0;opts.forEach(o=>sum+=o[1]);
  const q=[];
  for(let i=0;i<n;i++){
    let r=Math.random()*sum,t='grunt';
    for(const o of opts){if((r-=o[1])<=0){t=o[0];break;}}
    q.push(t);
  }
  if(w>=BDD.unlock.flyer){const nf=Math.round(BDD.wave.flyerBase+w*BDD.wave.flyerPerWave);for(let i=0;i<nf;i++)q.push('flyer');}
  for(let i=q.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[q[i],q[j]]=[q[j],q[i]];}
  /* cap spitters and menders alive at once, same idea as Survive */
  B.queue=q;
  /* bosses. The Sovereign replaces a Colossus when both would land on the same wave. */
  let boss=null;
  if(B.timed){
    if(!B.sovSpawned&&B.clock>=BDD.boss.timedSpawnAt)boss='super';
    else if(bdIsBossWave(w))boss='boss';
  }else{
    if(w===BDD.boss.endlessSovereignWave)boss='super';
    else if(bdIsBossWave(w))boss='boss';
  }
  if(boss==='super')B.sovSpawned=true;
  if(boss){
    const x=boss==='super'?BD_CORE.cx:BD_CORE.cx+rand(-40,40);
    spawn(boss,x,boss==='super'?-BDD.boss.sovereign.r:-60);
    G.banner={text:boss==='super'?'The Sovereign':'Colossus',sub:'Boss',t:4};
  }else G.banner={text:'Wave '+w,sub:'Wave',t:2.4};
}
function bdStreamSpawns(dt){
  const B=G.bd;
  if(!B.queue.length)return;
  B.spawnAcc+=B.queue.length>0?(dt*bdQueueRate()):0;
  while(B.spawnAcc>=1&&B.queue.length){
    B.spawnAcc-=1;
    const t=B.queue.pop();
    if(G.E.length>=380)continue;
    if(t==='flyer')spawn('flyer',rand(30,BDW-30),-30);
    else spawn(t,rand(BD_ROAD.x0+30,BD_ROAD.x1-30),-rand(20,50));
  }
}
/* enemies per second so the queue empties over spawnDur */
function bdQueueRate(){
  const B=G.bd;
  if(!B._rate||B._rateWave!==B.wave){B._rate=B.queue.length/B.spawnDur;B._rateWave=B.wave;}
  return B._rate;
}
function bdEndWave(){
  const B=G.bd;
  B.phase='build';
  B.phaseT=BDD.wave.build+BDD.wave.buildPerWave*Math.max(0,B.wave-1);
  G.banner={text:'Wave '+B.wave+' cleared',sub:'Build phase',t:2.4};
  B.score=Math.max(B.score,0);
  /* endless: waves survived is part of the score */
}

/* ---------- pickups ---------- */
function bdPickups(dt){
  const B=G.bd,p=G.p;
  for(const g of G.Gm){
    if(g.life===undefined)g.life=BDD.eco.gemLife;
    g.life-=dt;if(g.life<=0)g.dead=true;
  }
  const near=(o,rng)=>!B.dead&&Math.hypot(p.x-o.x,p.y-o.y)<rng;
  for(const c of B.cr){
    if(near(c,p.magnet)||c.pull){
      if(B.dead)continue;
      c.pull=true;const a=Math.atan2(p.y-c.y,p.x-c.x),d=Math.hypot(p.x-c.x,p.y-c.y),s=280+Math.max(0,p.magnet-d)*3;
      c.x+=Math.cos(a)*s*dt;c.y+=Math.sin(a)*s*dt;
    }
    if(near(c,p.r+8)){c.dead=true;B.crystals+=c.v;}
  }
  B.cr=B.cr.filter(c=>!c.dead);
  for(const c of B.crates){
    c.life-=dt;
    if(near(c,p.r+14)){c.dead=true;B.energy=Math.min(BDD.energy.max,B.energy+BDD.energy.crate);burst(c.x,c.y,8,'#5be7ff',120);}
    if(c.life<=0)c.dead=true;
  }
  B.crates=B.crates.filter(c=>!c.dead);
}

/* ---------- player ---------- */
/* clamp to the map and slide off solid walls. ox,oy is the position before the step. */
function bdMovePlayer(ox,oy){
  const p=G.p,B=G.bd,r=p.r;
  p.x=clamp(p.x,r,BDW-r);p.y=clamp(p.y,r,BDH-r);
  const hit=(x,y)=>{
    for(let rr=bdTileR(y-r);rr<=bdTileR(y+r);rr++)for(let cc=bdTileC(x-r);cc<=bdTileC(x+r);cc++){
      const b=B.tiles.get(bdKey(cc,rr));
      if(!b||b.dead||!bdBlocksPlayer(b))continue;
      const nx=clamp(x,b.c*BDT,(b.c+b.w)*BDT),ny=clamp(y,b.r*BDT,(b.r+b.h)*BDT);
      if((x-nx)*(x-nx)+(y-ny)*(y-ny)<r*r)return true;
    }
    return false;
  };
  if(!hit(p.x,p.y))return;
  const nx=p.x,ny=p.y;
  if(!hit(nx,oy)){p.y=oy;}
  else if(!hit(ox,ny)){p.x=ox;}
  else{p.x=ox;p.y=oy;}
}
function bdPlayerDied(){
  const B=G.bd,p=G.p;
  if(B.dead||B.over)return;
  B.dead=true;B.respawnT=BDD.death.respawn;G.shake=10;
  burst(p.x,p.y,24,'#5be7ff',260);
  const xd=Math.floor(G.xp*BDD.death.xpDrop);
  if(xd>0){G.xp-=xd;G.Gm.push({x:p.x,y:p.y,v:xd,r:6,vx:0,vy:0,life:BDD.eco.gemLife});}
  const cd=Math.floor(B.crystals*BDD.death.crystalDrop);
  if(cd>0){B.crystals-=cd;B.cr.push({x:p.x,y:p.y,v:cd});}
  bdLoseUpgrades(BDD.death.levelsLost);
  mouse.down=false;
}
/* Drop the last n upgrade picks by replaying the rest onto a fresh player, so every effect
   (and the +4% max HP per pick) is reversed cleanly. Second Wind picks do not count as upgrades. */
function bdLoseUpgrades(n){
  const idx=[];
  G.picks.forEach((id,i)=>{if(id!=='heal')idx.push(i);});
  const drop=new Set(idx.slice(-n));
  G.picks=G.picks.filter((_,i)=>!drop.has(i));
  const p=G.p,fresh=mkPlayer(G.w);
  fresh.x=p.x;fresh.y=p.y;fresh.aim=p.aim;
  Object.assign(p,fresh);
  G.lv={};
  for(const id of G.picks){
    if(id==='heal')continue;
    const s=SKILLS.find(k=>k.id===id);if(!s)continue;
    G.lv[id]=(G.lv[id]||0)+1;s.fn(p);p.maxHp=Math.round(p.maxHp*1.04);
  }
  p.hp=p.maxHp;
}
function bdRespawn(){
  const B=G.bd,p=G.p;
  B.dead=false;
  p.x=BD_CORE.cx;p.y=BD_CORE.y-60;p.hp=p.maxHp;p.inv=2.5;p.iframes=0;
  G.R.push({x:p.x,y:p.y,r:0,max:120,t:0,life:.4,rgb:'255,210,61'});
}

/* ---------- end ---------- */
function bdFinish(win){
  const B=G.bd;
  if(B.over)return;
  B.over=true;G.state=win?'win':'lose';
  const waves=Math.max(0,B.wave-(B.phase==='wave'&&!win?1:0));
  const score=waves+G.kills;
  let best=0;
  if(!B.timed){
    try{best=+(localStorage.getItem(BDD.best)||0);if(score>best){best=score;localStorage.setItem(BDD.best,String(score));}}catch(_){}
  }
  if(win){G.E.forEach(e=>burst(e.x,e.y,5,'#ffe2a8',170));G.E=[];G.B=[];}
  setTimeout(()=>{
    $('endTitle').textContent=win?'Dawn':'Core lost';
    $('endSub').textContent=win?'The line held. The light is back.':B.timed?'The core fell on wave '+B.wave+' with '+fmt(Math.max(0,DUR-B.clock))+' of the night left.':'The core fell on wave '+B.wave+'.';
    const st=$('endStats');st.innerHTML='';
    const rows=[['Waves',waves],['Kills',G.kills],['Level',G.level],['Weapon',G.w.name]];
    if(!B.timed)rows.push(['Score',score],['Best',best]);
    rows.forEach(a=>{
      const d=document.createElement('div'),b=document.createElement('b'),s=document.createElement('small');
      b.textContent=a[1];s.textContent=a[0];d.append(b,s);st.append(d);
    });
    $('endNote').hidden=true;$('revive').hidden=true;
    $('pbtn').hidden=true;$('end').hidden=false;$('again').focus();
  },win?1400:700);
}
