/* Base Defence turret core: upgrade maths, targeting and the per-frame dispatcher.
   Per-type behaviour lives in bd-tur-ground.js and bd-tur-air.js and registers itself in BDTUR[id](b,dt).
   Level 0 is a fresh building. Each upgrade level raises the stat named by the data key `up` ('rate' or 'dmg') by 30%
   and range by 10%. Overcharge (G.bd.ocT > 0) multiplies fire rate. */

/* multiplier for 'rate' or 'dmg' on building b */
function bdStat(b,which){
  const d=BDD.turrets[b.id];
  let m=d.up===which?1+BDD.upgrade.perLevel*b.lvl:1;
  if(which==='rate'&&G.bd.ocT>0)m*=BDD.skills.overcharge.rateMul;
  return m;
}
/* range in px including upgrades */
function bdRange(b){return BDD.turrets[b.id].range*(1+BDD.upgrade.range*b.lvl)*BDT;}
/* live enemies this building may hit, within range, ordered best target first.
   hits: 'ground' | 'air' | 'both'. Default order is closest to the core. opt.highestHp sorts by HP (sniper). */
function bdTargets(b,opt){
  const d=BDD.turrets[b.id],hits=d.hits,c=bdCenter(b),R=bdRange(b)+(opt&&opt.pad||0),out=[];
  for(const e of G.E){
    if(e.dead)continue;
    if(hits==='ground'&&e.fly)continue;
    if(hits==='air'&&!e.fly)continue;
    const dd=Math.hypot(e.x-c.x,e.y-c.y);
    if(dd-e.r>R)continue;
    out.push({e,d:dd,core:Math.hypot(e.x-BD_CORE.cx,e.y-BD_CORE.cy)});
  }
  if(opt&&opt.highestHp)out.sort((a,b2)=>b2.e.hp-a.e.hp);
  else out.sort((a,b2)=>a.core-b2.core);
  return out.map(o=>o.e);
}
const bdTarget=(b,opt)=>bdTargets(b,opt)[0]||null;

function bdTurrets(dt){
  const B=G.bd;
  for(const b of B.buildings){
    if(b.kind!=='turret')continue;
    const f=BDTUR[b.id];
    if(f)f(b,dt);
  }
}
