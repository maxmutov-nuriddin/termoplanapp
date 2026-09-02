const fs = require('fs');
const file = '/Applications/Project/AllProjects/TermoPlan/termoplanapp/src/utils/masterPlumberEngine.ts';
let code = fs.readFileSync(file, 'utf8');

// Replace the parity alignment with absolute Manifold projection!
const alignRegex = /\/\/ Align all rings to follow parity topology!.*?const geomFeed: IPoint\[\] = \[\];/s;
const alignNew = `// Align ALL rings to the absolute Manifold position!
  const alignedRings: IPoint[][] = [];
  for (let i = 0; i < ringsPx.length; i++) {
    alignedRings.push(alignRingToPoint(ringsPx[i], refPointPx[0]));
  }

  const geomFeed: IPoint[] = [];`;

code = code.replace(alignRegex, alignNew);

fs.writeFileSync(file, code);
console.log('Fixed topology spiral bug');
