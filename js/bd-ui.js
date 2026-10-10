/* Base Defence UI: hotbar (build menu), placement ghost, building and remnant panel, placement rules and the
   player actions (place, full wall, sell, repair, upgrade, rebuild). Input hooks are called from input.js while G.bd is set.
   Every number comes from BDD (bd-data.js and bd-data-ui.js). Skill and cable hooks are guarded with typeof. */

const BDU_GROUPS=[
  {name:'Walls',t:'wall',ids:()=>Object.keys(BDD.walls).filter(id=>!BDD.walls[id].skillOnly)},
  {name:'Turrets',t:'turret',ids:()=>Object.keys(BDD.turrets)},
  {name:'Skills',t:'skill',ids:()=>Object.keys(BDD.skills)}
];
const BDU_HINTS=[
  ['Shift + click: full wall','Tab group, wheel, 1-0 keys'],
  ['Tab group, wheel, 1-0 keys'],
  ['Click the map to use','Tab group, wheel, 1-0 keys']
];
let bduShift=false,bduPanel=null,bduCableDrag=false;
addEventListener('keydown',e=>{bduShift=e.shiftKey;});
addEventListener('keyup',e=>{bduShift=e.shiftKey;});
addEventListener('blur',()=>{bduShift=false;});
addEventListener('pointerup',e=>{if(e.button===2)bduCableEnd();});

