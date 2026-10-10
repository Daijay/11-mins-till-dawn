/* Extra Base Defence numbers for the energy skills. Extends BDD.skills in place. Merged into bd-data.js at the final pass. */
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
