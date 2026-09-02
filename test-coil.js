const Offset = require('polygon-offset');

function polyArea(points) {
  let a = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    a += points[i].x * points[j].y - points[j].x * points[i].y;
  }
  return Math.abs(a) / 2;
}

function findClosestPointIdx(pt, ring) {
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

// Ensure polygon is closed for polygon-offset
function ensureClosed(pts) {
  if (pts.length < 3) return pts;
  const first = pts[0];
  const last = pts[pts.length - 1];
  if (Math.hypot(first.x - last.x, first.y - last.y) > 0.001) {
    return [...pts, { ...first }];
  }
  return pts;
}

function generateInwardPolygonCoil(polygonMeters, stepM, scalePx) {
  // polygon-offset prefers non-tiny numbers. Scale to mm (1m = 1000mm)
  const toMM = 1000;
  const basePoly = ensureClosed(polygonMeters).map(p => [p.x * toMM, p.y * toMM]);

  // Array of valid rings (each is a single closed array of {x, y} in PIXELS)
  // If an offset yields multiple islands, we'll just take the largest one to avoid jumping.
  const ringsPx = [];
  
  let currentOffsetMM = 150; // 150mm from wall
  
  while (ringsPx.length < 40) {
    let result = [];
    try {
      result = new Offset().data(basePoly).padding(currentOffsetMM);
    } catch (e) {
      break;
    }
    
    if (!result || result.length === 0) break;
    
    // Find largest island
    let largestIsland = result[0];
    let maxArea = 0;
    for (const island of result) {
      const pts = island.map(p => ({ x: p[0], y: p[1] }));
      const a = polyArea(pts);
      if (a > maxArea) {
        maxArea = a;
        largestIsland = island;
      }
    }
    
    if (largestIsland.length < 3) break;
    if (maxArea < 100000) break; // < 0.1 m2
    
    const ringPx = largestIsland.map(p => ({
      x: (p[0] / toMM) * scalePx,
      y: (p[1] / toMM) * scalePx
    }));
    
    ringsPx.push(ringPx);
    currentOffsetMM += stepM * 1000;
  }

  if (ringsPx.length === 0) {
    return { feed: [], ret: [], lengthM: 0 };
  }

  const feed = [];
  const ret = [];

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

  return { feed, ret, lengthM: 0 };
}

const zShape = [
  { x: 0, y: 0 }, { x: 4, y: 0 }, { x: 4, y: 2 }, { x: 7, y: 2 },
  { x: 7, y: 5 }, { x: 3, y: 5 }, { x: 3, y: 3 }, { x: 0, y: 3 }
];
const res = generateInwardPolygonCoil(zShape, 0.15, 40);
console.log('Feed points:', res.feed.length, 'Return points:', res.ret.length);
