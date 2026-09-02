const fs = require('fs');
const file = '/Applications/Project/AllProjects/TermoPlan/termoplanapp/src/utils/masterPlumberEngine.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  'const toMM = 1000;\n  const refPoint = [{ x: minX * toMM, y: minY * toMM }];',
  'const refPoint = [{ x: minX * 1000, y: minY * 1000 }];'
);

fs.writeFileSync(file, code);
