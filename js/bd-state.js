/* Base Defence state: newGameBD(), grid geometry, building store and damage API.
   World coords: x 0..BDW, y 0..BDH, origin top-left of the map. Tiles are BDT px. G.bd is the mode state (null in Survive). */
const bdKey=(c,r)=>r*BDD.grid.cols+c;
const bdInGrid=(c,r)=>c>=0&&r>=0&&c<BDD.grid.cols&&r<BDD.grid.rows;
const bdIsRoad=(c,r)=>c>=BD_ROAD_C0&&c<=BD_ROAD_C1&&r>=0&&r<BDD.road.len;
const bdIsCore=(c,r)=>c>=BDD.core.col&&c<BDD.core.col+BDD.core.w&&r>=BD_CORE_R&&r<BD_CORE_R+BDD.core.h;
const bdTileC=x=>Math.floor(x/BDT),bdTileR=y=>Math.floor(y/BDT);
/* core rectangle in px */
const BD_CORE={x:BDD.core.col*BDT,y:BD_CORE_R*BDT,w:BDD.core.w*BDT,h:BDD.core.h*BDT};
BD_CORE.cx=BD_CORE.x+BD_CORE.w/2;BD_CORE.cy=BD_CORE.y+BD_CORE.h/2;
/* road bounds in px */
const BD_ROAD={x0:BD_ROAD_C0*BDT,x1:(BD_ROAD_C1+1)*BDT};

/* Registries that feature files fill in. Load order is irrelevant, they are only read at runtime.
   BDTUR[id](b,dt)   per-frame logic for a turret type
   BDFX.push((sx,sy)=>draw)   world-space effects (projectiles, beams, puddles) drawn above buildings
   BDUPD.push(dt=>step)       per-frame systems that are not tied to one building */
const BDTUR={},BDFX=[],BDUPD=[];
const mouseWX=()=>mouse.x-W/2+camX(),mouseWY=()=>mouse.y-H/2+camY();

function newGameBD(wk,timed){
  newGame(wk);
  const p=G.p;p.x=BD_CORE.cx;p.y=BD_CORE.y-70;
  G.picks=[];
  G.bd={
    timed:!!timed,crystals:BDD.eco.start,energy:BDD.energy.max,
    phase:'build',wave:0,phaseT:BDD.wave.build,clock:0,
    queue:[],spawnAcc:0,waveT:0,spawnDur:0,bossAlive:false,
    incomeT:BDD.eco.incomeEvery,
    uid:0,buildings:[],tiles:new Map(),cables:new Map(),remnants:[],
    core:{hp:BDD.core.hp,max:BDD.core.hp,fl:0},
    cr:[],crates:[],ocT:0,
    sel:null,barMin:false,hover:null,
    dead:false,respawnT:0,over:false,sovDead:false,score:0
  };
  G.state='play';
}

/* ---------- building store ---------- */
function bdDef(kind,id){return kind==='wall'?BDD.walls[id]:BDD.turrets[id];}
function bdAdd(kind,id,c,r,extra){
  const B=G.bd,d=bdDef(kind,id),w=d.w||1,h=d.h||1;
  const b=Object.assign({uid:++B.uid,kind,id,c,r,w,h,hp:d.hp,max:d.hp,lvl:0,paid:d.cost,fl:0,t:0},extra||{});
  B.buildings.push(b);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++)B.tiles.set(bdKey(c+x,r+y),b);
  return b;
}
function bdRemove(b){
  const B=G.bd;
  B.buildings=B.buildings.filter(o=>o!==b);
  for(let y=0;y<b.h;y++)for(let x=0;x<b.w;x++)if(B.tiles.get(bdKey(b.c+x,b.r+y))===b)B.tiles.delete(bdKey(b.c+x,b.r+y));
  if(B.sel&&B.sel.b===b)B.sel.b=null;
}
const bdCenter=b=>({x:(b.c+b.w/2)*BDT,y:(b.r+b.h/2)*BDT});
/* does this building physically stop enemies? Spike traps and cables do not. */
const bdBlocksEnemy=b=>b.id!=='spikeTrap';
/* does this building stop the player? Only walls. */
const bdBlocksPlayer=b=>b.kind==='wall'&&b.id.indexOf('spike')!==0;
/* damage a building. src is the attacker (for crystal reflect). Returns true if it died. */
function bdDamageB(b,d,src){
  if(b.dead)return false;
  b.hp-=d;b.fl=.12;
  if(b.id==='crystal'&&src&&!src.dead&&src.hp!==undefined&&src.type!=='super'){src.hp-=d*BDD.walls.crystal.reflect;src.fl=.07;}
  if(b.hp<=0){bdDestroy(b);return true;}
  return false;
}
function bdDestroy(b){
  b.dead=true;
  const c=bdCenter(b);
  burst(c.x,c.y,b.w*b.h>1?14:8,bdDef(b.kind,b.id).col||'#ffffff',170);
  G.R.push({x:c.x,y:c.y,r:0,max:BDT*b.w*.8,t:0,life:.25,rgb:'255,200,140'});
  bdRemove(b);
  const d=bdDef(b.kind,b.id);
  if(!d.noRemnant)G.bd.remnants.push({kind:b.kind,id:b.id,c:b.c,r:b.r,w:b.w,h:b.h,max:b.max,lvl:b.lvl,paid:b.paid});
}
/* damage the core. Returns true when it falls. */
function bdDamageCore(d){
  const C=G.bd.core;
  if(G.bd.over)return true;
  C.hp-=d;C.fl=.12;G.shake=Math.max(G.shake,3);
  if(C.hp<=0){C.hp=0;finish(false);return true;}
  return false;
}
