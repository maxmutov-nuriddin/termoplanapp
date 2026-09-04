import React, { useMemo, Suspense, useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, PanResponder } from 'react-native';
import { Canvas, useThree, useFrame } from '@react-three/fiber/native';
import { OrbitControls, Sky, ContactShadows } from '@react-three/drei/native';

const OrbitUpdater = ({ orbitRef }: { orbitRef: any }) => {
  useFrame(() => {
    if (orbitRef.current) {
      orbitRef.current.update();
    }
  });
  return null;
};
import { Maximize2, X, Box, Plus, Minus, RotateCcw } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as THREE from 'three';
import { useCanvasStore } from '../../store/canvasStore';
import { useShallow } from 'zustand/react/shallow';
import { PIXELS_PER_METER, generateRealisticFloorHeating, calculateAcCountAndPositions } from '../../utils/geometry';
import { COLORS, RADIUS, SHADOWS } from '../../theme';

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
    s.moveTo(roomPoints[0].x, -roomPoints[0].y); 
    for (let i = 1; i < roomPoints.length; i++) {
      s.lineTo(roomPoints[i].x, -roomPoints[i].y);
    }
    s.lineTo(roomPoints[0].x, -roomPoints[0].y);
    return s;
  }, [roomPoints]);

  if (!shape) return null;

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
      <shapeGeometry args={[shape]} />
      <meshStandardMaterial color="#E2E8F0" roughness={0.8} />
    </mesh>
  );
};

// 2. Devorlar (Walls)
const Walls = ({ roomPoints, wallHeight, walls = [] }: any) => {
  const wallMeshes = useMemo(() => {
    if (roomPoints.length < 3) return [];
    const meshes = [];

    for (let i = 0; i < roomPoints.length; i++) {
      const p1 = roomPoints[i];
      const p2 = roomPoints[(i + 1) % roomPoints.length];
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const length = Math.hypot(dx, dy);
      
      if (length < 0.01) continue;
      
      const angle = -Math.atan2(dy, dx); 
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
        <mesh key={`wall_${i}`} position={[p1.x, 0, p1.y]} rotation={[0, angle, 0]}>
          <primitive object={geometry} attach="geometry" />
          <meshStandardMaterial color={wallSpec.isExternal ? "#64748B" : "#94A3B8"} roughness={0.8} />
        </mesh>
      );
    }
    return meshes;
  }, [roomPoints, wallHeight, walls]);

  return <>{wallMeshes}</>;
};

// 2.5. Ichki Devorlar / To'siqlar (Interior Walls 3D)
const InteriorWalls3D = ({
  interiorWalls = [],
  wallHeight,
}: {
  interiorWalls: any[];
  wallHeight: number;
}) => {
  const wallMeshes = useMemo(() => {
    if (!interiorWalls || interiorWalls.length === 0) return [];
    const meshes = [];

    for (let i = 0; i < interiorWalls.length; i++) {
      const iw = interiorWalls[i];
      if (!iw || !iw.startPoint || !iw.endPoint) continue;
      const p1 = iw.startPoint;
      const p2 = iw.endPoint;
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const length = Math.hypot(dx, dy);

      if (length < 0.05) continue;

      const angle = -Math.atan2(dy, dx);
      const thickness = iw.thicknessM || 0.12;

      const shape = new THREE.Shape();
      shape.moveTo(0, 0);
      shape.lineTo(length, 0);
      shape.lineTo(length, wallHeight);
      shape.lineTo(0, wallHeight);
      shape.lineTo(0, 0);

      const extrudeSettings = { depth: thickness, bevelEnabled: false };
      const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);

      const perpX = -Math.sin(angle) * (thickness / 2);
      const perpY = -Math.cos(angle) * (thickness / 2);

      meshes.push(
        <mesh
          key={`int_wall_${iw.id || i}`}
          position={[p1.x + perpX, 0, p1.y + perpY]}
          rotation={[0, angle, 0]}
        >
          <primitive object={geometry} attach="geometry" />
          <meshStandardMaterial color="#475569" roughness={0.7} metalness={0.1} />
        </mesh>
      );
    }
    return meshes;
  }, [interiorWalls, wallHeight]);

  return <>{wallMeshes}</>;
};

