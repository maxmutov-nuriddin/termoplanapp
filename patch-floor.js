const fs = require('fs');
const file = '/Applications/Project/AllProjects/TermoPlan/termoplanapp/src/components/canvas/RoomCanvas3D.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  's.moveTo(roomPoints[0].x, -roomPoints[0].y); // In 3D, we usually map 2D (x,y) to (x, -y) or (x, z)',
  's.moveTo(roomPoints[0].x, roomPoints[0].y); // +y because rotation by -90 on X will turn it into -y in 3D space'
);
code = code.replace(
  's.lineTo(roomPoints[i].x, -roomPoints[i].y);',
  's.lineTo(roomPoints[i].x, roomPoints[i].y);'
);
code = code.replace(
  's.lineTo(roomPoints[0].x, -roomPoints[0].y);',
  's.lineTo(roomPoints[0].x, roomPoints[0].y);'
);

fs.writeFileSync(file, code);
console.log('Floor geometry patched');
