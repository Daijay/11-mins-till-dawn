/* Boot and requestAnimationFrame loop. Loaded last. */
/* ---------- loop ---------- */
idleState();showStart();
let last=performance.now();
function frame(now){
  const dt=Math.min(.05,(now-last)/1000);last=now;
  if(G.state==='play')update(dt);
  else if(G.state==='win'||G.state==='lose'||G.state==='levelup')fx(dt);
  draw();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

