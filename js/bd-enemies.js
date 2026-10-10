/* Base Defence enemy AI. bdEnemies(dt) replaces the Survive enemy loop while G.bd is set.
   Ground enemies stay on the road, walk to the core and attack whatever blocks them.
   They chase the player inside BDD.ai.engage tiles and give up past BDD.ai.leash tiles. Flyers ignore the road. */

/* spawn() hands off here in Base Defence. HP +12% and damage +5% per wave, no time scaling. */
function bdSpawn(type,x,y){
  const B=G.bd,T=type==='flyer'?BDD.flyer:TYPES[type],w=Math.max(0,B.wave-1);
  let hp=T.hp,r=T.r,spd=T.spd;
  if(type==='boss')hp=BDD.boss.colossus.hp;
  if(type==='super'){hp=BDD.boss.sovereign.hp;r=BDD.boss.sovereign.r;spd=BDD.boss.sovereign.speed;}
  const hm=T.fixed?1:1+BDD.wave.hpPerWave*w,dm=T.fixed?1:1+BDD.wave.dmgPerWave*w;
  G.E.push({id:++G.id,type,x,y,r,hp:hp*hm,max:hp*hm,spd,dmg:T.dmg*dm,xp:T.xp||2,col:T.col,kx:0,ky:0,bt:0,fl:0,ang:Math.PI/2,sh:rand(2.5,5),kr:T.kr===undefined?1:T.kr,sm:5,fu:0,tp:rand(2,4),cdT:rand(1.5,3),st:'',wt:0,dt:0,da:0,
    ln:rand(-50,50),hitT:0,slow:0,slowAmt:0,chase:false,fly:type==='flyer'});
}

/* first blocking building overlapped by a circle at (x,y,r), or null */
function bdBlockerAt(x,y,r){
  const B=G.bd,c0=bdTileC(x-r),c1=bdTileC(x+r),r0=bdTileR(y-r),r1=bdTileR(y+r);
  for(let rr=r0;rr<=r1;rr++)for(let cc=c0;cc<=c1;cc++){
    const b=B.tiles.get(bdKey(cc,rr));
    if(!b||b.dead||!bdBlocksEnemy(b))continue;
    const bx=b.c*BDT,by=b.r*BDT,bw=b.w*BDT,bh=b.h*BDT;
    const nx=clamp(x,bx,bx+bw),ny=clamp(y,by,by+bh);
    if((x-nx)*(x-nx)+(y-ny)*(y-ny)<r*r)return b;
  }
  return null;
}
const bdHitsCore=(x,y,r)=>{
  const nx=clamp(x,BD_CORE.x,BD_CORE.x+BD_CORE.w),ny=clamp(y,BD_CORE.y,BD_CORE.y+BD_CORE.h);
  return (x-nx)*(x-nx)+(y-ny)*(y-ny)<r*r;
};
/* wall hit multiplier: brutes and bosses hit walls hard */
const bdWallMul=e=>e.type==='brute'?2.5:e.type==='boss'?3:1;

function bdEnemies(dt){
  const B=G.bd,p=G.p;
  for(const e of G.E){
    if(e.dead)continue;
    e.hitT=Math.max(0,(e.hitT||0)-dt);
    e.fl=Math.max(0,e.fl-dt);e.bt=Math.max(0,e.bt-dt);
    if(e.slow>0)e.slow-=dt;
    if(e.burn>0){e.burn-=dt;G.nr=1;hurtEnemy(e,e.bd*dt,true);G.nr=0;if(e.dead)continue;}
    if(e.type==='super'){if(typeof bdSovereign==='function')bdSovereign(e,dt);continue;}
    if(e.type==='flyer')bdFlyer(e,dt);
    else bdGround(e,dt);
    if(e.dead)continue;
    /* touching the player */
    if(!B.dead&&Math.hypot(p.x-e.x,p.y-e.y)<e.r+p.r&&e.type!=='bomber')hurtPlayer(e.dmg);
  }
}

function bdFlyer(e,dt){
  const slow=e.slow>0?1-(e.slowAmt||0):1;
  e.ang=Math.atan2(BD_CORE.cy-e.y,BD_CORE.cx-e.x);
  if(bdHitsCore(e.x,e.y,e.r+6)){
    if(e.hitT<=0){e.hitT=BDD.ai.hitEvery;bdDamageCore(e.dmg);burst(e.x,e.y,4,'#7fffd4',100);}
  }else{
    e.x+=Math.cos(e.ang)*e.spd*slow*dt+e.kx*e.kr*dt;
    e.y+=Math.sin(e.ang)*e.spd*slow*dt+e.ky*e.kr*dt;
  }
  e.kx*=Math.pow(.02,dt);e.ky*=Math.pow(.02,dt);
}

