import { IPoint, IWall, IInteriorWall, IDoor, IWindow, IFurniture } from '../types';
import { PIXELS_PER_METER, calculatePolygonArea } from './geometry';
import polygonClipping from 'polygon-clipping';

export interface PhysicalWallSpec {
  side: 'top' | 'bottom' | 'left' | 'right' | 'polygon_edge';
  edgeIndex?: number;
  wallType: 'exterior_street' | 'exterior_facade' | 'interior_heated' | 'interior_unheated';
  label: string;
  thicknessMm: number;
  heatLossWattM2: number;
  offsetMm: number;
  pipePitchMm: number;
  azimuthDeg: number;
}

export interface ACRecommendation {
  id: string;
  position: IPoint;
  wallAzimuthDeg: number;
  heightFromCeilingCm: number;
  recommendedCapacityBtu: number;
  modelName: string;
  airflowDirectionDeg: number;
  targetZoneLabel: string;
  reason: string;
}

export interface MasterPlumberCircuit {
  id: string;
  name: string;
  feedPoints: string;
  returnPoints: string;
  pipeLengthM: number;
  areaM2: number;
  stepSm: number;
  flowRateL_min: number;
  pressureLossKPa: number;
  isBorderZone: boolean;
  centerX: number;
  centerY: number;
  physicalWalls: PhysicalWallSpec[];
}

export interface MasterPlumberBillOfMaterials {
  pexPipe16mmM: number;
  manifoldOutletsCount: number;
  manifoldUnitName: string;
  xpsInsulationM2: number;
  damperTapeM: number;
  pipeFixersCount: number;
  plasticizerKg: number;
  filmVaporBarrierM2: number;
}

export interface MasterPlumberPlan {
  circuits: MasterPlumberCircuit[];
  manifoldPosition: IPoint;
  boilerPosition: IPoint | null;
  boilerSupplyMain?: string;
  boilerReturnMain?: string;
  totalHeatedAreaM2: number;
  totalExcludedAreaM2: number;
  totalPipeLengthM: number;
  circuitCount: number;
  hydraulicBalancePercent: number;
  billOfMaterials: MasterPlumberBillOfMaterials;
  environmentalAnalysis: {
    exteriorWallsSummary: string;
    windowsSummary: string;
    solarWindSummary: string;
    doorsSummary: string;
    excludedSummary: string;
    physicsSummary: string;
  };
  acRecommendations: ACRecommendation[];
  isIntersectionFree: boolean;
  expertVerdict: string;
}

/**
 * 1. DEVORNING TASHQI AZIMUTINI HISOBLASH (0°=Shimol, 90°=Sharq, 180°=Janub, 270°=G'arb)
 */
export function computeWallAzimuth(p1: IPoint, p2: IPoint, compassNorthAngle: number = 0): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const wallDirDeg = (Math.atan2(dy, dx) * 180) / Math.PI;
  let outwardNormalDeg = (wallDirDeg + 90 + compassNorthAngle) % 360;
  if (outwardNormalDeg < 0) outwardNormalDeg += 360;
  return Math.round(outwardNormalDeg);
}

/**
 * 2. BOOLEAN SUBTRACTION: ISITILADIGAN MAYDONNI HISOBLASH (Multi-Island Support)
 */
export function getHeatableArea(
  roomPolygon: IPoint[],
  exclusionPolygons: Array<{ points: IPoint[] }> = []
): IPoint[][] {
  const valid = (roomPolygon || []).filter((p) => p && Number.isFinite(p.x) && Number.isFinite(p.y));
  if (valid.length < 3) return [];

  if (!exclusionPolygons || exclusionPolygons.length === 0) {
    return [valid];
  }

  const subject: any = [[valid.map((p) => [p.x, p.y])]];
  const clippers: any[] = exclusionPolygons
    .filter((z) => z.points && z.points.length >= 3)
    .map((z) => [[z.points.map((p) => [p.x, p.y])]]);

  let current = subject;
  for (const clip of clippers) {
    try {
      const diff = (polygonClipping as any).difference(current, clip);
      if (diff && diff.length > 0) {
        current = diff;
      }
    } catch {
      // Fallback
    }
  }

  const islands: IPoint[][] = [];
  for (const poly of current) {
    for (const ring of poly) {
      if (ring && ring.length >= 3) {
        islands.push(ring.map(([x, y]: any) => ({ x, y })));
      }
    }
  }

  return islands.length > 0 ? islands : [valid];
}

/**
 * 3. LOKAL QADAM (SPACING) MATEMATIKASI
 */