/* screen converters, same as state.js camera */
const bdSX=x=>x-camX()+W/2,bdSY=y=>y-camY()+H/2;
const bduGrp=()=>G.bd.grp||0;
const bduItems=g=>BDU_GROUPS[g].ids();
const bduIn=(r,x,y)=>!!r&&x>=r.x&&x<r.x+r.w&&y>=r.y&&y<r.y+r.h;
const bduCost=(t,id)=>t==='skill'?BDD.skills[id].energy:bdDef(t,id).cost;
const bduAfford=(t,id)=>t==='skill'?G.bd.energy>=BDD.skills[id].energy:G.bd.crystals>=bduCost(t,id);
const bduName=(t,id)=>t==='skill'?BDD.skills[id].name:bdDef(t,id).name;
const bduRefund=b=>Math.floor(BDD.eco.sell*b.paid);
const bduRepCost=b=>Math.ceil(BDD.eco.repairFrac*bdDef(b.kind,b.id).cost*(1-b.hp/b.max));
const bduUpCost=b=>b.lvl<BDD.upgrade.levels?Math.ceil(BDD.turrets[b.id].cost*BDD.upgrade.costs[b.lvl]):0;
const bduRemCost=rem=>Math.ceil(BDD.eco.remnantFrac*bdDef(rem.kind,rem.id).cost);
/* top-left anchor for a building under the cursor. Single tiles take the tile under the cursor, larger ones centre on it */
function bduAnchor(kind,id,wx,wy){
  const d=bdDef(kind,id),w=d.w||1,h=d.h||1;
  return {c:Math.round(wx/BDT-w/2),r:Math.round(wy/BDT-h/2),w,h};
}
/* does the player circle cover tile (c,r) */
function bduNearPlayer(c,r){
  const p=G.p,x0=c*BDT,y0=r*BDT;
  const nx=clamp(p.x,x0,x0+BDT),ny=clamp(p.y,y0,y0+BDT);
  return (p.x-nx)*(p.x-nx)+(p.y-ny)*(p.y-ny)<p.r*p.r;
}
/* why tile (c,r) cannot hold a building of this kind, or null when it can */
function bduTileReason(kind,id,c,r){
  const d=bdDef(kind,id),roadOnly=kind==='wall'||!!d.roadOnly;
  if(!bdInGrid(c,r))return 'Off the map';
  if(bdIsCore(c,r))return 'On the core';
  if(roadOnly&&!bdIsRoad(c,r))return 'Road only';
  if(G.bd.tiles.has(bdKey(c,r)))return 'Occupied';
  if(kind==='wall'&&bdBlocksPlayer({kind,id})&&bduNearPlayer(c,r))return 'Too close to you';
  return null;
}
/* footprint check without cost. Returns the first reason or null */
function bduFootReason(kind,id,c,r){
  const d=bdDef(kind,id),w=d.w||1,h=d.h||1;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const why=bduTileReason(kind,id,c+x,r+y);
    if(why)return why;
  }
  return null;
}
/* {ok,reason} for a single building at anchor c,r, including cost */
function bdCanPlace(kind,id,c,r){
  const d=bdDef(kind,id);
  if(!G.bd||!d)return {ok:false,reason:'Unknown'};
  if(d.skillOnly)return {ok:false,reason:'Skill only'};
  const why=bduFootReason(kind,id,c,r);
  if(why)return {ok:false,reason:why};
  if(G.bd.crystals<d.cost)return {ok:false,reason:'Not enough crystals'};
  return {ok:true,reason:''};
}
/* place a single building, spending crystals. Returns the building or null */
function bdPlace(kind,id,c,r){
  if(!bdCanPlace(kind,id,c,r).ok)return null;
  G.bd.crystals-=bdDef(kind,id).cost;
  return bdAdd(kind,id,c,r);
}
/* full wall plan: every road tile in depth rows from row r. Occupied or blocked tiles are skipped. cost is the sum times (1 - discount) */
function bduFullPlan(id,r){
  const d=BDD.walls[id],B=G.bd,cells=[];
  let sum=0;
  for(let dr=0;dr<d.depth;dr++)for(let c=BD_ROAD_C0;c<=BD_ROAD_C1;c++){
    const rr=r+dr,why=bduTileReason('wall',id,c,rr);
    cells.push({c,r:rr,why});
    if(!why)sum+=d.cost;
  }
  const tiles=cells.filter(x=>!x.why);
  const cost=Math.ceil(sum*(1-BDD.fullWallDiscount));
  let reason='';
  if(!tiles.length)reason='No room';
  else if(B.crystals<cost)reason='Not enough crystals';
  return {cells,tiles,cost,ok:!reason,reason};
}
/* full wall across the road from row r. Returns true if placed */
function bdPlaceFullWall(id,r){
  const plan=bduFullPlan(id,r);
  if(!plan.ok)return false;
  G.bd.crystals-=plan.cost;
  for(const t of plan.tiles)bdAdd('wall',id,t.c,t.r);
  return true;
}
/* sell a building for floor(sell * paid) */
function bdSell(b){
  const B=G.bd;
  if(!B.buildings.includes(b))return false;
  B.crystals+=bduRefund(b);
  bdRemove(b);
  if(bduPanel&&bduPanel.b===b)bduPanel=null;
  return true;
}
/* restore hp to max. Cost scales with the missing fraction */
function bdRepair(b){
  const B=G.bd,c=bduRepCost(b);
  if(b.hp>=b.max||bdDef(b.kind,b.id).noRepair||B.crystals<c)return false;
  B.crystals-=c;b.hp=b.max;
  return true;
}
/* turrets only, up to BDD.upgrade.levels. Max HP does not change */
function bdUpgrade(b){
  const B=G.bd;
  if(b.kind!=='turret'||b.lvl>=BDD.upgrade.levels)return false;
  const c=bduUpCost(b);
  if(B.crystals<c)return false;
  B.crystals-=c;b.lvl++;b.paid+=c;
  return true;
}
/* rebuild a destroyed building as a fresh one (level 0, full HP) */
function bdRepairRemnant(rem){
  const B=G.bd,c=bduRemCost(rem);
  if(!B.remnants.includes(rem)||bduFootReason(rem.kind,rem.id,rem.c,rem.r)||B.crystals<c)return false;
  B.crystals-=c;
  B.remnants=B.remnants.filter(x=>x!==rem);
  if(bduPanel&&bduPanel.rem===rem)bduPanel=null;
  bdAdd(rem.kind,rem.id,rem.c,rem.r);
  return true;
}

