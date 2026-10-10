/* Level-up cards and applying a chosen upgrade. */
/* ---------- level up ---------- */
function mkCard(parent,title,desc,tag,idx,onClick){
  const b=document.createElement('button');b.type='button';b.className='card';
  const h=document.createElement('strong'),s=document.createElement('span'),e=document.createElement('em');
  h.textContent=(idx?idx+'. ':'')+title;s.textContent=desc;e.textContent=tag;
  b.append(h,s);if(tag)b.append(e);
  b.addEventListener('click',onClick);parent.append(b);return b;
}
function openLevel(){
  G.state='levelup';mouse.down=false;
  const pool=SKILLS.filter(s=>(G.lv[s.id]||0)<s.max&&(!s.only||s.only.indexOf(G.wk)>=0)&&(!s.need||G.p[s.need])&&!((G.w.beam||G.w.boom||G.w.fade)&&s.id==='pierce'));
  for(let i=pool.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}
  CH=pool.slice(0,3);
  const spc=pool.filter(s=>s.only);
  if(CH.length===3&&spc.length&&!CH.some(s=>s.only)&&Math.random()<.6)CH[2]=spc[Math.floor(Math.random()*spc.length)];
  if(!CH.length)CH=[HEAL];
  const box=$('choices');box.innerHTML='';
  let first=null;
  CH.forEach((s,i)=>{
    const cur=G.lv[s.id]||0;
    const tag=s.id==='heal'?'':cur===0&&(s.id==='blades'||s.id==='nova')?'New weapon':'Level '+(cur+1)+' / '+s.max;
    const c=mkCard(box,s.name,s.desc,tag,i+1,()=>pick(s));if(!first)first=c;
  });
  $('lvl').hidden=false;first.focus();
}
function pick(s){
  if(G.state!=='levelup')return;
  if(s.id!=='heal')G.lv[s.id]=(G.lv[s.id]||0)+1;
  s.fn(G.p);{const o=G.p.maxHp;G.p.maxHp=Math.round(o*1.04);G.p.hp+=G.p.maxHp-o;}G.pending--;
  if(G.pending>0)openLevel();else{$('lvl').hidden=true;G.state='play';}
}

