const fs = require('fs');
const file = '/Applications/Project/AllProjects/TermoPlan/termoplanapp/src/utils/masterPlumberEngine.ts';
let code = fs.readFileSync(file, 'utf8');

// Replace the linear t with a smoothstep t
const linearT = 'const t = pt / NUM_PTS;';
const proT = `let rawT = pt / NUM_PTS;
      let t = 0;
      const transStart = 0.75;
      if (rawT > transStart) {
        let norm = (rawT - transStart) / (1 - transStart);
        t = norm * norm * (3 - 2 * norm); // Smoothstep for elegant parallel shift
      }`;

code = code.replace(new RegExp(linearT.replace(/[.*+?^$\{}()|[\]\\]/g, '\\$&'), 'g'), proT);

fs.writeFileSync(file, code);
console.log('Professional spiral step injected');