/* ---------- hotbar layout (screen px). Shared by drawing and hit tests ---------- */
function bduLayout(){
  const B=G.bd,U=BDD.ui,iw=U.barW,x=W-12-iw,y=U.barTop;
  const L={x,y,w:iw,h:0,tog:{x:x+iw-26,y:y+5,w:20,h:18},tabs:[],skip:null,rows:[],hint:[],hintY:0};
  let yy=y+28;
  if(!B.barMin){
    const tw=(iw-8)/BDU_GROUPS.length;
    BDU_GROUPS.forEach((g,i)=>L.tabs.push({x:x+4+i*tw,y:yy,w:tw-2,h:U.tabH,i}));
    yy+=U.tabH+6;
  }
  if(B.phase==='build'){L.skip={x:x+4,y:yy,w:iw-8,h:24};yy+=30;}
  if(!B.barMin){
    const g=bduGrp(),t=BDU_GROUPS[g].t,ids=bduItems(g);
    ids.forEach((id,i)=>L.rows.push({x:x+4,y:yy+i*U.rowH,w:iw-8,h:U.rowH-2,i,id,t}));
    yy+=ids.length*U.rowH+4;
    L.hint=BDU_HINTS[g];L.hintY=yy;yy+=L.hint.length*12+4;
  }
  L.h=yy-y+4;
  return L;
}
/* building or remnant panel (screen px) or null. Closes itself when its target is gone */
function bduPanelLayout(){
  const P=bduPanel;
  if(!P)return null;
  const B=G.bd,T=BDT,U=BDD.ui,pad=10,pw=U.panelW,btnH=24,gap=4;
  const out={w:pw,btns:[],title:'',sub:'',hp:null,note:''};
  if(P.b){
    const b=P.b;
    if(!B.buildings.includes(b)||b.dead){bduPanel=null;return null;}
    const d=bdDef(b.kind,b.id),isT=b.kind==='turret',maxed=b.lvl>=BDD.upgrade.levels;
    out.ax=bdSX(b.c*T);out.ay=bdSY(b.r*T);out.aw=b.w*T;
    out.title=d.name;
    out.sub=isT?'Level '+(b.lvl+1)+(maxed?' (max)':''):'Wall';
    out.hp={v:b.hp,max:b.max};
    if(isT){
      const uc=maxed?0:bduUpCost(b);
      out.btns.push({label:maxed?'Max level':'Upgrade',right:maxed?'':String(uc),enabled:!maxed&&B.crystals>=uc,act:()=>bdUpgrade(b)});
    }
    const full=b.hp>=b.max,rc=bduRepCost(b),noRep=!!d.noRepair;
    out.btns.push({label:noRep?'No repair':full?'Full HP':'Repair',right:(noRep||full)?'':String(rc),enabled:!noRep&&!full&&B.crystals>=rc,act:()=>bdRepair(b)});
    out.btns.push({label:'Sell',right:'+'+bduRefund(b),enabled:true,act:()=>bdSell(b)});
  }else{
    const rem=P.rem;
    if(!B.remnants.includes(rem)){bduPanel=null;return null;}
    const rc=bduRemCost(rem),why=bduFootReason(rem.kind,rem.id,rem.c,rem.r);
    out.ax=bdSX(rem.c*T);out.ay=bdSY(rem.r*T);out.aw=rem.w*T;
    out.title=bdDef(rem.kind,rem.id).name;
    out.sub='Destroyed';
    out.note=why||'Rebuilds at level 1';
    out.btns.push({label:'Rebuild',right:String(rc),enabled:!why&&B.crystals>=rc,act:()=>bdRepairRemnant(rem)});
  }
  const ph=pad+50+out.btns.length*(btnH+gap)+pad-gap;
  const L=bduLayout();
  const py=clamp(out.ay,8,H-ph-8);
  let px=out.ax+out.aw+8;
  if(px+pw>L.x-6&&px<L.x+L.w+6&&py<L.y+L.h&&py+ph>L.y)px=out.ax-pw-8;
  px=clamp(px,8,W-pw-8);
  out.x=px;out.y=py;out.h=ph;
  out.btns.forEach((bt,i)=>{bt.x=px+pad;bt.y=py+pad+50+i*(btnH+gap);bt.w=pw-2*pad;bt.h=btnH;});
  return out;
}

