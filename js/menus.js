/* Start screen, weapon cards, revive, skip toggle, pause, fullscreen. */
/* ---------- menus ---------- */
function showStart(){
  $('end').hidden=true;$('lvl').hidden=true;$('pause').hidden=true;$('pbtn').hidden=true;$('build').hidden=true;$('start').hidden=false;setSkip(false);if(typeof refreshMode==='function')refreshMode();
  let best=0;try{best=+(localStorage.getItem('bs_best')||0);}catch(_){}
  $('best').textContent=best>=DUR?'You have seen the dawn.':best>0?'Longest night so far: '+fmt(best):'';
  try{const eb=+(localStorage.getItem(BDD.best)||0);if(eb>0)$('best').textContent+=(best>0?'  ':'')+'Base Defence endless best: '+eb;}catch(_){}
  idleState();
}
/* mode picker: Survive, or Base Defence (Timed or Endless) */
let selMode='survive',bdTimed=true;
const modeCards=[],subCards=[];
function refreshMode(){
  const bd=selMode==='bd';
  modeCards.forEach((c,i)=>c.classList.toggle('sel',i===(bd?1:0)));
  subCards.forEach((c,i)=>c.classList.toggle('sel',i===(bdTimed?0:1)));
  $('bdsub').hidden=!bd;
  $('skip').hidden=bd;
  if(bd){setSkip(false);$('skipnote').hidden=true;}
}
modeCards.push(mkCard($('modes'),'Survive','Run and gun for 11 minutes. Hold out until dawn.','',0,()=>{selMode='survive';refreshMode();}));
modeCards.push(mkCard($('modes'),'Base Defence','Hold the line. Build walls and turrets, defend the core, kill the final boss.','',0,()=>{selMode='bd';refreshMode();}));
subCards.push(mkCard($('bdsub'),'Timed','Waves count down an 11 minute wave clock. The Sovereign arrives near the end.','',0,()=>{bdTimed=true;refreshMode();}));
subCards.push(mkCard($('bdsub'),'Endless','No clock. Score is waves survived plus kills. The Sovereign comes at wave 20.','',0,()=>{bdTimed=false;refreshMode();}));
refreshMode();
const wbox=$('weapons');
Object.keys(WEAPONS).forEach(k=>{
  const w=WEAPONS[k];
  mkCard(wbox,w.name,w.desc,'',0,()=>{
    if(selMode==='bd'){newGameBD(k,bdTimed);$('start').hidden=true;$('pbtn').hidden=false;mouse.down=false;return;}
    if(skip10){openBuild(k);return;}newGame(k);$('start').hidden=true;$('pbtn').hidden=false;mouse.down=false;});
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

