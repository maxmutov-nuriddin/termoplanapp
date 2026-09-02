import React, { useMemo, Suspense } from 'react';
import { View, StyleSheet, Dimensions, Text } from 'react-native';
import { Canvas } from '@react-three/fiber/native';
import { OrbitControls, Sky, Environment, ContactShadows, OrthographicCamera, PerspectiveCamera } from '@react-three/drei/native';
import * as THREE from 'three';
import { useCanvasStore } from '../../store/canvasStore';
import { useShallow } from 'zustand/react/shallow';
import { PIXELS_PER_METER, generateRealisticFloorHeating } from '../../utils/geometry';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface RoomCanvas3DProps {
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  wallHeightM?: number;
  isSunnyRoom?: boolean;
  recommendedBtu?: number;
  sunAzimuth?: number;
  windAngle?: number;
}

// 1. Zamin (Floor)
const Floor = ({ roomPoints }: { roomPoints: any[] }) => {
  const shape = useMemo(() => {
    if (roomPoints.length < 3) return null;
    const s = new THREE.Shape();
    s.moveTo(roomPoints[0].x, -roomPoints[0].y); // In 3D, we usually map 2D (x,y) to (x, -y) or (x, z)
    for (let i = 1; i < roomPoints.length; i++) {
      s.lineTo(roomPoints[i].x, -roomPoints[i].y);
    }
    s.lineTo(roomPoints[0].x, -roomPoints[0].y);
    return s;
  }, [roomPoints]);

  if (!shape) return null;

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, -0.01, 0]}>
      <shapeGeometry args={[shape]} />
      <meshStandardMaterial color="#E2E8F0" roughness={0.8} />
    </mesh>
  );
};

// 2. Devorlar (Walls)
const Walls = ({ roomPoints, wallHeight, walls = [], windows = [], doors = [] }: any) => {
  const wallMeshes = useMemo(() => {
    if (roomPoints.length < 3) return [];
    const meshes = [];

    for (let i = 0; i < roomPoints.length; i++) {
      const p1 = roomPoints[i];
      const p2 = roomPoints[(i + 1) % roomPoints.length];
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const length = Math.hypot(dx, dy);
      const angle = Math.atan2(-dy, dx); // Note: -dy because of 3D z-axis mapping
      
      const wallSpec = walls[i] || {};
      const thickness = wallSpec.isExternal ? 0.38 : 0.15;

      const shape = new THREE.Shape();
      shape.moveTo(0, 0);
      shape.lineTo(length, 0);
      shape.lineTo(length, wallHeight);
      shape.lineTo(0, wallHeight);
      shape.lineTo(0, 0);

      // Add holes for doors/windows if they belong to this wall (Simplified for now)
      // Since mapping doors/windows to precise walls requires exact snapping logic,
      // we'll draw basic walls first. Real Planner 5D does CSG or holes here.
      
      const extrudeSettings = { depth: thickness, bevelEnabled: false };
      const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);

      meshes.push(
        <mesh key={i} position={[p1.x, 0, -p1.y]} rotation={[0, angle, 0]} castShadow receiveShadow>
          <primitive object={geometry} attach="geometry" />
          <meshStandardMaterial color={wallSpec.isExternal ? "#94A3B8" : "#CBD5E1"} roughness={0.9} />
        </mesh>
      );
    }
    return meshes;
  }, [roomPoints, wallHeight, walls]);

  return <>{wallMeshes}</>;
};

