function polyArea(points) {
  let a = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    a += points[i].x * points[j].y - points[j].x * points[i].y;
  }
  return Math.abs(a) / 2;
}

function insetPolygon(points, insetDistance) {
  const n = points.length;
  if (n < 3) return [];

  let signedArea = 0;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    signedArea += points[i].x * points[j].y - points[j].x * points[i].y;
  }
  const isCCW = signedArea > 0;

  const lines = [];
  for (let i = 0; i < n; i++) {
    const p1 = points[i];
    const p2 = points[(i + 1) % n];

    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const len = Math.hypot(dx, dy);
    if (len < 0.001) continue;

    const nx = isCCW ? -dy / len : dy / len;
    const ny = isCCW ? dx / len : -dx / len;

    lines.push({
      p1: { x: p1.x + nx * insetDistance, y: p1.y + ny * insetDistance },
      p2: { x: p2.x + nx * insetDistance, y: p2.y + ny * insetDistance },
    });
  }

  const insetPoints = [];
  const m = lines.length;
  for (let i = 0; i < m; i++) {
    const l1 = lines[i];
    const l2 = lines[(i + 1) % m];

    const x1 = l1.p1.x, y1 = l1.p1.y, x2 = l1.p2.x, y2 = l1.p2.y;
    const x3 = l2.p1.x, y3 = l2.p1.y, x4 = l2.p2.x, y4 = l2.p2.y;

    const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
    if (Math.abs(denom) < 0.0001) {
      insetPoints.push(l1.p2);
    } else {
      const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
      const ix = x1 + t * (x2 - x1);
      const iy = y1 + t * (y2 - y1);
      insetPoints.push({ x: ix, y: iy });
    }
  }

  let newArea = polyArea(insetPoints);
  const newIsCCW = newArea > 0;
  if (Math.abs(newArea) < 0.1 || newIsCCW !== isCCW) {
    return [];
  }

  return insetPoints;
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

function generateInwardPolygonCoil(polygon, stepM, scale) {
  const rings = [];
  let cur = polygon;
  cur = insetPolygon(cur, 0.15); // Edge margin 150mm

  // Generate ALL rings (both supply and return rings) spaced by stepM
  while (cur.length >= 3 && rings.length < 40) {
    rings.push(cur.map((p) => ({ x: p.x * scale, y: p.y * scale })));
    const next = insetPolygon(cur, stepM);
    if (next.length < 3) break;
    cur = next;
  }

  if (rings.length === 0) {
    return { feed: [], ret: [], lengthM: 0 };
  }

  const feed = [];
  const ret = [];

  // Feed path: Rings 0, 2, 4, 6...
  let lastFeedPt = rings[0][0]; // Start at vertex 0 of outer ring
  for (let i = 0; i < rings.length; i += 2) {
    const ring = rings[i];
    // Find closest vertex on this ring to last feed pt (to step inward cleanly)
    let startIdx = 0;
    if (i > 0) startIdx = findClosestPointIdx(lastFeedPt, ring);
    
    // Push the full ring starting from startIdx
    for (let j = 0; j <= ring.length; j++) {
      feed.push(ring[(startIdx + j) % ring.length]);
    }
    lastFeedPt = feed[feed.length - 1]; // End of this ring loop
  }

  // Return path: Rings ... 7, 5, 3, 1 (spiraling outwards)
  // Determine highest odd ring index
  let highestOdd = (rings.length % 2 === 0) ? rings.length - 1 : rings.length - 2;
  
  if (highestOdd >= 0) {
    // The center loop connects feed to return. Connect to closest point on highest odd ring
    let lastRetPt = rings[highestOdd][findClosestPointIdx(lastFeedPt, rings[highestOdd])];
    
    // Draw the U-turn loop in the center
    feed.push({ x: lastFeedPt.x, y: lastRetPt.y }); // small jog
    
    for (let i = highestOdd; i >= 1; i -= 2) {
      const ring = rings[i];
      let startIdx = findClosestPointIdx(lastRetPt, ring);
      
      // Push the full ring
      for (let j = 0; j <= ring.length; j++) {
        ret.push(ring[(startIdx + j) % ring.length]);
      }
      lastRetPt = ret[ret.length - 1];
    }
  }

  return { feed, ret };
}

const zShape = [
  { x: 0, y: 0 }, { x: 4, y: 0 }, { x: 4, y: 2 }, { x: 7, y: 2 },
  { x: 7, y: 5 }, { x: 3, y: 5 }, { x: 3, y: 3 }, { x: 0, y: 3 },
];

const res = generateInwardPolygonCoil(zShape, 0.15, 40);
console.log('Feed points:', res.feed.length);
console.log('Return points:', res.ret.length);
