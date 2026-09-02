const fs = require('fs');
const file = '/Applications/Project/AllProjects/TermoPlan/termoplanapp/src/utils/masterPlumberEngine.ts';
let code = fs.readFileSync(file, 'utf8');

// Find where ringsPx is populated
const target = `    if (sum < 0) {
      ringPx.reverse();
    }
    ringsPx.push(ringPx);`;

const fix = `    if (sum < 0) {
      ringPx.reverse();
    }
    // Remove the duplicate closing point if it exists
    const firstP = ringPx[0];
    const lastP = ringPx[ringPx.length - 1];
    if (Math.hypot(firstP.x - lastP.x, firstP.y - lastP.y) < 1.0) {
      ringPx.pop();
    }
    ringsPx.push(ringPx);`;

code = code.replace(target, fix);

fs.writeFileSync(file, code);
console.log('Duplicate closing point removed');
