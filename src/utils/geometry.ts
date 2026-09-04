const EMPTY_GUIDELINES: Array<{ type: 'x' | 'y'; val: number }> = [];
import { IPoint, IWall } from '../types';
import { calculateMasterPlumberPlan, getHeatableArea } from './masterPlumberEngine';

export const PIXELS_PER_METER = 40;

/**
 * Ikki nuqta orasidagi masofani hisoblash (metrda)
 */
export function distanceBetweenPoints(p1: IPoint, p2: IPoint): number {
  if (!p1 || !p2) return 0;
  return parseFloat(Math.hypot(p2.x - p1.x, p2.y - p1.y).toFixed(2));
}

/**
 * Nuqtani to'g'ri chiziq kesmasiga proyeksiyalash (eng yaqin nuqta va masofa)
 */
export function projectPointOnSegment(
  p: IPoint,
  a: IPoint,
  b: IPoint
): { point: IPoint; distance: number; angleDeg: number } {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;

  if (lenSq === 0) {
    return {
      point: a,
      distance: distanceBetweenPoints(p, a),
      angleDeg: 0,
    };
  }

  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));

  const proj: IPoint = {
    x: parseFloat((a.x + t * dx).toFixed(2)),
    y: parseFloat((a.y + t * dy).toFixed(2)),
  };

  const angleDeg = ((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360;

  return {
    point: proj,
    distance: distanceBetweenPoints(p, proj),
    angleDeg: parseFloat(angleDeg.toFixed(1)),
  };
}

/**
 * Eng yaqin devorga magnit yopishish (Snap to Wall)
 */
export function findNearestWallSnap(
  point: IPoint,
  roomPoints: IPoint[] = [],
  thresholdM = 1.0,
  interiorWalls: Array<{ id?: string; startPoint: IPoint; endPoint: IPoint }> = []
): {
  snapped: boolean;
  position: IPoint;
  rotation: number;
  wallIndex: number;
  interiorWallId?: string;
  distance: number;
} {
  const valid = (roomPoints || []).filter((p) => p && Number.isFinite(p.x) && Number.isFinite(p.y));

  let minDistance = Infinity;
  let bestProj = point;
  let bestAngle = 0;
  let bestWallIdx = -1;
  let bestIntWallId: string | undefined = undefined;

  // 1. Tashqi devorlarni tekshirish
  if (valid.length >= 2) {
    const n = valid.length;
    for (let i = 0; i < n; i++) {
      const a = valid[i];
      const b = valid[(i + 1) % n];
      const { point: proj, distance, angleDeg } = projectPointOnSegment(point, a, b);

      if (distance < minDistance) {
        minDistance = distance;
        bestProj = proj;
        bestAngle = angleDeg;
        bestWallIdx = i;
        bestIntWallId = undefined;
      }
    }
  }

  // 2. Ichki devorlarni tekshirish (Interior Partition Walls)
  for (const iw of interiorWalls || []) {
    if (!iw.startPoint || !iw.endPoint) continue;
    const { point: proj, distance, angleDeg } = projectPointOnSegment(point, iw.startPoint, iw.endPoint);
    if (distance < minDistance) {
      minDistance = distance;
      bestProj = proj;
      bestAngle = angleDeg;
      bestWallIdx = -1;
      bestIntWallId = iw.id;
    }
  }

  if (minDistance <= thresholdM) {
    return {
      snapped: true,
      position: bestProj,
      rotation: bestAngle,
      wallIndex: bestWallIdx,
      interiorWallId: bestIntWallId,
      distance: minDistance,
    };
  }

  return {
    snapped: false,
    position: point,
    rotation: 0,
    wallIndex: -1,
    distance: minDistance,
  };
}

/**
 * Burchak (Vertex) yoki Devorga (Wall/T-Junction) to'liq magnit ulanish (Smart CAD Joint Snap)
 */
export function findNearestVertexOrWallSnap(
  point: IPoint,
  roomPoints: IPoint[] = [],
  interiorWalls: Array<{ startPoint: IPoint; endPoint: IPoint }> = [],
  thresholdM = 0.45
): {
  snapped: boolean;
  position: IPoint;
  rotation: number;
  isCorner: boolean;
  targetType: 'corner' | 'wall' | 'interior_wall';
} {
  // 1. Avval barcha mavjud burchaklar va tugunlarni tekshiramiz (Corner Snapping)
  const allVertices: IPoint[] = [...(roomPoints || [])];
  for (const iw of interiorWalls || []) {
    if (iw.startPoint) allVertices.push(iw.startPoint);
    if (iw.endPoint) allVertices.push(iw.endPoint);
  }

  let minVertDist = Infinity;
  let bestVert: IPoint = point;

  for (const v of allVertices) {
    if (!v || !Number.isFinite(v.x) || !Number.isFinite(v.y)) continue;
    const d = distanceBetweenPoints(point, v);
    if (d < minVertDist) {
      minVertDist = d;
      bestVert = v;
    }
  }

  if (minVertDist <= thresholdM) {
    return {
      snapped: true,
      position: { x: parseFloat(bestVert.x.toFixed(2)), y: parseFloat(bestVert.y.toFixed(2)) },
      rotation: 0,
      isCorner: true,
      targetType: 'corner',
    };
  }

  // 2. Agar burchak topilmasa, eng yaqin tashqi devorga tushiramiz (T-Junction on Outer Wall)
  const outerSnap = findNearestWallSnap(point, roomPoints, thresholdM);
  if (outerSnap.snapped) {
    return {
      snapped: true,
      position: outerSnap.position,
      rotation: outerSnap.rotation,
      isCorner: false,
      targetType: 'wall',
    };
  }

  // 3. Ichki devorlarga tushirish (T-Junction on Interior Wall)
  let minIntDist = Infinity;
  let bestIntProj: IPoint = point;
  let bestIntAngle = 0;

  for (const iw of interiorWalls || []) {
    if (!iw.startPoint || !iw.endPoint) continue;
    const { point: proj, distance, angleDeg } = projectPointOnSegment(point, iw.startPoint, iw.endPoint);
    if (distance < minIntDist) {
      minIntDist = distance;
      bestIntProj = proj;
      bestIntAngle = angleDeg;
    }
  }

  if (minIntDist <= thresholdM) {
    return {
      snapped: true,
      position: bestIntProj,
      rotation: bestIntAngle,
      isCorner: false,
      targetType: 'interior_wall',
    };
  }

  return {
    snapped: false,
    position: point,
    rotation: 0,
    isCorner: false,
    targetType: 'wall',
  };
}

/**
 * Devor chizishda 90° to'g'ri burchak va to'g'ri chiziq tekislash (Ortho & Cross-Vertex Alignment)
 */
export function snapWallOrthoAngle(
  startPoint: IPoint,
  rawEndPoint: IPoint,
  roomPoints: IPoint[] = [],
  interiorWalls: Array<{ startPoint: IPoint; endPoint: IPoint }> = []
): { endPoint: IPoint; isOrtho: boolean; guidelines: Array<{ type: 'x' | 'y'; val: number }> } {
  const dx = rawEndPoint.x - startPoint.x;
  const dy = rawEndPoint.y - startPoint.y;
  const angleDeg = ((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360;

  let snappedEnd = { ...rawEndPoint };
  let isOrtho = false;
  const guidelines: Array<{ type: 'x' | 'y'; val: number }> = [];

  // 1. Gorizontal tekislash (0° yoki 180°)
  if (Math.abs(angleDeg - 0) < 18 || Math.abs(angleDeg - 360) < 18 || Math.abs(angleDeg - 180) < 18) {
    snappedEnd.y = startPoint.y;
    isOrtho = true;
    guidelines.push({ type: 'y', val: startPoint.y });
  }
  // 2. Vertikal tekislash (90° yoki 270°)
  else if (Math.abs(angleDeg - 90) < 18 || Math.abs(angleDeg - 270) < 18) {
    snappedEnd.x = startPoint.x;
    isOrtho = true;
    guidelines.push({ type: 'x', val: startPoint.x });
  }

  // 3. Barcha boshqa mavjud burchaklar bilan X va Y tekisligini tutashtirish (Cross-Vertex Laser Lines)
  const allOtherVertices: IPoint[] = [...(roomPoints || [])];
  for (const iw of interiorWalls || []) {
    if (iw.startPoint) allOtherVertices.push(iw.startPoint);
    if (iw.endPoint) allOtherVertices.push(iw.endPoint);
  }

  for (const v of allOtherVertices) {
    if (!v || !Number.isFinite(v.x) || !Number.isFinite(v.y)) continue;
    if (Math.abs(v.x - startPoint.x) < 0.05 && Math.abs(v.y - startPoint.y) < 0.05) continue;

    if (Math.abs(snappedEnd.x - v.x) < 0.22) {
      snappedEnd.x = v.x;
      guidelines.push({ type: 'x', val: v.x });
      isOrtho = true;
    }
    if (Math.abs(snappedEnd.y - v.y) < 0.22) {
      snappedEnd.y = v.y;
      guidelines.push({ type: 'y', val: v.y });
      isOrtho = true;
    }
  }

  // 4. Magnit burchak/devor snap bilan tekshirish
  const snapRes = findNearestVertexOrWallSnap(snappedEnd, roomPoints, interiorWalls, 0.45);
  if (snapRes.snapped) {
    snappedEnd = snapRes.position;
  }

  return {
    endPoint: {
      x: parseFloat(snappedEnd.x.toFixed(2)),
      y: parseFloat(snappedEnd.y.toFixed(2)),
    },
    isOrtho,
    guidelines,
  };
}

/**
 * Gauss (Shoelace) formulasi orqali poligon maydonini hisoblash (m²)
 */
export function calculatePolygonArea(points: IPoint[]): number {
  if (!points || points.length < 3) return 0;
  let area = 0;
  const n = points.length;

  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const p1 = points[i];
    const p2 = points[j];
    if (p1 && p2 && Number.isFinite(p1.x) && Number.isFinite(p1.y) && Number.isFinite(p2.x) && Number.isFinite(p2.y)) {
      area += p1.x * p2.y;
      area -= p2.x * p1.y;
    }
  }

  return parseFloat((Math.abs(area) / 2).toFixed(2));
}

/**
 * Poligon perimetrini hisoblash (m)
 */
export function calculatePolygonPerimeter(points: IPoint[]): number {
  if (!points || points.length < 2) return 0;
  let perimeter = 0;
  const n = points.length;

  for (let i = 0; i < n; i++) {
    const next = (i + 1) % n;
    perimeter += distanceBetweenPoints(points[i], points[next]);
  }

  return parseFloat(perimeter.toFixed(2));
}

/**
 * Poligonning markaziy og'irlik nuqtasi (Centroid)
 */
export function calculateCentroid(points: IPoint[]): IPoint {
  const valid = (points || []).filter((p) => p && Number.isFinite(p.x) && Number.isFinite(p.y));
  if (valid.length === 0) return { x: 3.5, y: 2.5 };
  let sumX = 0;
  let sumY = 0;
  for (const p of valid) {
    sumX += p.x;
    sumY += p.y;
  }
  return {
    x: parseFloat((sumX / valid.length).toFixed(2)),
    y: parseFloat((sumY / valid.length).toFixed(2)),
  };
}

/**
 * Gorizontal chiziqning poligon va ichki devorlar bilan kesishish segmentlarini topish
 * (Floor Heating Row Scanline Clipping)
 *
 * Berilgan Y qiymatida xona poligonini gorizontal chiziq bilan kesib, ichidagi segmentlarni qaytaradi.
 * Ichki devorlar orqali quvur o'tishini taqiqlaydi.
 */
function getPolygonLineSegments(
  y: number,
  polygon: IPoint[],
  interiorWalls: Array<{ startPoint: IPoint; endPoint: IPoint }> = [],
  margin = 0.28
): Array<{ xStart: number; xEnd: number }> {
  const intersections: number[] = [];
  const n = polygon.length;

  for (let i = 0; i < n; i++) {
    const p1 = polygon[i];
    const p2 = polygon[(i + 1) % n];

    if ((p1.y <= y && p2.y > y) || (p2.y <= y && p1.y > y)) {
      const t = (y - p1.y) / (p2.y - p1.y);
      const x = p1.x + t * (p2.x - p1.x);
      intersections.push(x);
    }
  }

  intersections.sort((a, b) => a - b);
  let rawSegments: Array<{ xStart: number; xEnd: number }> = [];

  for (let i = 0; i + 1 < intersections.length; i += 2) {
    const x1 = intersections[i] + margin;
    const x2 = intersections[i + 1] - margin;
    if (x2 > x1 + 0.35) {
      rawSegments.push({ xStart: x1, xEnd: x2 });
    }
  }

  // Ichki devorlar orqali quvur o'tishini taqiqlash (Wall Obstacle Clipping)
  for (const iw of interiorWalls || []) {
    if (!iw.startPoint || !iw.endPoint) continue;
    const minWy = Math.min(iw.startPoint.y, iw.endPoint.y);
    const maxWy = Math.max(iw.startPoint.y, iw.endPoint.y);
    const minWx = Math.min(iw.startPoint.x, iw.endPoint.x);
    const maxWx = Math.max(iw.startPoint.x, iw.endPoint.x);

    // Gorizontal ichki devor
    if (Math.abs(iw.startPoint.y - iw.endPoint.y) < 0.2 && Math.abs(y - minWy) < 0.25) {
      const wallMargin = 0.25;
      const splitSegments: Array<{ xStart: number; xEnd: number }> = [];
      for (const seg of rawSegments) {
        if (minWx > seg.xStart + wallMargin && maxWx < seg.xEnd - wallMargin) {
          if (minWx - wallMargin - seg.xStart > 0.35) {
            splitSegments.push({ xStart: seg.xStart, xEnd: minWx - wallMargin });
          }
          if (seg.xEnd - (maxWx + wallMargin) > 0.35) {
            splitSegments.push({ xStart: maxWx + wallMargin, xEnd: seg.xEnd });
          }
        } else if (Math.abs(seg.xStart - minWx) <= wallMargin || Math.abs(seg.xStart - maxWx) <= wallMargin) {
          if (seg.xEnd - (maxWx + wallMargin) > 0.35) {
            splitSegments.push({ xStart: maxWx + wallMargin, xEnd: seg.xEnd });
          }
        } else if (Math.abs(seg.xEnd - minWx) <= wallMargin || Math.abs(seg.xEnd - maxWx) <= wallMargin) {
          if (minWx - wallMargin - seg.xStart > 0.35) {
            splitSegments.push({ xStart: seg.xStart, xEnd: minWx - wallMargin });
          }
        } else {
          splitSegments.push(seg);
        }
      }
      rawSegments = splitSegments;
    }
    // Vertikal yoki qiya ichki devor
    else if (y >= minWy - 0.1 && y <= maxWy + 0.1) {
      const dy = iw.endPoint.y - iw.startPoint.y;
      const t = dy !== 0 ? (y - iw.startPoint.y) / dy : 0.5;
      const xWall = iw.startPoint.x + t * (iw.endPoint.x - iw.startPoint.x);
      const wallMargin = 0.25;

      const splitSegments: Array<{ xStart: number; xEnd: number }> = [];
      for (const seg of rawSegments) {
        if (xWall > seg.xStart + wallMargin && xWall < seg.xEnd - wallMargin) {
          if (xWall - wallMargin - seg.xStart > 0.35) {
            splitSegments.push({ xStart: seg.xStart, xEnd: xWall - wallMargin });
          }
          if (seg.xEnd - (xWall + wallMargin) > 0.35) {
            splitSegments.push({ xStart: xWall + wallMargin, xEnd: seg.xEnd });
          }
        } else if (Math.abs(seg.xStart - xWall) <= wallMargin) {
          if (seg.xEnd - (xWall + wallMargin) > 0.35) {
            splitSegments.push({ xStart: xWall + wallMargin, xEnd: seg.xEnd });
          }
        } else if (Math.abs(seg.xEnd - xWall) <= wallMargin) {
          if (xWall - wallMargin - seg.xStart > 0.35) {
            splitSegments.push({ xStart: seg.xStart, xEnd: xWall - wallMargin });
          }
        } else {
          splitSegments.push(seg);
        }
      }
      rawSegments = splitSegments;
    }
  }

  return rawSegments;
}

/**
 * Excluded Zone ichida qolgan segmentlarni kesib tashlash
 */
function clipSegmentsAgainstExcludedZone(
  segments: Array<{ xStart: number; xEnd: number }>,
  y: number,
  zonePoints: IPoint[]
): Array<{ xStart: number; xEnd: number }> {
  const zoneMinY = Math.min(...zonePoints.map(p => p.y));
  const zoneMaxY = Math.max(...zonePoints.map(p => p.y));
  if (y < zoneMinY || y > zoneMaxY) return segments;

  const zoneIntersections: number[] = [];
  const n = zonePoints.length;
  for (let i = 0; i < n; i++) {
    const p1 = zonePoints[i];
    const p2 = zonePoints[(i + 1) % n];
    if ((p1.y <= y && p2.y > y) || (p2.y <= y && p1.y > y)) {
      const t = (y - p1.y) / (p2.y - p1.y);
      const x = p1.x + t * (p2.x - p1.x);
      zoneIntersections.push(x);
    }
  }
  if (zoneIntersections.length < 2) return segments;
  zoneIntersections.sort((a, b) => a - b);

  const result: Array<{ xStart: number; xEnd: number }> = [];
  for (const seg of segments) {
    let remaining = [seg];
    for (let i = 0; i + 1 < zoneIntersections.length; i += 2) {
      const zStart = zoneIntersections[i] - 0.05;
      const zEnd = zoneIntersections[i + 1] + 0.05;
      const nextRemaining: Array<{ xStart: number; xEnd: number }> = [];
      for (const r of remaining) {
        if (r.xEnd <= zStart || r.xStart >= zEnd) {
          nextRemaining.push(r);
        } else {
          if (r.xStart < zStart && zStart - r.xStart > 0.3) {
            nextRemaining.push({ xStart: r.xStart, xEnd: zStart });
          }
          if (r.xEnd > zEnd && r.xEnd - zEnd > 0.3) {
            nextRemaining.push({ xStart: zEnd, xEnd: r.xEnd });
          }
        }
      }
      remaining = nextRemaining;
    }
    result.push(...remaining);
  }
  return result;
}

/**
 * Haqiqiy Muhandislik — Serpentine (Yilansimon) Bifilar Tyoply Pol Quvurlari
 *
 * TOPOLOGIYA:
 *  QIZIL (Feed / Подача +45°C):
 *    Tashqi track — yilansimon (chapdan-o'ngga → vertikal tushish → o'ngdan-chapga → ...)
 *    Barcha qatorlarni ketma-ket bosib o'tadi.
 *
 *  KO'K (Return / Обратка +35°C):
 *    Ichki track (6 sm offset) — Feed ning teskari yo'nalishda
 *    (oxirgi qatordan birinchisiga qarab) aynan shu qatorlar bo'ylab qaytadi.
 *
 *  KAFOLAT: Feed va Return turli tracklarda (outer vs inner offset),
 *  burilishlari perimetrning qarama-qarshi tomonlarida,
 *  barcha o'tishlar faqat 90° vertikal segment — HECH QACHON kesishmaydi.
 */
export interface FloorHeatingCircuit {
  id: string;
  feedPoints: string;
  returnPoints: string;
  transitFeed?: string;
  transitReturn?: string;
  lengthM: number;
  areaM2: number;
}

export interface FloorHeatingResult {
  circuits: FloorHeatingCircuit[];
  boilerSupplyMain?: string;
  boilerReturnMain?: string;
  feedPoints: string;
  returnPoints: string;
  totalLengthM: number;
}

export function generateRealisticFloorHeating(
  roomPoints: IPoint[],
  manifoldPos?: IPoint | null,
  interiorWalls: Array<{ startPoint: IPoint; endPoint: IPoint }> = [],
  excludedZones: Array<{ points: IPoint[] }> = [],
  patternType: 'spiral' | 'double_snake' | 'single_snake' | 'border_zone' = 'spiral',
  doors: Array<{ position: IPoint; width?: number }> = [],
  windows: Array<{ position: IPoint; width?: number }> = [],
  boilerPos?: IPoint | null,
  furniture: any[] = [],
  compassNorthAngle: number = 0,
  walls: IWall[] = []
): FloorHeatingResult {
  const valid = (roomPoints || []).filter((p) => p && Number.isFinite(p.x) && Number.isFinite(p.y));
  if (valid.length < 3) {
    return { circuits: [], feedPoints: '', returnPoints: '', totalLengthM: 0 };
  }

  const plan = calculateMasterPlumberPlan(
    valid,
    manifoldPos,
    boilerPos,
    interiorWalls as any,
    excludedZones,
    doors as any,
    windows as any,
    furniture,
    'Xona',
    'living_room',
    compassNorthAngle,
    walls
  );

  const circuits: FloorHeatingCircuit[] = plan.circuits.map((c) => ({
    id: c.id,
    feedPoints: c.feedPoints,
    returnPoints: c.returnPoints,
    lengthM: c.pipeLengthM,
    areaM2: c.areaM2,
  }));

  const allFeedStr = circuits.map((c) => c.feedPoints).filter(Boolean).join(' ');
  const allReturnStr = circuits.map((c) => c.returnPoints).filter(Boolean).join(' ');

  return {
    circuits,
    boilerSupplyMain: plan.boilerSupplyMain,
    boilerReturnMain: plan.boilerReturnMain,
    feedPoints: allFeedStr,
    returnPoints: allReturnStr,
    totalLengthM: plan.totalPipeLengthM,
  };
}

export const ROOM_PRESETS = {
  RECTANGLE: (w = 6.0, h = 4.0): IPoint[] => [
    { x: 1.0, y: 1.0 },
    { x: 1.0 + w, y: 1.0 },
    { x: 1.0 + w, y: 1.0 + h },
    { x: 1.0, y: 1.0 + h },
  ],
  L_SHAPE: (): IPoint[] => [
    { x: 1.0, y: 1.0 },
    { x: 6.0, y: 1.0 },
    { x: 6.0, y: 3.5 },
    { x: 3.5, y: 3.5 },
    { x: 3.5, y: 5.5 },
    { x: 1.0, y: 5.5 },
  ],
  T_SHAPE: (): IPoint[] => [
    { x: 2.5, y: 1.0 },
    { x: 5.5, y: 1.0 },
    { x: 5.5, y: 3.0 },
    { x: 7.0, y: 3.0 },
    { x: 7.0, y: 5.5 },
    { x: 1.0, y: 5.5 },
    { x: 1.0, y: 3.0 },
    { x: 2.5, y: 3.0 },
  ],
};

/**
 * Vergul (,) yoki nuqta (.) bilan yozilgan o'lchamlarni to'g'ri float songa aylantirish
 */
export function parseLocalizedFloat(val: string | number): number {
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  if (!val || typeof val !== 'string') return 0;
  const sanitized = val.replace(',', '.').replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(sanitized);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Burchaklarni bir-biri bilan parallel va 90° to'g'ri burchakda tekislash (Smart Ortho & Parallel Snap)
 */
export function snapPointToOrthoAndParallel(
  point: IPoint,
  allPoints: IPoint[],
  excludeIndex = -1,
  thresholdM = 0.20
): {
  point: IPoint;
  snappedPoint: IPoint;
  guidelines: Array<{ type: 'x' | 'y'; val: number }>;
  guides: Array<{ type: 'x' | 'y'; val: number }>;
  snapped: boolean;
  isOrtho: boolean;
} {
  let snappedX = point.x;
  let snappedY = point.y;
  const guidelines: Array<{ type: 'x' | 'y'; val: number }> = [];
  let snapped = false;

  for (let i = 0; i < allPoints.length; i++) {
    if (i === excludeIndex) continue;
    const ref = allPoints[i];
    if (!ref) continue;

    // X bo'yicha tekislash
    if (Math.abs(point.x - ref.x) <= thresholdM) {
      snappedX = ref.x;
      guidelines.push({ type: 'x', val: ref.x });
      snapped = true;
    }

    // Y bo'yicha tekislash
    if (Math.abs(point.y - ref.y) <= thresholdM) {
      snappedY = ref.y;
      guidelines.push({ type: 'y', val: ref.y });
      snapped = true;
    }
  }

  const finalPt = { x: parseFloat(snappedX.toFixed(2)), y: parseFloat(snappedY.toFixed(2)) };

  const finalGuides = guidelines.length > 0 ? guidelines : EMPTY_GUIDELINES;
  return {
    point: finalPt,
    snappedPoint: finalPt,
    guidelines: finalGuides,
    guides: finalGuides,
    snapped,
    isOrtho: snapped,
  };
}

export interface IAcPlacement {
  x: number;
  y: number;
  targetAngle: number;
  label?: string;
  btu?: number;
  modelName?: string;
  roomWidthM?: number;
  roomHeightM?: number;
  maxRangeM?: number;
  roomName?: string;
  roomAreaM2?: number;
}

export function calculateAcCountAndPositions(
  roomPoints: IPoint[],
  roomArea: number,
  ceilingHeight: number = 3.0,
  windowsCount: number = 0,
  isSunny: boolean = false,
  interiorWalls: Array<{ id?: string; startPoint: IPoint; endPoint: IPoint; thicknessM?: number }> = [],
  windows: Array<{ position: IPoint; width?: number }> = [],
  compassNorthAngle: number = 0
): {
  count: number;
  modelName: string;
  totalKw: string;
  totalBtu: number;
  positions: IAcPlacement[];
  roomBreakdown?: Array<{
    name: string;
    areaM2: number;
    btu: number;
    modelName: string;
    windowCount: number;
    pos: IAcPlacement;
  }>;
} {
  const valid = (roomPoints || []).filter((p) => p && Number.isFinite(p.x) && Number.isFinite(p.y));
  if (valid.length < 3) {
    return {
      count: 0,
      modelName: 'Hali chizilmadi',
      totalKw: '0.0',
      totalBtu: 0,
      positions: [],
    };
  }

  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  valid.forEach((p) => {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  });

  const height = ceilingHeight || 3.0;

  // 1. Agar ichki devorlar mavjud bo'lsa, xonalarni (sub-room) ajratib, har biriga alohida hisoblaymiz
  if (interiorWalls && interiorWalls.length > 0) {
    const excludes: Array<{ points: IPoint[] }> = [];
    for (const iw of interiorWalls) {
      if (!iw || !iw.startPoint || !iw.endPoint) continue;
      const halfThick = Math.max(0.06, (iw.thicknessM || 0.12) / 2);
      const dx = iw.endPoint.x - iw.startPoint.x;
      const dy = iw.endPoint.y - iw.startPoint.y;
      const len = Math.hypot(dx, dy);
      if (len <= 0.1) continue;
      const nx = (-dy / len) * halfThick;
      const ny = (dx / len) * halfThick;
      const ux = dx / len;
      const uy = dy / len;

      const isStartNearOuter =
        iw.startPoint.x <= minX + 0.2 || iw.startPoint.x >= maxX - 0.2 || iw.startPoint.y <= minY + 0.2 || iw.startPoint.y >= maxY - 0.2;
      const isEndNearOuter =
        iw.endPoint.x <= minX + 0.2 || iw.endPoint.x >= maxX - 0.2 || iw.endPoint.y <= minY + 0.2 || iw.endPoint.y >= maxY - 0.2;

      let isStartNearOtherWall = false;
      let isEndNearOtherWall = false;
      for (const other of interiorWalls) {
        if (!other || other.id === iw.id) continue;
        if (Math.abs(iw.startPoint.y - other.startPoint.y) < 0.15 && iw.startPoint.x >= Math.min(other.startPoint.x, other.endPoint.x) - 0.1 && iw.startPoint.x <= Math.max(other.startPoint.x, other.endPoint.x) + 0.1) isStartNearOtherWall = true;
        if (Math.abs(iw.endPoint.y - other.startPoint.y) < 0.15 && iw.endPoint.x >= Math.min(other.startPoint.x, other.endPoint.x) - 0.1 && iw.endPoint.x <= Math.max(other.startPoint.x, other.endPoint.x) + 0.1) isEndNearOtherWall = true;
        if (Math.abs(iw.startPoint.x - other.startPoint.x) < 0.15 && iw.startPoint.y >= Math.min(other.startPoint.y, other.endPoint.y) - 0.1 && iw.startPoint.y <= Math.max(other.startPoint.y, other.endPoint.y) + 0.1) isStartNearOtherWall = true;
        if (Math.abs(iw.endPoint.x - other.startPoint.x) < 0.15 && iw.endPoint.y >= Math.min(other.startPoint.y, other.endPoint.y) - 0.1 && iw.endPoint.y <= Math.max(other.startPoint.y, other.endPoint.y) + 0.1) isEndNearOtherWall = true;
      }

      const exStart = isStartNearOuter || isStartNearOtherWall ? 0.12 : 0.0;
      const exEnd = isEndNearOuter || isEndNearOtherWall ? 0.12 : 0.0;

      excludes.push({
        points: [
          { x: iw.startPoint.x - ux * exStart + nx, y: iw.startPoint.y - uy * exStart + ny },
          { x: iw.endPoint.x + ux * exEnd + nx, y: iw.endPoint.y + uy * exEnd + ny },
          { x: iw.endPoint.x + ux * exEnd - nx, y: iw.endPoint.y + uy * exEnd - ny },
          { x: iw.startPoint.x - ux * exStart - nx, y: iw.startPoint.y - uy * exStart - ny },
        ],
      });
    }

    const islands = getHeatableArea(valid, excludes);
    const habitableIslands = islands.filter((isl) => calculatePolygonArea(isl) >= 2.5);

    if (habitableIslands.length > 1) {
      const positions: IAcPlacement[] = [];
      const roomBreakdown: Array<{
        name: string;
        areaM2: number;
        btu: number;
        modelName: string;
        windowCount: number;
        pos: IAcPlacement;
      }> = [];
      let totalBtuSum = 0;

      habitableIslands.forEach((isl, idx) => {
        const subArea = parseFloat(calculatePolygonArea(isl).toFixed(1));
        const xs = isl.map((p) => p.x);
        const ys = isl.map((p) => p.y);
        const rMinX = Math.min(...xs);
        const rMaxX = Math.max(...xs);
        const rMinY = Math.min(...ys);
        const rMaxY = Math.max(...ys);
        const rW = rMaxX - rMinX;
        const rH = rMaxY - rMinY;

        // Shu xonadagi oynalar
        const winInRoom = (windows || []).filter((w) => {
          if (!w || !w.position) return false;
          return (
            w.position.x >= rMinX - 0.35 &&
            w.position.x <= rMaxX + 0.35 &&
            w.position.y >= rMinY - 0.35 &&
            w.position.y <= rMaxY + 0.35
          );
        });

        const subVol = Math.round(subArea * height);
        const baseW = subVol * 40;
        const winW = winInRoom.length * 350 * (isSunny ? 1.2 : 1.0);
        const subWatts = Math.round(baseW + winW);

        let subBtu = 9000;
        let subModelName = '09-Model (9 000 BTU / 2.6 kW)';
        if (subWatts > 2800 && subWatts <= 4000) {
          subBtu = 12000;
          subModelName = '12-Model (12 000 BTU / 3.5 kW)';
        } else if (subWatts > 4000) {
          subBtu = 18000;
          subModelName = '18-Model (18 000 BTU / 5.2 kW)';
        }

        totalBtuSum += subBtu;

        const hasTopOuter = Math.abs(rMinY - minY) < 0.25;
        const hasBottomOuter = Math.abs(rMaxY - maxY) < 0.25;
        const hasLeftOuter = Math.abs(rMinX - minX) < 0.25;
        const hasRightOuter = Math.abs(rMaxX - maxX) < 0.25;

        let acX = rMinX + rW * 0.5;
        let acY = rMinY + 0.35;
        let targetAngle = 90;
        let maxRangeM = Math.min(rH * 0.85, 3.2);

        if (hasTopOuter) {
          acX = rMinX + rW * 0.5;
          acY = rMinY + 0.35;
          targetAngle = 90;
          maxRangeM = Math.min(rH * 0.85, 3.2);
        } else if (hasRightOuter && rW >= rH) {
          acX = rMaxX - 0.35;
          acY = rMinY + rH * 0.5;
          targetAngle = 180;
          maxRangeM = Math.min(rW * 0.85, 3.5);
        } else if (hasBottomOuter) {
          acX = rMinX + rW * 0.5;
          acY = rMaxY - 0.35;
          targetAngle = 270;
          maxRangeM = Math.min(rH * 0.85, 3.2);
        } else if (hasLeftOuter) {
          acX = rMinX + 0.35;
          acY = rMinY + rH * 0.5;
          targetAngle = 0;
          maxRangeM = Math.min(rW * 0.85, 3.5);
        }

        const placement: IAcPlacement = {
          x: parseFloat(acX.toFixed(2)),
          y: parseFloat(acY.toFixed(2)),
          targetAngle,
          label: `AC ${idx + 1}`,
          btu: subBtu,
          modelName: subModelName,
          roomWidthM: rW,
          roomHeightM: rH,
          maxRangeM: parseFloat(maxRangeM.toFixed(1)),
          roomName: `${idx + 1}-Xona (${subArea} m²)`,
          roomAreaM2: subArea,
        };

        positions.push(placement);
        roomBreakdown.push({
          name: `${idx + 1}-Xona`,
          areaM2: subArea,
          btu: subBtu,
          modelName: subModelName,
          windowCount: winInRoom.length,
          pos: placement,
        });
      });

      return {
        count: positions.length,
        modelName: `${positions.length} dona split-sistema (Multisplit, ${totalBtuSum.toLocaleString()} BTU jami)`,
        totalKw: (totalBtuSum / 3412).toFixed(1),
        totalBtu: totalBtuSum,
        positions,
        roomBreakdown,
      };
    }
  }

  // 2. Yagona xona holati (Single Room)
  let area = roomArea || 0;
  if (area === 0) {
    area = parseFloat(calculatePolygonArea(valid).toFixed(1));
  }

  const volume = Math.round(area * height);
  const baseWatts = volume * 40;
  const actualWindows = windows.length > 0 ? windows.length : windowsCount;
  const windowBonus = actualWindows * 350;
  const solarFactor = isSunny ? 1.15 : 1.0;
  const totalWatts = Math.round((baseWatts + windowBonus) * solarFactor);
  const totalKw = (totalWatts / 1000).toFixed(1);
  const totalBtu = Math.round(totalWatts * 3.412);

  let count = 1;
  let modelName = '1 dona 09-Model (9 000 BTU / 2.6 kW)';

  if (totalWatts <= 2800) {
    count = 1;
    modelName = '1 dona 09-Model (9 000 BTU / 2.6 kW)';
  } else if (totalWatts <= 4000) {
    count = 1;
    modelName = '1 dona 12-Model (12 000 BTU / 3.5 kW)';
  } else if (totalWatts <= 6500) {
    if (area > 40) {
      count = 2;
      modelName = '2 dona 09-Model (har biri 9 000 BTU)';
    } else {
      count = 1;
      modelName = '1 dona 18-Model (18 000 BTU / 5.2 kW)';
    }
  } else if (totalWatts <= 9000) {
    count = 2;
    modelName = '2 dona 12-Model (har biri 12 000 BTU)';
  } else if (totalWatts <= 13000) {
    count = 3;
    modelName = '1 dona 18-Model + 2 dona 12-Model (42 000 BTU jami)';
  } else if (totalWatts <= 18000) {
    count = 4;
    modelName = '2 dona 18-Model + 2 dona 12-Model (60 000 BTU jami)';
  } else {
    count = Math.min(8, Math.ceil(totalWatts / 3500));
    modelName = `${count} dona 12-Model (har biri 12 000 BTU)`;
  }

  const positions: IAcPlacement[] = [];
  const roomW = maxX - minX;
  const roomH = maxY - minY;
  const btuPerUnit = Math.round(totalBtu / count);

  if (count === 1) {
    positions.push({
      x: parseFloat((minX + roomW / 2).toFixed(2)),
      y: parseFloat((minY + 0.35).toFixed(2)),
      targetAngle: 90,
      label: 'AC 1',
      btu: btuPerUnit,
      modelName,
      roomWidthM: roomW,
      roomHeightM: roomH,
      maxRangeM: parseFloat((roomH * 0.85).toFixed(1)),
    });
  } else if (count === 2) {
    positions.push({
      x: parseFloat((minX + roomW * 0.28).toFixed(2)),
      y: parseFloat((minY + 0.35).toFixed(2)),
      targetAngle: 90,
      label: 'AC 1',
      btu: btuPerUnit,
      modelName,
      roomWidthM: roomW,
      roomHeightM: roomH,
      maxRangeM: parseFloat((roomH * 0.85).toFixed(1)),
    });
    positions.push({
      x: parseFloat((minX + roomW * 0.72).toFixed(2)),
      y: parseFloat((minY + 0.35).toFixed(2)),
      targetAngle: 90,
      label: 'AC 2',
      btu: btuPerUnit,
      modelName,
      roomWidthM: roomW,
      roomHeightM: roomH,
      maxRangeM: parseFloat((roomH * 0.85).toFixed(1)),
    });
  } else {
    const topCount = Math.ceil(count / 2);
    const bottomCount = Math.floor(count / 2);

    for (let i = 0; i < topCount; i++) {
      const step = roomW / (topCount + 1);
      positions.push({
        x: parseFloat((minX + step * (i + 1)).toFixed(2)),
        y: parseFloat((minY + 0.35).toFixed(2)),
        targetAngle: 90,
        label: `AC ${i + 1}`,
        btu: btuPerUnit,
        roomWidthM: roomW,
        roomHeightM: roomH,
        maxRangeM: parseFloat((roomH * 0.85).toFixed(1)),
      });
    }

    for (let i = 0; i < bottomCount; i++) {
      const step = roomW / (bottomCount + 1);
      positions.push({
        x: parseFloat((minX + step * (i + 1)).toFixed(2)),
        y: parseFloat((maxY - 0.35).toFixed(2)),
        targetAngle: 270,
        label: `AC ${topCount + i + 1}`,
        btu: btuPerUnit,
        roomWidthM: roomW,
        roomHeightM: roomH,
        maxRangeM: parseFloat((roomH * 0.85).toFixed(1)),
      });
    }
  }

  return { count, modelName, totalKw, totalBtu, positions };
}
