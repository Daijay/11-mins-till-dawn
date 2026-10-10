/* finish(): win/lose handling, best time, end screen. */
function finish(win){
  if(G.bd){bdFinish(win);return;}
  G.state=win?'win':'lose';
  const t=G.t;
  if(win){G.E.forEach(e=>{burst(e.x,e.y,5,'#ffe2a8',170);});G.E=[];G.B=[];G.t=DUR;}
  try{const b=+(localStorage.getItem('bs_best')||0);if(win||t>b)localStorage.setItem('bs_best',win?DUR:Math.floor(t));}catch(_){}
  setTimeout(()=>{
    $('endTitle').textContent=win?'Dawn':'Overrun';
    $('endSub').textContent=win?'You held out. The light is back and so is the quiet.':'The dark got you with '+fmt(DUR-t)+' to go.';
    const st=$('endStats');st.innerHTML='';
    [['Kills',G.kills],['Level',G.level],['Weapon',G.w.name],['Survived',fmt(Math.floor(win?DUR:t)).replace(/^(\d+:\d+)$/,'$1')]].forEach(a=>{
      const d=document.createElement('div'),b=document.createElement('b'),s=document.createElement('small');
      b.textContent=a[1];s.textContent=a[0];d.append(b,s);st.append(d);
    });
    const nt=$('endNote');nt.hidden=!(win&&G.revives>0);if(!nt.hidden)nt.textContent='Side note: you came back from the dead '+(G.revives>1?G.revives+' times':'once')+' on the way here. Respect, still counts. We won\'t tell anyone.';
    $('revive').hidden=win;
    $('pbtn').hidden=true;$('end').hidden=false;$('revive').hidden?$('again').focus():$('revive').focus();
  },win?1400:700);
}

