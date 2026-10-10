/* Extra Base Defence numbers for ground turrets. Extend BDD here, never hardcode in logic. Merged into bd-data.js at the final pass.
   Keys added to existing turret entries are visual or behaviour tuning; core numbers (dmg, rate, range, every...) stay in bd-data.js. */
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
