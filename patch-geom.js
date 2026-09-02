const fs = require('fs');
let f = '/Applications/Project/AllProjects/TermoPlan/termoplanapp/src/utils/geometry.ts';
let c = fs.readFileSync(f, 'utf8');

c = c.replace(
  'manifoldPos: IPoint,',
  'manifoldPos?: IPoint | null,'
);
// Inside generateRealisticFloorHeating, it passes manifoldPos to calculateMasterPlumberPlan, which accepts optional.
fs.writeFileSync(f, c);
