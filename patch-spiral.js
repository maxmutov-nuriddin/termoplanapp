const fs = require('fs');
const file = '/Applications/Project/AllProjects/TermoPlan/termoplanapp/src/utils/masterPlumberEngine.ts';
let code = fs.readFileSync(file, 'utf8');

const injectionPoint = 'ringsPx.push(ringPx);';
const fix = `
    // Fix winding order (force clockwise)
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
`;

code = code.replace(injectionPoint, fix);
fs.writeFileSync(file, code);
console.log('Patched spiral logic for winding order');
