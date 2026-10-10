/* Base Defence cables. A Repair Station heals only what its network reaches.
   Hold right click on a station (or an existing cable) and drag: every tile passed becomes a cable tile.
   Network = 4-connected cable component plus every station touching it (a station is attached when one of its
   tiles is a cable tile or 4-adjacent to one; a station touching two networks heals both).
   Connections = each building with a cable tile on it (stations excluded), plus the core once.
   Heal per network = sum over its stations of repair.heal * bdStat(station,'dmg'), split evenly over its connections.
   Ground enemies that step on a cable tile cut it instantly. Flyers do not. */

const CB_DIRS=[[1,0],[-1,0],[0,1],[0,-1]];
/* cbDrag: {B,c,r,cur,done} while the right button is held. cbNet: cached networks, rebuilt on change and on a timer. */
let cbDrag=null;
let cbNet={B:null,nets:[],dirty:true,t:0};

/* a building still standing and still occupying its tiles (sold buildings leave B.tiles without being marked dead) */
const cbLive=(B,b)=>!!b&&!b.dead&&B.tiles.get(bdKey(b.c,b.r))===b;

/* world px to clamped grid tile */
function cbTile(wx,wy){
  return {c:clamp(bdTileC(wx),0,BDD.grid.cols-1),r:clamp(bdTileR(wy),0,BDD.grid.rows-1)};
}

/* 4-connected tiles from (c0,r0) (exclusive) to (c1,r1) (inclusive) along the straight line between them.
   Diagonal steps get a corner tile, so a fast drag leaves no gaps. */
function cbPath(c0,r0,c1,r1){
  const out=[],dc=c1-c0,dr=r1-r0,n=Math.max(Math.abs(dc),Math.abs(dr));
  let pc=c0,pr=r0;
  for(let i=1;i<=n;i++){
    const nc=c0+Math.round(dc*i/n),nr=r0+Math.round(dr*i/n);
    if(nc!==pc&&nr!==pr)out.push({c:nc,r:pr});
    if(nc!==pc||nr!==pr)out.push({c:nc,r:nr});
    pc=nc;pr=nr;
  }
  return out;
}

/* lay one cable tile. Skips station tiles, existing cable, and stops the drag when crystals run out. */
function cbPlace(B,D,c,r){
  if(D.done||!bdInGrid(c,r))return;
  const k=bdKey(c,r);
  if(B.cables.has(k))return;
  const b=B.tiles.get(k);
  if(b&&b.id==='repair')return;
  const cost=BDD.cable.cost;
  if(B.crystals<cost){D.done=true;return;}
  B.crystals-=cost;
  B.cables.set(k,{c,r});
  cbNet.dirty=true;
}

/* right button down. Only starts on a repair station tile or an existing cable tile. */
function bdCableDown(wx,wy){
  const B=G.bd;
  if(!B||B.over)return false;
  const t=cbTile(wx,wy),k=bdKey(t.c,t.r),b=B.tiles.get(k);
  if(!((b&&b.id==='repair')||B.cables.has(k)))return false;
  cbDrag={B,c:t.c,r:t.r,cur:{c:t.c,r:t.r},done:false};
  return true;
}
/* drag. Lays cable along every tile between the last sample and this one. */
function bdCableMove(wx,wy){
  const D=cbDrag,B=G.bd;
  if(!D)return;
  if(!B||D.B!==B||B.over){cbDrag=null;return;}
  const t=cbTile(wx,wy);
  D.cur=t;
  for(const p of cbPath(D.c,D.r,t.c,t.r))cbPlace(B,D,p.c,p.r);
  D.c=t.c;D.r=t.r;
}
/* right button up. Ends the drag. */
function bdCableUp(wx,wy){
  if(cbDrag)cbNet.dirty=true;
  cbDrag=null;
}

/* connected components of cable tiles, with their connections and touching stations */
function cbRecompute(B){
  const cab=B.cables,nets=[],compOf=new Map();
  for(const k0 of cab.keys()){
    if(compOf.has(k0))continue;
    const idx=nets.length,net={keys:[],conns:[],stations:[]};
    nets.push(net);
    compOf.set(k0,idx);
    const q=[k0];
    while(q.length){
      const k=q.pop();
      net.keys.push(k);
      const p=cab.get(k);
      for(const [dc,dr] of CB_DIRS){
        const c=p.c+dc,r=p.r+dr;
        if(!bdInGrid(c,r))continue;
        const nk=bdKey(c,r);
        if(cab.has(nk)&&!compOf.has(nk)){compOf.set(nk,idx);q.push(nk);}
      }
    }
  }
  /* connections: buildings under a cable tile (once each), the core once */
  for(const net of nets){
    const seen=new Set();let core=false;
    for(const k of net.keys){
      const p=cab.get(k),b=B.tiles.get(k);
      if(b&&b.id!=='repair'&&!seen.has(b)){seen.add(b);net.conns.push({b});}
      if(bdIsCore(p.c,p.r))core=true;
    }
    if(core)net.conns.push({core:true});
  }
  /* stations: attached to every network they touch, with one cable key kept for the link line */
  for(const st of B.buildings){
    if(st.id!=='repair'||st.dead)continue;
    const links=new Map();
    for(let y=0;y<st.h;y++)for(let x=0;x<st.w;x++){
      const c=st.c+x,r=st.r+y;
      const cand=[bdKey(c,r)];
      for(const [dc,dr] of CB_DIRS)if(bdInGrid(c+dc,r+dr))cand.push(bdKey(c+dc,r+dr));
      for(const nk of cand){
        if(!cab.has(nk))continue;
        const idx=compOf.get(nk);
        if(!links.has(idx))links.set(idx,nk);
      }
    }
    for(const [idx,k] of links)nets[idx].stations.push({b:st,key:k});
  }
  return nets;
}