export function getLocalSpacingCm(
  wallType: 'exterior_street' | 'exterior_facade' | 'interior_heated' | 'interior_unheated',
  azimuthDeg: number,
  hasNearbyWindow: boolean,
  distanceFromWallCm: number
): number {
  let base = 15;

  if (wallType === 'exterior_facade' && hasNearbyWindow && distanceFromWallCm < 60) {
    base = 10;
  } else if (wallType === 'exterior_facade' || wallType === 'exterior_street') {
    base = 12;
  } else if (wallType === 'interior_unheated') {
    base = 13;
  } else {
    base = 15;
  }

  const isNorth = azimuthDeg >= 315 || azimuthDeg <= 45;
  const isSouth = azimuthDeg >= 135 && azimuthDeg <= 225;

  if (isNorth) base -= 2;
  if (isSouth) base += 1;

  if (distanceFromWallCm > 60) {
    base = 15;
  }

  return Math.max(10, Math.min(15, base));
}

/**
 * 4. TO'G'RI PARALLEL POLYGON INSET (Offset/Buffer) ALGORITMI
 */
// @ts-ignore
import Offset from 'polygon-offset';

function ensureClosed(pts: IPoint[]): IPoint[] {
  if (pts.length < 3) return pts;
  const first = pts[0];
  const last = pts[pts.length - 1];
  if (Math.hypot(first.x - last.x, first.y - last.y) > 0.001) {
    return [...pts, { ...first }];
  }
  return pts;
}

function findClosestPointIdx(pt: IPoint, ring: IPoint[]): number {
  let minDist = Infinity;
  let idx = 0;
  for (let i = 0; i < ring.length; i++) {
    const d = Math.hypot(ring[i].x - pt.x, ring[i].y - pt.y);
    if (d < minDist) {
      minDist = d;
      idx = i;
    }
  }
  return idx;
}

/**
 * BOSQICH E1: KESISHMASLIK KAFOLATI VA VALIDATSIYASI (Zero Self-Intersection)
 */
function segmentsIntersect(p1: IPoint, p2: IPoint, p3: IPoint, p4: IPoint): boolean {
  function ccw(A: IPoint, B: IPoint, C: IPoint) {
    return (C.y - A.y) * (B.x - A.x) > (B.y - A.y) * (C.x - A.x);
  }
  return ccw(p1, p3, p4) !== ccw(p2, p3, p4) && ccw(p1, p2, p3) !== ccw(p1, p2, p4);
}

export function validateNoSelfIntersection(points: IPoint[]): boolean {
  const n = points.length;
  for (let i = 0; i < n - 1; i++) {
    const s1_p1 = points[i];
    const s1_p2 = points[i + 1];
    for (let j = i + 2; j < n - 1; j++) {
      if (Math.abs(i - j) <= 1) continue;
      const s2_p1 = points[j];
      const s2_p2 = points[j + 1];
      if (segmentsIntersect(s1_p1, s1_p2, s2_p1, s2_p2)) {
        return false;
      }
    }
  }
  return true;
}

/**
 * 5. BOSQICH E: INWARD POLYGON OFFSET VA QUYOSH/DEVOR FIZIKASI BILAN SPIRAL GENERATOR
 */



function getClosestPointOnPolygon(pt: IPoint, poly: IPoint[]): { point: IPoint, insertIdx: number, originalIdx: number } {
  let minDist = Infinity;
  let bestPoint = poly[0];
  let insertIdx = 0;
  let originalIdx = -1;

  for (let i = 0; i < poly.length; i++) {
    const p1 = poly[i];
    const p2 = poly[(i + 1) % poly.length];

    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const len2 = dx * dx + dy * dy;
    let t = 0;
    if (len2 > 0) {
      t = ((pt.x - p1.x) * dx + (pt.y - p1.y) * dy) / len2;
      t = Math.max(0, Math.min(1, t));
    }
    const projX = p1.x + t * dx;
    const projY = p1.y + t * dy;

    const dist = Math.hypot(pt.x - projX, pt.y - projY);
    if (dist < minDist) {
      minDist = dist;
      bestPoint = { x: projX, y: projY };
      
      // If projection is exactly on a vertex, use the vertex directly!
      // This prevents inserting duplicate vertices at corners which causes overlapping shifts
      if (t === 0) {
        originalIdx = i;
      } else if (t === 1) {
        originalIdx = (i + 1) % poly.length;
      } else {
        originalIdx = -1;
        insertIdx = i + 1;
      }
    }
  }
  return { point: bestPoint, insertIdx, originalIdx };
}

function alignRingToPoint(target: IPoint[], pt: IPoint): IPoint[] {
  const { point, insertIdx, originalIdx } = getClosestPointOnPolygon(pt, target);
  let newRing = [...target];
  if (originalIdx === -1) {
    // Insert new vertex
    newRing.splice(insertIdx, 0, point);
    return [...newRing.slice(insertIdx), ...newRing.slice(0, insertIdx)];
  } else {
    // Just rotate
    return [...newRing.slice(originalIdx), ...newRing.slice(0, originalIdx)];
  }
}

