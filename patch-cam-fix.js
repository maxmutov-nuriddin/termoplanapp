const fs = require('fs');
const file = '/Applications/Project/AllProjects/TermoPlan/termoplanapp/src/components/canvas/RoomCanvas3D.tsx';
let code = fs.readFileSync(file, 'utf8');

// Inject cameraMode
const stateRegex = /const lastRot = React\.useRef\(\{ x: 0\.5, y: -0\.5 \}\);/;
const stateNew = `const lastRot = React.useRef({ x: 0.5, y: -0.5 });
  const [cameraMode, setCameraMode] = useState<'3D'|'2D'>('3D');`;
code = code.replace(stateRegex, stateNew);

// In PanResponder move:
const panMoveRegex = /if \(gestureState\.numberActiveTouches === 1\) \{/;
const panMoveNew = `if (gestureState.numberActiveTouches === 1 && cameraMode === '3D') {`;
code = code.replace(panMoveRegex, panMoveNew);

fs.writeFileSync(file, code);
console.log('Fixed cameraMode state');
