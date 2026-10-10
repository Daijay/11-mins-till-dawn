/* Enemy spawning, spawn weights, pickups, super boss. */
function spawn(type,x,y){
  if(G.bd){bdSpawn(type,x,y);return;}
  const T=TYPES[type],m=T.fixed?1:1+G.t/(DUR/2.8);
  G.E.push({id:++G.id,type,x,y,r:T.r,hp:T.hp*m,max:T.hp*m,spd:T.spd*(1+G.t/1300),dmg:T.dmg*(1+G.t/800),xp:T.xp,col:T.col,kx:0,ky:0,bt:0,fl:0,ang:0,sh:rand(2.5,5),kr:T.kr===undefined?1:T.kr,sm:5,fu:0,tp:rand(2,4),cdT:rand(1.5,3),st:'',wt:0,dt:0,da:0});
}
function spawnEdge(type){const a=rand(0,6.283),d=rand(670,740);spawn(type,G.p.x+Math.cos(a)*d,G.p.y+Math.sin(a)*d);}
function spawnRing(type,n){for(let i=0;i<n;i++){const a=i/n*6.283+rand(-.1,.1),d=rand(670,720);spawn(type,G.p.x+Math.cos(a)*d,G.p.y+Math.sin(a)*d);}}
function pickType(){
  const t=G.t,opts=[['grunt',10]];
  if(t>25)opts.push(['runner',5+t/30]);
  if(t>80)opts.push(['splitter',3]);
  if(t>60&&G.E.filter(e=>e.type==='spitter').length<5)opts.push(['spitter',2]);
  if(t>110)opts.push(['charger',2.5]);
  if(t>100)opts.push(['shielder',2.5]);
  if(t>150)opts.push(['bomber',3]);
  if(t>200)opts.push(['blinker',2]);
  if(t>180&&G.E.filter(e=>e.type==='mender').length<4)opts.push(['mender',1.5]);
  if(t>140)opts.push(['brute',1.5+(t-140)/90]);
  let sum=0;opts.forEach(o=>sum+=o[1]);let r=Math.random()*sum;
  for(const o of opts){if((r-=o[1])<=0)return o[0];}
  return 'grunt';
}

function pickPU(){const r=Math.random()*100;return r<34?'heal':r<60?'rate':r<85?'speed':'gold';}
function spawnSuper(){
  const p=G.p,a=rand(0,6.283);
  spawn('super',p.x+Math.cos(a)*340,p.y+Math.sin(a)*340);
  G.fence={cx:p.x,cy:p.y,R:780,R0:780,target:120,rate:660/Math.max(10,DUR+14-G.t)};
  G.banner={text:'The Sovereign',sub:'Super boss',t:4};
}