/* ---------- hit handling for the bar ---------- */
function bduBarClick(L,mx,my){
  const B=G.bd;
  if(bduIn(L.tog,mx,my)){B.barMin=!B.barMin;return;}
  for(const t of L.tabs)if(bduIn(t,mx,my)){B.grp=t.i;return;}
  if(bduIn(L.skip,mx,my)){bdSkipBuild();return;}
  for(const row of L.rows)if(bduIn(row,mx,my)){bduPick(row.t,row.id);return;}
}
/* select a hotbar item. Clicking the selected item again clears the selection */
function bduPick(t,id){
  const B=G.bd;
  B.sel=(B.sel&&B.sel.t===t&&B.sel.id===id)?null:{t,id};
  bduPanel=null;
}
function bduCableEnd(){
  if(!bduCableDrag)return;
  bduCableDrag=false;
  if(typeof bdCableUp==='function')bdCableUp(mouseWX(),mouseWY());
}

/* ---------- input hooks ---------- */
function bdPointerDown(e){
  const B=G.bd;
  if(!B)return false;
  const wx=mouseWX(),wy=mouseWY();
  const L=bduLayout(),PL=bduPanelLayout();
  if(PL&&bduIn(PL,mouse.x,mouse.y)){
    if(e.button===0)for(const bt of PL.btns)if(bduIn(bt,mouse.x,mouse.y)){if(bt.enabled)bt.act();break;}
    return true;
  }
  if(bduIn(L,mouse.x,mouse.y)){
    if(e.button===0)bduBarClick(L,mouse.x,mouse.y);
    return true;
  }
  if(e.button===2){
    if(B.sel&&B.sel.t!=='skill'){B.sel=null;return true;}
    bduCableDrag=true;
    if(typeof bdCableDown==='function')bdCableDown(wx,wy);
    return true;
  }
  if(e.button!==0)return false;
  if(B.sel){
    if(B.sel.t==='skill'){
      if(typeof bdSkillUse==='function')bdSkillUse(B.sel.id,wx,wy);
      return true;
    }
    const kind=B.sel.t,id=B.sel.id;
    if(kind==='wall'&&e.shiftKey&&BDD.ui.fullWallIds.indexOf(id)>=0){
      bdPlaceFullWall(id,bdTileR(wy));
      return true;
    }
    const a=bduAnchor(kind,id,wx,wy);
    bdPlace(kind,id,a.c,a.r);
    return true;
  }
  if(bdInGrid(bdTileC(wx),bdTileR(wy))){
    const b=B.tiles.get(bdKey(bdTileC(wx),bdTileR(wy)));
    if(b){bduPanel={b};return true;}
  }
  const rem=B.remnants.find(r=>wx>=r.c*BDT&&wx<(r.c+r.w)*BDT&&wy>=r.r*BDT&&wy<(r.r+r.h)*BDT);
  if(rem){bduPanel={rem};return true;}
  bduPanel=null;
  return false;
}
function bdPointerMove(e){
  if(bduCableDrag&&typeof bdCableMove==='function')bdCableMove(mouseWX(),mouseWY());
}
function bdPointerUp(e){
  if(bduCableDrag&&(e.button===2||e.type==='pointercancel'))bduCableEnd();
}
function bdWheel(e){
  const B=G.bd;
  if(!B||!e.deltaY)return;
  const g=bduGrp(),t=BDU_GROUPS[g].t,ids=bduItems(g),n=ids.length,dir=e.deltaY>0?1:-1;
  let idx=(B.sel&&B.sel.t===t)?ids.indexOf(B.sel.id):(dir>0?-1:n);
  idx=(idx+dir+n)%n;
  B.sel={t,id:ids[idx]};
  bduPanel=null;
}
function bdKeyDown(k,e){
  const B=G.bd;
  if(!B)return false;
  if(k==='escape'){
    if(B.sel||bduPanel){B.sel=null;bduPanel=null;return true;}
    return false;
  }
  if(k==='tab'){e.preventDefault();B.grp=(bduGrp()+1)%BDU_GROUPS.length;return true;}
  if(k==='n'){
    if(B.phase!=='build')return false;
    bdSkipBuild();
    return true;
  }
  if(k.length===1&&k>='0'&&k<='9'){
    const idx=k==='0'?9:+k-1,g=bduGrp(),ids=bduItems(g);
    if(idx>=ids.length)return false;
    bduPick(BDU_GROUPS[g].t,ids[idx]);
    return true;
  }
  return false;
}

