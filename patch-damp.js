const fs = require('fs');
const file = '/Applications/Project/AllProjects/TermoPlan/termoplanapp/src/components/canvas/RoomCanvas3D.tsx';
let code = fs.readFileSync(file, 'utf8');

// Increase damping factor from 6 to 25 for instant, snappy response
code = code.replace(/6, delta\);/g, '25, delta);');

// Let's also check if there's any state being set inside PanResponder that triggers React re-renders
// Wait, panResponder is inside useMemo, so it's not recreating.

fs.writeFileSync(file, code);
console.log('RoomCanvas3D damping optimized');
