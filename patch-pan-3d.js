const fs = require('fs');
const file = '/Applications/Project/AllProjects/TermoPlan/termoplanapp/src/components/canvas/RoomCanvas3D.tsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Add panX, panZ to refs
const rotRefRegex = /const lastRot = React\.useRef\(\{ x: 0\.5, y: -0\.5 \}\);/;
const rotRefNew = `const panX = React.useRef(0);
  const panZ = React.useRef(0);
  const lastPan = React.useRef({ x: 0, z: 0 });
  const lastRot = React.useRef({ x: 0.5, y: -0.5 });`;
code = code.replace(rotRefRegex, rotRefNew);

// 2. Add pan logic to PanResponder
const grantRegex = /lastRot\.current = \{ x: rotX\.current, y: rotY\.current \};/;
const grantNew = `lastRot.current = { x: rotX.current, y: rotY.current };
      lastPan.current = { x: panX.current, z: panZ.current };`;
code = code.replace(grantRegex, grantNew);

const moveRegex = /if \(gestureState\.numberActiveTouches === 1 && cameraMode === '3D'\) \{[\s\S]*?rotX\.current = Math\.max\(-Math\.PI\/2, Math\.min\(Math\.PI\/2, lastRot\.current\.x \+ gestureState\.dy \* 0\.01\)\);\s*\}/;
const moveNew = `if (gestureState.numberActiveTouches === 1 && cameraMode === '3D') {
        rotY.current = lastRot.current.y + gestureState.dx * 0.01;
        rotX.current = Math.max(-Math.PI/2, Math.min(Math.PI/2, lastRot.current.x + gestureState.dy * 0.01));
      } else if (gestureState.numberActiveTouches === 2) {
        panX.current = lastPan.current.x + gestureState.dx * 0.05;
        panZ.current = lastPan.current.z + gestureState.dy * 0.05;
      }`;
code = code.replace(moveRegex, moveNew);

// 3. Update SceneRotator props and internal logic
const srRegex = /const SceneRotator = \(\{ rotX, rotY, children \}: any\) => \{[\s\S]*?targetRotation\.current\.set\(-Math\.PI \/ 2, 0, 0\);[\s\S]*?targetRotation\.current\.set\(rotX, rotY, 0\);[\s\S]*?if \(groupRef\.current\) \{[\s\S]*?groupRef\.current\.rotation\.z = THREE\.MathUtils\.damp\(groupRef\.current\.rotation\.z, targetRotation\.current\.z, 6, delta\);\s*\}/;
const srNew = `const SceneRotator = ({ rotX, rotY, panX = 0, panZ = 0, children }: any) => {
  const targetRotation = React.useRef<THREE.Euler>(new THREE.Euler(0, 0, 0));
  const targetPosition = React.useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const groupRef = React.useRef<THREE.Group>(null);
  const is2D = rotY === -999;

  useFrame((state, delta) => {
    if (rotY === -999) {
      targetRotation.current.set(-Math.PI / 2, 0, 0);
    } else {
      targetRotation.current.set(rotX, rotY, 0);
    }
    
    targetPosition.current.set(panX, 0, panZ);

    if (groupRef.current) {
      groupRef.current.rotation.x = THREE.MathUtils.damp(groupRef.current.rotation.x, targetRotation.current.x, 6, delta);
      groupRef.current.rotation.y = THREE.MathUtils.damp(groupRef.current.rotation.y, targetRotation.current.y, 6, delta);
      groupRef.current.rotation.z = THREE.MathUtils.damp(groupRef.current.rotation.z, targetRotation.current.z, 6, delta);
      
      groupRef.current.position.x = THREE.MathUtils.damp(groupRef.current.position.x, targetPosition.current.x, 6, delta);
      groupRef.current.position.z = THREE.MathUtils.damp(groupRef.current.position.z, targetPosition.current.z, 6, delta);
    }`;
code = code.replace(srRegex, srNew);

// 4. Pass panX and panZ to SceneRotator
const groupRegex = /<SceneRotator rotX=\{cameraMode === '2D' \? 0 : rotX\.current\} rotY=\{cameraMode === '2D' \? -999 : rotY\.current\}>/;
const groupNew = `<SceneRotator rotX={cameraMode === '2D' ? 0 : rotX.current} rotY={cameraMode === '2D' ? -999 : rotY.current} panX={panX.current} panZ={panZ.current}>`;
code = code.replace(groupRegex, groupNew);

fs.writeFileSync(file, code);
console.log('RoomCanvas3D panning added');
