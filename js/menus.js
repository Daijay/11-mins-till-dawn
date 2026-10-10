/* Start screen, weapon cards, revive, skip toggle, pause, fullscreen. */
/* ---------- menus ---------- */
function showStart(){
  $('end').hidden=true;$('lvl').hidden=true;$('pause').hidden=true;$('pbtn').hidden=true;$('build').hidden=true;$('start').hidden=false;setSkip(false);
  let best=0;try{best=+(localStorage.getItem('bs_best')||0);}catch(_){}
  $('best').textContent=best>=DUR?'You have seen the dawn.':best>0?'Longest night so far: '+fmt(best):'';
  idleState();
}
const wbox=$('weapons');
Object.keys(WEAPONS).forEach(k=>{
  const w=WEAPONS[k];
  mkCard(wbox,w.name,w.desc,'',0,()=>{if(skip10){openBuild(k);return;}newGame(k);$('start').hidden=true;$('pbtn').hidden=false;mouse.down=false;});
});
$('again').addEventListener('click',showStart);
$('revive').addEventListener('click',()=>{
  if(!G||G.state!=='lose')return;
  const p=G.p;
  G.revives=(G.revives||0)+1;
  p.hp=Math.round(p.maxHp*.8);p.inv=2.5;p.iframes=0;
  G.EB=[];G.state='play';G.shake=10;
  G.R.push({x:p.x,y:p.y,r:0,max:160,t:0,life:.45,rgb:'255,210,61'});burst(p.x,p.y,30,'#ffd23d',260);
  for(const e of G.E){const d=Math.hypot(e.x-p.x,e.y-p.y);if(d<170&&d>0){const a=Math.atan2(e.y-p.y,e.x-p.x);e.kx+=Math.cos(a)*420;e.ky+=Math.sin(a)*420;}}
  $('end').hidden=true;$('pbtn').hidden=false;mouse.down=false;
});
function setSkip(v){
  skip10=v;const b=$('skip');b.setAttribute('aria-pressed',String(v));
  b.querySelector('span').textContent=v?'ON':'OFF';$('skipnote').hidden=!v;
}
$('skip').addEventListener('click',()=>setSkip(!skip10));

function setPause(on){
  if(!G)return;
  if(on&&G.state==='play'){G.state='paused';mouse.down=false;$('pause').hidden=false;$('resume').focus();}
  else if(!on&&G.state==='paused'){G.state='play';$('pause').hidden=true;mouse.down=false;}
}
$('resume').addEventListener('click',()=>setPause(false));
$('quit').addEventListener('click',showStart);
function toggleFs(){
  try{
    if(document.fullscreenElement)document.exitFullscreen();
    else if(document.documentElement.requestFullscreen)document.documentElement.requestFullscreen().catch(()=>{});
  }catch(_){}
}
$('fbtn').addEventListener('click',e=>{e.currentTarget.blur();toggleFs();});
$('pbtn').addEventListener('click',e=>{e.currentTarget.blur();setPause(true);});