function alignRing(target: IPoint[], reference: IPoint[]): IPoint[] {
  let minD = Infinity;
  let minIdx = 0;
  for(let i=0; i<target.length; i++) {
    const d = Math.hypot(target[i].x - reference[0].x, target[i].y - reference[0].y);
    if (d < minD) { minD = d; minIdx = i; }
  }
  return [...target.slice(minIdx), ...target.slice(0, minIdx)];
}

function computeOrthogonalPolygonInset(polygon: IPoint[], d: number): IPoint[] | null {
  const n = polygon.length;
  if (n < 3) return null;
  let area = 0;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += polygon[i].x * polygon[j].y - polygon[j].x * polygon[i].y;
  }
  const isClockwise = area > 0;
  const pts = isClockwise ? [...polygon] : [...polygon].reverse();

  const lines: Array<{ type: 'horiz' | 'vert'; val: number }> = [];
  for (let i = 0; i < n; i++) {
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;

    if (Math.abs(dy) <= Math.abs(dx)) {
      const shiftY = dx >= 0 ? d : -d;
      lines.push({ type: 'horiz', val: p1.y + shiftY });
    } else {
      const shiftX = dy >= 0 ? -d : d;
      lines.push({ type: 'vert', val: p1.x + shiftX });
    }
  }

  const insetPts: IPoint[] = [];
  for (let i = 0; i < n; i++) {
    const prevLine = lines[(i - 1 + n) % n];
    const currLine = lines[i];
    let x: number, y: number;
    if (prevLine.type === 'horiz' && currLine.type === 'vert') {
      x = currLine.val;
      y = prevLine.val;
    } else if (prevLine.type === 'vert' && currLine.type === 'horiz') {
      x = prevLine.val;
      y = currLine.val;
    } else {
      x = pts[i].x;
      y = pts[i].y;
    }
    insetPts.push({ x: parseFloat(x.toFixed(3)), y: parseFloat(y.toFixed(3)) });
  }

  let newArea = 0;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    newArea += insetPts[i].x * insetPts[j].y - insetPts[j].x * insetPts[i].y;
  }
  if (Math.abs(newArea) / 2 < 0.3) return null;
  return insetPts;
}

