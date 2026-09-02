const fs = require('fs');
const file = '/Applications/Project/AllProjects/TermoPlan/termoplanapp/src/components/canvas/RoomCanvas2D.tsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Import DraggableElementsRenderer
code = code.replace(
  "import { AirflowConeRenderer } from './AirflowConeRenderer';",
  "import { AirflowConeRenderer } from './AirflowConeRenderer';\nimport { DraggableElementsRenderer } from './DraggableElementsRenderer';"
);

// 2. Remove destructuring
code = code.replace(/    windows,\n    doors,\n    furniture,\n    boilerPosition,\n    manifoldPosition,\n    acPosition,\n/g, '');
code = code.replace(/    heatingExcludedZones,\n/g, '');

// 3. Replace inline renders with DraggableElementsRenderer
// First, find where heatingExcludedZones starts (line 630 approx) up to Kotyol
// Wait, it's safer to use regex to strip out the inline renders.

// Let's replace the props in HeatingPipeRenderer and AirflowConeRenderer
code = code.replace(/doors=\{doors \|\| \[\]\}/g, 'doors={useCanvasStore.getState().doors || []}');
code = code.replace(/windows=\{windows \|\| \[\]\}/g, 'windows={useCanvasStore.getState().windows || []}');
code = code.replace(/furniture=\{furniture \|\| \[\]\}/g, 'furniture={useCanvasStore.getState().furniture || []}');
code = code.replace(/excludedZones=\{heatingExcludedZones \|\| \[\]\}/g, 'excludedZones={useCanvasStore.getState().heatingExcludedZones || []}');
code = code.replace(/manifoldPos=\{manifoldPosition \|\| undefined\}/g, 'manifoldPos={useCanvasStore.getState().manifoldPosition || undefined}');
code = code.replace(/boilerPos=\{boilerPosition\}/g, 'boilerPos={useCanvasStore.getState().boilerPosition}');
code = code.replace(/acPos=\{acPosition \|\| \{ x: 1\.2, y: 0\.5, targetAngle: 75 \}\}/g, 'acPos={useCanvasStore.getState().acPosition || { x: 1.2, y: 0.5, targetAngle: 75 }}');

fs.writeFileSync(file, code);
console.log('RoomCanvas2D fast props replaced');
