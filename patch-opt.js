const fs = require('fs');
const file = '/Applications/Project/AllProjects/TermoPlan/termoplanapp/src/components/canvas/RoomCanvas3D.tsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Remove ContactShadows entirely (it kills mobile FPS)
code = code.replace(/<ContactShadows[^>]*\/>/g, '');

// 2. Reduce TubeGeometry segments for Pipes
code = code.replace(/256, 0\.016, 8/g, '64, 0.016, 6');

// 3. Lower shadow map size
code = code.replace(/shadow-mapSize=\{\[1024, 1024\]\}/g, 'shadow-mapSize={[512, 512]}');

// 4. Reduce directionalLight intensity a bit to match lack of ambient occlusion
code = code.replace(/intensity=\{1\.5\}/g, 'intensity={1.2}');

fs.writeFileSync(file, code);
console.log('RoomCanvas3D optimized for mobile performance');
