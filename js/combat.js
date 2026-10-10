/* Firing, beam/line hit tests, damage to enemies and player. */
function burst(x,y,n,col,sp){
  if(G.P.length>420)return;
  for(let i=0;i<n;i++){const a=rand(0,6.283),s=rand(30,sp||140);G.P.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:rand(.25,.55),max:.55,col,sz:rand(1.5,3.2)});}
}
function fire(base){
  const p=G.p,w=G.w,n=p.count;G.mf=.07;
  if(base===undefined)base=p.aim;
  for(let i=0;i<n;i++){
    const jt=w.jit*(p.mini?3:1);
    const a=base+(i-(n-1)/2)*w.step+rand(-jt,jt);
    if(w.beam){beam(a);continue;}
    if(w.boom){G.B.push({x:p.x,y:p.y,vx:Math.cos(a)*w.speed,vy:Math.sin(a)*w.speed,boom:true,ph:0,dist:0,sp:w.speed,reach:w.reach*p.reachMul,sz:w.sz*p.sizeMul,dmg:w.dmg*p.dmgMul,pr:999,hit:[],life:99,max:99,col:w.col,fade:false,rot:0});continue;}
    G.B.push({x:p.x+Math.cos(p.aim)*16,y:p.y+Math.sin(p.aim)*16,vx:Math.cos(a)*w.speed,vy:Math.sin(a)*w.speed,life:w.life*p.rangeMul,max:w.life*p.rangeMul,col:w.col||'#ffffff',sz:(w.sz||3.2)*(w.fade?p.sizeMul:1),fade:!!w.fade,dmg:w.dmg*p.dmgMul,pr:p.pierce,hit:[]});
  }
  if(p.lodge>0&&G.wk==='rifle'){p.lodgeShots++;if(p.lodgeShots>=[20,15,10][p.lodge-1]){G.SH.forEach(s=>{s.ret=true;s.sp=200;});p.lodgeShots=0;}}
}

function lineHits(ox,oy,a,wd){
  const len=950,ca=Math.cos(a),sa=Math.sin(a),hits=[];
  for(const e of G.E){
    if(e.dead)continue;
    const ex=e.x-ox,ey=e.y-oy,t=ex*ca+ey*sa;
    if(t<0||t>len)continue;
    if(Math.abs(-ex*sa+ey*ca)<e.r+5+wd)hits.push([t,e]);
  }
  hits.sort((x,y)=>x[0]-y[0]);
  return hits;
}
function beam(a){
  const p=G.p,ca=Math.cos(a),sa=Math.sin(a),dmg=G.w.dmg*p.dmgMul;
  lineHits(p.x,p.y,a,p.beamW).forEach((h,i)=>{
    hurtEnemy(h[1],dmg*(1+p.amp*i),false,Math.atan2(p.y-h[1].y,p.x-h[1].x));
    h[1].kx+=ca*80;h[1].ky+=sa*80;
  });
  const L=[0,.5,.9,1.4][Math.min(p.glow,3)];
  G.BM.push({a,len:950,ox:p.x,oy:p.y,life:.14+L,max:.14+L,w:p.beamW,tk:.15,lg:L>0});
}
function hurtEnemy(e,d,q,fa){
  if(e.dead)return;
  if(e.type==='super'&&!G.nr&&!G.bd)d*={rifle:.5,sniper:.55,flame:.6,boom:.5}[G.wk]||1;
  if(e.type==='shielder'&&fa!==undefined){
    const sa=e.sa===undefined?e.ang:e.sa;
    let df=Math.abs(fa-sa)%6.283;if(df>3.1416)df=6.283-df;
    if(df<1.05){d*=.12;if(!q)burst(e.x+Math.cos(sa)*e.r,e.y+Math.sin(sa)*e.r,3,'#9fd6ff',120);}
  }
  e.hp-=d;if(!q)e.fl=.07;
  if(e.hp<=0){
    e.dead=true;G.kills++;
    if(G.bd)bdOnKill(e);
    G.Gm.push({x:e.x,y:e.y,v:e.xp,r:e.xp>=6?6:e.xp>=3?5:4,vx:0,vy:0});
    const dr=(e.type==='boss'||e.type==='super')?1:e.type==='brute'?.25:(e.type==='shielder'||e.type==='mender')?.1:(e.type==='spitter'||e.type==='charger'||e.type==='splitter')?.05:.02;
    if(!G.bd&&Math.random()<dr&&G.PU.length<12)G.PU.push({x:e.x,y:e.y,t:e.type==='boss'?'gold':e.type==='super'?'heal':pickPU(),life:22});
    burst(e.x,e.y,e.type==='brute'?18:7,e.col,150);
    if(e.type==='super')G.sovDead=true;
    if(e.type==='boss'||e.type==='super'){burst(e.x,e.y,e.type==='super'?60:36,'#ffe2a8',320);G.R.push({x:e.x,y:e.y,r:0,max:e.r*(e.type==='super'?3:2),t:0,life:.55,rgb:'255,226,168'});G.shake=Math.max(G.shake,e.type==='super'?16:10);}
    else G.R.push({x:e.x,y:e.y,r:0,max:e.r+14,t:0,life:.2,rgb:'255,255,255'});
    if(e.type==='splitter'){for(let i=0;i<3;i++){spawn('runner',e.x+rand(-12,12),e.y+rand(-12,12));}}
  }else if(!q)burst(e.x,e.y,2,'#ffffff',90);
}
function hurtPlayer(d){
  const p=G.p;if(p.iframes>0||p.inv>0||(G.bd&&G.bd.dead))return;
  p.hp-=d;p.iframes=.5;G.shake=7;burst(p.x,p.y,10,'#5be7ff',160);
  if(p.hp<=0){if(G.bd)bdPlayerDied();else finish(false);}
}