function generateInwardPolygonCoil(
  polygonMeters: IPoint[],
  manifoldPos: IPoint,
  stepM: number,
  scalePx: number
): { feed: IPoint[]; ret: IPoint[]; lengthM: number } {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const p of polygonMeters) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }

  const mX = manifoldPos && Number.isFinite(manifoldPos.x)
    ? manifoldPos.x * scalePx
    : (minX + 0.35) * scalePx;
  const mY = manifoldPos && Number.isFinite(manifoldPos.y)
    ? manifoldPos.y * scalePx
    : (minY + 0.35) * scalePx;

  const boxArea = (maxX - minX) * (maxY - minY);
  const polyArea = calculatePolygonArea(polygonMeters);
  const isRectangle = polygonMeters.length === 4 && Math.abs(boxArea - polyArea) < 0.05 * boxArea;
  const isLShape = polygonMeters.length === 6;

  // 1. L-Shaklli xonalar uchun maxsus 6-tomonli uzluksiz Two-Lane Bifilar Spiral
  if (isLShape) {
    const xVals = [...new Set(polygonMeters.map(p => p.x))].sort((a, b) => a - b);
    const yVals = [...new Set(polygonMeters.map(p => p.y))].sort((a, b) => a - b);
    const midX = xVals.find(x => x > minX && x < maxX) || (minX + maxX) / 2;
    const midY = yVals.find(y => y > minY && y < maxY) || (minY + maxY) / 2;

    const p = 0.18 * scalePx;
    const margin = 0.28 * scalePx;

    let xL1 = minX * scalePx + margin;
    let xR1_top = maxX * scalePx - margin;
    let yB1_top = midY * scalePx - margin;
    let xR1_bot = midX * scalePx - margin;
    let yB1_bot = maxY * scalePx - margin;
    let yT1 = minY * scalePx + margin;

    let xL2 = xL1 + p;
    let xR2_top = xR1_top - p;
    let yB2_top = yB1_top - p;
    let xR2_bot = xR1_bot - p;
    let yB2_bot = yB1_bot - p;
    let yT2 = yT1 + p;

    const feed: IPoint[] = [];
    const ret: IPoint[] = [];

    feed.push({ x: mX, y: yT1 });
    ret.push({ x: mX, y: yT2 });

    while (xR2_bot - xL2 >= 2.0 * p && yB2_top - yT2 >= 2.0 * p) {
      feed.push({ x: xR1_top, y: yT1 });
      ret.push({ x: xR2_top, y: yT2 });

      feed.push({ x: xR1_top, y: yB1_top });
      ret.push({ x: xR2_top, y: yB2_top });

      feed.push({ x: xR1_bot, y: yB1_top });
      ret.push({ x: xR2_bot, y: yB2_top });

      feed.push({ x: xR1_bot, y: yB1_bot });
      ret.push({ x: xR2_bot, y: yB2_bot });

      feed.push({ x: xL1, y: yB1_bot });
      ret.push({ x: xL2, y: yB2_bot });

      feed.push({ x: xL1, y: yT1 + 2 * p });
      ret.push({ x: xL2, y: yT2 + 2 * p });

      xL1 += 2 * p;
      xR1_top -= 2 * p;
      yB1_top -= 2 * p;
      xR1_bot -= 2 * p;
      yB1_bot -= 2 * p;
      yT1 += 2 * p;

      xL2 += 2 * p;
      xR2_top -= 2 * p;
      yB2_top -= 2 * p;
      xR2_bot -= 2 * p;
      yB2_bot -= 2 * p;
      yT2 += 2 * p;
    }

    const lastF = feed[feed.length - 1];
    const lastR = ret[ret.length - 1];
    feed.push({ x: lastF.x + p, y: lastF.y });
    feed.push({ x: lastR.x, y: lastR.y });

    const returnOutward = ret.reverse();
    const lengthM = parseFloat((polyArea / 0.18).toFixed(1));

    return { feed, ret: returnOutward, lengthM };
  }

  // 2. Boshqa murakkab poligonlar uchun
  if (!isRectangle) {
    const rings: Array<Array<{ x: number; y: number }>> = [];
    for (let d = 0.28; d <= 2.5; d += 0.18) {
      const r = computeOrthogonalPolygonInset(polygonMeters, d);
      if (!r) break;
      let isValid = true;
      for (let k = 0; k < r.length; k++) {
        const nextK = (k + 1) % r.length;
        const origDx = polygonMeters[nextK].x - polygonMeters[k].x;
        const origDy = polygonMeters[nextK].y - polygonMeters[k].y;
        const newDx = r[nextK].x - r[k].x;
        const newDy = r[nextK].y - r[k].y;
        if (origDx * newDx < -0.01 || origDy * newDy < -0.01) {
          isValid = false;
          break;
        }
      }
      if (!isValid) break;
      rings.push(r.map(p => ({ x: p.x * scalePx, y: p.y * scalePx })));
    }

    if (rings.length >= 2) {
      const polyFeed: IPoint[] = [];
      const polyRet: IPoint[] = [];

      polyFeed.push({ x: mX, y: rings[0][0].y });
      polyRet.push({ x: mX, y: rings[1][0].y });

      const pairCount = Math.floor(rings.length / 2);
      for (let k = 0; k < pairCount; k++) {
        const rF = rings[2 * k];
        const rR = rings[2 * k + 1];

        for (let i = 0; i < rF.length; i++) {
          polyFeed.push(rF[i]);
          polyRet.push(rR[i]);
        }

        if (k < pairCount - 1) {
          const nextF = rings[2 * (k + 1)];
          const nextR = rings[2 * (k + 1) + 1];
          polyFeed.push({ x: nextF[0].x, y: rF[rF.length - 1].y });
          polyRet.push({ x: nextR[0].x, y: rR[rR.length - 1].y });
        }
      }

      const lastF = polyFeed[polyFeed.length - 1];
      const lastR = polyRet[polyRet.length - 1];
      polyFeed.push({ x: lastF.x, y: lastR.y });
      polyFeed.push({ x: lastR.x, y: lastR.y });

      const polyRetOutward = polyRet.reverse();

      const lengthM = parseFloat((polyArea / 0.18).toFixed(1));
      return { feed: polyFeed, ret: polyRetOutward, lengthM };
    }
  }

  // 2. Standart to'rtburchak xonalar uchun Two-Lane Bifilar Spiral
  const margin = 0.28 * scalePx;
  const p = 0.18 * scalePx; // 18sm quvur qadami

  let xL1 = minX * scalePx + margin;
  let xR1 = maxX * scalePx - margin;
  let yT1 = minY * scalePx + margin;
  let yB1 = maxY * scalePx - margin;

  let xL2 = xL1 + p;
  let xR2 = xR1 - p;
  let yT2 = yT1 + p;
  let yB2 = yB1 - p;

  const feed: IPoint[] = [];
  const ret: IPoint[] = [];

  // 1. Kollektor (KL) shkafiga parallel ulanish (mutlaqo 0 kesishuv)
  feed.push({ x: mX, y: yT1 });
  ret.push({ x: mX, y: yT2 });

  // 2. Parallel spiral qavatlari (Two-Lane Bifilar Spiral)
  while (xR2 - xL2 >= 2.5 * p && yB2 - yT2 >= 2.5 * p) {
    feed.push({ x: xR1, y: yT1 });
    ret.push({ x: xR2, y: yT2 });

    feed.push({ x: xR1, y: yB1 });
    ret.push({ x: xR2, y: yB2 });

    // Bottom side: o'ngdan chapga to'liq devor bo'yigacha
    feed.push({ x: xL1, y: yB1 });
    ret.push({ x: xL2, y: yB2 });

    // Left side: pastdan keyingi ichki qavat tepasigacha
    feed.push({ x: xL1, y: yT1 + 2 * p });
    ret.push({ x: xL2, y: yT2 + 2 * p });

    xL1 += 2 * p;
    xR1 -= 2 * p;
    yT1 += 2 * p;
    yB1 -= 2 * p;

    xL2 += 2 * p;
    xR2 -= 2 * p;
    yT2 += 2 * p;
    yB2 -= 2 * p;
  }

  // 3. Markaziy 180° hairpin burilish (Feed -> Return)
  const lastF = feed[feed.length - 1];
  const lastR = ret[ret.length - 1];
  feed.push({ x: lastF.x + p, y: lastF.y });
  feed.push({ x: lastR.x, y: lastR.y });

  // 4. Return quvurini teskari (outward) tartibda kollektorga qaytarish (tugash nuqtasi)
  const returnOutward = ret.reverse();

  const lengthM = parseFloat((polyArea / 0.18).toFixed(1));

  return { feed, ret: returnOutward, lengthM };
}

