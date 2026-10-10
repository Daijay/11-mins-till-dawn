/* Base Defence data. Every cost, HP, rate and range for the mode lives here. Ranges are in tiles, times in seconds. */
const BDD={
  grid:{tile:40,cols:28,rows:26},
  /* road: 6 tiles wide, centred, rows 0..len-1. Core sits at the bottom rows. */
  road:{cols:6,len:24},
  core:{w:3,h:3,hp:3000,col:12},   /* col = left tile of the core, row is rows-3 */
  eco:{start:200,income:3,incomeEvery:4,dropWaveScale:.06,gemLife:30,crateLife:30,sell:.65,repairFrac:.5,remnantFrac:.85},
  /* crystal drops per kill type */
  drops:{grunt:1,runner:1,splitter:2,spitter:3,charger:3,bomber:3,blinker:3,shielder:4,mender:4,brute:6,flyer:2,boss:150,super:0},
  energy:{max:100,regen:1.5,crate:20,crateChance:.04},
  upgrade:{levels:4,costs:[.6,.9,1.3,1.8],perLevel:.3,range:.1},
  wave:{build:25,buildPerWave:1.5,skipRate:.5,stream:30,streamPerWave:1,count:10,countPerWave:4,hpPerWave:.12,dmgPerWave:.05,tail:10,flyerBase:3,flyerPerWave:.5},
  unlock:{grunt:1,runner:2,splitter:3,flyer:4,spitter:4,brute:5,shielder:6,charger:7,bomber:8,blinker:9,mender:10},
  /* ground enemy AI, in tiles */
  ai:{engage:3,leash:5,hitEvery:.8,roadMargin:2},
  /* per-type enemy overrides for this mode (stats not listed use TYPES in data.js) */
  flyer:{r:9,hp:60,spd:105,dmg:10,col:'#7fffd4'},
  /* walls and traps, road only. depth = rows in a full wall. hold = seconds the Sovereign needs per row */
  walls:{
    wood:{name:'Wood wall',cost:5,hp:120,depth:2,col:'#8b5a2b',hold:0},
    stone:{name:'Stone wall',cost:12,hp:450,depth:2,col:'#8a93a6',hold:0},
    iron:{name:'Iron wall',cost:30,hp:1000,depth:2,col:'#b8c4d6',hold:1},
    crystal:{name:'Crystal wall',cost:55,hp:1800,depth:3,col:'#7dd3ff',hold:2,reflect:.12},
    obsidian:{name:'Obsidian wall',cost:0,hp:2000,depth:3,col:'#3a2a5a',hold:2.2,skillOnly:true},
    spikeWood:{name:'Wooden spikes',cost:8,hp:60,col:'#a47b4a',dps:6,hits:['runner','bomber','blinker'],noRemnant:true,noRepair:true},
    spikeIron:{name:'Iron spikes',cost:22,hp:250,col:'#c9d2e0',dps:14,hits:['runner','bomber','blinker']}
  },
  fullWallDiscount:.05,
  /* turrets. hits: ground | air | both | support. ramp/reset only on the machine gun */
  turrets:{
    pistol:{up:'rate',name:'Pistol turret',w:1,h:1,hits:'ground',cost:15,hp:150,range:6,dmg:6,rate:2,col:'#9fb4d8'},
    mg:{up:'rate',name:'Machine Gun',w:2,h:2,hits:'ground',cost:60,hp:260,range:7,dmg:5,rate:3,rateMax:12,ramp:4,reset:1.5,col:'#ffd166'},
    flame:{up:'dmg',name:'Flame turret',w:2,h:2,hits:'ground',cost:70,hp:280,range:3.5,dps:70,cone:.5,burn:2.5,col:'#ff7a2e'},
    laser:{up:'dmg',name:'Laser turret',w:2,h:2,hits:'ground',cost:110,hp:260,range:9,dmg:90,every:1.4,col:'#ff4d6d'},
    freeze:{up:'dmg',name:'Freeze turret',w:2,h:2,hits:'ground',cost:60,hp:250,range:4,dps:6,slow:.4,slowFor:2,col:'#8fe9ff'},
    tesla:{up:'rate',name:'Tesla coil',w:2,h:2,hits:'ground',cost:130,hp:300,range:5,dmg:35,chain:3,falloff:.7,rate:1.1,col:'#b57bff'},
    sniper:{up:'dmg',name:'Sniper tower',w:2,h:2,hits:'ground',cost:150,hp:220,range:14,dmg:220,every:2.2,target:'highestHp',col:'#e8f7ff'},
    missile:{up:'rate',name:'Missile battery',w:3,h:2,hits:'both',cost:170,hp:300,range:9,missiles:4,dmg:25,every:2.6,splash:.9,col:'#ff9a3c'},
    acid:{up:'dmg',name:'Acid sprayer',w:2,h:2,hits:'ground',cost:90,hp:260,range:6,puddle:3,puddleFor:6,dps:20,every:5,col:'#c8ff3d'},
    flak:{up:'rate',name:'Flak',w:1,h:1,hits:'air',cost:90,hp:180,range:8,dmg:12,rate:4,splash:.8,col:'#ffe29a'},
    seeker:{up:'rate',name:'Seeker Missiles',w:2,h:2,hits:'air',cost:120,hp:260,range:11,missiles:2,dmg:30,every:1.6,col:'#7fffd4'},
    spikeTrap:{up:'dmg',name:'Spike trap',w:2,h:2,hits:'ground',cost:25,hp:150,dps:18,roadOnly:true,col:'#d9dde8'},
    repair:{up:'dmg',name:'Repair Station',w:2,h:2,hits:'support',cost:120,hp:200,heal:12,col:'#5dffa0'}
  },
  cable:{cost:1},
  /* energy skills. Select in the hotbar, then use the mouse */
  skills:{
    shockwave:{name:'Shockwave',energy:35,dmg:30,radius:5,push:520,sovPush:1.2},
    overcharge:{name:'Overcharge',energy:38,rateMul:1.4,time:7.3,hpLoss:.3},
    mend:{name:'Mend Pulse',energy:25,radius:3.5,heal:.4,reach:8},
    barrage:{name:'Rocket Barrage',energy:40,rockets:25,dmg:60,blast:1.2},
    obsidian:{name:'Obsidian Wall',energy:20,tiles:3}
  },
  boss:{
    colossus:{every:5,hp:6000,hpPerWave:.12,drop:150},
    sovereign:{hp:40000,r:150,speed:14,crush:1,coreBreak:3,armour:[{below:20,cut:.5},{below:1e9,cut:.15}]},
    timedSpawnAt:590,
    endlessSovereignWave:20
  },
  death:{respawn:7,xpDrop:.5,crystalDrop:.15,levelsLost:2},
  best:'bd_best'
};
/* helpers */
const BDT=BDD.grid.tile;
const BDW=BDD.grid.cols*BDT,BDH=BDD.grid.rows*BDT;
const BD_ROAD_C0=(BDD.grid.cols-BDD.road.cols)/2,BD_ROAD_C1=BD_ROAD_C0+BDD.road.cols-1;
const BD_CORE_R=BDD.grid.rows-BDD.core.h;