// 3. Quvurlar (Pipes)
const Pipes = ({ circuits }: { circuits: any[] }) => {
  const parsePath = (pointsStr: string) => {
    if (!pointsStr) return [];
    const pts = pointsStr.trim().split(/\s+/).map(p => {
      const [x, y] = p.split(',');
      return new THREE.Vector3(parseFloat(x) / PIXELS_PER_METER, 0.05, -parseFloat(y) / PIXELS_PER_METER);
    });
    return pts;
  };

  return (
    <>
      {circuits.map((c, i) => {
        const feedPts = parsePath(c.feedPoints);
        const retPts = parsePath(c.returnPoints);

        return (
          <group key={i}>
            {feedPts.length > 1 && (
              <mesh castShadow>
                <tubeGeometry args={[new THREE.CatmullRomCurve3(feedPts, false, 'catmullrom', 0.1), 256, 0.016, 8, false]} />
                <meshStandardMaterial color="#EF4444" roughness={0.3} metalness={0.1} />
              </mesh>
            )}
            {retPts.length > 1 && (
              <mesh castShadow>
                <tubeGeometry args={[new THREE.CatmullRomCurve3(retPts, false, 'catmullrom', 0.1), 256, 0.016, 8, false]} />
                <meshStandardMaterial color="#3B82F6" roughness={0.3} metalness={0.1} />
              </mesh>
            )}
          </group>
        );
      })}
    </>
  );
};

// 4. Mebellar (Furniture)
const Furnitures = ({ items }: { items: any[] }) => {
  return (
    <>
      {items.map((item, i) => (
        <mesh key={i} position={[item.position.x, 0.4, -item.position.y]} castShadow receiveShadow>
          <boxGeometry args={[item.width || 1.2, 0.8, item.length || 2.0]} />
          <meshStandardMaterial color="#FBBF24" roughness={0.5} />
        </mesh>
      ))}
    </>
  );
};

export const RoomCanvas3D: React.FC<RoomCanvas3DProps> = ({
  isFullscreen,
  onToggleFullscreen,
  wallHeightM = 3.0,
}) => {
  const { roomPoints, walls, furniture, seasonMode } = useCanvasStore(useShallow(s => ({ roomPoints: s.roomPoints, walls: s.walls, furniture: s.furniture, seasonMode: s.seasonMode })));

  const validPoints = useMemo(() => {
    return (roomPoints || []).filter((p) => p && Number.isFinite(p.x) && Number.isFinite(p.y));
  }, [roomPoints]);

  const { circuits } = useMemo(() => {
    if (validPoints.length < 3) return { circuits: [] };
    return generateRealisticFloorHeating(
      validPoints,
      { x: 1, y: 1 },
      [],
      [],
      'spiral',
      [],
      [],
      null,
      furniture || [],
      0,
      walls || []
    );
  }, [validPoints, furniture, walls]);

  const centroid = useMemo(() => {
    if (validPoints.length === 0) return { x: 0, y: 0 };
    let cx = 0, cy = 0;
    validPoints.forEach(p => { cx += p.x; cy += p.y; });
    return { x: cx / validPoints.length, y: cy / validPoints.length };
  }, [validPoints]);

  if (validPoints.length < 3) {
    return (
      <View style={[styles.container, { height: 350, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: '#fff' }}>3D Sahnani ko'rish uchun xona chizing</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Canvas shadows camera={{ position: [centroid.x, 6, -centroid.y + 6], fov: 50 }}>
        <Suspense fallback={null}>
          <Sky sunPosition={[10, 20, 10]} />
          <ambientLight intensity={0.4} />
          <directionalLight castShadow position={[5, 10, 5]} intensity={1.5} shadow-mapSize={[1024, 1024]} />
          
          <group position={[-centroid.x, 0, centroid.y]}>
            <Floor roomPoints={validPoints} />
            <Walls roomPoints={validPoints} wallHeight={wallHeightM} walls={walls} />
            <Furnitures items={furniture} />
            
            {seasonMode === 'winter' && <Pipes circuits={circuits} />}
          </group>

          <ContactShadows position={[0, -0.05, 0]} opacity={0.5} scale={20} blur={2} far={4} />
          <OrbitControls target={[0, 0, 0]} maxPolarAngle={Math.PI / 2 - 0.05} />
        </Suspense>
      </Canvas>
      <View style={styles.overlay}>
        <Text style={styles.overlayText}>Haqiqiy 3D (WebGL)</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 380,
    backgroundColor: '#0F172A',
    borderRadius: 16,
    overflow: 'hidden',
    marginVertical: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  overlay: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 6,
    borderRadius: 6,
  },
  overlayText: {
    color: '#38BDF8',
    fontSize: 10,
    fontWeight: 'bold',
  }
});