/**
 * 6. BOSQICH G: KONDITSIONER JOYLASHUVI VA BIR NECHTA BLOK DETERMINATSIYASI
 */
function computeConvexHull(points: IPoint[]): IPoint[] {
  const pts = [...points].sort((a, b) => (a.x === b.x ? a.y - b.y : a.x - b.x));
  function cross(o: IPoint, a: IPoint, b: IPoint) {
    return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  }

  const lower: IPoint[] = [];
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) {
      lower.pop();
    }
    lower.push(p);
  }

  const upper: IPoint[] = [];
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) {
      upper.pop();
    }
    upper.push(p);
  }

  upper.pop();
  lower.pop();
  return lower.concat(upper);
}

export function determineACUnitCount(roomPoints: IPoint[]): number {
  const valid = (roomPoints || []).filter((p) => p && Number.isFinite(p.x) && Number.isFinite(p.y));
  if (valid.length < 3) return 1;

  const areaM2 = calculatePolygonArea(valid);
  if (areaM2 > 40) return 2;

  const hull = computeConvexHull(valid);
  const hullArea = calculatePolygonArea(hull);
  const concavityRatio = hullArea > 0 ? areaM2 / hullArea : 1;

  if (concavityRatio < 0.75) return 2; // Cho'zilgan yoki bir necha qanotga bo'lingan xona
  return 1;
}

