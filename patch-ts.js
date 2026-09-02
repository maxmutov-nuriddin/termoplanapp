const fs = require('fs');

// 1. Fix HeatingPipeRenderer.tsx
let f2 = '/Applications/Project/AllProjects/TermoPlan/termoplanapp/src/components/canvas/HeatingPipeRenderer.tsx';
let c2 = fs.readFileSync(f2, 'utf8');
c2 = c2.replace(
  'manifoldPos || null,',
  'manifoldPos || undefined,'
);
fs.writeFileSync(f2, c2);

// 2. Fix ConstructorScreen.tsx
let f3 = '/Applications/Project/AllProjects/TermoPlan/termoplanapp/src/screens/ConstructorScreen.tsx';
let c3 = fs.readFileSync(f3, 'utf8');
c3 = c3.replace(
  'manifoldPosition: manifoldPosition || null,',
  'manifoldPosition: manifoldPosition || undefined,'
);
fs.writeFileSync(f3, c3);

// 3. Fix RoomCanvas2D.tsx
let f1 = '/Applications/Project/AllProjects/TermoPlan/termoplanapp/src/components/canvas/RoomCanvas2D.tsx';
let c1 = fs.readFileSync(f1, 'utf8');
c1 = c1.replace(
  'manifoldPos={manifoldPosition || null}',
  'manifoldPos={manifoldPosition || undefined}'
);
fs.writeFileSync(f1, c1);