function bdGround(e,dt){
  const B=G.bd,p=G.p,T=BDT,ai=BDD.ai;
  const slow=e.slow>0?1-(e.slowAmt||0):1;
  const dp=Math.hypot(p.x-e.x,p.y-e.y);
  if(!B.dead&&dp<ai.engage*T)e.chase=true;
  else if(B.dead||dp>ai.leash*T)e.chase=false;
  let tx=BD_CORE.cx+(e.ln||0),ty=BD_CORE.y;
  if(e.chase){tx=p.x;ty=p.y;}
  e.ang=Math.atan2(ty-e.y,tx-e.x);
  /* a blocker in the way of the next step? */
  let sp=e.spd*slow,dv=0;
  const lookY=e.y+e.r+4,ahead=bdBlockerAt(e.x,lookY,e.r*.8);
  const aheadCore=bdHitsCore(e.x,lookY,e.r*.8);

  if(e.type==='spitter'){
    /* stop at range from the nearest building or the core, then shoot it */
    const tg=bdNearestTarget(e.x,e.y,6*T);
    if(tg){sp=0;e.sh-=dt;if(e.sh<=0){e.sh=rand(3,4.2);
      const a=Math.atan2(tg.y-e.y,tg.x-e.x);
      if(G.EB.length<30)G.EB.push({x:e.x,y:e.y,vx:Math.cos(a)*190,vy:Math.sin(a)*190,life:3.2,dmg:e.dmg*.7,bd:true});}}
  }
  if(e.type==='charger'){
    e.cdT-=dt;
    if(e.st==='wind'){sp=0;e.wt-=dt;if(e.wt<=0){e.st='dash';e.dt=.55;e.da=e.chase?e.ang:Math.PI/2;}}
    else if(e.st==='dash'){sp=0;dv=420;e.dt-=dt;if(e.dt<=0){e.st='';e.cdT=rand(2.5,4);}}
    else if(e.cdT<=0&&(ahead||aheadCore||e.chase)){e.st='wind';e.wt=.6;}
  }
  if(e.type==='shielder'){
    if(e.sa===undefined)e.sa=e.ang;
    let df=e.ang-e.sa;df=Math.atan2(Math.sin(df),Math.cos(df));
    e.sa+=clamp(df,-1.4*dt,1.4*dt);
  }
  if(e.type==='bomber'){
    if(e.fu>0){
      sp=0;e.fu-=dt;e.fl=.05;
      if(e.fu<=0){bdBomberBlast(e);return;}
    }else if(ahead||aheadCore||(e.chase&&dp<95))e.fu=.7;
  }
  if(e.type==='blinker'){
    e.tp-=dt;
    if(e.tp<=0&&ahead){
      e.tp=rand(3,4.5);burst(e.x,e.y,8,'#cfd8ff',120);
      /* skip one wall row: jump past the blocker and one more row */
      const ny=ahead.r*T+ahead.h*T+e.r+T;
      if(!bdBlockerAt(e.x,ny,e.r)&&!bdHitsCore(e.x,ny,e.r)){e.y=ny;burst(e.x,e.y,8,'#cfd8ff',120);e.fl=.12;}
    }
  }
  if(e.type==='mender'){
    for(const o of G.E){
      if(o===e||o.dead||o.hp>=o.max)continue;
      const dx=o.x-e.x,dy=o.y-e.y;
      if(dx*dx+dy*dy<19600)o.hp=Math.min(o.max,o.hp+14*dt);
    }
  }

  /* move */
  const wob=e.type==='charger'&&dv?0:Math.sin(G.t*1.7+e.id)*.18;
  const a=(dv?e.da:e.ang+wob);
  const sp2=dv||sp;
  const vx=Math.cos(a)*sp2+e.kx*e.kr,vy=Math.sin(a)*sp2+e.ky*e.kr;
  e.kx*=Math.pow(.02,dt);e.ky*=Math.pow(.02,dt);
  let nx=e.x+vx*dt,ny=e.y+vy*dt,blocked=null;
  nx=clamp(nx,BD_ROAD.x0+e.r,BD_ROAD.x1-e.r);
  const hit=bdBlockerAt(nx,ny,e.r),hc=bdHitsCore(nx,ny,e.r);
  if(!hit&&!hc){e.x=nx;e.y=ny;}
  else{
    const hx=bdBlockerAt(nx,e.y,e.r),hy=bdBlockerAt(e.x,ny,e.r);
    if(!hx&&!hy&&!bdHitsCore(nx,e.y,e.r)&&!bdHitsCore(e.x,ny,e.r)){e.x=nx;ny=e.y;}
    else if(!hx&&!bdHitsCore(nx,e.y,e.r)&&Math.abs(vx)>2){e.x=nx;}
    else if(!hy&&!bdHitsCore(e.x,ny,e.r)){e.y=ny;}
    blocked=hit||hy||hx;
    if(dv&&(blocked||hc)){e.dt=0;e.st='';e.cdT=rand(2.5,4);if(blocked)bdDamageB(blocked,e.dmg*3*bdWallMul(e),e);}
  }
  if(e.y<-80)e.y=-80;
  /* spike traps under the enemy */
  const under=B.tiles.get(bdKey(bdTileC(e.x),bdTileR(e.y)));
  if(under&&under.id==='spikeTrap')hurtEnemy(e,BDD.turrets.spikeTrap.dps*dt,true);
  /* attack: what blocks me, the core, or the player */
  if(e.hitT<=0&&e.type!=='bomber'&&sp2>=0){
    if(blocked&&!blocked.dead){
      const d=bdDef(blocked.kind,blocked.id);
      if(d.dps&&d.hits&&d.hits.indexOf(e.type)>=0)hurtEnemy(e,d.dps*BDD.ai.hitEvery,true);
      e.hitT=ai.hitEvery;bdDamageB(blocked,e.dmg*bdWallMul(e),e);
    }else if(hc||aheadCore){e.hitT=ai.hitEvery;bdDamageCore(e.dmg*bdWallMul(e));}
  }
}