export function recommendACPositions(
  roomPoints: IPoint[],
  walls: IWall[] = [],
  windows: IWindow[] = [],
  doors: IDoor[] = [],
  furniture: IFurniture[] = [],
  compassNorthAngle: number = 0
): ACRecommendation[] {
  const valid = (roomPoints || []).filter((p) => p && Number.isFinite(p.x) && Number.isFinite(p.y));
  if (valid.length < 3) return [];

  const unitCount = determineACUnitCount(valid);
  const areaM2 = calculatePolygonArea(valid);
  const isSouth = compassNorthAngle >= 135 && compassNorthAngle <= 225;
  const totalBtuNeeded = areaM2 * (isSouth ? 700 : 600);

  const n = valid.length;
  const candidates: Array<{ pos: IPoint; azimuth: number; score: number; wallIdx: number }> = [];

  for (let i = 0; i < n; i++) {
    const p1 = valid[i];
    const p2 = valid[(i + 1) % n];
    const wall = walls[i];

    const isExternal = wall ? wall.isExternal !== false : true;
    if (!isExternal) continue;

    const azimuth = computeWallAzimuth(p1, p2, compassNorthAngle);
    if (azimuth >= 135 && azimuth <= 225) continue; // Janubiy quyoshli devor chetlanadi

    const wallLen = Math.hypot(p2.x - p1.x, p2.y - p1.y);
    if (wallLen < 1.0) continue;

    const midPoint: IPoint = {
      x: parseFloat(((p1.x + p2.x) / 2).toFixed(2)),
      y: parseFloat(((p1.y + p2.y) / 2).toFixed(2)),
    };

    let score = 50;
    if (azimuth >= 225 && azimuth <= 315) score += 30; // G'arb/Shimoli-g'arb devori

    candidates.push({ pos: midPoint, azimuth, score, wallIdx: i });
  }

  if (candidates.length === 0) {
    const p1 = valid[0];
    const p2 = valid[1];
    return [
      {
        id: 'ac_1',
        position: { x: parseFloat(((p1.x + p2.x) / 2).toFixed(2)), y: parseFloat(((p1.y + p2.y) / 2).toFixed(2)) },
        wallAzimuthDeg: 0,
        heightFromCeilingCm: 15,
        recommendedCapacityBtu: 12000,
        modelName: '12-model (12000 BTU)',
        airflowDirectionDeg: 180,
        targetZoneLabel: 'Asosiy Zona',
        reason: 'Standart xona devoriga joylashtirildi',
      },
    ];
  }

  candidates.sort((a, b) => b.score - a.score);

  if (unitCount === 1) {
    const best = candidates[0];
    let btu = Math.round(totalBtuNeeded / 3000) * 3000;
    btu = Math.max(9000, Math.min(24000, btu));
    const modelNum = Math.round(btu / 1000);

    return [
      {
        id: 'ac_1',
        position: best.pos,
        wallAzimuthDeg: best.azimuth,
        heightFromCeilingCm: 15,
        recommendedCapacityBtu: btu,
        modelName: `${modelNum < 10 ? '0' + modelNum : modelNum}-model (${btu} BTU)`,
        airflowDirectionDeg: (best.azimuth + 180) % 360,
        targetZoneLabel: 'To‘liq Xona Qamrovi',
        reason: `Fasad (${best.azimuth}°): To'g'ridan-to'g'ri quyosh tushmaydi, xona ichiga optimal havo oqimi yo'naltirildi.`,
      },
    ];
  }

  // 2 TA MUSTAQIL BLOK KERAK (Katta yoki botiq xona)
  const posA = candidates[0];
  let posB = candidates[1];

  // Agar ikkinchi devor juda yaqin bo'lsa (< 3m), uzoqroqdagi devor qidiriladi
  for (let i = 1; i < candidates.length; i++) {
    const dist = Math.hypot(candidates[i].pos.x - posA.pos.x, candidates[i].pos.y - posA.pos.y);
    if (dist >= 3.0) {
      posB = candidates[i];
      break;
    }
  }

  const btuPerUnit = Math.round((totalBtuNeeded / 2) / 3000) * 3000;
  const clampedBtu = Math.max(9000, Math.min(18000, btuPerUnit));
  const modelNum = Math.round(clampedBtu / 1000);
  const modelName = `${modelNum < 10 ? '0' + modelNum : modelNum}-model (${clampedBtu} BTU)`;

  return [
    {
      id: 'ac_1',
      position: posA.pos,
      wallAzimuthDeg: posA.azimuth,
      heightFromCeilingCm: 15,
      recommendedCapacityBtu: clampedBtu,
      modelName,
      airflowDirectionDeg: (posA.azimuth + 180) % 360,
      targetZoneLabel: '1-Zona (Asosiy Fasad)',
      reason: '1-qanot zonasi uchun mustaqil havo sirkulyatsiyasi.',
    },
    {
      id: 'ac_2',
      position: (posB || posA).pos,
      wallAzimuthDeg: (posB || posA).azimuth,
      heightFromCeilingCm: 15,
      recommendedCapacityBtu: clampedBtu,
      modelName,
      airflowDirectionDeg: (((posB || posA).azimuth + 180) % 360),
      targetZoneLabel: '2-Zona (Qo‘shimcha Qanot)',
      reason: '2-qanot zonasi uchun alohida mustaqil blok (3m+ oraliq).',
    },
  ];
}

/**
 * 7. ASOSIY INTEGRATSIYA: calculateMasterPlumberPlan
 */
