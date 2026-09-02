const fs = require('fs');
const file = '/Applications/Project/AllProjects/TermoPlan/termoplanapp/src/utils/masterPlumberEngine.ts';
let code = fs.readFileSync(file, 'utf8');

const regex = /function getClosestPointOnPolygon[\s\S]*?return \{ point: bestPoint, insertIdx, originalIdx \};\n\}/;

const newCode = `function getClosestPointOnPolygon(pt: IPoint, poly: IPoint[]): { point: IPoint, insertIdx: number, originalIdx: number } {
  let minDist = Infinity;
  let bestPoint = poly[0];
  let insertIdx = 0;
  let originalIdx = -1;

  for (let i = 0; i < poly.length; i++) {
    const p1 = poly[i];
    const p2 = poly[(i + 1) % poly.length];

    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const len2 = dx * dx + dy * dy;
    let t = 0;
    if (len2 > 0) {
      t = ((pt.x - p1.x) * dx + (pt.y - p1.y) * dy) / len2;
      t = Math.max(0, Math.min(1, t));
    }
    const projX = p1.x + t * dx;
    const projY = p1.y + t * dy;

    const dist = Math.hypot(pt.x - projX, pt.y - projY);
    if (dist < minDist) {
      minDist = dist;
      bestPoint = { x: projX, y: projY };
      
      // If projection is exactly on a vertex, use the vertex directly!
      // This prevents inserting duplicate vertices at corners which causes overlapping shifts
      if (t === 0) {
        originalIdx = i;
      } else if (t === 1) {
        originalIdx = (i + 1) % poly.length;
      } else {
        originalIdx = -1;
        insertIdx = i + 1;
      }
    }
  }
  return { point: bestPoint, insertIdx, originalIdx };
}`;

code = code.replace(regex, newCode);
fs.writeFileSync(file, code);
console.log('Fixed duplicate vertex bug');
