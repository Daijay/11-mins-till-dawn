/* Minute 9:50 build picker (choose 28 upgrades). */
/* ---------- build picker for the minute 10 start ---------- */
let BLD=null;
function eligible(wk){
  const w=WEAPONS[wk];
  return SKILLS.filter(s=>(!s.only||s.only.indexOf(wk)>=0)&&!((w.beam||w.boom||w.fade)&&s.id==='pierce'));
}
function openBuild(wk){
  BLD={wk,lv:{},left:28};
  $('start').hidden=true;$('build').hidden=false;renderBuild();
}
function renderBuild(){
  const box=$('buildList'),st=box.scrollTop;box.innerHTML='';
  $('buildLeft').textContent=BLD.left;
  eligible(BLD.wk).forEach(s=>{
    const cur=BLD.lv[s.id]||0,locked=!!s.need&&!(BLD.lv[s.need]>0);
    const row=document.createElement('div');row.className='brow'+(locked?' locked':'');
    const tx=document.createElement('div');tx.className='btxt';
    const nm=document.createElement('strong');
    nm.textContent=s.name+(s.only?' (weapon)':'')+(locked?' (needs Minigun Conversion)':'');
    const ds=document.createElement('span');ds.textContent=s.desc;
    tx.append(nm,ds);
    const ct=document.createElement('div');ct.className='bctl';
    const mi=document.createElement('button');mi.type='button';mi.textContent='-';mi.disabled=cur<=0;mi.setAttribute('aria-label','Remove '+s.name);
    const cn=document.createElement('b');cn.textContent=cur+'/'+s.max;
    const pl=document.createElement('button');pl.type='button';pl.textContent='+';pl.disabled=cur>=s.max||BLD.left<=0||locked;pl.setAttribute('aria-label','Add '+s.name);
    mi.addEventListener('click',()=>{
      BLD.lv[s.id]=cur-1;BLD.left++;
      if(s.id==='mini'&&cur-1===0){BLD.left+=BLD.lv.spin||0;BLD.lv.spin=0;}
      renderBuild();
    });
    pl.addEventListener('click',()=>{BLD.lv[s.id]=cur+1;BLD.left--;renderBuild();});
    ct.append(mi,cn,pl);row.append(tx,ct);box.append(row);
  });
  box.scrollTop=st;
}
function fillEven(){
  let guard=0;
  while(BLD.left>0&&guard++<500){
    let best=null,bl=1e9;
    eligible(BLD.wk).forEach(s=>{
      const c=BLD.lv[s.id]||0;
      if(c>=s.max)return;
      if(s.need&&!(BLD.lv[s.need]>0))return;
      if(c<bl){bl=c;best=s;}
    });
    if(!best)break;
    BLD.lv[best.id]=(BLD.lv[best.id]||0)+1;BLD.left--;
  }
  renderBuild();
}
$('bBack').addEventListener('click',showStart);
$('bReset').addEventListener('click',()=>{BLD.lv={};BLD.left=28;renderBuild();});
$('bRand').addEventListener('click',fillEven);
$('bGo').addEventListener('click',()=>{newGame(BLD.wk,BLD);$('build').hidden=true;$('pbtn').hidden=false;mouse.down=false;});