/* nearest building or the core within range px, for spitters */
function bdNearestTarget(x,y,range){
  const B=G.bd;let best=null,bd=range;
  for(const b of B.buildings){
    const c=bdCenter(b),d=Math.hypot(c.x-x,c.y-y);
    if(d<bd){bd=d;best={x:c.x,y:c.y,b};}
  }
  const dc=Math.hypot(BD_CORE.cx-x,BD_CORE.cy-y)-BD_CORE.h/2;
  if(dc<bd)best={x:BD_CORE.cx,y:BD_CORE.cy,core:true};
  return best;
}
function bdBomberBlast(e){
  const B=G.bd,p=G.p,R=70;
  e.dead=true;G.R.push({x:e.x,y:e.y,r:0,max:R,t:0,life:.3,rgb:'255,110,50'});
  burst(e.x,e.y,16,'#ff9a3c',200);G.shake=Math.max(G.shake,5);
  G.Gm.push({x:e.x,y:e.y,v:e.xp,r:4,vx:0,vy:0});
  if(!B.dead&&Math.hypot(p.x-e.x,p.y-e.y)<R+p.r)hurtPlayer(e.dmg*1.5);
  for(const b of B.buildings.slice()){
    const c=bdCenter(b);
    if(Math.hypot(c.x-e.x,c.y-e.y)<R+Math.max(b.w,b.h)*BDT/2)bdDamageB(b,e.dmg*3,e);
  }
  if(bdHitsCore(e.x,e.y,R))bdDamageCore(e.dmg*3);
}

/* enemy projectiles that hit buildings and the core. Movement and player hits stay in update(). */
function bdEnemyShots(){
  const B=G.bd;
  for(const s of G.EB){
    if(!s.bd||s.life<=0)continue;
    const b=B.tiles.get(bdKey(bdTileC(s.x),bdTileR(s.y)));
    if(b&&!b.dead){bdDamageB(b,s.dmg,null);s.life=0;burst(s.x,s.y,3,'#ff5ad1',100);}
    else if(bdHitsCore(s.x,s.y,4)){bdDamageCore(s.dmg);s.life=0;}
  }
}

/* death hook, called from hurtEnemy when G.bd is set */
function bdOnKill(e){
  const B=G.bd;
  B.score+=e.type==='boss'||e.type==='super'?25:1;
  const base=e.type==='boss'?BDD.drops.boss:(BDD.drops[e.type]||1);
  const v=e.type==='boss'?base:Math.max(1,Math.round(base*(1+BDD.eco.dropWaveScale*B.wave)));
  if(v>0)B.cr.push({x:e.x,y:e.y,v});
  if(Math.random()<BDD.energy.crateChance||e.type==='boss')B.crates.push({x:e.x+rand(-10,10),y:e.y+rand(-10,10),life:BDD.eco.crateLife});
}
