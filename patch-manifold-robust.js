const fs = require('fs');
const file = '/Applications/Project/AllProjects/TermoPlan/termoplanapp/src/utils/masterPlumberEngine.ts';
let code = fs.readFileSync(file, 'utf8');

// Find the block setting refPointPx
const regex = /const refPoint =.*?const alignedRings: IPoint\[\]\[\] = \[\];/s;

const newCode = `// Align all rings to the physical Manifold position!
  const refPointPx = [{ x: manifoldPos.x * scalePx, y: manifoldPos.y * scalePx }];

  // Align all rings to the manifold corner
  const alignedRings: IPoint[][] = [];`;

code = code.replace(regex, newCode);
fs.writeFileSync(file, code);
console.log('Robust manifold alignment injected');