/* each network heals its connections: stations' heal, split evenly across connections */
function cbHeal(B,dt){
  for(const net of cbNet.nets){
    if(!net.conns.length)continue;
    let tot=0;
    for(const L of net.stations)if(cbLive(B,L.b))tot+=BDD.turrets.repair.heal*bdStat(L.b,'dmg');
    if(tot<=0)continue;
    const per=tot*dt/net.conns.length;
    for(const cn of net.conns){
      if(cn.core)B.core.hp=Math.min(B.core.max,B.core.hp+per);
      else if(cbLive(B,cn.b))cn.b.hp=Math.min(cn.b.max,cn.b.hp+per);
    }
  }
}

/* per-frame: ground enemies cut cables, networks are rebuilt, networks heal */
BDUPD.push(dt=>{
  const B=G.bd;
  if(!B||B.over)return;
  if(cbNet.B!==B)cbNet={B,nets:[],dirty:true,t:0};
  for(const e of G.E){
    if(e.dead||e.fly)continue;
    const c=bdTileC(e.x),r=bdTileR(e.y);
    if(!bdInGrid(c,r))continue;
    const k=bdKey(c,r);
    if(!B.cables.has(k))continue;
    B.cables.delete(k);
    cbNet.dirty=true;
    burst(c*BDT+BDT/2,r*BDT+BDT/2,BDD.cable.breakFx,BDD.cable.col,120);
  }
  cbNet.t-=dt;
  if(cbNet.dirty||cbNet.t<=0){
    cbNet.nets=cbRecompute(B);
    cbNet.dirty=false;
    cbNet.t=BDD.cable.recomputeEvery;
  }
  cbHeal(B,dt);
});

/* world-space cables and station links. Drawn under buildings by bdDrawWorld. */
function bdDrawCables(sx,sy){
  const B=G.bd;
  if(!B)return;
  const T=BDT,C=BDD.cable;
  const cen=(c,r)=>[sx(c*T+T/2),sy(r*T+T/2)];
  ctx.save();
  ctx.lineCap='round';ctx.strokeStyle=C.col;
  for(const pass of [0,1]){
    ctx.globalAlpha=pass?1:C.glowAlpha;
    ctx.lineWidth=pass?C.lineW:C.glowW;
    ctx.beginPath();
    for(const p of B.cables.values()){
      const [x0,y0]=cen(p.c,p.r);
      if(B.cables.has(bdKey(p.c+1,p.r))){const [x1,y1]=cen(p.c+1,p.r);ctx.moveTo(x0,y0);ctx.lineTo(x1,y1);}
      if(B.cables.has(bdKey(p.c,p.r+1))){const [x1,y1]=cen(p.c,p.r+1);ctx.moveTo(x0,y0);ctx.lineTo(x1,y1);}
    }
    ctx.stroke();
  }
  ctx.globalAlpha=1;ctx.fillStyle=C.col;
  ctx.beginPath();
  for(const p of B.cables.values()){
    const [x,y]=cen(p.c,p.r);
    ctx.moveTo(x+C.dotR,y);ctx.arc(x,y,C.dotR,0,6.283);
  }
  ctx.fill();
  /* faint line from each station into the network it feeds */
  if(cbNet.B===B){
    ctx.globalAlpha=C.linkAlpha;ctx.lineWidth=1.5;ctx.setLineDash(C.linkDash);
    ctx.beginPath();
    for(const net of cbNet.nets)for(const L of net.stations){
      if(!cbLive(B,L.b))continue;
      const s=bdCenter(L.b),p=B.cables.get(L.key);
      if(!p)continue;
      const [x1,y1]=cen(p.c,p.r);
      ctx.moveTo(sx(s.x),sy(s.y));ctx.lineTo(x1,y1);
    }
    ctx.stroke();
  }
  ctx.restore();
}

/* overlay pass, drawn above buildings: connection rings and the drag cursor */
BDFX.push((sx,sy)=>{
  const B=G.bd;
  if(!B)return;
  const C=BDD.cable;
  ctx.save();
  ctx.strokeStyle=C.col;ctx.lineWidth=C.ringW;
  if(cbNet.B===B){
    for(const net of cbNet.nets)for(const cn of net.conns){
      let x,y;
      if(cn.core){x=BD_CORE.cx;y=BD_CORE.cy;}
      else if(cbLive(B,cn.b)){const s=bdCenter(cn.b);x=s.x;y=s.y;}
      else continue;
      ctx.beginPath();ctx.arc(sx(x),sy(y),C.ringR,0,6.283);ctx.stroke();
    }
  }
  if(cbDrag&&cbDrag.B===B){
    const T=BDT,t=cbDrag.cur;
    ctx.strokeStyle=cbDrag.done?C.badCol:C.col;
    ctx.strokeRect(sx(t.c*T)+C.ringW/2,sy(t.r*T)+C.ringW/2,T-C.ringW,T-C.ringW);
  }
  ctx.restore();
});