// 3. 3D Eshiklar (Doors)
const Doors3D = ({ doors, wallHeight }: { doors: any[]; wallHeight: number }) => {
  return (
    <>
      {(doors || []).map((door, i) => {
        if (!door || !door.position || !Number.isFinite(door.position.x)) return null;
        const width = door.width || 0.9;
        const height = door.height || wallHeight * 0.72;
        const rotRad = ((door.rotation || 0) * Math.PI) / 180;
        return (
          <group
            key={`door_${i}`}
            position={[door.position.x, height / 2, door.position.y]}
            rotation={[0, -rotRad, 0]}
          >
            <mesh>
              <boxGeometry args={[width, height, 0.16]} />
              <meshStandardMaterial color="#523722" roughness={0.6} />
            </mesh>
            <mesh position={[width / 2 - 0.1, 0, 0.1]}>
              <sphereGeometry args={[0.03, 12, 12]} />
              <meshStandardMaterial color="#E2E8F0" metalness={0.8} roughness={0.2} />
            </mesh>
          </group>
        );
      })}
    </>
  );
};

// 4. 3D Oynalar/Derazalar (Windows)
const Windows3D = ({ windows, wallHeight }: { windows: any[]; wallHeight: number }) => {
  return (
    <>
      {(windows || []).map((win, i) => {
        if (!win || !win.position || !Number.isFinite(win.position.x)) return null;
        const width = win.width || 1.4;
        const height = win.height || 1.2;
        const posY = win.elevationM || 1.0;
        const rotRad = ((win.rotation || 0) * Math.PI) / 180;
        return (
          <group
            key={`win_${i}`}
            position={[win.position.x, posY + height / 2, win.position.y]}
            rotation={[0, -rotRad, 0]}
          >
            <mesh>
              <boxGeometry args={[width, height, 0.18]} />
              <meshStandardMaterial color="#FFFFFF" roughness={0.3} />
            </mesh>
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[width - 0.1, height - 0.1, 0.04]} />
              <meshStandardMaterial color="#93C5FD" transparent opacity={0.45} roughness={0.1} />
            </mesh>
          </group>
        );
      })}
    </>
  );
};

// 5. 3D Mebellar (Furniture)
const Furnitures3D = ({ items }: { items: any[] }) => {
  return (
    <>
      {(items || []).map((item, i) => {
        if (!item || !item.position || !Number.isFinite(item.position.x)) return null;
        const w = item.width || 1.2;
        const l = item.length || 2.0;
        const type = item.type || 'table';
        const rotRad = ((item.rotation || 0) * Math.PI) / 180;

        if (type === 'bed') {
          return (
            <group
              key={`furn_${i}`}
              position={[item.position.x, 0, item.position.y]}
              rotation={[0, -rotRad, 0]}
            >
              <mesh position={[0, 0.2, 0]}>
                <boxGeometry args={[w, 0.4, l]} />
                <meshStandardMaterial color="#78350F" roughness={0.6} />
              </mesh>
              <mesh position={[0, 0.45, 0]}>
                <boxGeometry args={[w - 0.1, 0.2, l - 0.1]} />
                <meshStandardMaterial color="#F8FAFC" roughness={0.8} />
              </mesh>
              <mesh position={[0, 0.6, -l / 2 + 0.3]}>
                <boxGeometry args={[w - 0.3, 0.1, 0.4]} />
                <meshStandardMaterial color="#E2E8F0" roughness={0.9} />
              </mesh>
            </group>
          );
        }

        if (type === 'sofa') {
          return (
            <group
              key={`furn_${i}`}
              position={[item.position.x, 0, item.position.y]}
              rotation={[0, -rotRad, 0]}
            >
              <mesh position={[0, 0.25, 0]}>
                <boxGeometry args={[w, 0.4, l]} />
                <meshStandardMaterial color="#334155" roughness={0.7} />
              </mesh>
              <mesh position={[-w / 2 + 0.15, 0.6, 0]}>
                <boxGeometry args={[0.3, 0.7, l]} />
                <meshStandardMaterial color="#1E293B" roughness={0.7} />
              </mesh>
            </group>
          );
        }

        return (
          <mesh
            key={`furn_${i}`}
            position={[item.position.x, 0.4, item.position.y]}
            rotation={[0, -rotRad, 0]}
          >
            <boxGeometry args={[w, 0.8, l]} />
            <meshStandardMaterial color="#D97706" roughness={0.5} />
          </mesh>
        );
      })}
    </>
  );
};

