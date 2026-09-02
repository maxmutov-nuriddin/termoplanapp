import { IPoint } from '../types';

export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export interface ScreenPoint {
  x: number;
  y: number;
}

/**
 * 3D Fazodagi koordinatani (X, Y, Z) 2D ekranga aylantirish (Isometrik va Aksonometrik proeksiya)
 * @param pt - 3D koordinata (metrlarda)
 * @param rotateDeg - gorizontal aylanish burchagi (0 - 360°)
 * @param tiltDeg - vertikal egilish burchagi (20 - 80°)
 * @param scale - masshtab (piksel/metr)
 * @param origin - ekran markazi
 */
export function project3DTo2D(
  pt: Point3D,
  rotateDeg: number = 45,
  tiltDeg: number = 35,
  scale: number = 35,
  origin: ScreenPoint = { x: 180, y: 160 }
): ScreenPoint {
  const rotRad = (rotateDeg * Math.PI) / 180;
  const tiltRad = (tiltDeg * Math.PI) / 180;

  // Gorizontal aylanish (Z o'qi atrofida)
  const rotX = pt.x * Math.cos(rotRad) - pt.y * Math.sin(rotRad);
  const rotY = pt.x * Math.sin(rotRad) + pt.y * Math.cos(rotRad);

  // Vertikal egilish (Isometrik / Aksonometrik)
  const screenX = origin.x + rotX * scale;
  const screenY = origin.y + (rotY * Math.sin(tiltRad) - pt.z * Math.cos(tiltRad)) * scale;

  return {
    x: parseFloat(screenX.toFixed(2)),
    y: parseFloat(screenY.toFixed(2)),
  };
}

/**
 * 3D Qirra (Edge) va Yuzalar (Faces) hosil qilish
 */
export function createExtrudedWallFaces(
  polygon2D: IPoint[],
  wallHeightM: number = 3.0,
  rotateDeg: number,
  tiltDeg: number,
  scale: number,
  origin: ScreenPoint
) {
  const n = polygon2D.length;
  const bottomPoints3D: Point3D[] = polygon2D.map((p) => ({ x: p.x, y: p.y, z: 0 }));
  const topPoints3D: Point3D[] = polygon2D.map((p) => ({ x: p.x, y: p.y, z: wallHeightM }));

  const bottom2D = bottomPoints3D.map((p) => project3DTo2D(p, rotateDeg, tiltDeg, scale, origin));
  const top2D = topPoints3D.map((p) => project3DTo2D(p, rotateDeg, tiltDeg, scale, origin));

  const wallFaces: Array<{
    id: string;
    pointsStr: string;
    normalAngle: number;
    color: string;
    isHighlighted: boolean;
  }> = [];

  for (let i = 0; i < n; i++) {
    const next = (i + 1) % n;
    const b1 = bottom2D[i];
    const b2 = bottom2D[next];
    const t2 = top2D[next];
    const t1 = top2D[i];

    // Devor yuzasi poligoni
    const pointsStr = `${b1.x},${b1.y} ${b2.x},${b2.y} ${t2.x},${t2.y} ${t1.x},${t1.y}`;

    // Yorug'lik soyasi (Shading)
    const dx = polygon2D[next].x - polygon2D[i].x;
    const dy = polygon2D[next].y - polygon2D[i].y;
    const wallAngle = Math.atan2(dy, dx) * (180 / Math.PI);
    const shadeFactor = Math.abs(Math.sin((wallAngle + rotateDeg) * (Math.PI / 180)));
    const baseColorVal = Math.round(50 + shadeFactor * 50);
    const color = `rgb(${baseColorVal + 20}, ${baseColorVal + 30}, ${baseColorVal + 45})`;

    wallFaces.push({
      id: `wall_face_${i}`,
      pointsStr,
      normalAngle: wallAngle,
      color,
      isHighlighted: i === 0,
    });
  }

  const floorPolygonStr = bottom2D.map((p) => `${p.x},${p.y}`).join(' ');
  const ceilingOutlineStr = top2D.map((p) => `${p.x},${p.y}`).join(' ');

  return {
    bottom2D,
    top2D,
    floorPolygonStr,
    ceilingOutlineStr,
    wallFaces,
  };
}
