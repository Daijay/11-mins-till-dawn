/* Mouse and keyboard handlers. */
/* ---------- input ---------- */
function setMouse(e){const r=cv.getBoundingClientRect();mouse.x=(e.clientX-r.left)*W/r.width;mouse.y=(e.clientY-r.top)*H/r.height;}
cv.addEventListener('pointerdown',e=>{
  setMouse(e);
  if(G&&G.bd&&G.state==='play'&&bdPointerDown(e))return;
  if(e.button===2){if(G&&G.state==='play')G.p.wantNova=true;return;}
  mouse.down=true;try{cv.setPointerCapture(e.pointerId)}catch(_){}
});
cv.addEventListener('pointermove',e=>{setMouse(e);if(G&&G.bd&&G.state==='play')bdPointerMove(e);});
cv.addEventListener('pointerup',e=>{mouse.down=false;if(G&&G.bd)bdPointerUp(e);});
cv.addEventListener('pointercancel',e=>{mouse.down=false;if(G&&G.bd)bdPointerUp(e);});
cv.addEventListener('wheel',e=>{if(G&&G.bd&&G.state==='play'){e.preventDefault();bdWheel(e);}},{passive:false});
cv.addEventListener('contextmenu',e=>e.preventDefault());
addEventListener('keydown',e=>{
  const k=e.key.toLowerCase();
  if(G&&G.state==='play'&&['arrowup','arrowdown','arrowleft','arrowright',' '].indexOf(k)>=0)e.preventDefault();
  keys[k]=true;
  if(G&&G.bd&&G.state==='play'&&bdKeyDown(k,e))return;
  if((k===' '||k==='e')&&G&&G.state==='play')G.p.wantNova=true;
  if((k==='p'||k==='escape')&&G)setPause(G.state==='play');
  if(k==='f'&&!e.ctrlKey&&!e.metaKey)toggleFs();
  if(G&&G.state==='levelup'&&k.length===1&&'123'.indexOf(k)>=0){const c=CH[+k-1];if(c)pick(c);}
});
addEventListener('keyup',e=>{keys[e.key.toLowerCase()]=false;});
addEventListener('blur',()=>{for(const k in keys)keys[k]=false;mouse.down=false;if(G&&G.state==='play')setPause(true);});