// 6. 3D Qozon / Gas Boiler (Winter Mode)
const Boiler3D = ({ boilerPos, roomPoints }: { boilerPos?: any; roomPoints: any[] }) => {
  const pos = useMemo(() => {
    if (boilerPos && Number.isFinite(boilerPos.x) && Number.isFinite(boilerPos.y)) {
      return [boilerPos.x, 1.5, boilerPos.y];
    }
    if (roomPoints.length >= 1) {
      return [roomPoints[0].x + 0.5, 1.5, roomPoints[0].y + 0.3];
    }
    return null;
  }, [boilerPos, roomPoints]);

  if (!pos) return null;

  return (
    <group position={pos as [number, number, number]}>
      <mesh castShadow>
        <boxGeometry args={[0.45, 0.75, 0.32]} />
        <meshStandardMaterial color="#F8FAFC" roughness={0.2} metalness={0.1} />
      </mesh>
      <mesh position={[0, 0.1, 0.165]}>
        <boxGeometry args={[0.2, 0.12, 0.01]} />
        <meshBasicMaterial color="#0284C7" />
      </mesh>
      <mesh position={[-0.1, -0.45, 0]}>
        <cylinderGeometry args={[0.018, 0.018, 0.2, 12]} />
        <meshStandardMaterial color="#EF4444" roughness={0.3} />
      </mesh>
      <mesh position={[0.1, -0.45, 0]}>
        <cylinderGeometry args={[0.018, 0.018, 0.2, 12]} />
        <meshStandardMaterial color="#0284C7" roughness={0.3} />
      </mesh>
    </group>
  );
};

// 7. 3D Kollektor Shkafi (Winter Mode)
const Manifold3D = ({ manifoldPos, roomPoints }: { manifoldPos?: any; roomPoints: any[] }) => {
  const position = useMemo(() => {
    if (manifoldPos && Number.isFinite(manifoldPos.x) && Number.isFinite(manifoldPos.y)) {
      return [manifoldPos.x, 0.4, manifoldPos.y];
    }
    if (roomPoints.length >= 1) {
      return [roomPoints[0].x + 0.3, 0.4, roomPoints[0].y + 0.3];
    }
    return [0.8, 0.4, 0.8];
  }, [manifoldPos, roomPoints]);

  return (
    <group position={position as [number, number, number]}>
      <mesh>
        <boxGeometry args={[0.55, 0.65, 0.18]} />
        <meshStandardMaterial color="#64748B" roughness={0.4} metalness={0.6} />
      </mesh>
      <mesh position={[-0.14, 0.12, 0.1]}>
        <cylinderGeometry args={[0.025, 0.025, 0.38, 12]} />
        <meshStandardMaterial color="#EF4444" roughness={0.3} />
      </mesh>
      <mesh position={[0.14, -0.12, 0.1]}>
        <cylinderGeometry args={[0.025, 0.025, 0.38, 12]} />
        <meshStandardMaterial color="#0284C7" roughness={0.3} />
      </mesh>
    </group>
  );
};

