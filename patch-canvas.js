const fs = require('fs');

// 1. Fix RoomCanvas2D.tsx
let f1 = '/Applications/Project/AllProjects/TermoPlan/termoplanapp/src/components/canvas/RoomCanvas2D.tsx';
let c1 = fs.readFileSync(f1, 'utf8');
c1 = c1.replace(
  'manifoldPos={manifoldPosition || { x: 0.8, y: 0.8 }}',
  'manifoldPos={manifoldPosition || null}'
);
fs.writeFileSync(f1, c1);

// 2. Fix HeatingPipeRenderer.tsx
let f2 = '/Applications/Project/AllProjects/TermoPlan/termoplanapp/src/components/canvas/HeatingPipeRenderer.tsx';
let c2 = fs.readFileSync(f2, 'utf8');
c2 = c2.replace(
  'manifoldPos: IPoint;',
  'manifoldPos?: IPoint | null;'
);
c2 = c2.replace(
  'manifoldPos || { x: 1.0, y: 1.0 },',
  'manifoldPos || null,'
);
c2 = c2.replace(
  'manifoldPos || { x: 1.0, y: 1.0 }',
  'manifoldPos'
);
fs.writeFileSync(f2, c2);

// 3. Fix ConstructorScreen.tsx
let f3 = '/Applications/Project/AllProjects/TermoPlan/termoplanapp/src/screens/ConstructorScreen.tsx';
let c3 = fs.readFileSync(f3, 'utf8');
c3 = c3.replace(
  'manifoldPosition: manifoldPosition || undefined,',
  'manifoldPosition: manifoldPosition || null,'
);
fs.writeFileSync(f3, c3);

console.log('Fixed manifold defaults');
