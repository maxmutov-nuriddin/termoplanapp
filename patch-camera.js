const fs = require('fs');
const file = '/Applications/Project/AllProjects/TermoPlan/termoplanapp/src/components/canvas/RoomCanvas3D.tsx';
let code = fs.readFileSync(file, 'utf8');

// Fix camera position
code = code.replace(
  '<Canvas shadows camera={{ position: [centroid.x, 6, -centroid.y + 6], fov: 50 }}>',
  '<Canvas shadows camera={{ position: [0, 8, 12], fov: 55 }}>'
);

// Give full freedom to OrbitControls (no maxPolarAngle restriction)
code = code.replace(
  '<OrbitControls target={[0, 0, 0]} maxPolarAngle={Math.PI / 2 - 0.05} />',
  '<OrbitControls makeDefault target={[0, 0, 0]} enablePan={true} enableZoom={true} enableRotate={true} />'
);

fs.writeFileSync(file, code);
console.log('Patched Camera and OrbitControls');
