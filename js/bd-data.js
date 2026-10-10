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

/* ---- build bar and panel ---- */
BDD.ui={barW:160,barTop:122,rowH:22,tabH:22,panelW:200,fullWallIds:['wood','stone','iron','crystal']};

/* ---- ground turret effects ---- */
BDD.turrets.pistol.flash=.06;        /* muzzle flash seconds */
BDD.turrets.pistol.tracer=.08;       /* tracer line life, seconds */
BDD.turrets.pistol.tracerW=1.5;      /* tracer width px */

BDD.turrets.mg.flash=.05;
BDD.turrets.mg.tracer=.05;
BDD.turrets.mg.tracerW=1.2;

BDD.turrets.flame.flash=.05;
BDD.turrets.flame.burnDps=5;         /* burn damage per second once set alight (e.bd) */
BDD.turrets.flame.puffRate=30;       /* flame puffs spawned per second while firing */
BDD.turrets.flame.puffLife=.45;      /* seconds */
BDD.turrets.flame.puffSpeed=40;      /* px/s outward drift */
BDD.turrets.flame.puffSz=9;          /* glow half-size px before random spread */
BDD.turrets.flame.maxFx=400;         /* cap on live effects, puffs stop spawning past this */

BDD.turrets.laser.flash=.1;
BDD.turrets.laser.beamLife=.15;      /* beam fade time, seconds */
BDD.turrets.laser.beamW=4;           /* beam core width px */

BDD.turrets.freeze.pulseHz=1;        /* ring pulse cycles per second */
BDD.turrets.freeze.ringAlpha=.2;     /* peak ring opacity */
BDD.turrets.freeze.ringW=2;          /* ring line width px */

BDD.turrets.tesla.flash=.05;
BDD.turrets.tesla.jump=3;            /* max chain jump, tiles, from one hit to the next */
BDD.turrets.tesla.seg=.5;            /* bolt segment length, tiles */
BDD.turrets.tesla.jag=7;             /* bolt jitter px */
BDD.turrets.tesla.boltLife=.12;      /* seconds, fades quickly */
BDD.turrets.tesla.boltW=2.5;

BDD.turrets.sniper.flash=.12;
BDD.turrets.sniper.tracer=.25;       /* long tracer life, seconds */
BDD.turrets.sniper.tracerW=3;

BDD.turrets.acid.flash=.06;
BDD.turrets.acid.lobTime=.5;         /* flight time of the lob, seconds */
BDD.turrets.acid.lobArc=40;          /* lob height px */
BDD.turrets.acid.lobSize=5;          /* lob glow half-size px */
BDD.turrets.acid.fade=.6;            /* puddle fades over its last N seconds */
BDD.turrets.acid.alpha=.35;          /* puddle opacity */
BDD.turrets.acid.bubbles=6;
BDD.turrets.acid.bubbleR=2;          /* bubble radius px */
BDD.turrets.acid.bubbleRate=.6;      /* bubble rises per second */

/* ---- air turrets and missiles ---- */
/* air: shared effect and homing numbers. Times in seconds, distances in px unless named tiles. Per-turret damage, rate, range and splash stay in BDD.turrets. */
BDD.air={
  flashT:.1,            /* muzzle flash and tracer time after a shot */
  maxInFlight:150,      /* cap on homing missiles alive at once */
  smokeEvery:.05,       /* seconds between smoke puffs from a missile */
  boomRing:22,          /* minimum visual radius of an impact ring, px */
  ringMul:1.5,          /* impact ring radius = detonation radius * ringMul, when larger than boomRing */
  boomShake:1.5,        /* screen shake on impact */
  homing:{seekRange:14},/* tiles: a missile with no target looks for one this close */
  flak:{splashMul:.5,puff:6,puffSpd:140},  /* other flyers in the burst take this share of the shot's damage */
  seeker:{hitR:4,launch:170,spd:430,turn:6,life:3.2,spread:.35},  /* hitR: direct-hit radius px, launch: start speed px/s, spd: cruise px/s, turn: rad/s, life: s, spread: rad between missiles */
  missile:{hitR:4,launch:150,spd:360,turn:4.2,life:3.8,spread:.22}
};

/* ---- cables ---- */
/* BDD.cable.cost (crystals per tile) lives in bd-data.js. Everything else cable-related is here. */
Object.assign(BDD.cable,{
  col:'#5dffa0',        /* cable, ring and link colour */
  badCol:'#ff4d6d',     /* drag cursor once crystals ran out */
  recomputeEvery:.25,   /* seconds between network rebuilds (also rebuilt on any change) */
  breakFx:6,            /* particles when a ground enemy cuts a tile */
  lineW:3,              /* cable core line width, px */
  glowW:9,              /* cable glow line width, px */
  glowAlpha:.18,        /* cable glow alpha */
  dotR:3,               /* cable dot radius, px */
  ringR:9,              /* connection ring radius, px */
  ringW:2,              /* ring and drag cursor line width, px */
  linkAlpha:.3,         /* station to network link alpha */
  linkDash:[4,5]        /* station to network link dash pattern, px */
});

/* ---- energy skills ---- */
BDD.skills.shockwave.ringLife=.35;          /* s the push ring stays visible */
BDD.skills.overcharge.excludeTypes=['spikeTrap','repair'];   /* turret ids that do not lose HP to overcharge */
BDD.skills.mend.ringLife=.45;               /* s the green pulse ring lasts */
BDD.skills.barrage.stagger=1.5;             /* s over which all rockets are launched */
BDD.skills.barrage.fall=.5;                 /* s from launch to impact for one rocket */
BDD.skills.barrage.zoneMargin=3;            /* tiles beside the road the rockets may land on */
BDD.skills.barrage.rocketH=230;             /* px, visual height a rocket falls from */
BDD.skillFx={
  txtLife:.9,txtRise:36,txtFont:'bold 14px "Chakra Petch",sans-serif',
  cGood:'93,255,160',cBad:'255,120,120',cFire:'120,230,255',cRocket:'255,110,50',cObs:'181,123,255'
};

/* ---- Sovereign ---- */
/* Sovereign: speed back up the road while pushed by the Shockwave skill, px/s */
BDD.boss.sovereign.pushSpeed=90;
