const fs = require('fs');
const file = '/Applications/Project/AllProjects/TermoPlan/termoplanapp/src/components/canvas/RoomCanvas3D.tsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Import OrthographicCamera
code = code.replace(
  "import { Sky, Environment, ContactShadows } from '@react-three/drei/native';",
  "import { Sky, Environment, ContactShadows, OrthographicCamera, PerspectiveCamera } from '@react-three/drei/native';"
);

// 2. Add cameraMode state and toggle button
const stateRegex = /const \[rotX, setRotX\] = useState\(0\);\n\s*const \[rotY, setRotY\] = useState\(0\);/;
const stateNew = `const [rotX, setRotX] = useState(0);
  const [rotY, setRotY] = useState(0);
  const [cameraMode, setCameraMode] = useState<'3D'|'2D'>('3D');`;
code = code.replace(stateRegex, stateNew);

// 3. Modify SceneRotator logic
const rotatorRegex = /const targetRotation = useRef<THREE\.Euler>\(new THREE\.Euler\(0, 0, 0\)\);/;
const rotatorNew = `const targetRotation = useRef<THREE.Euler>(new THREE.Euler(0, 0, 0));
  const is2D = rotY === -999;`;
code = code.replace(rotatorRegex, rotatorNew);

const frameRegex = /targetRotation\.current\.set\(rotX, rotY, 0\);/;
const frameNew = `if (rotY === -999) {
      targetRotation.current.set(-Math.PI / 2, 0, 0);
    } else {
      targetRotation.current.set(rotX, rotY, 0);
    }`;
code = code.replace(frameRegex, frameNew);

// 4. In panResponder, don't update if in 2D mode
const panRegex = /setRotX\(\(prev\) => Math\.max\(-Math\.PI \/ 2, Math\.min\(Math\.PI \/ 2, prev \+ dy\)\)\);\n\s*setRotY\(\(prev\) => prev \+ dx\);/;
const panNew = `if (cameraMode === '3D') {
          setRotX((prev) => Math.max(-Math.PI / 2, Math.min(Math.PI / 2, prev + dy)));
          setRotY((prev) => prev + dx);
        }`;
code = code.replace(panRegex, panNew);

// 5. Change Canvas camera conditionally
const canvasRegex = /<Canvas shadows camera=\{\{ position: \[0, 8, 12\], fov: 55 \}\}>/;
const canvasNew = `<Canvas shadows>
        {cameraMode === '3D' ? (
          <PerspectiveCamera makeDefault position={[0, 8, 12]} fov={55} />
        ) : (
          <OrthographicCamera makeDefault position={[0, 20, 0]} zoom={30} rotation={[-Math.PI / 2, 0, 0]} />
        )}`;
code = code.replace(canvasRegex, canvasNew);

// 6. Disable SceneRotator if 2D mode
const groupRegex = /<SceneRotator rotX=\{rotX\} rotY=\{rotY\}>/g;
const groupNew = `<SceneRotator rotX={cameraMode === '2D' ? 0 : rotX} rotY={cameraMode === '2D' ? -999 : rotY}>`;
code = code.replace(groupRegex, groupNew);

// 7. Add UI toggle
const fullscreenBtnRegex = /<TouchableOpacity\n\s*style=\{\{ position: 'absolute', top: 16, right: 16/;
const uiNew = `<TouchableOpacity
        style={{ position: 'absolute', top: 16, left: 16, zIndex: 100, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 }}
        onPress={() => setCameraMode(p => p === '3D' ? '2D' : '3D')}
      >
        <Text style={{ color: '#fff', fontWeight: '600' }}>{cameraMode === '3D' ? '📐 2D Top-Down' : '🏢 3D Fazo'}</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={{ position: 'absolute', top: 16, right: 16`;
code = code.replace(fullscreenBtnRegex, uiNew);

fs.writeFileSync(file, code);
console.log('RoomCanvas3D enhanced with 2D mode');
