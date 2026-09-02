const fs = require('fs');
const file = '/Applications/Project/AllProjects/TermoPlan/termoplanapp/src/utils/masterPlumberEngine.ts';
let code = fs.readFileSync(file, 'utf8');

const regex = /\/\/ Feed geometric path.*?\/\/ Connect at center and reverse return/s;

const sequentialCode = `// Feed geometric path (0, 2, 4...)
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

  // Connect at center and reverse return`;

code = code.replace(regex, sequentialCode);
fs.writeFileSync(file, code);
console.log('Sequential loops injected');
