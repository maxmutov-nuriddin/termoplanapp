const fs = require('fs');

const path = '/Applications/Project/AllProjects/TermoPlan/termoplanapp/src/utils/masterPlumberEngine.ts';
let content = fs.readFileSync(path, 'utf8');

// Replace insetPolygon and generateInwardPolygonCoil
const startMarker = '/**\n * 4. TO\'G\'RI PARALLEL POLYGON INSET';
const endMarker = '/**\n * 6. BOSQICH G';

if (content.includes(startMarker) && content.includes(endMarker)) {
  const before = content.substring(0, content.indexOf(startMarker));
  const after = content.substring(content.indexOf(endMarker));

  const newSection = `/**
 * 4. TO'G'RI PARALLEL POLYGON INSET (Offset/Buffer) ALGORITMI
 */
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
function generateInwardPolygonCoil(
  polygonMeters: IPoint[],
  stepM: number,
  scalePx: number
): { feed: IPoint[]; ret: IPoint[]; lengthM: number } {
  const toMM = 1000;
  const basePoly = ensureClosed(polygonMeters).map(p => [p.x * toMM, p.y * toMM]);

  const ringsPx: IPoint[][] = [];
  let currentOffsetMM = 150; // 150mm margin from the wall
  
  while (ringsPx.length < 40) {
    let result: any[] = [];
    try {
      result = new Offset().data(basePoly).padding(currentOffsetMM);
    } catch (e) {
      break;
    }
    
    if (!result || result.length === 0) break;
    
    // Choose the largest island if it splits
    let largestIsland = result[0];
    let maxArea = 0;
    for (const island of result) {
      const pts = island.map((p: any) => ({ x: p[0], y: p[1] }));
      const a = calculatePolygonArea(pts);
      if (a > maxArea) {
        maxArea = a;
        largestIsland = island;
      }
    }
    
    if (largestIsland.length < 3) break;
    
    const ringPx = largestIsland.map((p: any) => ({
      x: parseFloat(((p[0] / toMM) * scalePx).toFixed(1)),
      y: parseFloat(((p[1] / toMM) * scalePx).toFixed(1))
    }));
    
    ringsPx.push(ringPx);
    currentOffsetMM += stepM * 1000;
  }

  if (ringsPx.length === 0) {
    return { feed: [], ret: [], lengthM: 0 };
  }

  const feed: IPoint[] = [];
  const ret: IPoint[] = [];

  // Feed path: Rings 0, 2, 4, 6...
  let lastFeedPt = ringsPx[0][0]; 
  for (let i = 0; i < ringsPx.length; i += 2) {
    const ring = ringsPx[i];
    let startIdx = 0;
    if (i > 0) startIdx = findClosestPointIdx(lastFeedPt, ring);
    
    for (let j = 0; j <= ring.length; j++) {
      feed.push(ring[(startIdx + j) % ring.length]);
    }
    lastFeedPt = feed[feed.length - 1]; 
  }

  // Return path: Rings 7, 5, 3, 1
  let highestOdd = (ringsPx.length % 2 === 0) ? ringsPx.length - 1 : ringsPx.length - 2;
  
  if (highestOdd >= 0) {
    let lastRetPt = ringsPx[highestOdd][findClosestPointIdx(lastFeedPt, ringsPx[highestOdd])];
    
    const dx = lastRetPt.x - lastFeedPt.x;
    const dy = lastRetPt.y - lastFeedPt.y;
    feed.push({ x: lastFeedPt.x + dx/2, y: lastFeedPt.y + dy/2 }); 
    
    for (let i = highestOdd; i >= 1; i -= 2) {
      const ring = ringsPx[i];
      let startIdx = findClosestPointIdx(lastRetPt, ring);
      
      for (let j = 0; j <= ring.length; j++) {
        ret.push(ring[(startIdx + j) % ring.length]);
      }
      lastRetPt = ret[ret.length - 1];
    }
  }

  const areaM2 = calculatePolygonArea(polygonMeters);
  const lengthM = parseFloat((areaM2 / stepM).toFixed(1));

  return { feed, ret, lengthM };
}

`;

  fs.writeFileSync(path, before + newSection + after);
  console.log('Successfully updated generateInwardPolygonCoil and insetPolygon!');
} else {
  console.log('Could not find markers!');
}