// 8. 3D Professional CFD Sovutish Simulyatsiyasi (Super Light & Elegant Vector Airflow)
const AirConditioner3D = ({ acPos, roomPoints, wallHeight }: { acPos?: any; roomPoints: any[]; wallHeight: number }) => {
  const { pos, rotY } = useMemo(() => {
    let targetX = 1.2;
    let targetY = 0.5;
    let angle = 90;

    if (acPos && Number.isFinite(acPos.x) && Number.isFinite(acPos.y)) {
      targetX = acPos.x;
      targetY = acPos.y;
      angle = acPos.targetAngle || 90;
    } else if (roomPoints.length >= 2) {
      let minX = Infinity, maxX = -Infinity, minY = Infinity;
      roomPoints.forEach(p => {
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
        if (p.y < minY) minY = p.y;
      });
      targetX = (minX + maxX) / 2;
      targetY = minY + 0.35;
    }

    let offsetY = 0.20;
    if (angle === 270) {
      offsetY = -0.20;
    }

    const rot = angle === 270 ? Math.PI : 0;

    return {
      pos: [targetX, wallHeight - 0.45, targetY + offsetY],
      rotY: rot
    };
  }, [acPos, roomPoints, wallHeight]);

  // Pol ustidagi 2D/3D Sinxron Aerodinamik Havo Qamrovi Sektori (Sector Shape)
  const outerSectorShape = useMemo(() => {
    const s = new THREE.Shape();
    const radius = 3.2; // 3.2 metr qamrov masofasi
    const angleStart = -Math.PI / 6; // -30°
    const angleEnd = Math.PI / 6;    // +30°

    s.moveTo(0, 0);
    const steps = 24;
    for (let i = 0; i <= steps; i++) {
      const a = angleStart + (angleEnd - angleStart) * (i / steps);
      s.lineTo(Math.sin(a) * radius, Math.cos(a) * radius);
    }
    s.lineTo(0, 0);
    return s;
  }, []);

  const innerSectorShape = useMemo(() => {
    const s = new THREE.Shape();
    const radius = 1.4; // 1.4 metr sovuq core masofasi
    const angleStart = -Math.PI / 7;
    const angleEnd = Math.PI / 7;

    s.moveTo(0, 0);
    const steps = 16;
    for (let i = 0; i <= steps; i++) {
      const a = angleStart + (angleEnd - angleStart) * (i / steps);
      s.lineTo(Math.sin(a) * radius, Math.cos(a) * radius);
    }
    s.lineTo(0, 0);
    return s;
  }, []);

  // 5 ta Ingichka Vektor Nurlari (CFD Air Streamlines)
  const streamlines = useMemo(() => {
    const lines = [];
    const numRays = 5;
    const dropY = wallHeight - 0.5;
    
    for (let i = 0; i < numRays; i++) {
      const angle = (-Math.PI / 6) + (Math.PI / 3) * (i / (numRays - 1));
      const endX = Math.sin(angle) * 3.0;
      const endZ = Math.cos(angle) * 3.0;

      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0, 0.1),
        new THREE.Vector3(endX * 0.4, -dropY * 0.5, endZ * 0.4),
        new THREE.Vector3(endX, -dropY + 0.05, endZ)
      ]);
      lines.push(curve);
    }
    return lines;
  }, [wallHeight]);

  return (
    <group position={pos as [number, number, number]} rotation={[0, rotY, 0]}>
      {/* 1. Split Konditsioner Sleek Korpusi */}
      <mesh castShadow>
        <boxGeometry args={[1.15, 0.35, 0.26]} />
        <meshStandardMaterial color="#CBD5E1" roughness={0.3} />
      </mesh>

      {/* Oq mat korpus */}
      <mesh position={[0, 0, 0.02]}>
        <boxGeometry args={[1.1, 0.31, 0.24]} />
        <meshStandardMaterial color="#F8FAFC" roughness={0.2} metalness={0.1} />
      </mesh>

      {/* Displeyi */}
      <mesh position={[0.3, 0.02, 0.142]}>
        <boxGeometry args={[0.16, 0.08, 0.01]} />
        <meshBasicMaterial color="#0284C7" />
      </mesh>

      {/* Jalyuzi Havo Panjarasi */}
      <mesh position={[0, -0.14, 0.06]} rotation={[0.4, 0, 0]}>
        <boxGeometry args={[0.95, 0.03, 0.12]} />
        <meshStandardMaterial color="#334155" roughness={0.5} />
      </mesh>

      {/* 2. Ince va Nafis CFD Vektor Havo Oqimlari (5 ta Nur) */}
      {streamlines.map((curve, idx) => (
        <mesh key={`stream_${idx}`}>
          <tubeGeometry args={[curve, 32, 0.012, 6, false]} />
          <meshBasicMaterial color="#38BDF8" transparent opacity={0.45} />
        </mesh>
      ))}

      {/* 3. POL USTIDAGI SOVUTISh QAMROV SEKTORI (Xona Ichiga Qaratilgan Sleek Fan Sector) */}
      <group position={[0, -(wallHeight - 0.47), 0.1]} rotation={[Math.PI / 2, 0, 0]}>
        {/* Tashqi Yumshoq Qamrov Maydoni (+22°C Comfort Zone) */}
        <mesh position={[0, 0, 0.01]}>
          <shapeGeometry args={[outerSectorShape]} />
          <meshBasicMaterial color="#38BDF8" transparent opacity={0.18} side={THREE.DoubleSide} />
        </mesh>

        {/* Ichki Eng Sovuq Core Zone (+18°C Cold Core) */}
        <mesh position={[0, 0, 0.02]}>
          <shapeGeometry args={[innerSectorShape]} />
          <meshBasicMaterial color="#0284C7" transparent opacity={0.32} side={THREE.DoubleSide} />
        </mesh>
      </group>
    </group>
  );
};

