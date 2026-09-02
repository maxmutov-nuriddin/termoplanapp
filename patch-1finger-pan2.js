const fs = require('fs');
const file = '/Applications/Project/AllProjects/TermoPlan/termoplanapp/src/components/canvas/RoomCanvas3D.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(/panX\.current = lastPan\.current\.x - gestureState\.dx \* 0\.05;/g, 'panX.current = lastPan.current.x + gestureState.dx * 0.05;');
code = code.replace(/panZ\.current = lastPan\.current\.z - gestureState\.dy \* 0\.05;/g, 'panZ.current = lastPan.current.z + gestureState.dy * 0.05;');

fs.writeFileSync(file, code);
console.log('Fixed pan direction');
