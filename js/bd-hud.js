/* Base Defence HUD: core HP, crystals, energy, wave and build phase panel. Placement hotbar lives in bd-ui.js. */
function bdDrawHud(){
  const B=G.bd,C=B.core;
  /* core hp, top centre */
  panel(W/2-130,12,260,34);
  ctx.textAlign='left';ctx.font='700 12px "Chakra Petch",sans-serif';ctx.fillStyle='#7df9ff';ctx.fillText('CORE',W/2-120,28);
  ctx.textAlign='right';ctx.fillStyle='#eef2ff';ctx.fillText(Math.ceil(C.hp)+' / '+C.max,W/2+120,28);
  ctx.fillStyle='#16204d';ctx.fillRect(W/2-120,33,240,7);
  ctx.fillStyle=C.hp/C.max>.3?'#5be7ff':'#ff4d6d';ctx.fillRect(W/2-120,33,240*clamp(C.hp/C.max,0,1),7);
  /* crystals + energy, under the kills panel */
  panel(W-142,58,130,52);
  ctx.textAlign='left';ctx.font='500 11px "Chakra Petch",sans-serif';ctx.fillStyle='#9aa4d6';ctx.fillText('CRYSTALS',W-134,74);
  ctx.textAlign='right';ctx.font='700 16px "Chakra Petch",sans-serif';ctx.fillStyle='#ff9bff';ctx.fillText(String(Math.floor(B.crystals)),W-22,74);
  ctx.textAlign='left';ctx.font='500 11px "Chakra Petch",sans-serif';ctx.fillStyle='#9aa4d6';ctx.fillText('ENERGY',W-134,92);
  ctx.fillStyle='#16204d';ctx.fillRect(W-134,98,114,6);
  ctx.fillStyle='#5be7ff';ctx.fillRect(W-134,98,114*clamp(B.energy/BDD.energy.max,0,1),6);
  /* phase + wave clock, bottom left */
  const bx=132;panel(12,H-62,240,48);
  ctx.textAlign='center';
  if(B.phase==='build'){
    ctx.font='700 24px "Chakra Petch",sans-serif';ctx.fillStyle='#7dffb2';ctx.fillText('BUILD '+fmt(B.phaseT),bx,H-36);
    ctx.font='500 10px "Chakra Petch",sans-serif';ctx.fillStyle='#9aa4d6';
    ctx.fillText('NEXT: WAVE '+(B.wave+1)+(typeof BD_SKIP_HINT==='string'?BD_SKIP_HINT:''),bx,H-20);
  }else{
    ctx.font='700 24px "Chakra Petch",sans-serif';ctx.fillStyle=G.t>0&&B.timed&&B.clock>DUR-60?'#ffb36b':'#ff6b81';
    ctx.fillText('WAVE '+B.wave,bx,H-36);
    ctx.font='500 10px "Chakra Petch",sans-serif';ctx.fillStyle='#9aa4d6';
    ctx.fillText(B.timed?fmt(B.clock)+' / '+fmt(DUR)+' WAVE CLOCK':'ENDLESS  SCORE '+(Math.max(0,B.wave-1)+G.kills),bx,H-20);
  }
  if(B.dead){
    ctx.font='700 30px "Chakra Petch",sans-serif';ctx.fillStyle='#ff6b81';ctx.fillText('DOWN',W/2,H/2-10);
    ctx.font='500 14px "Chakra Petch",sans-serif';ctx.fillStyle='#cfd6ff';ctx.fillText('Respawn in '+Math.ceil(B.respawnT)+'s',W/2,H/2+14);
  }
}
