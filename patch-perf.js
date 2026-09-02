const fs = require('fs');
const file = '/Applications/Project/AllProjects/TermoPlan/termoplanapp/src/components/canvas/RoomCanvas3D.tsx';
let code = fs.readFileSync(file, 'utf8');

// Add useFrame import
if (!code.includes('useFrame')) {
  code = code.replace(
    'import { Canvas } from \'@react-three/fiber/native\';',
    'import { Canvas, useFrame } from \'@react-three/fiber/native\';'
  );
}

// Remove setRenderTrigger
code = code.replace('const [, setRenderTrigger] = useState(0);', '');
code = code.replace('setRenderTrigger(v => v + 1);', '');

// Create Rotator component
const rotatorComponent = `
const SceneRotator = ({ rotX, rotY, children }: any) => {
  const groupRef = React.useRef<THREE.Group>(null);
  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.x = rotX.current;
      groupRef.current.rotation.y = rotY.current;
    }
  });
  return <group ref={groupRef}>{children}</group>;
};
`;

code = code.replace('export const RoomCanvas3D', rotatorComponent + '\nexport const RoomCanvas3D');

// Wrap with SceneRotator instead of static group
code = code.replace(
  '<group rotation={[rotX.current, rotY.current, 0]}>',
  '<SceneRotator rotX={rotX} rotY={rotY}>'
);
code = code.replace(
  '</group>\n          </group>',
  '</group>\n          </SceneRotator>'
);

fs.writeFileSync(file, code);
console.log('Performance patched for 60FPS');