/* ---------- drawing ---------- */
function bduRR(x,y,w,h,r){ctx.beginPath();if(ctx.roundRect)ctx.roundRect(x,y,w,h,r);else ctx.rect(x,y,w,h);}
function bduDrawBtn(bt){
  bduRR(bt.x,bt.y,bt.w,bt.h,5);
  ctx.fillStyle=bt.enabled?'rgba(91,231,255,.14)':'rgba(255,255,255,.03)';ctx.fill();
  ctx.strokeStyle=bt.enabled?'rgba(91,231,255,.6)':'rgba(154,164,214,.25)';ctx.lineWidth=1;ctx.stroke();
  ctx.font='700 11px "Chakra Petch",sans-serif';ctx.textAlign='left';
  ctx.fillStyle=bt.enabled?'#eef2ff':'#6b74a8';
  ctx.fillText(bt.label,bt.x+8,bt.y+bt.h/2+1);
  if(bt.right){
    ctx.textAlign='right';ctx.fillStyle=bt.enabled?'#ffb36b':'#6b74a8';
    ctx.fillText(bt.right,bt.x+bt.w-8,bt.y+bt.h/2+1);
  }
}
/* screen-space: hotbar, skip button and the building panel. Called from bdDrawHud every frame */
function bdDrawBar(){
  const B=G.bd;
  if(!B)return;
  const L=bduLayout(),g=bduGrp();
  ctx.save();
  ctx.textBaseline='middle';ctx.textAlign='left';
  panel(L.x,L.y,L.w,L.h);
  ctx.font='700 12px "Chakra Petch",sans-serif';ctx.fillStyle='#eef2ff';
  ctx.fillText('HOTBAR',L.x+8,L.y+14);
  bduRR(L.tog.x,L.tog.y,L.tog.w,L.tog.h,4);ctx.fillStyle='rgba(255,255,255,.08)';ctx.fill();
  ctx.font='700 13px "Chakra Petch",sans-serif';ctx.fillStyle='#ffb36b';ctx.textAlign='center';
  ctx.fillText(B.barMin?'+':'-',L.tog.x+L.tog.w/2,L.tog.y+L.tog.h/2+1);
  ctx.textAlign='left';
  for(const t of L.tabs){
    const on=t.i===g;
    bduRR(t.x,t.y,t.w,t.h,4);ctx.fillStyle=on?'rgba(255,179,107,.22)':'rgba(255,255,255,.05)';ctx.fill();
    ctx.font='700 11px "Chakra Petch",sans-serif';ctx.textAlign='center';
    ctx.fillStyle=on?'#ffb36b':'#9aa4d6';
    ctx.fillText(BDU_GROUPS[t.i].name,t.x+t.w/2,t.y+t.h/2+1);
    ctx.textAlign='left';
  }
  if(L.skip){
    const s=L.skip,bonus=Math.floor(B.phaseT*BDD.wave.skipRate);
    bduRR(s.x,s.y,s.w,s.h,5);ctx.fillStyle='rgba(91,231,255,.14)';ctx.fill();
    ctx.strokeStyle='#5be7ff';ctx.lineWidth=1;ctx.stroke();
    ctx.font='700 11px "Chakra Petch",sans-serif';ctx.fillStyle='#eef2ff';
    ctx.fillText('Skip build (N)',s.x+8,s.y+s.h/2+1);
    ctx.textAlign='right';ctx.fillStyle='#7dffb2';
    ctx.fillText('+'+bonus,s.x+s.w-8,s.y+s.h/2+1);
    ctx.textAlign='left';
  }
  for(const row of L.rows){
    const on=!!B.sel&&B.sel.t===row.t&&B.sel.id===row.id,ok=bduAfford(row.t,row.id);
    ctx.globalAlpha=ok?1:.42;
    bduRR(row.x,row.y,row.w,row.h,4);
    ctx.fillStyle=on?'rgba(255,179,107,.2)':'rgba(255,255,255,.04)';ctx.fill();
    if(on){ctx.strokeStyle='#ffb36b';ctx.lineWidth=1;ctx.stroke();}
    const my=row.y+row.h/2+1;
    ctx.font='500 10px "Chakra Petch",sans-serif';ctx.fillStyle='#9aa4d6';ctx.textAlign='left';
    if(row.i<10)ctx.fillText(String((row.i+1)%10),row.x+6,my);
    ctx.font='500 11px "Chakra Petch",sans-serif';ctx.fillStyle='#eef2ff';
    ctx.fillText(bduName(row.t,row.id),row.x+20,my);
    ctx.font='700 11px "Chakra Petch",sans-serif';ctx.textAlign='right';
    if(row.t==='skill'){ctx.fillStyle='#5be7ff';ctx.fillText(bduCost(row.t,row.id)+' E',row.x+row.w-6,my);}
    else{ctx.fillStyle='#ff9bff';ctx.fillText(String(bduCost(row.t,row.id)),row.x+row.w-6,my);}
  }
  ctx.globalAlpha=1;ctx.textAlign='left';
  ctx.font='500 9px "Chakra Petch",sans-serif';ctx.fillStyle='#9aa4d6';
  L.hint.forEach((s,i)=>ctx.fillText(s,L.x+8,L.hintY+6+i*12));
  /* building or remnant panel */
  const PL=bduPanelLayout();
  if(PL){
    panel(PL.x,PL.y,PL.w,PL.h);
    ctx.textAlign='left';
    ctx.font='700 13px "Chakra Petch",sans-serif';ctx.fillStyle='#eef2ff';
    ctx.fillText(PL.title,PL.x+10,PL.y+18);
    ctx.font='500 11px "Chakra Petch",sans-serif';ctx.fillStyle='#9aa4d6';
    ctx.fillText(PL.sub,PL.x+10,PL.y+34);
    if(PL.hp){
      ctx.textAlign='right';ctx.fillStyle='#eef2ff';ctx.font='700 11px "Chakra Petch",sans-serif';
      ctx.fillText('HP '+Math.ceil(PL.hp.v)+' / '+PL.hp.max,PL.x+PL.w-10,PL.y+34);
      ctx.fillStyle='#16204d';ctx.fillRect(PL.x+10,PL.y+42,PL.w-20,5);
      const k=clamp(PL.hp.v/PL.hp.max,0,1);
      ctx.fillStyle=k>.5?'#7dffb2':k>.25?'#ffb020':'#ff4d6d';ctx.fillRect(PL.x+10,PL.y+42,(PL.w-20)*k,5);
    }else{
      ctx.font='500 10px "Chakra Petch",sans-serif';ctx.fillStyle='#ffb36b';
      ctx.fillText(PL.note,PL.x+10,PL.y+46);
    }
    for(const bt of PL.btns)bduDrawBtn(bt);
  }
  ctx.restore();
}

