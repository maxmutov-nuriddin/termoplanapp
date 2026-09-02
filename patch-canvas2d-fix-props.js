const fs = require('fs');
const file = '/Applications/Project/AllProjects/TermoPlan/termoplanapp/src/components/canvas/RoomCanvas2D.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(/useCanvasStore\.getState\(\)\.doors=\{/g, 'doors={');
code = code.replace(/useCanvasStore\.getState\(\)\.windows=\{/g, 'windows={');
code = code.replace(/useCanvasStore\.getState\(\)\.furniture=\{/g, 'furniture={');

fs.writeFileSync(file, code);
console.log('Fixed prop names');
