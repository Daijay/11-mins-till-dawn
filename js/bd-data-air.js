/* Extra Base Defence numbers for air. Extend BDD here, never hardcode in logic. Merged into bd-data.js at the final pass. */
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