// 9. 3D Tyoply Pol Quvurlari
const Pipes3D = ({ circuits, roomPoints }: { circuits: any[]; roomPoints: any[] }) => {
  const pipeCurves = useMemo(() => {
    const curves: { pts: THREE.Vector3[]; isFeed: boolean }[] = [];

    const safeParse = (pointsStr: string, isFeed: boolean) => {
      if (!pointsStr) return;
      const raw = pointsStr.trim().split(/\s+/).map(p => {
        const parts = p.split(',');
        if (parts.length < 2) return null;
        const x = parseFloat(parts[0]) / PIXELS_PER_METER;
        const y = parseFloat(parts[1]) / PIXELS_PER_METER;
        if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
        return new THREE.Vector3(x, 0.06, y);
      }).filter(Boolean) as THREE.Vector3[];

      const cleanPts: THREE.Vector3[] = [];
      for (let i = 0; i < raw.length; i++) {
        if (i === 0) {
          cleanPts.push(raw[i]);
        } else {
          const prev = cleanPts[cleanPts.length - 1];
          const dist = Math.hypot(raw[i].x - prev.x, raw[i].z - prev.z);
          if (dist > 0.03) {
            cleanPts.push(raw[i]);
          }
        }
      }

      if (cleanPts.length >= 2) {
        curves.push({ pts: cleanPts, isFeed });
      }
    };

    if (circuits && circuits.length > 0) {
      circuits.forEach(c => {
        if (c.feedPoints) safeParse(c.feedPoints, true);
        if (c.returnPoints) safeParse(c.returnPoints, false);
      });
    }

    if (curves.length === 0 && roomPoints.length >= 3) {
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      roomPoints.forEach(p => {
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.y > maxY) maxY = p.y;
      });

      const inset = 0.35;
      const ptsFeed: THREE.Vector3[] = [];
      const ptsRet: THREE.Vector3[] = [];
      const steps = 4;
      
      for (let s = 0; s < steps; s++) {
        const d = inset + s * 0.28;
        if (minX + d >= maxX - d || minY + d >= maxY - d) break;
        ptsFeed.push(new THREE.Vector3(minX + d, 0.06, minY + d));
        ptsFeed.push(new THREE.Vector3(maxX - d, 0.06, minY + d));
        ptsFeed.push(new THREE.Vector3(maxX - d, 0.06, maxY - d));
        ptsFeed.push(new THREE.Vector3(minX + d + 0.15, 0.06, maxY - d));

        ptsRet.push(new THREE.Vector3(minX + d + 0.12, 0.05, minY + d + 0.12));
        ptsRet.push(new THREE.Vector3(maxX - d - 0.12, 0.05, minY + d + 0.12));
        ptsRet.push(new THREE.Vector3(maxX - d - 0.12, 0.05, maxY - d - 0.12));
      }

      if (ptsFeed.length >= 2) curves.push({ pts: ptsFeed, isFeed: true });
      if (ptsRet.length >= 2) curves.push({ pts: ptsRet, isFeed: false });
    }

    return curves;
  }, [circuits, roomPoints]);

  return (
    <>
      {pipeCurves.map((c, i) => (
        <mesh key={`pipe_${i}`}>
          <tubeGeometry args={[new THREE.CatmullRomCurve3(c.pts, false, 'catmullrom', 0.1), 128, 0.025, 8, false]} />
          <meshStandardMaterial color={c.isFeed ? "#EF4444" : "#0284C7"} roughness={0.2} metalness={0.2} />
        </mesh>
      ))}
    </>
  );
};

