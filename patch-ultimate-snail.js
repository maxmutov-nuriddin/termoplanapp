const fs = require('fs');
const file = '/Applications/Project/AllProjects/TermoPlan/termoplanapp/src/utils/masterPlumberEngine.ts';
let code = fs.readFileSync(file, 'utf8');

const regex = /\/\/ Feed geometric path.*?const areaM2 = calculatePolygonArea/s;

const newSpiralCode = `// Feed geometric path (0, 2, 4...)
  for (let i = 0; i < N; i += 2) {
    const ring = alignedRings[i];
    const M = ring.length;
    if (i === 0) {
      for (let j = 0; j < M; j++) geomFeed.push(ring[j]);
    } else {
      geomFeed.push(ring[M - 1]);
      for (let j = 0; j < M; j++) geomFeed.push(ring[j]);
    }
  }

  // Return geometric path (1, 3, 5...)
  for (let i = 1; i < N; i += 2) {
    const ring = alignedRings[i];
    const M = ring.length;
    if (i === 1) {
      for (let j = 0; j < M; j++) geomReturn.push(ring[j]);
    } else {
      geomReturn.push(ring[M - 1]);
      for (let j = 0; j < M; j++) geomReturn.push(ring[j]);
    }
  }

  // Connect at center and reverse return
  const feed = [...geomFeed];
  const ret = geomReturn.reverse();
  
  // Add center hairpin connection smoothly
  if (feed.length > 0 && ret.length > 0) {
    feed.push(ret[0]); // Connect to the start of reversed return
  }

  const areaM2 = calculatePolygonArea`;

code = code.replace(regex, newSpiralCode);
fs.writeFileSync(file, code);
console.log('Ultimate rectilinear snail injected');
