/* draw(): world, enemies, projectiles, lighting, vignette. */
/* ---------- drawing ---------- */
function draw(){
  const p=G.p,pr=clamp((G.bd?G.bd.clock:G.t)/DUR,0,1),CX=camX(),CY=camY(),PX=pScrX(),PY=pScrY(),sx=x=>x-CX+W/2,sy=y=>y-CY+H/2;
  ctx.save();
  if(G.shake>0)ctx.translate(rand(-G.shake,G.shake),rand(-G.shake,G.shake));
  // ground
  ctx.fillStyle='#444d5c';ctx.fillRect(-20,-20,W+40,H+40);
  const mp=[];
  {
    const ax=Math.floor(-md(CX,512)),ay=Math.floor(-md(CY,512));
    for(let x=ax-512;x<W+20;x+=512)for(let y=ay-512;y<H+20;y+=512)ctx.drawImage(TA,x,y);
    const bx=Math.floor(-md(CX+300,1024)),by=Math.floor(-md(CY+170,1024));
    for(let x=bx-1024;x<W+20;x+=1024)for(let y=by-1024;y<H+20;y+=1024){
      ctx.drawImage(TB,x,y);
      for(const m of MUSH){const mx=x+m.x,my=y+m.y;if(mx>-40&&mx<W+40&&my>-40&&my<H+40)mp.push([mx,my,m.ph]);}
    }
  }
  if(G.bd)bdDrawGround(sx,sy);
  // time of day tint
  const sc=skyCol(pr);
  ctx.fillStyle='rgba('+sc[0]+','+sc[1]+','+sc[2]+','+lerp(.5,.08,Math.pow(pr,1.3))+')';ctx.fillRect(-20,-20,W+40,H+40);
  // sun + dawn light
  const e=Math.pow(pr,2.2),sunY=lerp(-70,64,e);
  let g=ctx.createLinearGradient(0,0,0,90+260*pr);
  g.addColorStop(0,'rgba(255,150,90,'+(.04+.45*pr)+')');g.addColorStop(1,'rgba(255,150,90,0)');
  ctx.fillStyle=g;ctx.fillRect(-20,-20,W+40,110+260*pr);
  g=ctx.createRadialGradient(W/2,sunY,10,W/2,sunY,120+380*pr);
  g.addColorStop(0,'rgba(255,200,120,'+(.1+.5*pr)+')');g.addColorStop(1,'rgba(255,200,120,0)');
  ctx.fillStyle=g;ctx.fillRect(-20,-20,W+40,H+40);
  ctx.fillStyle='#ffe2a8';ctx.beginPath();ctx.arc(W/2,sunY,46,0,6.283);ctx.fill();
  ctx.globalCompositeOperation='lighter';
  const ra=.01+.075*Math.pow(pr,1.4);
  for(let k=0;k<9;k++){
    const an=1.5708+(k-4)*.19+Math.sin(G.t*.2+k*1.7)*.04,wd=.03+.018*Math.sin(G.t*.3+k);
    const lg=ctx.createLinearGradient(W/2,sunY,W/2+Math.cos(an)*1000,sunY+Math.sin(an)*1000);
    lg.addColorStop(0,'rgba(255,205,140,'+ra+')');lg.addColorStop(1,'rgba(255,205,140,0)');
    ctx.fillStyle=lg;ctx.beginPath();ctx.moveTo(W/2,sunY);ctx.lineTo(W/2+Math.cos(an-wd)*1200,sunY+Math.sin(an-wd)*1200);ctx.lineTo(W/2+Math.cos(an+wd)*1200,sunY+Math.sin(an+wd)*1200);ctx.closePath();ctx.fill();
  }
  // lights on the ground
  for(const m of mp)gl(m[0],m[1],26,'#4fe3c8',(.5+.25*Math.sin(G.t*2+m[2]))*(1-pr*.8));
  gl(PX,PY,170,'#5be7ff',.15*(1-pr*.6));
  // drifting fog
  for(let k=0;k<7;k++){
    const fx0=md(k*397+G.t*(5+k*1.3)-CX*.55,1500)-290,fy0=md(k*233+Math.sin(G.t*.1+k)*40-CY*.55,1100)-250,fs=230+k*18;
    gl(fx0,fy0,fs,'#8fa6d4',.085*(1-pr));
    gl(fx0,fy0,fs,'#ffb98a',.06*pr*pr);
  }
  // floating motes
  const mc=pr<.6?'#8fd8ff':'#ffd9a0';
  for(const m of MO){
    const mx=md(m.x-CX*m.z-G.t*3*m.z,W+100)-50,my=md(m.y-CY*m.z-G.t*(6+m.z*8),H+100)-50;
    gl(mx,my,m.s*4.5,mc,(.2+.35*(.5+.5*Math.sin(G.t*2+m.ph)))*m.z+.1);
  }
  ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;
  // gems
  for(const q of G.Gm){
    const x=sx(q.x),y=sy(q.y);if(x<-10||x>W+10||y<-10||y>H+10)continue;
    {const gc=q.v>=6?'#ffd166':q.v>=3?'#7dd3ff':'#7dffb2';ctx.globalCompositeOperation='lighter';gl(x,y,q.r*3.6,gc,.4+.15*Math.sin(G.t*5+q.x));ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;}
    ctx.fillStyle=q.v>=6?'#ffd166':q.v>=3?'#7dd3ff':'#7dffb2';ctx.strokeStyle='#08142a';ctx.lineWidth=1.5;
    ctx.beginPath();ctx.moveTo(x,y-q.r);ctx.lineTo(x+q.r,y);ctx.lineTo(x,y+q.r);ctx.lineTo(x-q.r,y);ctx.closePath();ctx.fill();ctx.stroke();
  }
  // power-up drops
  for(const u of G.PU){
    const x=sx(u.x),by=sy(u.y)+Math.sin(G.t*4+u.x)*2;
    if(x<-20||x>W+20||by<-20||by>H+20)continue;
    if(u.life<4&&Math.floor(G.t*8)%2===0)continue;
    const col=u.t==='heal'?'#ff5d73':u.t==='rate'?'#ffb020':u.t==='gold'?'#ffd23d':'#4dd8ff';
    ctx.globalCompositeOperation='lighter';gl(x,by,30,col,.35+.15*Math.sin(G.t*6));ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;
    ctx.fillStyle='rgba(5,8,25,.6)';ctx.beginPath();ctx.arc(x,by,14,0,6.283);ctx.fill();
    ctx.strokeStyle=col;ctx.lineWidth=3;ctx.beginPath();ctx.arc(x,by,12,0,6.283);ctx.stroke();
    ctx.fillStyle=col;
    if(u.t==='heal'){ctx.fillRect(x-2,by-7,4,14);ctx.fillRect(x-7,by-2,14,4);}
    else if(u.t==='rate'){ctx.beginPath();ctx.moveTo(x+2,by-8);ctx.lineTo(x-5,by+1);ctx.lineTo(x-.5,by+1);ctx.lineTo(x-2,by+8);ctx.lineTo(x+5,by-2);ctx.lineTo(x+.5,by-2);ctx.closePath();ctx.fill();}
    else if(u.t==='gold'){ctx.beginPath();ctx.arc(x,by,6,0,6.283);ctx.fill();}
    else{for(const o of [-4,3]){ctx.beginPath();ctx.moveTo(x+o-3,by-6);ctx.lineTo(x+o+3,by);ctx.lineTo(x+o-3,by+6);ctx.lineTo(x+o-5,by+6);ctx.lineTo(x+o+1,by);ctx.lineTo(x+o-5,by-6);ctx.closePath();ctx.fill();}}
  }
  // rings
  for(const r of G.R){
    const ka=clamp(1-r.t/(r.life+.12),0,1);
    ctx.strokeStyle='rgba('+(r.rgb||'120,230,255')+','+ka*.22+')';ctx.lineWidth=14;
    ctx.beginPath();ctx.arc(sx(r.x),sy(r.y),r.r,0,6.283);ctx.stroke();
    ctx.strokeStyle='rgba('+(r.rgb||'120,230,255')+','+ka*.9+')';ctx.lineWidth=4;
    ctx.beginPath();ctx.arc(sx(r.x),sy(r.y),r.r,0,6.283);ctx.stroke();
  }
  if(G.bd)bdDrawWorld(sx,sy);
  // shadows
  ctx.fillStyle='rgba(0,0,0,.3)';
  for(const n of G.E){const x=sx(n.x),y=sy(n.y);if(x<-80||x>W+80||y<-80||y>H+80)continue;ctx.beginPath();ctx.ellipse(x+3,y+n.r*.62,n.r*.98,n.r*.42,0,0,6.283);ctx.fill();}
  if(G.state!=='lose'){ctx.beginPath();ctx.ellipse(PX+3,PY+p.r*.7,p.r*1.05,p.r*.45,0,0,6.283);ctx.fill();}
  // enemies
  for(const n of G.E){
    const x=sx(n.x),y=sy(n.y),cm=n.r+30;if(x<-cm||x>W+cm||y<-cm||y>H+cm)continue;
    if(n.type==='boss'||n.type==='super'){ctx.globalCompositeOperation='lighter';gl(x,y,n.r*(n.type==='super'?3:2.6),n.col,.24+.08*Math.sin(G.t*3));ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;}
    ctx.fillStyle=(n.fl>0||(n.st==='wind'&&Math.floor(G.t*18)%2===0))?'#ffffff':n.col;ctx.strokeStyle=n.burn>0?'#ff7a00':n.fi?'#ff2a2a':'#14081c';ctx.lineWidth=(n.burn>0||n.fi)?3:2;
    ctx.beginPath();ctx.arc(x,y,n.r,0,6.283);ctx.fill();ctx.stroke();
    if(n.type==='brute'||n.type==='boss'){ctx.beginPath();ctx.arc(x,y,n.r*.6,0,6.283);ctx.stroke();}
    if(n.type==='splitter'){ctx.beginPath();ctx.moveTo(x-n.r*.6,y);ctx.lineTo(x+n.r*.6,y);ctx.stroke();}
    if(n.type==='spitter'){ctx.beginPath();ctx.arc(x,y,n.r*.45,0,6.283);ctx.stroke();}
    if(n.type==='charger'){const ca=n.st==='dash'?n.da:n.ang;ctx.fillStyle=n.col;ctx.beginPath();ctx.moveTo(x+Math.cos(ca)*n.r*1.7,y+Math.sin(ca)*n.r*1.7);ctx.lineTo(x+Math.cos(ca+2.2)*n.r,y+Math.sin(ca+2.2)*n.r);ctx.lineTo(x+Math.cos(ca-2.2)*n.r,y+Math.sin(ca-2.2)*n.r);ctx.closePath();ctx.fill();ctx.stroke();}
    if(n.type==='boss'||n.type==='super'){
      const sk=n.type==='super'?16:10;
      ctx.fillStyle=n.col;ctx.strokeStyle='#14081c';ctx.lineWidth=3;
      for(let i=0;i<sk;i++){
        const a=i/sk*6.283+G.t*.3,r0=n.r*.92,r1=n.r*1.22;
        ctx.beginPath();ctx.moveTo(x+Math.cos(a-.12)*r0,y+Math.sin(a-.12)*r0);ctx.lineTo(x+Math.cos(a)*r1,y+Math.sin(a)*r1);ctx.lineTo(x+Math.cos(a+.12)*r0,y+Math.sin(a+.12)*r0);ctx.closePath();ctx.fill();ctx.stroke();
      }
    }
    if(n.type==='shielder'){const sa=n.sa===undefined?n.ang:n.sa;ctx.strokeStyle='#9fd6ff';ctx.lineWidth=5;ctx.beginPath();ctx.arc(x,y,n.r+5,sa-1.05,sa+1.05);ctx.stroke();}
    if(n.type==='mender'){ctx.strokeStyle='rgba(120,255,170,.25)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,140,0,6.283);ctx.stroke();ctx.fillStyle='#2ecf7a';ctx.fillRect(x-1.5,y-6,3,12);ctx.fillRect(x-6,y-1.5,12,3);}
    ctx.fillStyle='#14081c';
    const ex=Math.cos(n.ang)*n.r*.4,ey=Math.sin(n.ang)*n.r*.4,px=-Math.sin(n.ang)*n.r*.32,py=Math.cos(n.ang)*n.r*.32;
    ctx.beginPath();ctx.arc(x+ex+px,y+ey+py,Math.max(1.4,n.r*.2),0,6.283);ctx.arc(x+ex-px,y+ey-py,Math.max(1.4,n.r*.2),0,6.283);ctx.fill();
  }
  // electric fence
  if(G.fence){
    const f=G.fence,cx=sx(f.cx),cy=sy(f.cy),R=f.R;
    ctx.fillStyle='rgba(10,0,30,.45)';ctx.beginPath();ctx.rect(-50,-50,W+100,H+100);ctx.arc(cx,cy,R,0,6.283,true);ctx.fill('evenodd');
    ctx.strokeStyle='rgba(120,230,255,.1)';ctx.lineWidth=40;ctx.beginPath();ctx.arc(cx,cy,R-16,0,6.283);ctx.stroke();
    ctx.lineJoin='round';
    for(let pass=0;pass<2;pass++){
      ctx.beginPath();
      for(let i=0;i<=120;i++){
        const a=i/120*6.283,rr=R+(pass?4:9)*(Math.random()-.5)*2;
        const x=cx+Math.cos(a)*rr,y=cy+Math.sin(a)*rr;
        if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
      }
      ctx.strokeStyle=pass?'#ffffff':'rgba(120,230,255,.9)';ctx.lineWidth=pass?2:5;ctx.stroke();
    }
    for(let i=0;i<24;i++){
      const a=i/24*6.283,x=cx+Math.cos(a)*R,y=cy+Math.sin(a)*R;
      ctx.fillStyle='#14081c';ctx.strokeStyle='#7df9ff';ctx.lineWidth=3;
      ctx.beginPath();ctx.arc(x,y,9,0,6.283);ctx.fill();ctx.stroke();
      ctx.fillStyle='#ffffff';ctx.beginPath();ctx.arc(x,y,3,0,6.283);ctx.fill();
      if(Math.random()<.35){ctx.strokeStyle='rgba(200,250,255,.85)';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(x,y);let qx=x,qy=y;for(let k=0;k<4;k++){qx+=Math.cos(a+3.1416)*8+rand(-7,7);qy+=Math.sin(a+3.1416)*8+rand(-7,7);ctx.lineTo(qx,qy);}ctx.stroke();}
    }
  }
  // lodged shells
  for(const s of G.SH){
    const x=sx(s.x),y=sy(s.y);if(x<-10||x>W+10||y<-10||y>H+10)continue;
    ctx.fillStyle=s.ret?'#ffffff':'#ffd166';ctx.strokeStyle='#14081c';ctx.lineWidth=1.5;
    ctx.beginPath();ctx.arc(x,y,s.ret?4:3,0,6.283);ctx.fill();ctx.stroke();
  }
  // plasma laser
  if(p.plasma&&G.state!=='lose'){
    const x0=PX+Math.cos(p.aim)*16,y0=PY+Math.sin(p.aim)*16,x1=PX+Math.cos(p.aim)*950,y1=PY+Math.sin(p.aim)*950,pu=.5+.5*Math.sin(G.t*20);
    ctx.lineCap='round';
    ctx.globalCompositeOperation='lighter';ctx.strokeStyle='rgba(255,40,70,.12)';ctx.lineWidth=40+p.beamW+pu*6;ctx.beginPath();ctx.moveTo(x0,y0);ctx.lineTo(x1,y1);ctx.stroke();ctx.globalCompositeOperation='source-over';
    ctx.strokeStyle='rgba(255,40,70,.35)';ctx.lineWidth=16+p.beamW+pu*4;ctx.beginPath();ctx.moveTo(x0,y0);ctx.lineTo(x1,y1);ctx.stroke();
    ctx.strokeStyle='#ff2a4d';ctx.lineWidth=7+p.beamW*.5;ctx.stroke();
    ctx.strokeStyle='#ffd0d8';ctx.lineWidth=2.5;ctx.stroke();
  }
  // laser beams
  for(const m of G.BM){
    const bx0=sx(m.ox),by0=sy(m.oy),k=m.life/m.max,x0=bx0+Math.cos(m.a)*16,y0=by0+Math.sin(m.a)*16,x1=bx0+Math.cos(m.a)*m.len,y1=by0+Math.sin(m.a)*m.len;
    ctx.globalAlpha=clamp(k*1.6,0,1);ctx.lineCap='round';
    ctx.globalCompositeOperation='lighter';ctx.strokeStyle='rgba(60,200,255,.09)';ctx.lineWidth=16+10*k+(m.w||0);ctx.beginPath();ctx.moveTo(x0,y0);ctx.lineTo(x1,y1);ctx.stroke();ctx.globalCompositeOperation='source-over';
    ctx.strokeStyle='#7df9ff';ctx.lineWidth=3+8*k+(m.w||0)*.8;ctx.beginPath();ctx.moveTo(x0,y0);ctx.lineTo(x1,y1);ctx.stroke();
    ctx.strokeStyle='#ffffff';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x0,y0);ctx.lineTo(x1,y1);ctx.stroke();
    ctx.globalAlpha=1;
  }
  // enemy shots
  for(const b of G.EB){const x=sx(b.x),y=sy(b.y);ctx.globalCompositeOperation='lighter';gl(x,y,17,'#ff5ad1',.5);ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;ctx.fillStyle='#ff5ad1';ctx.strokeStyle='#14081c';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,6,0,6.283);ctx.fill();ctx.stroke();}
  // blades
  if(p.blades>0){
    const rad=70+p.blades*4;
    ctx.strokeStyle='rgba(255,255,255,.18)';ctx.lineWidth=1;ctx.beginPath();ctx.arc(PX,PY,rad,0,6.283);ctx.stroke();
    for(let k=0;k<p.blades;k++){
      const a=p.bladeAng+k*6.283/p.blades,bx=PX+Math.cos(a)*rad,by=PY+Math.sin(a)*rad;
      ctx.fillStyle='#e8f7ff';ctx.strokeStyle='#06122e';ctx.lineWidth=2;
      ctx.beginPath();ctx.moveTo(bx+Math.cos(a+1.57)*17,by+Math.sin(a+1.57)*17);ctx.lineTo(bx+Math.cos(a)*11,by+Math.sin(a)*11);ctx.lineTo(bx+Math.cos(a-1.57)*17,by+Math.sin(a-1.57)*17);ctx.lineTo(bx-Math.cos(a)*11,by-Math.sin(a)*11);ctx.closePath();ctx.fill();ctx.stroke();
    }
  }
  // bullets
  for(const b of G.B){
    const x=sx(b.x),y=sy(b.y);if(x<-10||x>W+10||y<-10||y>H+10)continue;
    if(b.boom){
      ctx.globalCompositeOperation='lighter';gl(x,y,b.sz*2.4,'#ffd166',.4);ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;
      ctx.save();ctx.translate(x,y);ctx.rotate(b.rot);
      ctx.fillStyle='rgba(255,214,102,.3)';ctx.strokeStyle='#14081c';ctx.lineWidth=2;
      ctx.beginPath();ctx.arc(0,0,b.sz,0,6.283);ctx.fill();
      ctx.fillStyle='#ffd166';
      for(let i=0;i<4;i++){ctx.rotate(1.5708);ctx.beginPath();ctx.moveTo(b.sz,0);ctx.lineTo(b.sz*.3,b.sz*.38);ctx.lineTo(0,0);ctx.closePath();ctx.fill();ctx.stroke();}
      ctx.restore();continue;
    }
    const fr=clamp(b.life/b.max,0,1);
    if(b.fade){
      ctx.globalCompositeOperation='lighter';
      gl(x,y,b.sz*(2.4+(1-fr)*2.2),fr>.66?'#fff0b0':fr>.33?'#ff9a2e':'#c8341c',fr*.75);
      ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;continue;
    }
    ctx.globalCompositeOperation='lighter';gl(x,y,b.sz*4,b.rc?'#9aa0a8':b.col,.4);ctx.globalCompositeOperation='source-over';
    if(!b.rc){ctx.globalAlpha=.4;ctx.strokeStyle=b.col;ctx.lineWidth=b.sz*1.5;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-b.vx*.028,y-b.vy*.028);ctx.stroke();}
    ctx.globalAlpha=b.fade?fr*.9:1;
    ctx.fillStyle=b.col;ctx.strokeStyle='#0b1030';ctx.lineWidth=1.5;
    if(b.rc){ctx.save();ctx.translate(x,y);ctx.rotate(Math.atan2(b.vy,b.vx));ctx.beginPath();ctx.ellipse(0,0,b.sz*.55,b.sz*.95,0,0,6.283);ctx.fill();ctx.stroke();ctx.restore();}
    else{    ctx.beginPath();ctx.arc(x,y,b.fade?b.sz*(1+(1-fr)*.8):b.sz,0,6.283);ctx.fill();if(!b.fade)ctx.stroke();}
    ctx.globalAlpha=1;
  }
  // player
  if(G.state!=='lose'&&!(G.bd&&G.bd.dead)){
    ctx.save();
    if(p.iframes>0&&Math.floor(G.t*20)%2===0)ctx.globalAlpha=.45;
    if(p.inv>0&&(p.inv>1||Math.floor(G.t*10)%2===0)){
      ctx.strokeStyle='rgba(255,210,61,.95)';ctx.lineWidth=4;ctx.fillStyle='rgba(255,210,61,.18)';
      ctx.beginPath();ctx.arc(PX,PY,23,0,6.283);ctx.fill();ctx.stroke();
    }
    ctx.shadowColor='#5be7ff';ctx.shadowBlur=18;
    ctx.strokeStyle='#ffffff';ctx.lineWidth=4;ctx.lineCap='round';
    ctx.beginPath();ctx.moveTo(PX,PY);ctx.lineTo(PX+Math.cos(p.aim)*20,PY+Math.sin(p.aim)*20);ctx.stroke();
    ctx.fillStyle='#5be7ff';ctx.strokeStyle='#06122e';ctx.lineWidth=2;
    ctx.beginPath();ctx.arc(PX,PY,p.r,0,6.283);ctx.fill();ctx.shadowBlur=0;ctx.stroke();
    ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(PX,PY,4,0,6.283);ctx.fill();
    ctx.restore();
  }
  // shockwave ready ring
  if(p.nova>0&&p.novaCd<=0&&G.state==='play'){
    ctx.strokeStyle='rgba(120,230,255,'+(.55+.4*Math.sin(G.t*8))+')';ctx.lineWidth=3;
    ctx.beginPath();ctx.arc(PX,PY,24+2*Math.sin(G.t*8),0,6.283);ctx.stroke();
  }
  // muzzle flash
  if(G.mf>0&&G.state!=='lose'){
    ctx.globalCompositeOperation='lighter';
    gl(PX+Math.cos(p.aim)*24,PY+Math.sin(p.aim)*24,G.w.beam?44:G.wk==='flame'?30:24,G.w.beam?'#9ff4ff':G.wk==='flame'?'#ffb050':'#ffe9a8',G.mf/.07*.8);
    ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;
  }
  if(G.bd)bdDrawOverlay(sx,sy);
  // particles
  ctx.lineCap='round';
  for(const q of G.P){
    const k=clamp(q.life/q.max,0,1),qx=sx(q.x),qy=sy(q.y);
    ctx.globalAlpha=k;ctx.strokeStyle=q.col;ctx.lineWidth=q.sz*.85;
    ctx.beginPath();ctx.moveTo(qx,qy);ctx.lineTo(qx-q.vx*.03,qy-q.vy*.03);ctx.stroke();
  }
  ctx.globalAlpha=1;
  // vignette + low hp warning
  ctx.globalAlpha=lerp(1,.5,pr);ctx.drawImage(VG,-20,-20);
  if(G.fence){
    const fk=clamp((G.fence.R0-G.fence.R)/(G.fence.R0-G.fence.target),0,1);
    ctx.globalAlpha=Math.min(1,fk*1.1);ctx.drawImage(VR,-20,-20);
    ctx.globalAlpha=fk*.22;ctx.fillStyle='rgb(190,0,30)';ctx.fillRect(-20,-20,W+40,H+40);
  }
  const lh=p.hp/p.maxHp;
  if(lh<.4&&G.state!=='lose'){ctx.globalAlpha=(.4-lh)/.4*(.55+.45*Math.sin(G.t*6));ctx.drawImage(VR,-20,-20);}
  ctx.globalAlpha=1;
  ctx.restore();
  if(G.state!=='menu'){drawHud();if(G.bd)bdDrawHud();}
  // crosshair
  if(G.state==='play'||G.state==='paused'){
    ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.beginPath();ctx.arc(mouse.x,mouse.y,7,0,6.283);ctx.moveTo(mouse.x-12,mouse.y);ctx.lineTo(mouse.x-4,mouse.y);ctx.moveTo(mouse.x+12,mouse.y);ctx.lineTo(mouse.x+4,mouse.y);ctx.stroke();
  }
}

