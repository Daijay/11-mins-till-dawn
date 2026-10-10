/* Extra Base Defence numbers for cables. Extend BDD here, never hardcode in logic. Merged into bd-data.js at the final pass. */
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
