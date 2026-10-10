/* Per-frame simulation: update(dt) and fx(dt). */
/* ---------- update ---------- */
function update(dt){
  const p=G.p;G.t+=dt;
  if(!G.bd&&G.t>=DUR){finish(true);return;}
  // move
  let dx=(keys['d']||keys['arrowright']?1:0)-(keys['a']||keys['arrowleft']?1:0);
  let dy=(keys['s']||keys['arrowdown']?1:0)-(keys['w']||keys['arrowup']?1:0);
  if(G.bd&&G.bd.dead)dx=dy=0;
  if(dx||dy){const l=Math.hypot(dx,dy);const sm=p.speed*(p.buffs.speed>0?1.35:1);const ox=p.x,oy=p.y;p.x+=dx/l*sm*dt;p.y+=dy/l*sm*dt;if(G.bd)bdMovePlayer(ox,oy);}
  p.aim=Math.atan2(mouse.y-pScrY(),mouse.x-pScrX());
  if(G.fence){
    const f=G.fence;
    if(f.R>f.target)f.R=Math.max(f.target,f.R-f.rate*dt);
    const fd=Math.hypot(p.x-f.cx,p.y-f.cy);
    if(fd>f.R-p.r){
      const fa=Math.atan2(p.y-f.cy,p.x-f.cx);
      p.x=f.cx+Math.cos(fa)*(f.R-p.r);p.y=f.cy+Math.sin(fa)*(f.R-p.r);
      hurtPlayer(14);
    }
    if(!G.E.some(e=>e.type==='super'&&!e.dead))G.fence=null;
  }
  p.iframes=Math.max(0,p.iframes-dt);
  p.hp=Math.min(p.maxHp,p.hp+p.regen*dt);
  // power-ups
  p.buffs.rate=Math.max(0,p.buffs.rate-dt);p.buffs.speed=Math.max(0,p.buffs.speed-dt);p.inv=Math.max(0,p.inv-dt);
  for(const u of G.PU){
    u.life-=dt;
    if(Math.hypot(p.x-u.x,p.y-u.y)<p.r+16){
      u.life=0;
      if(u.t==='heal'){p.hp=Math.min(p.maxHp,p.hp+p.maxHp*.15);burst(p.x,p.y,12,'#ff5d73',140);}
      else if(u.t==='rate'){p.buffs.rate=15;burst(p.x,p.y,12,'#ffb020',140);}
      else if(u.t==='gold'){p.inv=4.8;burst(p.x,p.y,16,'#ffd23d',180);}
      else{p.buffs.speed=10;burst(p.x,p.y,12,'#4dd8ff',140);}
    }
  }
  G.PU=G.PU.filter(u=>u.life>0);
  // shoot
  p.held=mouse.down?p.held+dt:0;
  p.cd-=dt;
  let want=mouse.down&&!(G.bd&&G.bd.dead),aimA=p.aim;
  if(!want&&p.auto){
    let bd=520,ne=null;
    for(const e of G.E){if(e.dead)continue;const d=Math.hypot(e.x-p.x,e.y-p.y);if(d<bd){bd=d;ne=e;}}
    if(ne){want=true;aimA=Math.atan2(ne.y-p.y,ne.x-p.x);}
  }
  if(want&&p.cd<=0&&!p.plasma){fire(aimA);const rp=p.mini?.25+.75*Math.min(1,p.held/p.rampT):1;p.cd+=1/(G.w.rate*p.rateMul*(p.mini?1.8:1)*(p.buffs.rate>0?1.2:1)*rp);if(p.cd<0)p.cd=0;}
  else if(!want&&p.cd<0)p.cd=0;
  // spawning
  if(G.bd)bdUpdate(dt);
  else{
  if(G.t<DUR-5){
    G.spawnAcc+=(1.5+(G.t/DUR)*13)*(G.sovDead?.35:1)*dt;
    while(G.spawnAcc>=1){G.spawnAcc-=1;if(G.E.length<380){
      if(G.sovDead){const a=rand(0,6.283),d=rand(620,820);spawn(pickType(),G.p.x+Math.cos(a)*d,G.p.y+Math.sin(a)*d);}
      else spawnEdge(pickType());
    }}
  }
  if(G.t>=G.nextWave&&!G.sovDead){
    G.wave++;G.nextWave+=40;
    const ty=WAVE_TYPES[(G.wave-1)%WAVE_TYPES.length];
    let n=Math.min(70,16+G.wave*6);if(ty==='brute')n=Math.ceil(n/5);if(ty==='spitter')n=Math.min(n,5);if(ty==='shielder'||ty==='bomber'||ty==='blinker')n=Math.ceil(n/2);
    if(G.E.length<340)spawnRing(ty,n);
    G.banner={text:'Wave '+G.wave,sub:LABEL[ty],t:2.4};
  }
  if(!G.b1&&G.t>=200){G.b1=1;spawnEdge('boss');G.banner={text:'Colossus',sub:'Boss',t:3};}
  if(!G.b2&&G.t>=400){G.b2=1;spawnEdge('boss');G.banner={text:'Colossus',sub:'Boss',t:3};}
  if(!G.b3&&G.t>=590){G.b3=1;spawnSuper();}
  }
  if(G.banner){G.banner.t-=dt;if(G.banner.t<=0)G.banner=null;}
  // enemies
  if(G.bd)bdEnemies(dt);
  else for(const e of G.E){
    if(e.dead)continue;
    e.ang=Math.atan2(p.y-e.y,p.x-e.x);
    const d0=Math.hypot(p.x-e.x,p.y-e.y);
    let sp=e.spd,dv=0;const a=e.ang+Math.sin(G.t*1.7+e.id)*.35;
    if(e.type==='spitter'){
      if(d0<230)sp=-e.spd*.7;else if(d0<300)sp=0;
      e.sh-=dt;
      if(e.sh<=0&&d0<540){e.sh=rand(3,4.2);if(G.EB.length<10)G.EB.push({x:e.x,y:e.y,vx:Math.cos(e.ang)*190,vy:Math.sin(e.ang)*190,life:3.2,dmg:e.dmg*.7});}
    }
    if(e.type==='charger'){
      e.cdT-=dt;
      if(e.st==='wind'){sp=0;e.wt-=dt;if(e.wt<=0){e.st='dash';e.dt=.55;e.da=e.ang;}}
      else if(e.st==='dash'){sp=0;dv=420;e.dt-=dt;if(e.dt<=0){e.st='';e.cdT=rand(2.5,4);}}
      else if(e.cdT<=0&&d0<420){e.st='wind';e.wt=.6;}
    }
    if(e.type==='shielder'){
      if(e.sa===undefined)e.sa=e.ang;
      let df=e.ang-e.sa;df=Math.atan2(Math.sin(df),Math.cos(df));
      e.sa+=clamp(df,-1.4*dt,1.4*dt);
    }
    if(e.type==='bomber'){
      if(e.fu>0){
        sp=0;e.fu-=dt;e.fl=.05;
        if(e.fu<=0){
          e.dead=true;G.R.push({x:e.x,y:e.y,r:0,max:70,t:0,life:.3,rgb:'255,110,50'});
          burst(e.x,e.y,16,'#ff9a3c',200);G.shake=Math.max(G.shake,5);
          G.Gm.push({x:e.x,y:e.y,v:e.xp,r:4,vx:0,vy:0});
          if(Math.hypot(p.x-e.x,p.y-e.y)<70+p.r)hurtPlayer(e.dmg*1.5);
          continue;
        }
      }else if(d0<95)e.fu=.7;
    }
    if(e.type==='blinker'){
      e.tp-=dt;
      if(e.tp<=0){
        e.tp=rand(3,4.5);burst(e.x,e.y,8,'#cfd8ff',120);
        const ba=rand(0,6.283),bd=rand(130,170);
        e.x=p.x+Math.cos(ba)*bd;e.y=p.y+Math.sin(ba)*bd;
        burst(e.x,e.y,8,'#cfd8ff',120);e.fl=.12;
      }
    }
    if(e.type==='mender'){
      for(const o of G.E){
        if(o===e||o.dead||o.hp>=o.max)continue;
        const dx=o.x-e.x,dy=o.y-e.y;
        if(dx*dx+dy*dy<19600)o.hp=Math.min(o.max,o.hp+14*dt);
      }
    }
    if(e.type==='super'){
      e.sh-=dt;
      if(e.sh<=0){
        e.sh=5.5;const n=18,off=rand(0,6.283);
        for(let i=0;i<n;i++){const aa=off+i/n*6.283;G.EB.push({x:e.x,y:e.y,vx:Math.cos(aa)*170,vy:Math.sin(aa)*170,life:3.6,dmg:14});}
      }
      e.sm-=dt;
      if(e.sm<=0){
        e.sm=8;
        for(let i=0;i<6;i++){const aa=rand(0,6.283);spawn(i%2?'grunt':'runner',e.x+Math.cos(aa)*(e.r+20),e.y+Math.sin(aa)*(e.r+20));}
      }
    }
    e.kx*=Math.pow(.02,dt);e.ky*=Math.pow(.02,dt);
    e.fi=!!G.fence&&Math.hypot(e.x-G.fence.cx,e.y-G.fence.cy)<G.fence.R;const fm=e.fi?.5:1;
    const vx=(dv?Math.cos(e.da)*dv:Math.cos(a)*sp)*fm,vy=(dv?Math.sin(e.da)*dv:Math.sin(a)*sp)*fm;
    e.x+=(vx+e.kx*e.kr)*dt;e.y+=(vy+e.ky*e.kr)*dt;
    e.fl=Math.max(0,e.fl-dt);e.bt=Math.max(0,e.bt-dt);
    if(e.burn>0){e.burn-=dt;G.nr=1;hurtEnemy(e,e.bd*dt,true);G.nr=0;if(e.dead)continue;}
    const d=Math.hypot(p.x-e.x,p.y-e.y);
    if(d<e.r+p.r)hurtPlayer(e.dmg);
  }
  // bullets
  for(const b of G.B){
    if(b.boom){
      if(b.ph===0){
        b.x+=b.vx*dt;b.y+=b.vy*dt;b.dist+=b.sp*dt;
        if(b.dist>=b.reach){b.ph=1;b.hit=[];b.sp=200;}
      }else{
        const ra=Math.atan2(p.y-b.y,p.x-b.x);b.sp=Math.min(b.sp+900*dt,720);
        b.x+=Math.cos(ra)*b.sp*dt;b.y+=Math.sin(ra)*b.sp*dt;
        if(Math.hypot(p.x-b.x,p.y-b.y)<p.r+10){b.dead=true;G.xp+=1.5;continue;}
      }
      b.rot+=dt*14;
    }else{
      b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;
      if(b.life<=0){b.dead=true;continue;}
    }
    for(const e of G.E){
      if(e.dead)continue;
      const rr=e.r+b.sz,ddx=e.x-b.x,ddy=e.y-b.y;
      if(ddx*ddx+ddy*ddy<rr*rr&&b.hit.indexOf(e.id)<0){
        b.hit.push(e.id);
        if(e.type==='super'&&G.wk==='rifle'&&!b.boom&&Math.random()<.4){
          const na=Math.atan2(b.y-e.y,b.x-e.x)+(Math.random()-.5)*1.6,sp0=Math.hypot(b.vx,b.vy);
          b.vx=Math.cos(na)*sp0;b.vy=Math.sin(na)*sp0;b.x=e.x+Math.cos(na)*(e.r+b.sz);b.y=e.y+Math.sin(na)*(e.r+b.sz);
          b.pr=0;b.rc=true;b.col='#9aa0a8';b.vx*=.35;b.vy*=.35;b.life=b.max=.2;b.dmg*=.45;b.hit=[e.id];burst(b.x,b.y,2,'#cfd3d8',140);break;
        }
        hurtEnemy(e,b.dmg,false,Math.atan2(b.y-e.y,b.x-e.x));if(p.burn>0){e.burn=2.5;e.bd=5*p.burn;}
        e.kx+=b.vx*.12;e.ky+=b.vy*.12;
        if(e.type==='super'&&!b.boom){b.dead=true;break;}
        if(b.pr--<=0){
          b.dead=true;
          if(p.lodge>0&&G.SH.length<150)G.SH.push({e,ox:b.x-e.x,oy:b.y-e.y,x:b.x,y:b.y,ret:false,hit:[],dmg:b.dmg,sp:0});
          break;
        }
      }
    }
  }
  // lingering beams and plasma
  for(const m of G.BM){
    if(!m.lg)continue;
    m.tk-=dt;
    if(m.tk<=0){m.tk=.1;lineHits(m.ox,m.oy,m.a,m.w).forEach(h=>hurtEnemy(h[1],G.w.dmg*p.dmgMul*.09,false,Math.atan2(m.oy-h[1].y,m.ox-h[1].x)));}
  }
  if(p.plasma){
    p.pt-=dt;
    const tick=p.pt<=0;if(tick){p.pt=.1;p.pc++;}
    const seen=p.pset||(p.pset=new Set()),now=new Set();
    lineHits(p.x,p.y,p.aim,p.beamW).forEach((h,i)=>{
      now.add(h[1].id);
      if(tick||!seen.has(h[1].id))hurtEnemy(h[1],G.w.dmg*p.dmgMul*p.rateMul*.14*(1+p.amp*i),p.pc%3!==0,Math.atan2(p.y-h[1].y,p.x-h[1].x));
    });
    p.pset=now;
  }
  // lodged shells
  for(const s of G.SH){
    if(!s.ret){
      if(s.e){if(s.e.dead)s.e=null;else{s.x=s.e.x+s.ox;s.y=s.e.y+s.oy;}}
    }else{
      const ra=Math.atan2(p.y-s.y,p.x-s.x);s.sp=Math.min(s.sp+1400*dt,700);
      s.x+=Math.cos(ra)*s.sp*dt;s.y+=Math.sin(ra)*s.sp*dt;
      for(const e of G.E){
        if(e.dead||s.hit.indexOf(e.id)>=0)continue;
        const rr=e.r+6,dx=e.x-s.x,dy=e.y-s.y;
        if(dx*dx+dy*dy<rr*rr){s.hit.push(e.id);hurtEnemy(e,s.dmg*1.5);}
      }
      if(Math.hypot(p.x-s.x,p.y-s.y)<p.r+8){s.dead=true;G.xp+=.4;}
    }
  }
  G.SH=G.SH.filter(s=>!s.dead);
  // enemy shots
  for(const b of G.EB){
    b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;
    if(Math.hypot(b.x-p.x,b.y-p.y)<p.r+5){hurtPlayer(b.dmg);b.life=0;}
  }
  G.EB=G.EB.filter(b=>b.life>0);
  // blades
  if(p.blades>0){
    p.bladeAng+=(4.4+p.blades*.35)*dt;
    const rad=70+p.blades*4;
    for(let k=0;k<p.blades;k++){
      const a=p.bladeAng+k*6.283/p.blades,bx=p.x+Math.cos(a)*rad,by=p.y+Math.sin(a)*rad;
      for(const e of G.E){
        if(e.dead||e.bt>0)continue;
        const rr=e.r+14;
        if((e.x-bx)*(e.x-bx)+(e.y-by)*(e.y-by)<rr*rr){G.nr=1;hurtEnemy(e,18*p.dmgMul);G.nr=0;e.bt=.33;e.kx+=Math.cos(a)*120;e.ky+=Math.sin(a)*120;}
      }
    }
  }
  // nova
  if(p.nova>0){
    p.novaCd=Math.max(0,p.novaCd-dt);
    if(p.novaCd<=0&&p.wantNova){
      p.novaMax=Math.max(1.6,4.2-p.nova*.5);p.novaCd=p.novaMax;
      const max=100+p.nova*32,dm=24+p.nova*16;
      G.R.push({x:p.x,y:p.y,r:0,max,t:0,life:.35});
      for(const e of G.E){
        if(e.dead)continue;
        const d=Math.hypot(e.x-p.x,e.y-p.y);
        if(d<max+e.r){G.nr=1;hurtEnemy(e,dm*Math.max(1,p.dmgMul*.7));G.nr=0;const a=Math.atan2(e.y-p.y,e.x-p.x);e.kx+=Math.cos(a)*420;e.ky+=Math.sin(a)*420;}
      }
      G.shake=Math.max(G.shake,4);
    }
    p.wantNova=false;
  }
  // gems
  for(const g of G.Gm){
    const d=Math.hypot(p.x-g.x,p.y-g.y);
    if(d<p.magnet||g.pull){g.pull=true;const a=Math.atan2(p.y-g.y,p.x-g.x),s=280+Math.max(0,p.magnet-d)*3;g.x+=Math.cos(a)*s*dt;g.y+=Math.sin(a)*s*dt;}
    if(d<p.r+6){g.dead=true;G.xp+=g.v;}
  }
  while(G.xp>=xpNext(G.level)){G.xp-=xpNext(G.level);G.level++;G.pending++;}
  fx(dt);
  G.E=G.E.filter(e=>!e.dead);G.B=G.B.filter(b=>!b.dead);G.Gm=G.Gm.filter(g=>!g.dead);
  if(G.pending>0&&G.state==='play')openLevel();
}
function fx(dt){
  G.mf=Math.max(0,(G.mf||0)-dt);
  for(const m of G.BM)m.life-=dt;
  G.BM=G.BM.filter(m=>m.life>0);
  for(const q of G.P){q.x+=q.vx*dt;q.y+=q.vy*dt;q.vx*=Math.pow(.05,dt);q.vy*=Math.pow(.05,dt);q.life-=dt;}
  G.P=G.P.filter(q=>q.life>0);
  for(const r of G.R){r.t+=dt;r.r=r.max*Math.min(1,r.t/r.life);}
  G.R=G.R.filter(r=>r.t<r.life+.12);
  G.shake=Math.max(0,G.shake-30*dt);
}

