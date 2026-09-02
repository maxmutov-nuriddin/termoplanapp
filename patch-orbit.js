const fs = require('fs');
const file = '/Applications/Project/AllProjects/TermoPlan/termoplanapp/src/components/canvas/RoomCanvas3D.tsx';
let code = fs.readFileSync(file, 'utf8');

// Remove OrbitControls import
code = code.replace('OrbitControls, ', '');
code = code.replace('<OrbitControls makeDefault target={[0, 0, 0]} enablePan={true} enableZoom={true} enableRotate={true} />', '');

// Add PanResponder to imports
code = code.replace('import { View, StyleSheet, Dimensions, Text } from \'react-native\';', 'import { View, StyleSheet, Dimensions, Text, PanResponder } from \'react-native\';\nimport { useState } from \'react\';');

// Inside RoomCanvas3D component, add state and PanResponder
const hookStart = 'const { roomPoints, walls, furniture, seasonMode, windows, doors, acPosition } = useCanvasStore();';
const newHook = `const { roomPoints, walls, furniture, seasonMode, windows, doors, acPosition } = useCanvasStore();
  const [rotX, setRotX] = useState(0.5); // Initial tilt
  const [rotY, setRotY] = useState(-0.5); // Initial rotation

  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderMove: (evt, gestureState) => {
      if (gestureState.numberActiveTouches === 1) {
        setRotY(prev => prev + gestureState.vx * 0.05);
        setRotX(prev => Math.max(-Math.PI/2, Math.min(Math.PI/2, prev + gestureState.vy * 0.05)));
      }
    },
  }), []);
`;

code = code.replace(hookStart, newHook);

// Apply to group
code = code.replace(
  '<group position={[-centroid.x, 0, centroid.y]}>',
  '<group rotation={[rotX, rotY, 0]}>\n            <group position={[-centroid.x, 0, centroid.y]}>'
);

code = code.replace(
  '{seasonMode === \'winter\' && <Pipes circuits={circuits} />}\n          </group>',
  '{seasonMode === \'winter\' && <Pipes circuits={circuits} />}\n            </group>\n          </group>'
);

// Apply PanResponder to the View wrapping Canvas
code = code.replace(
  '<View style={isFullscreen ? styles.fullContainer : styles.container}>',
  '<View style={isFullscreen ? styles.fullContainer : styles.container} {...panResponder.panHandlers}>'
);

fs.writeFileSync(file, code);
console.log('Patched custom pan responder');
