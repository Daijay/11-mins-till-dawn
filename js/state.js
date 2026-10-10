/* Global run state G, input state, newGame(), xp curve. */
let G=null,CH=[],skip10=false;
const keys={},mouse={x:W/2+80,y:H/2,down:false};

function mkPlayer(w){
  return {x:0,y:0,hp:100,maxHp:100,speed:175,r:11,iframes:0,aim:0,cd:0,rateMul:1,dmgMul:1,count:w.count,pierce:w.pierce||0,held:0,magnet:75,regen:0,blades:0,nova:0,bladeAng:0,novaCd:0,novaMax:4,wantNova:false,rangeMul:1,sizeMul:1,reachMul:1,rampT:1.8,lodge:0,lodgeShots:0,auto:false,mini:false,burn:0,amp:0,beamW:0,glow:0,bm:!!w.beam,plasma:false,pt:0,pc:0,inv:0,buffs:{rate:0,speed:0}};
}
/* Camera. Survive keeps the player centred. Base Defence scrolls vertically only (the map is as wide as the screen). */
function camX(){return G.bd?W/2:G.p.x;}
function camY(){return G.bd?clamp(G.p.y,H/2,BDH-H/2):G.p.y;}
function pScrX(){return G.bd?W/2+G.p.x-camX():W/2;}
function pScrY(){return G.bd?H/2+G.p.y-camY():H/2;}
function newGame(wk,skip){
  const w=WEAPONS[wk];
  G={t:0,w,wk,level:1,xp:0,kills:0,spawnAcc:0,wave:0,nextWave:30,pending:0,
    p:mkPlayer(w),
    lv:{},E:[],EB:[],BM:[],SH:[],PU:[],B:[],Gm:[],P:[],R:[],state:'play',shake:0,banner:null,id:0};
  if(skip){
    G.t=590;G.nextWave=600;G.b1=1;G.b2=1;G.level=29;
    SKILLS.forEach(s=>{
      const n=skip.lv[s.id]||0;
      for(let i=0;i<n;i++){G.lv[s.id]=(G.lv[s.id]||0)+1;s.fn(G.p);G.p.maxHp=Math.round(G.p.maxHp*1.04);}
    });
    G.p.hp=G.p.maxHp;
  }
}
function idleState(){newGame('sniper');G.state='menu';}
const XPT=[4,9,18,30,42];const xpNext=l=>l<=5?XPT[l-1]:Math.round((8+10*l)*Math.pow(1.12,l-5));