export const RoomCanvas3D: React.FC<RoomCanvas3DProps> = ({
  isFullscreen = false,
  onToggleFullscreen,
  wallHeightM = 3.0,
}) => {
  const insets = useSafeAreaInsets();
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);

  const {
    roomPoints,
    walls,
    interiorWalls,
    doors,
    windows,
    furniture,
    seasonMode,
    acPosition,
    manifoldPosition,
    boilerPosition,
  } = useCanvasStore(
    useShallow(s => ({
      roomPoints: s.roomPoints,
      walls: s.walls,
      interiorWalls: s.interiorWalls,
      doors: s.doors,
      windows: s.windows,
      furniture: s.furniture,
      seasonMode: s.seasonMode,
      acPosition: s.acPosition,
      manifoldPosition: s.manifoldPosition,
      boilerPosition: s.boilerPosition,
    }))
  );

  const validPoints = useMemo(() => {
    return (roomPoints || []).filter((p) => p && Number.isFinite(p.x) && Number.isFinite(p.y));
  }, [roomPoints]);

  const { circuits } = useMemo(() => {
    if ((roomPoints || []).length < 3) return { circuits: [] };
    return generateRealisticFloorHeating(
      roomPoints,
      manifoldPosition,
      interiorWalls || [],
      [],
      'spiral',
      doors || [],
      windows || [],
      boilerPosition,
      furniture || [],
      0,
      walls || []
    );
  }, [roomPoints, manifoldPosition, interiorWalls, doors, windows, boilerPosition, furniture, walls]);

  const centroid = useMemo(() => {
    if (validPoints.length === 0) return { x: 0, y: 0 };
    let cx = 0, cy = 0;
    validPoints.forEach(p => { cx += p.x; cy += p.y; });
    return { x: cx / validPoints.length, y: cy / validPoints.length };
  }, [validPoints]);

  const orbitRef = useRef<any>(null);

  const acPositions3D = useMemo(() => {
    if (validPoints.length < 3) return [{ x: 1.2, y: 0.5, targetAngle: 90 }];
    const res = calculateAcCountAndPositions(validPoints, 0, wallHeightM, windows ? windows.length : 0, false);
    return (res.positions && res.positions.length > 0) ? res.positions : [{ x: 1.2, y: 0.5, targetAngle: 90 }];
  }, [validPoints, wallHeightM, windows?.length]);

  const handleZoomIn = () => {
    if (orbitRef.current) {
      orbitRef.current.dollyIn(1.25);
      orbitRef.current.update();
    }
  };

  const handleZoomOut = () => {
    if (orbitRef.current) {
      orbitRef.current.dollyOut(1.25);
      orbitRef.current.update();
    }
  };

  const handleResetZoom = () => {
    if (orbitRef.current) {
      orbitRef.current.reset();
    }
  };

  const panResponder3D = useMemo(() => {
    let lastPinchDist = 0;
    let lastTouch = { x: 0, y: 0 };

    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const touches = evt.nativeEvent.touches;
        if (touches && touches.length >= 2) {
          lastPinchDist = Math.hypot(touches[1].pageX - touches[0].pageX, touches[1].pageY - touches[0].pageY);
        } else if (touches && touches.length === 1) {
          lastTouch = { x: touches[0].pageX, y: touches[0].pageY };
        }
      },
      onPanResponderMove: (evt) => {
        const touches = evt.nativeEvent.touches;
        if (!orbitRef.current) return;

        if (touches && touches.length >= 2) {
          // 2-BARMOQ PINCH ZOOM (Yaqinlashganda -> YAQINLASHISH, Uzoqlashganda -> UZOQLASHISH)
          const currentDist = Math.hypot(touches[1].pageX - touches[0].pageX, touches[1].pageY - touches[0].pageY);
          if (lastPinchDist > 0) {
            const distDelta = currentDist - lastPinchDist;
            if (distDelta < -1.5) {
              if (typeof orbitRef.current.dollyIn === 'function') {
                orbitRef.current.dollyIn(1.025);
                orbitRef.current.update();
              }
            } else if (distDelta > 1.5) {
              if (typeof orbitRef.current.dollyOut === 'function') {
                orbitRef.current.dollyOut(1.025);
                orbitRef.current.update();
              }
            }
          }
          lastPinchDist = currentDist;
        } else if (touches && touches.length === 1) {
          // 1-BARMOQ 360° SPHERICAL AYLANISH (Sof Three.js Spherical Orbit)
          const dx = touches[0].pageX - lastTouch.x;
          const dy = touches[0].pageY - lastTouch.y;
          lastTouch = { x: touches[0].pageX, y: touches[0].pageY };

          const camera = orbitRef.current.object;
          if (camera) {
            const spherical = new THREE.Spherical().setFromVector3(camera.position);
            spherical.theta -= (2 * Math.PI * dx) / 500;
            spherical.phi -= (2 * Math.PI * dy) / 500;
            spherical.phi = Math.max(0.05, Math.min(Math.PI / 2 - 0.02, spherical.phi));
            camera.position.setFromSpherical(spherical);
            camera.lookAt(0, 0, 0);
            orbitRef.current.update();
          }
        }
      },
      onPanResponderRelease: () => {
        lastPinchDist = 0;
      },
    });
  }, []);

  if (validPoints.length < 3) {
    return (
      <View style={[isFullscreen ? styles.fullscreenContainer : styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: '#94A3B8', fontSize: 13, fontWeight: '600' }}>
          3D Sahnani ko'rish uchun avval 2D xonani chizing
        </Text>
      </View>
    );
  }

  return (
    <View style={isFullscreen ? styles.fullscreenContainer : styles.container} {...panResponder3D.panHandlers}>
      {/* Fullscreen Header / Controls */}
      {isFullscreen && (
        <View style={[styles.fullscreenHeader, { paddingTop: insets.top || 16 }]} pointerEvents="box-none">
          <View style={styles.fsHeaderLeft}>
            <Box size={20} color={COLORS.primaryLight} />
            <View>
              <Text style={styles.fsTitle}>🏢 3D Fazo Simulyatsiyasi</Text>
              <Text style={styles.fsSub}>360° burish va Zoom tugmalari yordamida ko'rish</Text>
            </View>
          </View>
          {onToggleFullscreen && (
            <TouchableOpacity style={styles.closeFsBtn} onPress={onToggleFullscreen} activeOpacity={0.8}>
              <X size={20} color={COLORS.surface} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* WebGL 3D Canvas */}
      <Canvas shadows={false} camera={{ position: [0, 8, 10], fov: 45, near: 0.1, far: 200 }}>
        <OrbitUpdater orbitRef={orbitRef} />
        <Suspense fallback={null}>
          <Sky sunPosition={[10, 20, 10]} />
          <ambientLight intensity={0.9} />
          <directionalLight position={[5, 12, 5]} intensity={1.5} />
          
          <group position={[-centroid.x, 0, -centroid.y]}>
            <Floor roomPoints={validPoints} />
            <Walls roomPoints={validPoints} wallHeight={wallHeightM} walls={walls} />
            <InteriorWalls3D interiorWalls={interiorWalls} wallHeight={wallHeightM} />
            <Doors3D doors={doors} wallHeight={wallHeightM} />
            <Windows3D windows={windows} wallHeight={wallHeightM} />
            <Furnitures3D items={furniture} />
            
            {/* Qishgi Rejimda: Tyoply pol quvurlari, Kollektor va Qozon */}
            {seasonMode === 'winter' && (
              <>
                <Pipes3D circuits={circuits} roomPoints={validPoints} />
                <Manifold3D manifoldPos={manifoldPosition} roomPoints={validPoints} />
                <Boiler3D boilerPos={boilerPosition} roomPoints={validPoints} />
              </>
            )}

            {/* Yozgi Rejimda: Professional CFD Vektor Havo Oqimi Simulyatsiyasi (Barcha Konditsionerlar) */}
            {seasonMode === 'summer' && (
              <>
                {acPositions3D.map((pos, idx) => (
                  <AirConditioner3D key={`ac3d_${idx}`} acPos={pos} roomPoints={validPoints} wallHeight={wallHeightM} />
                ))}
              </>
            )}
          </group>

          <OrbitControls
            ref={orbitRef}
            makeDefault
            target={[0, 0, 0]}
            enablePan={false}
            enableZoom={true}
            enableRotate={true}
            enableDamping={false}
            rotateSpeed={0.85}
            zoomSpeed={0.85}
            minDistance={1.5}
            maxDistance={50}
            minPolarAngle={0.05}
            maxPolarAngle={Math.PI / 2 - 0.02}
            touches={{
              ONE: THREE.TOUCH.ROTATE,
              TWO: THREE.TOUCH.DOLLY,
            }}
          />
        </Suspense>
      </Canvas>

      {/* Interaktiv Zoom Tugmalari (+ / - / Reset) */}
      <View style={styles.zoomControlBar} pointerEvents="box-none">
        <TouchableOpacity style={styles.zoomBtn} onPress={handleZoomIn} activeOpacity={0.8}>
          <Plus size={16} color={COLORS.surface} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.zoomBtn} onPress={handleZoomOut} activeOpacity={0.8}>
          <Minus size={16} color={COLORS.surface} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.zoomBtn} onPress={handleResetZoom} activeOpacity={0.8}>
          <RotateCcw size={14} color={COLORS.surface} />
        </TouchableOpacity>
      </View>

      {/* Card Overlay & Expand Button */}
      {!isFullscreen && (
        <View style={styles.overlayRow}>
          <View style={styles.overlayBadge}>
            <Text style={styles.overlayText}>
              {seasonMode === 'winter' ? '🔥 3D Tyoply Pol & Kotyol' : '❄️ 3D HVAC Sovutish Simulyatsiyasi'}
            </Text>
          </View>

          {onToggleFullscreen && (
            <TouchableOpacity style={styles.expandBtn} onPress={onToggleFullscreen} activeOpacity={0.8}>
              <Maximize2 size={13} color={COLORS.surface} />
              <Text style={styles.expandBtnText}>Katta Ekran</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 380,
    backgroundColor: '#0F172A',
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    marginVertical: 6,
    borderWidth: 1,
    borderColor: '#334155',
    position: 'relative',
  },
  fullscreenContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#0F172A',
    position: 'relative',
  },
  fullscreenHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
  },
  fsHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  fsTitle: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '800',
  },
  fsSub: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 1,
  },
  closeFsBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayRow: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 5,
  },
  overlayBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: RADIUS.sm,
  },
  overlayText: {
    color: '#38BDF8',
    fontSize: 10.5,
    fontWeight: 'bold',
  },
  expandBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 118, 110, 0.9)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    gap: 5,
    ...SHADOWS.button,
  },
  expandBtnText: {
    color: COLORS.surface,
    fontSize: 11,
    fontWeight: '700',
  },
  zoomControlBar: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    zIndex: 10,
    flexDirection: 'column',
    gap: 6,
  },
  zoomBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(15, 118, 110, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.button,
  },
});