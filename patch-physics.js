const fs = require('fs');
const file = '/Applications/Project/AllProjects/TermoPlan/termoplanapp/src/components/canvas/RoomCanvas3D.tsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Add interactive Furniture
const furnRegex = /\/\/ 4\. Mebellar \(Furniture\)[\s\S]*?<\/>\n  \);\n\};/s;
const furnNew = `// 4. Mebellar (Furniture) - JONLANTIRILGAN FIZIK OBYEKTLAR
const Furniture3D = ({ item }: { item: any }) => {
  const [bouncing, setBouncing] = useState(false);
  const posY = React.useRef(0.4);
  const scale = React.useRef(1.0);
  
  useFrame((state, delta) => {
    const targetY = bouncing ? 1.5 : 0.4;
    const targetScale = bouncing ? 1.2 : 1.0;
    posY.current = THREE.MathUtils.damp(posY.current, targetY, 12, delta);
    scale.current = THREE.MathUtils.damp(scale.current, targetScale, 12, delta);
    if (bouncing && Math.abs(posY.current - targetY) < 0.1) {
      setBouncing(false); // fall back down
    }
  });

  return (
    <mesh 
      position={[item.position.x, posY.current, -item.position.y]} 
      rotation={[0, -(item.rotation || 0), 0]} 
      scale={[scale.current, scale.current, scale.current]}
      castShadow 
      receiveShadow
      onClick={(e) => { e.stopPropagation(); setBouncing(true); }}
    >
      <boxGeometry args={[item.width || 1.2, 0.8, item.length || 2.0]} />
      <meshStandardMaterial color={bouncing ? "#F59E0B" : "#FBBF24"} roughness={0.3} metalness={0.2} />
    </mesh>
  );
};

const Furnitures = ({ items }: { items: any[] }) => {
  return <>{items.map((item, i) => <Furniture3D key={i} item={item} />)}</>;
};`;
code = code.replace(furnRegex, furnNew);

// 2. Add interactive Doors & Windows
const wallsRegex = /\/\/ Add 3D doors\n\s*doors\.forEach\(\(door: any, idx: number\) => \{[\s\S]*?\}\);\n\n\s*\/\/ Add 3D windows\n\s*windows\.forEach\(\(win: any, idx: number\) => \{[\s\S]*?\}\);/s;

const wallsNew = `// We render doors and windows via interactive components
    return meshes;
  }, [roomPoints, wallHeight, walls]); // Removed doors and windows from here to render them dynamically

  return (
    <>
      {elements}
      {doors.map((d: any, i: number) => <Door3D key={'d'+i} door={d} />)}
      {windows.map((w: any, i: number) => <Window3D key={'w'+i} win={w} />)}
    </>
  );
};

const Door3D = ({ door }: any) => {
  const [open, setOpen] = useState(false);
  const groupRef = React.useRef<THREE.Group>(null);
  
  useFrame((state, delta) => {
    if (groupRef.current) {
      const target = open ? Math.PI / 1.5 : 0;
      groupRef.current.rotation.y = THREE.MathUtils.damp(groupRef.current.rotation.y, target, 8, delta);
    }
  });

  return (
    <group position={[door.position.x, 1.0, -door.position.y]} rotation={[0, -(door.rotation || 0), 0]}>
      {/* Pivot point shift */}
      <group position={[-(door.width || 0.9)/2, 0, 0]} ref={groupRef}>
        <mesh position={[(door.width || 0.9)/2, 0, 0]} castShadow onClick={(e) => { e.stopPropagation(); setOpen(!open); }}>
          <boxGeometry args={[door.width || 0.9, 2.0, 0.1]} />
          <meshStandardMaterial color="#8B4513" roughness={0.7} />
        </mesh>
      </group>
    </group>
  );
};

const Window3D = ({ win }: any) => {
  const [open, setOpen] = useState(false);
  const posY = React.useRef(1.5);
  
  useFrame((state, delta) => {
    const target = open ? 2.5 : 1.5;
    posY.current = THREE.MathUtils.damp(posY.current, target, 5, delta);
  });

  return (
    <mesh 
      position={[win.position.x, posY.current, -win.position.y]} 
      rotation={[0, -(win.rotation || 0), 0]} 
      castShadow 
      onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
    >
      <boxGeometry args={[win.width || 1.5, 1.2, 0.1]} />
      <meshStandardMaterial color="#38BDF8" transparent opacity={0.6} roughness={0.1} metalness={0.8} />
    </mesh>
  );
};`;

// Replace walls logic
code = code.replace(wallsRegex, ''); // clear the old forEach logic
code = code.replace(
  'return meshes;\n  }, [roomPoints, wallHeight, walls, windows, doors]);\n\n  return <>{elements}</>;\n};',
  wallsNew
);

fs.writeFileSync(file, code);
console.log('Physics and animations added');
