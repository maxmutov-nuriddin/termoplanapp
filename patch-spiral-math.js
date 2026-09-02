const fs = require('fs');
const file = '/Applications/Project/AllProjects/TermoPlan/termoplanapp/src/utils/masterPlumberEngine.ts';
let code = fs.readFileSync(file, 'utf8');

const regex = /function generateInwardPolygonCoil.*?\/\*\*\n \* 6\. BOSQICH G/s;

const newSpiralCode = `function resamplePolygon(points: IPoint[], numPoints: number): IPoint[] {
  let totalLen = 0;
  const lengths = [];
  for(let i=0; i<points.length; i++) {
    const p1 = points[i];
    const p2 = points[(i+1)%points.length];
    const d = Math.hypot(p2.x - p1.x, p2.y - p1.y);
    totalLen += d;
    lengths.push(d);
  }
  
  if (totalLen === 0) return Array(numPoints).fill(points[0]);

  const resampled: IPoint[] = [];
  const step = totalLen / numPoints;
  let currentDist = 0;
  let edgeIdx = 0;
  
  for(let i=0; i<numPoints; i++) {
    const targetDist = i * step;
    while (edgeIdx < points.length && currentDist + lengths[edgeIdx] < targetDist - 0.001) {
      currentDist += lengths[edgeIdx];
      edgeIdx++;
    }
    if (edgeIdx >= points.length) {
      resampled.push(points[0]);
      continue;
    }
    
    const p1 = points[edgeIdx];
    const p2 = points[(edgeIdx+1)%points.length];
    const remain = targetDist - currentDist;
    const ratio = lengths[edgeIdx] === 0 ? 0 : remain / lengths[edgeIdx];
    
    resampled.push({
      x: p1.x + (p2.x - p1.x) * ratio,
      y: p1.y + (p2.y - p1.y) * ratio
    });
  }
  return resampled;
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

function generateInwardPolygonCoil(
  polygonMeters: IPoint[],
  stepM: number,
  scalePx: number
): { feed: IPoint[]; ret: IPoint[]; lengthM: number } {
  const toMM = 1000;
  const basePoly = ensureClosed(polygonMeters).map(p => [p.x * toMM, p.y * toMM]);

  const ringsPx: IPoint[][] = [];
  let currentOffsetMM = 150; 
  
  while (ringsPx.length < 80) {
    let result: any[] = [];
    try {
      result = new Offset().data(basePoly).padding(currentOffsetMM);
    } catch (e) {
      break;
    }
    
    if (!result || result.length === 0) break;
    
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
    
    let sum = 0;
    for (let k = 0; k < ringPx.length; k++) {
      const pA = ringPx[k];
      const pB = ringPx[(k + 1) % ringPx.length];
      sum += (pB.x - pA.x) * (pB.y + pA.y);
    }
    if (sum < 0) {
      ringPx.reverse();
    }
    ringsPx.push(ringPx);
    
    currentOffsetMM += stepM * 1000;
  }

  if (ringsPx.length === 0) {
    return { feed: [], ret: [], lengthM: 0 };
  }

  const NUM_PTS = 150;
  const alignedRings: IPoint[][] = [];
  
  for (let i = 0; i < ringsPx.length; i++) {
    let resampled = resamplePolygon(ringsPx[i], NUM_PTS);
    if (i > 0) {
      resampled = alignRing(resampled, alignedRings[i-1]);
    }
    alignedRings.push(resampled);
  }

  const feed: IPoint[] = [];
  const ret: IPoint[] = [];
  const N = alignedRings.length;

  for (let i = 0; i < N - 2; i += 2) {
    const R_curr = alignedRings[i];
    const R_next = alignedRings[i+2];
    for (let pt = 0; pt < NUM_PTS; pt++) {
      const t = pt / NUM_PTS; 
      feed.push({
        x: (1-t)*R_curr[pt].x + t*R_next[pt].x,
        y: (1-t)*R_curr[pt].y + t*R_next[pt].y
      });
    }
  }

  let highestOdd = (N % 2 === 0) ? N - 1 : N - 2;
  
  if (highestOdd >= 1) {
    for (let i = highestOdd; i >= 1; i -= 2) {
      const R_curr = alignedRings[i];
      for (let pt = 0; pt < NUM_PTS; pt++) {
        const t = pt / NUM_PTS; 
        if (i >= 2) {
          ret.push({
            x: (1-t)*R_curr[pt].x + t*alignedRings[i-2][pt].x,
            y: (1-t)*R_curr[pt].y + t*alignedRings[i-2][pt].y
          });
        } else {
          ret.push({
            x: R_curr[pt].x,
            y: R_curr[pt].y
          });
        }
      }
    }
  }

  const areaM2 = calculatePolygonArea(polygonMeters);
  const lengthM = parseFloat((areaM2 / stepM).toFixed(1));

  return { feed, ret, lengthM };
}

/**
 * 6. BOSQICH G`;

code = code.replace(regex, newSpiralCode);
fs.writeFileSync(file, code);
console.log('Archimedean spiral math injected');
