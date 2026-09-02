const fs = require('fs');
const file = '/Applications/Project/AllProjects/TermoPlan/termoplanapp/src/components/canvas/RoomCanvas3D.tsx';
let code = fs.readFileSync(file, 'utf8');

// Add rotation to doors
code = code.replace(
  '<mesh key={\'d\'+idx} position={[door.position.x, 1.0, -door.position.y]} castShadow>',
  '<mesh key={\'d\'+idx} position={[door.position.x, 1.0, -door.position.y]} rotation={[0, -(door.rotation || 0), 0]} castShadow>'
);

// Add rotation to windows
code = code.replace(
  '<mesh key={\'wi\'+idx} position={[win.position.x, 1.5, -win.position.y]} castShadow>',
  '<mesh key={\'wi\'+idx} position={[win.position.x, 1.5, -win.position.y]} rotation={[0, -(win.rotation || 0), 0]} castShadow>'
);

// Add rotation to furniture
code = code.replace(
  '<mesh key={i} position={[item.position.x, 0.4, -item.position.y]} castShadow receiveShadow>',
  '<mesh key={i} position={[item.position.x, 0.4, -item.position.y]} rotation={[0, -(item.rotation || 0), 0]} castShadow receiveShadow>'
);

fs.writeFileSync(file, code);
console.log('Rotations patched');
