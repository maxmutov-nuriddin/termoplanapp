const fs = require('fs');
const file = '/Applications/Project/AllProjects/TermoPlan/termoplanapp/src/components/canvas/RoomCanvas3D.tsx';
let code = fs.readFileSync(file, 'utf8');

const wallsStart = '// 2. Devorlar, Eshiklar va Oynalar';
const acStart = '// 2.5. Konditsioner (AC Unit)';

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

      const cx = (p1.x + p2.x) / 2;
      const cy = (p1.y + p2.y) / 2; // In 2D

      // Draw solid wall using BoxGeometry
      meshes.push(
        <mesh key={'w'+i} position={[cx, wallHeight / 2, -cy]} rotation={[0, angle, 0]} castShadow receiveShadow>
          <boxGeometry args={[length, wallHeight, thickness]} />
          <meshStandardMaterial color={wallSpec.isExternal ? "#94A3B8" : "#CBD5E1"} roughness={0.9} />
        </mesh>
      );
    }
    
    // Add 3D doors
    doors.forEach((door: any, idx: number) => {
      meshes.push(
        <mesh key={'d'+idx} position={[door.position.x, 1.0, -door.position.y]} castShadow>
          <boxGeometry args={[door.width || 0.9, 2.0, 0.45]} />
          <meshStandardMaterial color="#8B4513" roughness={0.7} />
        </mesh>
      );
    });

    // Add 3D windows
    windows.forEach((win: any, idx: number) => {
      meshes.push(
        <mesh key={'wi'+idx} position={[win.position.x, 1.5, -win.position.y]} castShadow>
          <boxGeometry args={[win.width || 1.5, 1.2, 0.5]} />
          <meshStandardMaterial color="#38BDF8" transparent opacity={0.8} roughness={0.1} metalness={0.8} />
        </mesh>
      );
    });

    return meshes;
  }, [roomPoints, wallHeight, walls, windows, doors]);

  return <>{elements}</>;
};

`;

code = code.replace(code.substring(code.indexOf(wallsStart), code.indexOf(acStart)), newWalls);
fs.writeFileSync(file, code);
console.log('Walls patched');
