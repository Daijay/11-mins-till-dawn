/* drawHud(): HP, skills, clock, boss bars, buffs, banner. */
function panel(x,y,w,h){ctx.fillStyle='rgba(5,8,25,.62)';ctx.beginPath();ctx.roundRect?ctx.roundRect(x,y,w,h,6):ctx.rect(x,y,w,h);ctx.fill();}
function drawHud(){
  const p=G.p;
  // hp
  panel(12,12,244,40);
  ctx.fillStyle='#2a1020';ctx.fillRect(22,34,224,10);
  ctx.fillStyle=p.hp/p.maxHp>.3?'#ff5d73':'#ff2e2e';ctx.fillRect(22,34,224*clamp(p.hp/p.maxHp,0,1),10);
  ctx.font='700 13px "Chakra Petch",sans-serif';ctx.textBaseline='alphabetic';
  ctx.fillStyle='#eef2ff';ctx.textAlign='left';ctx.fillText('HP '+Math.ceil(p.hp)+' / '+p.maxHp,22,28);
  ctx.textAlign='right';ctx.fillStyle='#ffb36b';ctx.fillText('LV '+G.level,246,28);
  // owned skills
  const own=SKILLS.filter(s=>G.lv[s.id]>0);
  if(own.length){
    panel(12,58,170,own.length*16+12);
    ctx.font='500 12px "Chakra Petch",sans-serif';ctx.textAlign='left';
    own.forEach((s,i)=>{ctx.fillStyle='#cfd6ff';ctx.fillText(s.name,22,76+i*16);ctx.textAlign='right';ctx.fillStyle='#ffb36b';ctx.fillText(G.lv[s.id]+'/'+s.max,172,76+i*16);ctx.textAlign='left';});
  }
  // kills
  panel(W-142,12,130,40);
  ctx.textAlign='right';ctx.font='700 20px "Chakra Petch",sans-serif';ctx.fillStyle='#eef2ff';ctx.fillText(String(G.kills),W-22,40);
  ctx.font='500 11px "Chakra Petch",sans-serif';ctx.fillStyle='#9aa4d6';ctx.textAlign='left';ctx.fillText('KILLS',W-134,40);
  // clock
  panel(W/2-70,H-62,140,48);
  ctx.textAlign='center';ctx.font='700 28px "Chakra Petch",sans-serif';ctx.fillStyle=G.t>DUR-60?'#ffb36b':'#eef2ff';
  ctx.fillText(fmt(DUR-G.t),W/2,H-32);
  ctx.font='500 10px "Chakra Petch",sans-serif';ctx.fillStyle='#9aa4d6';ctx.fillText('UNTIL DAWN',W/2,H-19);
  // xp
  ctx.fillStyle='rgba(5,8,25,.7)';ctx.fillRect(0,H-8,W,8);
  ctx.fillStyle='#7dffb2';ctx.fillRect(0,H-8,W*clamp(G.xp/xpNext(G.level),0,1),8);
  // shockwave status
  if(p.nova>0){
    const ready=p.novaCd<=0;
    panel(12,H-58,176,44);
    ctx.textAlign='left';ctx.font='700 12px "Chakra Petch",sans-serif';
    ctx.fillStyle=ready?'#5be7ff':'#9aa4d6';ctx.fillText('SHOCKWAVE',22,H-41);
    ctx.textAlign='right';ctx.fillText(ready?'READY':p.novaCd.toFixed(1)+'s',178,H-41);
    ctx.fillStyle='#16204d';ctx.fillRect(22,H-32,156,8);
    ctx.fillStyle=ready?'#5be7ff':'#4a5aa8';ctx.fillRect(22,H-32,156*(ready?1:1-p.novaCd/p.novaMax),8);
    ctx.textAlign='left';ctx.font='500 10px "Chakra Petch",sans-serif';ctx.fillStyle='#9aa4d6';
    if(ready)ctx.fillText('RIGHT CLICK / E',22,H-18);
  }
  // minigun charge
  if(p.mini){
    const c=clamp(p.held/p.rampT,0,1);
    panel(W/2-66,H-104,132,36);
    ctx.textAlign='center';ctx.font='700 10px "Chakra Petch",sans-serif';ctx.fillStyle=c>=1?'#ff9a3c':'#eef2ff';
    ctx.fillText(c>=1?'FULL SPIN':'CHARGE',W/2,H-91);
    ctx.fillStyle='#2a2410';ctx.fillRect(W/2-58,H-84,116,8);
    ctx.fillStyle=c>=1?'#ff6b3d':'#ffd166';ctx.fillRect(W/2-58,H-84,116*c,8);
  }
  // boss health bars
  const bs=G.E.filter(e=>(e.type==='boss'||e.type==='super')&&!e.dead).slice(0,2);
  bs.forEach((b,i)=>{
    const y=12+i*36,bw=400;
    panel(W/2-bw/2-8,y,bw+16,32);
    ctx.textAlign='left';ctx.font='700 12px "Chakra Petch",sans-serif';ctx.fillStyle=b.type==='super'?'#ff7bff':'#ff6b81';
    ctx.fillText(b.type==='super'?'THE SOVEREIGN':'COLOSSUS',W/2-bw/2,y+14);
    ctx.textAlign='right';ctx.fillStyle='#eef2ff';ctx.fillText(Math.max(0,Math.ceil(b.hp))+' / '+Math.ceil(b.max),W/2+bw/2,y+14);
    ctx.fillStyle='#2a1020';ctx.fillRect(W/2-bw/2,y+19,bw,8);
    ctx.fillStyle=b.type==='super'?'#c026d3':'#ff4d6d';ctx.fillRect(W/2-bw/2,y+19,bw*clamp(b.hp/b.max,0,1),8);
  });
  const by0=12+bs.length*36;
  // active buffs
  const bl=[];
  if(p.buffs.rate>0)bl.push(['FIRE RATE +20%',p.buffs.rate,'#ffb020']);
  if(p.buffs.speed>0)bl.push(['SPEED UP',p.buffs.speed,'#4dd8ff']);
  if(p.inv>0)bl.push(['INVINCIBLE',p.inv,'#ffd23d']);
  if(bl.length){
    panel(W/2-100,by0,200,bl.length*20+10);
    ctx.font='700 12px "Chakra Petch",sans-serif';
    bl.forEach((b,i)=>{ctx.textAlign='left';ctx.fillStyle=b[2];ctx.fillText(b[0],W/2-90,by0+19+i*20);ctx.textAlign='right';ctx.fillText(Math.ceil(b[1])+'s',W/2+90,by0+19+i*20);});
  }
  // lodged rounds status
  if(p.lodge>0){
    const need=[20,15,10][p.lodge-1];
    panel(198,H-58,150,44);
    ctx.textAlign='left';ctx.font='700 12px "Chakra Petch",sans-serif';ctx.fillStyle='#ffd166';ctx.fillText('RECALL',208,H-41);
    ctx.textAlign='right';ctx.fillText(G.SH.length+' lodged',338,H-41);
    ctx.fillStyle='#2a2410';ctx.fillRect(208,H-32,130,8);
    ctx.fillStyle='#ffd166';ctx.fillRect(208,H-32,130*clamp(p.lodgeShots/need,0,1),8);
  }
  // banner
  if(G.banner){
    const a=clamp(Math.min(G.banner.t,2.4-G.banner.t)*3,0,1);
    ctx.globalAlpha=a;ctx.textAlign='center';
    panel(W/2-160,92,320,64);
    ctx.font='700 28px "Chakra Petch",sans-serif';ctx.fillStyle='#ff6b81';ctx.fillText(G.banner.text.toUpperCase(),W/2,126);
    ctx.font='500 13px "Chakra Petch",sans-serif';ctx.fillStyle='#cfd6ff';ctx.fillText(G.banner.sub.toUpperCase()+' INCOMING',W/2,146);
    ctx.globalAlpha=1;
  }
  if(G.state==='paused'){
    ctx.fillStyle='rgba(5,7,22,.6)';ctx.fillRect(0,0,W,H);
    ctx.textAlign='center';ctx.font='700 40px "Chakra Petch",sans-serif';ctx.fillStyle='#ffb36b';ctx.fillText('PAUSED',W/2,H/2);
    ctx.font='500 14px "Chakra Petch",sans-serif';ctx.fillStyle='#cfd6ff';ctx.fillText('Press P to resume',W/2,H/2+28);
  }
}

