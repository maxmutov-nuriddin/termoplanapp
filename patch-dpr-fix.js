const fs = require('fs');
const file = '/Applications/Project/AllProjects/TermoPlan/termoplanapp/src/components/canvas/RoomCanvas3D.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  "<Canvas shadows dpr={[1, 1.5]} gl={{ powerPreference: 'high-performance', antialias: true }}>",
  "<Canvas shadows gl={{ antialias: false }}>"
);

fs.writeFileSync(file, code);
console.log('Fixed Canvas props');
