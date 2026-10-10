/* Mouse and keyboard handlers. */
/* ---------- input ---------- */
function setMouse(e){const r=cv.getBoundingClientRect();mouse.x=(e.clientX-r.left)*W/r.width;mouse.y=(e.clientY-r.top)*H/r.height;}
cv.addEventListener('pointerdown',e=>{
  setMouse(e);
  if(e.button===2){if(G&&G.state==='play')G.p.wantNova=true;return;}
  mouse.down=true;try{cv.setPointerCapture(e.pointerId)}catch(_){}
});
cv.addEventListener('pointermove',setMouse);
cv.addEventListener('pointerup',()=>{mouse.down=false});
cv.addEventListener('pointercancel',()=>{mouse.down=false});
cv.addEventListener('contextmenu',e=>e.preventDefault());
addEventListener('keydown',e=>{
  const k=e.key.toLowerCase();
  if(G&&G.state==='play'&&['arrowup','arrowdown','arrowleft','arrowright',' '].indexOf(k)>=0)e.preventDefault();
  keys[k]=true;
  if((k===' '||k==='e')&&G&&G.state==='play')G.p.wantNova=true;
  if((k==='p'||k==='escape')&&G)setPause(G.state==='play');
  if(k==='f'&&!e.ctrlKey&&!e.metaKey)toggleFs();
  if(G&&G.state==='levelup'&&k.length===1&&'123'.indexOf(k)>=0){const c=CH[+k-1];if(c)pick(c);}
});
addEventListener('keyup',e=>{keys[e.key.toLowerCase()]=false;});
addEventListener('blur',()=>{for(const k in keys)keys[k]=false;mouse.down=false;if(G&&G.state==='play')setPause(true);});