/* small cursor label: rows of {t,c,f}. Flips to the left near the right edge */
function bduLabel(rows){
  const lw=190,lh=rows.length*16+10;
  let lx=mouse.x+18,ly=mouse.y+12;
  if(lx+lw>W-4)lx=mouse.x-lw-14;
  if(ly+lh>H-4)ly=H-4-lh;
  panel(lx,ly,lw,lh);
  ctx.textAlign='left';
  rows.forEach((r,i)=>{ctx.font=r.f||'500 11px "Chakra Petch",sans-serif';ctx.fillStyle=r.c;ctx.fillText(r.t,lx+8,ly+12+i*16);});
}
/* world-space placement preview, drawn before the HUD. sx/sy convert world px to screen px */
function bdDrawGhost(sx,sy){
  const B=G.bd;
  if(!B||!B.sel)return;
  const L=bduLayout();
  if(bduIn(L,mouse.x,mouse.y))return;
  const sel=B.sel,wx=mouseWX(),wy=mouseWY(),green='rgba(125,255,178,',red='rgba(255,77,109,';
  ctx.save();
  ctx.textBaseline='middle';
  if(sel.t==='skill'){
    if(typeof bdSkillGhost==='function')bdSkillGhost(sel.id,sx,sy);
    const sk=BDD.skills[sel.id],ok=B.energy>=sk.energy;
    bduLabel([
      {t:sk.name,c:'#eef2ff',f:'700 12px "Chakra Petch",sans-serif'},
      {t:'Energy '+sk.energy,c:ok?'#5be7ff':'#ff4d6d'}
    ]);
  }else if(sel.t==='wall'&&bduShift&&BDD.ui.fullWallIds.indexOf(sel.id)>=0){
    const d=BDD.walls[sel.id],plan=bduFullPlan(sel.id,bdTileR(wy));
    for(const cell of plan.cells){
      const x=sx(cell.c*BDT),y=sy(cell.r*BDT);
      ctx.fillStyle=(cell.why?red+'.28)':green+'.32)');
      ctx.fillRect(x+1,y+1,BDT-2,BDT-2);
    }
    bduLabel([
      {t:d.name+' x'+plan.tiles.length,c:'#eef2ff',f:'700 12px "Chakra Petch",sans-serif'},
      {t:'Cost '+plan.cost+' crystals',c:'#ff9bff'},
      {t:plan.reason||'Full wall',c:plan.ok?'#7dffb2':'#ff4d6d'}
    ]);
  }else{
    const kind=sel.t,def=bdDef(kind,sel.id),a=bduAnchor(kind,sel.id,wx,wy);
    const res=bdCanPlace(kind,sel.id,a.c,a.r),col=res.ok?green:red;
    for(let y=0;y<a.h;y++)for(let x=0;x<a.w;x++){
      const px=sx((a.c+x)*BDT),py=sy((a.r+y)*BDT);
      ctx.fillStyle=col+'.32)';ctx.fillRect(px+1,py+1,BDT-2,BDT-2);
      ctx.strokeStyle=col+'.9)';ctx.lineWidth=1.5;ctx.strokeRect(px+1,py+1,BDT-2,BDT-2);
    }
    if(kind==='turret'&&def.range){
      const cx=sx((a.c+a.w/2)*BDT),cy=sy((a.r+a.h/2)*BDT);
      ctx.beginPath();ctx.arc(cx,cy,def.range*BDT,0,6.283);
      ctx.fillStyle=col+'.07)';ctx.fill();
      ctx.strokeStyle=col+'.6)';ctx.lineWidth=1.5;ctx.stroke();
    }
    bduLabel([
      {t:def.name,c:'#eef2ff',f:'700 12px "Chakra Petch",sans-serif'},
      {t:'Cost '+def.cost+' crystals',c:'#ff9bff'},
      {t:res.ok?'Click to place':res.reason,c:res.ok?'#7dffb2':'#ff4d6d'}
    ]);
  }
  ctx.restore();
}
