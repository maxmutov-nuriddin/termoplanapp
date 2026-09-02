const fs = require('fs');
const file = '/Applications/Project/AllProjects/TermoPlan/termoplanapp/src/utils/masterPlumberEngine.ts';
let code = fs.readFileSync(file, 'utf8');

// Find the alignment block
const target = `  // Align all rings to Ring 0
  const alignedRings: IPoint[][] = [ringsPx[0]];
  for (let i = 1; i < ringsPx.length; i++) {
    alignedRings.push(alignRing(ringsPx[i], ringsPx[0]));
  }`;

const fix = `  // Find absolute Top-Left of the polygon for rock-solid alignment
  let minX = Infinity, minY = Infinity;
  for (const p of polygonMeters) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
  }
  const toMM = 1000;
  const refPoint = [{ x: minX * toMM, y: minY * toMM }]; // Use MM scale because ringsPx are in pixel/MM? Wait, ringsPx are in scalePx!
  const refPointPx = [{ x: minX * scalePx, y: minY * scalePx }];

  // Align all rings to the absolute Top-Left corner
  const alignedRings: IPoint[][] = [];
  for (let i = 0; i < ringsPx.length; i++) {
    alignedRings.push(alignRing(ringsPx[i], refPointPx));
  }`;

code = code.replace(target, fix);

fs.writeFileSync(file, code);
console.log('Absolute alignment injected');
