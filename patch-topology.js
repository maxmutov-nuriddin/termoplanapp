const fs = require('fs');
const file = '/Applications/Project/AllProjects/TermoPlan/termoplanapp/src/utils/masterPlumberEngine.ts';
let code = fs.readFileSync(file, 'utf8');

const getClosestFn = `function getClosestPointOnPolygon(pt: IPoint, poly: IPoint[]): { point: IPoint, insertIdx: number, originalIdx: number } {
  let minDist = Infinity;
  let bestPoint = poly[0];
  let insertIdx = 0;
  let originalIdx = -1;

  for (let i = 0; i < poly.length; i++) {
    const p1 = poly[i];
    const p2 = poly[(i + 1) % poly.length];

    // Check exact vertices first to avoid floating point issues
    const d1 = Math.hypot(pt.x - p1.x, pt.y - p1.y);
    if (d1 < minDist && d1 < 5) { // 5px threshold for "exact"
      return { point: p1, insertIdx: i, originalIdx: i };
    }

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
      insertIdx = i + 1;
      originalIdx = -1;
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

function alignRing`;

// Insert the new functions before alignRing
code = code.replace('function alignRing', getClosestFn);

// Replace the alignment loop
const alignOldRegex = /\/\/ Align all rings to the manifold corner.*?const geomFeed: IPoint\[\] = \[\];/s;
const alignNew = `// Align all rings to follow parity topology!
  const alignedRings: IPoint[][] = [];
  if (ringsPx.length > 0) {
    alignedRings.push(alignRingToPoint(ringsPx[0], refPointPx[0]));
  }
  if (ringsPx.length > 1) {
    alignedRings.push(alignRingToPoint(ringsPx[1], refPointPx[0]));
  }
  
  for (let i = 2; i < ringsPx.length; i++) {
    const prevRing = alignedRings[i - 2];
    const prevLastPoint = prevRing[prevRing.length - 1];
    alignedRings.push(alignRingToPoint(ringsPx[i], prevLastPoint));
  }

  const geomFeed: IPoint[] = [];`;

code = code.replace(alignOldRegex, alignNew);

fs.writeFileSync(file, code);
console.log('Topology alignment injected');
