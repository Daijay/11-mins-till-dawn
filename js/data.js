/* Game data: weapons, enemy types, wave order, upgrade list. */
const WEAPONS={
  sniper:{name:'Laser Rifle',rate:.8,dmg:70,count:1,step:.1,jit:0,speed:0,life:0,beam:true,desc:'Sniper beam. Huge damage, pierces everything in a line.'},
  flame:{name:'Flamethrower',rate:16,dmg:3.4,count:1,step:.1,jit:.32,speed:340,life:.36,pierce:99,col:'#ff9a3c',sz:6,fade:true,desc:'Short stream that burns through crowds.'},
  rifle:{name:'Rifle',rate:7,dmg:6.5,count:1,step:.1,jit:.1,speed:640,life:.85,desc:'Steady rapid fire. Upgrade it into a minigun for a wide, charging spray.'},
  boom:{name:'Boomerang',rate:1.2,dmg:24,count:1,step:.3,jit:0,speed:440,life:0,reach:270,sz:13,col:'#ffd166',boom:true,desc:'Disc flies out and returns, cutting enemies both ways. Scales with size, reach and auto throw.'}
};
const TYPES={
  grunt:{r:10,hp:22,spd:58,dmg:8,xp:1,col:'#ff4d6d'},
  runner:{r:7,hp:11,spd:112,dmg:6,xp:1,col:'#ff9a3c'},
  splitter:{r:14,hp:55,spd:60,dmg:10,xp:3,col:'#b57bff'},
  brute:{r:20,hp:150,spd:42,dmg:20,xp:8,col:'#ff2e63',kr:.6},
  spitter:{r:9,hp:26,spd:52,dmg:9,xp:3,col:'#c8ff3d'},
  charger:{r:12,hp:42,spd:68,dmg:14,xp:3,col:'#ffcc33'},
  shielder:{r:14,hp:90,spd:50,dmg:12,xp:4,col:'#6f8cff'},
  bomber:{r:10,hp:18,spd:88,dmg:20,xp:2,col:'#ff5b2e'},
  blinker:{r:9,hp:34,spd:70,dmg:10,xp:3,col:'#cfd8ff'},
  mender:{r:11,hp:60,spd:46,dmg:8,xp:5,col:'#e8fff5'},
  boss:{r:62,hp:3500,spd:30,dmg:30,xp:60,col:'#c9184a',kr:.1},
  super:{r:130,hp:34000,spd:26,dmg:40,xp:300,col:'#7a1fa2',kr:0,fixed:true}
};
const WAVE_TYPES=['grunt','runner','grunt','spitter','splitter','charger','shielder','runner','bomber','brute','blinker','charger','spitter','shielder','bomber','brute'];
const LABEL={grunt:'Grunts',runner:'Runners',splitter:'Splitters',brute:'Brutes',spitter:'Spitters',charger:'Chargers',shielder:'Shielders',bomber:'Bombers',blinker:'Blinkers',mender:'Menders',boss:'Boss'};
const SKILLS=[
  {id:'rate',name:'Rapid Fire',max:6,desc:'+25% fire rate. Laser Rifle: also makes the beam linger and keep cutting, and at level 4 becomes an always-on plasma laser (0.1s hits, more dps than the normal beam)',fn:p=>{p.rateMul*=1.25;if(p.bm){p.glow++;if(p.glow>=4)p.plasma=true;}}},
  {id:'dmg',name:'Heavy Rounds',max:6,desc:'+30% damage',fn:p=>p.dmgMul*=1.3},
  {id:'multi',name:'Extra Barrel',max:4,desc:'+1 projectile per shot',fn:p=>p.count++},
  {id:'pierce',name:'Piercing',max:4,desc:'Bullets pass through +1 enemy',fn:p=>p.pierce++},
  {id:'speed',name:'Quick Boots',max:5,desc:'+12% move speed',fn:p=>p.speed*=1.12},
  {id:'hp',name:'Vitality',max:5,desc:'+35 max HP and heal 35',fn:p=>{p.maxHp+=35;p.hp=Math.min(p.maxHp,p.hp+35)}},
  {id:'magnet',name:'Magnet',max:4,desc:'+50% pickup range',fn:p=>p.magnet*=1.5},
  {id:'regen',name:'Regeneration',max:4,desc:'+0.9 HP per second',fn:p=>p.regen+=0.9},
  {id:'blades',name:'Orbit Blades',max:6,desc:'Add a big blade. Wider orbit, faster spin, more damage',fn:p=>p.blades++},
  {id:'lodge',name:'Lodged Rounds',only:['rifle'],max:3,desc:'Shells stay in the enemy they hit, then fly back to you through everything. Recalls every 20 shots (15, then 10). Returning shells give a little xp',fn:p=>p.lodge++},
  {id:'mini',name:'Minigun Conversion',only:['rifle'],max:1,desc:'Rifle becomes a minigun: much wider spray, charges up slowly, far higher fire rate at full charge',fn:p=>{p.mini=true;p.rampT=2.6;}},
  {id:'spin',name:'Faster Spin-Up',only:['rifle'],need:'mini',max:3,desc:'Minigun reaches full charge sooner',fn:p=>p.rampT*=.7},
  {id:'amp',name:'Armor Piercer',only:['sniper'],max:3,desc:'Beam gains +10% damage for every enemy it passes through',fn:p=>p.amp+=.1},
  {id:'burn',name:'Scorch',only:['flame'],max:3,desc:'Flames set enemies on fire. They keep burning after you stop',fn:p=>p.burn++},
  {id:'size',name:'Bigger Shots',only:['sniper','flame','boom'],max:4,desc:'Laser: thicker beam. Flamethrower: bigger flames. Boomerang: bigger disc. All hit a wider area',fn:p=>{p.beamW+=6;p.sizeMul*=1.35}},
  {id:'reach',name:'Long Range',only:['flame','boom'],max:4,desc:'Flamethrower: +30% flame range. Boomerang: +25% throw distance',fn:p=>{p.rangeMul*=1.3;p.reachMul*=1.25}},
  {id:'auto',name:'Auto Throw',only:['boom'],max:1,desc:'Throws discs on its own at the nearest enemy',fn:p=>p.auto=true},
  {id:'nova',name:'Shockwave',max:5,desc:'Right click (or E / Space) to fire a pulse that damages and shoves enemies. Glows when ready',fn:p=>{p.nova++;if(p.nova===1)p.novaCd=0;}}
];
const HEAL={id:'heal',name:'Second Wind',max:99,desc:'Restore 40 HP',fn:p=>{p.hp=Math.min(p.maxHp,p.hp+40)}};