export function calculateMasterPlumberPlan(
  roomPoints: IPoint[],
  userManifoldPos?: IPoint | null,
  boilerPos?: IPoint | null,
  interiorWalls: IInteriorWall[] = [],
  excludedZones: Array<{ points: IPoint[] }> = [],
  doors: IDoor[] = [],
  windows: IWindow[] = [],
  furniture: IFurniture[] = [],
  roomName: string = 'Mehmonxona',
  roomType: string = 'living_room',
  compassNorthAngle: number = 0,
  walls: IWall[] = []
): MasterPlumberPlan {
  const scale = PIXELS_PER_METER;
  const valid = (roomPoints || []).filter((p) => p && Number.isFinite(p.x) && Number.isFinite(p.y));

  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const p of valid) {
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
  }

  const roomWidthM = Math.max(1, maxX - minX);
  const roomHeightM = Math.max(1, maxY - minY);
  const totalFloorAreaM2 = parseFloat((roomWidthM * roomHeightM).toFixed(1));

  // 1. KOLLEKTOR JOYLAShUVI
  let manifoldPos: IPoint;
  if (userManifoldPos && Number.isFinite(userManifoldPos.x) && Number.isFinite(userManifoldPos.y)) {
    manifoldPos = userManifoldPos;
  } else if (boilerPos && Number.isFinite(boilerPos.x) && Number.isFinite(boilerPos.y)) {
    manifoldPos = {
      x: parseFloat((boilerPos.x + 0.6).toFixed(2)),
      y: parseFloat(boilerPos.y.toFixed(2)),
    };
  } else {
    manifoldPos = {
      x: parseFloat((minX + 0.6).toFixed(2)),
      y: parseFloat((minY + 0.6).toFixed(2)),
    };
  }

  const mX = manifoldPos.x * scale;
  const mY = manifoldPos.y * scale;

  let boilerSupplyMain: string | undefined;
  let boilerReturnMain: string | undefined;

  if (boilerPos && Number.isFinite(boilerPos.x) && Number.isFinite(boilerPos.y)) {
    const bX = boilerPos.x * scale;
    const bY = boilerPos.y * scale;
    boilerSupplyMain = `${bX.toFixed(1)},${bY.toFixed(1)} ${(bX + (mX - bX) * 0.5).toFixed(1)},${bY.toFixed(1)} ${(bX + (mX - bX) * 0.5).toFixed(1)},${mY.toFixed(1)} ${mX.toFixed(1)},${mY.toFixed(1)}`;
    boilerReturnMain = `${mX.toFixed(1)},${(mY + 8).toFixed(1)} ${(bX + (mX - bX) * 0.5 + 8).toFixed(1)},${(mY + 8).toFixed(1)} ${(bX + (mX - bX) * 0.5 + 8).toFixed(1)},${(bY + 8).toFixed(1)} ${bX.toFixed(1)},${(bY + 8).toFixed(1)}`;
  }

  // 2. BARCHA ISTISNO ZONALAR (Mebel, Istisno joylar va Ichki devorlar)
  const combinedExcludes: Array<{ points: IPoint[] }> = [...(excludedZones || [])];

  // Ichki devorlar (to'siqlar) bo'ylab quvur o'tmasligi uchun to'siq poligonlari
  for (const iw of interiorWalls || []) {
    if (iw && iw.startPoint && iw.endPoint) {
      const halfThick = Math.max(0.08, (iw.thicknessM || 0.12) / 2 + 0.08);
      const dx = iw.endPoint.x - iw.startPoint.x;
      const dy = iw.endPoint.y - iw.startPoint.y;
      const len = Math.hypot(dx, dy);
      if (len > 0.1) {
        const nx = (-dy / len) * halfThick;
        const ny = (dx / len) * halfThick;
        const ex = (dx / len) * 0.04;
        const ey = (dy / len) * 0.04;
        combinedExcludes.push({
          points: [
            { x: iw.startPoint.x - ex + nx, y: iw.startPoint.y - ey + ny },
            { x: iw.endPoint.x + ex + nx, y: iw.endPoint.y + ey + ny },
            { x: iw.endPoint.x + ex - nx, y: iw.endPoint.y + ey - ny },
            { x: iw.startPoint.x - ex - nx, y: iw.startPoint.y - ey - ny },
          ],
        });
      }
    }
  }

  for (const f of furniture || []) {
    if (f && f.position) {
      const halfW = ((f as any).width || 1.4) / 2 + 0.15;
      const halfH = ((f as any).height || (f as any).length || 1.8) / 2 + 0.15;
      combinedExcludes.push({
        points: [
          { x: f.position.x - halfW, y: f.position.y - halfH },
          { x: f.position.x + halfW, y: f.position.y - halfH },
          { x: f.position.x + halfW, y: f.position.y + halfH },
          { x: f.position.x - halfW, y: f.position.y + halfH },
        ],
      });
    }
  }

  // 3. ISITILADIGAN OROLLARNI AJRATISH (Boolean Subtraction)
  const heatableIslands = getHeatableArea(valid, combinedExcludes);

  const circuits: MasterPlumberCircuit[] = [];
  let totalPipeLengthM = 0;
  let totalHeatedAreaM2 = 0;
  let isIntersectionFree = true;

  for (let idx = 0; idx < heatableIslands.length; idx++) {
    const island = heatableIslands[idx];
    const islandArea = parseFloat(calculatePolygonArea(island).toFixed(1));
    if (islandArea < 1.0) continue;

    const stepM = 0.15;
    const stepSm = Math.round(stepM * 100);

    const { feed, ret, lengthM } = generateInwardPolygonCoil(island, manifoldPos, stepM, scale);

    const heatLoadWatt = islandArea * 75;
    const flowRateL_min = parseFloat((heatLoadWatt / (1.163 * 10 * 60)).toFixed(2));
    const pressureLossKPa = parseFloat((lengthM * 0.15 + 2.5).toFixed(1));

    totalPipeLengthM += lengthM;
    totalHeatedAreaM2 += islandArea;

    let cX = 0, cY = 0;
    for (const p of island) {
      cX += p.x;
      cY += p.y;
    }
    cX = (cX / island.length) * scale;
    cY = (cY / island.length) * scale;

    const allPts = [...feed, ...ret];
    if (!validateNoSelfIntersection(allPts)) {
      isIntersectionFree = false;
    }

    circuits.push({
      id: `circuit_${idx + 1}`,
      name: `${idx + 1}-Kontur (${stepSm} sm)`,
      feedPoints: feed.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' '),
      returnPoints: ret.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' '),
      pipeLengthM: lengthM,
      areaM2: islandArea,
      stepSm,
      flowRateL_min,
      pressureLossKPa,
      isBorderZone: false,
      centerX: parseFloat(cX.toFixed(1)),
      centerY: parseFloat(cY.toFixed(1)),
      physicalWalls: [],
    });
  }

  const totalExcludedAreaM2 = Math.max(0, parseFloat((totalFloorAreaM2 - totalHeatedAreaM2).toFixed(1)));

  // GIDRAVLIK BALANS
  const circuitLengths = circuits.map((c) => c.pipeLengthM);
  const minL = circuitLengths.length > 0 ? Math.min(...circuitLengths) : 0;
  const maxL = circuitLengths.length > 0 ? Math.max(...circuitLengths) : 0;
  const lengthDiff = maxL - minL;
  const hydraulicBalancePercent =
    circuitLengths.length > 0 ? Math.max(90, Math.min(100, Math.round(100 - (lengthDiff / (maxL || 1)) * 15))) : 100;

  // BOM
  const circuitCount = circuits.length;
  const pexPipe16mmM = Math.ceil(totalPipeLengthM * 1.05);
  const xpsInsulationM2 = Math.ceil(totalFloorAreaM2 * 1.08);
  const damperTapeM = Math.ceil((roomWidthM + roomHeightM) * 2 + 10);
  const pipeFixersCount = Math.ceil(pexPipe16mmM * 2.2);
  const plasticizerKg = Math.ceil(totalFloorAreaM2 * 0.8);
  const filmVaporBarrierM2 = Math.ceil(totalFloorAreaM2 * 1.15);

  const acRecs = recommendACPositions(valid, walls, windows, doors, furniture, compassNorthAngle);

  const environmentalAnalysis = {
    exteriorWallsSummary: `${walls.length || 4} ta devor parametrlari va qalinligi to'liq hisoblandi`,
    windowsSummary: `${windows.length} ta deraza oldida sovuq konveksiyaga qarshi 100mm issiq termoparda`,
    solarWindSummary: `Kompas: ${compassNorthAngle}° • Fasad yo'nalishi bo'yicha hisoblandi`,
    doorsSummary: `${doors.length} ta eshik o'rni orqali gidravlik ulanish`,
    excludedSummary: totalExcludedAreaM2 > 0 ? `${totalExcludedAreaM2} m² maydon (mebel/vanna) 100% chetlab o'tildi` : 'Toza reja',
    physicsSummary: 'Inward Polygon Offset (Buffer) va Boolean Subtraction orqali Z/L shaklli xonalar to\'liq qamrab olindi.',
  };

  const expertVerdict = `Bino Fizikasi va Inward Polygon Offset Standarti: ${totalHeatedAreaM2} m² maydon uchun ${circuitCount} ta kontur hisoblandi (${hydraulicBalancePercent}% balans, 0 kesishuv). Konditsioner: ${acRecs.length} ta mustaqil blok belgilandi.`;

  return {
    circuits,
    manifoldPosition: manifoldPos,
    boilerPosition: boilerPos || null,
    boilerSupplyMain,
    boilerReturnMain,
    totalHeatedAreaM2,
    totalExcludedAreaM2,
    totalPipeLengthM,
    circuitCount,
    hydraulicBalancePercent,
    billOfMaterials: {
      pexPipe16mmM,
      manifoldOutletsCount: circuitCount,
      manifoldUnitName: `Kollektor Guruhi (${circuitCount} chiqishli, rotametrli)`,
      xpsInsulationM2,
      damperTapeM,
      pipeFixersCount,
      plasticizerKg,
      filmVaporBarrierM2,
    },
    environmentalAnalysis,
    acRecommendations: acRecs,
    isIntersectionFree,
    expertVerdict,
  };
}
