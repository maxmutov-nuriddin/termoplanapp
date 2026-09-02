const fs = require('fs');
const file = '/Applications/Project/AllProjects/TermoPlan/termoplanapp/src/utils/masterPlumberEngine.ts';
let code = fs.readFileSync(file, 'utf8');

const regex = /function generateInwardPolygonCoil.*?\/\*\*\n \* 6\. BOSQICH G/s;

const newSpiralCode = `function alignRing(target: IPoint[], reference: IPoint[]): IPoint[] {
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
    
    // Force Clockwise
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

  // Align all rings to Ring 0
  const alignedRings: IPoint[][] = [ringsPx[0]];
  for (let i = 1; i < ringsPx.length; i++) {
    alignedRings.push(alignRing(ringsPx[i], ringsPx[0]));
  }

  const geomFeed: IPoint[] = [];
  const geomReturn: IPoint[] = [];
  const N = alignedRings.length;

  // Feed geometric path (0, 2, 4...)
  for (let i = 0; i < N; i += 2) {
    const ring = alignedRings[i];
    for (let j = 0; j < ring.length; j++) {
      geomFeed.push(ring[j]);
    }
  }

  // Return geometric path (1, 3, 5...)
  for (let i = 1; i < N; i += 2) {
    const ring = alignedRings[i];
    for (let j = 0; j < ring.length; j++) {
      geomReturn.push(ring[j]);
    }
  }

  // Connect at center and reverse return
  const feed = [...geomFeed];
  const ret = geomReturn.reverse();
  
  // Add center hairpin connection smoothly
  if (feed.length > 0 && ret.length > 0) {
    feed.push(ret[0]); // Connect to the start of reversed return
  }

  const areaM2 = calculatePolygonArea(polygonMeters);
  const lengthM = parseFloat((areaM2 / stepM).toFixed(1));

  return { feed, ret, lengthM };
}

/**
 * 6. BOSQICH G`;

code = code.replace(regex, newSpiralCode);
fs.writeFileSync(file, code);
console.log('Perfect rectilinear snail injected');
