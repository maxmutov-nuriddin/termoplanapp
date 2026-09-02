const fs = require('fs');
const file = '/Applications/Project/AllProjects/TermoPlan/termoplanapp/src/components/canvas/RoomCanvas3D.tsx';
let code = fs.readFileSync(file, 'utf8');

// Replace Walls to also render Windows and Doors as transparent or distinct blocks
const wallsStart = '// 2. Devorlar (Walls)';
const pipesStart = '// 3. Quvurlar (Pipes)';

const newWalls = `// 2. Devorlar, Eshiklar va Oynalar
const Walls = ({ roomPoints, wallHeight, walls = [], windows = [], doors = [] }: any) => {
  const elements = useMemo(() => {
    if (roomPoints.length < 3) return [];
    const meshes = [];

    for (let i = 0; i < roomPoints.length; i++) {
      const p1 = roomPoints[i];
      const p2 = roomPoints[(i + 1) % roomPoints.length];
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const length = Math.hypot(dx, dy);
      const angle = Math.atan2(-dy, dx); 
      
      const wallSpec = walls[i] || {};
      const thickness = wallSpec.isExternal ? 0.38 : 0.15;

      const shape = new THREE.Shape();
      shape.moveTo(0, 0);
      shape.lineTo(length, 0);
      shape.lineTo(length, wallHeight);
      shape.lineTo(0, wallHeight);
      shape.lineTo(0, 0);

      const extrudeSettings = { depth: thickness, bevelEnabled: false };
      const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);

      meshes.push(
        <mesh key={'w'+i} position={[p1.x, 0, -p1.y]} rotation={[0, angle, 0]} castShadow receiveShadow>
          <primitive object={geometry} attach="geometry" />
          <meshStandardMaterial color={wallSpec.isExternal ? "#94A3B8" : "#CBD5E1"} roughness={0.9} />
        </mesh>
      );
    }
    
    // Add simple 3D doors
    doors.forEach((door: any, idx: number) => {
      meshes.push(
        <mesh key={'d'+idx} position={[door.position.x, 1.0, -door.position.y]} castShadow>
          <boxGeometry args={[door.width || 0.9, 2.0, 0.4]} />
          <meshStandardMaterial color="#8B4513" roughness={0.7} />
        </mesh>
      );
    });

    // Add simple 3D windows
    windows.forEach((win: any, idx: number) => {
      meshes.push(
        <mesh key={'wi'+idx} position={[win.position.x, 1.5, -win.position.y]} castShadow>
          <boxGeometry args={[win.width || 1.5, 1.2, 0.45]} />
          <meshStandardMaterial color="#38BDF8" transparent opacity={0.6} roughness={0.1} metalness={0.8} />
        </mesh>
      );
    });

    return meshes;
  }, [roomPoints, wallHeight, walls, windows, doors]);

  return <>{elements}</>;
};

// 2.5. Konditsioner (AC Unit)
const ACUnit = ({ acPosition, height }: any) => {
  if (!acPosition) return null;
  return (
    <group position={[acPosition.x, height - 0.4, -acPosition.y]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[0.9, 0.3, 0.25]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.3} />
      </mesh>
      <mesh position={[0, -0.05, 0.13]}>
        <planeGeometry args={[0.8, 0.1]} />
        <meshBasicMaterial color="#000000" />
      </mesh>
    </group>
  );
};

`;

code = code.replace(code.substring(code.indexOf(wallsStart), code.indexOf(pipesStart)), newWalls);

// Also inject ACUnit and windows/doors props into the render
code = code.replace(
  '<Walls roomPoints={validPoints} wallHeight={wallHeightM} walls={walls} />',
  '<Walls roomPoints={validPoints} wallHeight={wallHeightM} walls={walls} windows={useCanvasStore.getState().windows} doors={useCanvasStore.getState().doors} />\n            {seasonMode === \'summer\' && <ACUnit acPosition={useCanvasStore.getState().acPosition} height={wallHeightM} />}'
);

fs.writeFileSync(file, code);
console.log('Patched');
