const fs = require('fs');
const file = '/Applications/Project/AllProjects/TermoPlan/termoplanapp/src/utils/masterPlumberEngine.ts';
let code = fs.readFileSync(file, 'utf8');

// 1. Update signature of generateInwardPolygonCoil
const sigOld = `function generateInwardPolygonCoil(
  polygonMeters: IPoint[],
  stepM: number,
  scalePx: number
): { feed: IPoint[]; ret: IPoint[]; lengthM: number } {`;
const sigNew = `function generateInwardPolygonCoil(
  polygonMeters: IPoint[],
  manifoldPos: IPoint,
  stepM: number,
  scalePx: number
): { feed: IPoint[]; ret: IPoint[]; lengthM: number } {`;
code = code.replace(sigOld, sigNew);

// 2. Update refPointPx calculation
const alignOld = `  // Find absolute Top-Left of the polygon for rock-solid alignment
  let minX = Infinity, minY = Infinity;
  for (const p of polygonMeters) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
  }
  const refPoint = [{ x: minX * 1000, y: minY * 1000 }];
  const refPointPx = [{ x: minX * scalePx, y: minY * scalePx }];

  // Align all rings to the absolute Top-Left corner
  const alignedRings: IPoint[][] = [];
  for (let i = 0; i < ringsPx.length; i++) {
    alignedRings.push(alignRing(ringsPx[i], refPointPx));
  }`;

const alignNew = `  // Align all rings to the physical Manifold position!
  const refPointPx = [{ x: manifoldPos.x * scalePx, y: manifoldPos.y * scalePx }];

  // Align all rings to the manifold corner
  const alignedRings: IPoint[][] = [];
  for (let i = 0; i < ringsPx.length; i++) {
    alignedRings.push(alignRing(ringsPx[i], refPointPx));
  }`;
code = code.replace(alignOld, alignNew);

// 3. Update the call site
const callOld = `const { feed, ret, lengthM } = generateInwardPolygonCoil(island, stepM, scale);`;
const callNew = `const { feed, ret, lengthM } = generateInwardPolygonCoil(island, manifoldPos, stepM, scale);`;
code = code.replace(callOld, callNew);

fs.writeFileSync(file, code);
console.log('Manifold alignment injected');
