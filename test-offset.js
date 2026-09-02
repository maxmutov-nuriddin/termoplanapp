const Offset = require('polygon-offset');
const zShape = [
  [0, 0], [40, 0], [40, 20], [70, 20],
  [70, 50], [30, 50], [30, 30], [0, 30], [0,0]
];
const offset = new Offset();
const rings = [];
for (let step = 5; step <= 20; step += 5) {
  const p = new Offset().data(zShape).padding(step);
  if (p && p.length > 0) rings.push(p);
}
console.log('Rings generated:', rings.length);
if (rings.length > 0) {
  rings.forEach((r, idx) => console.log(`Ring ${idx}: ${r.length} parts. First part length: ${r[0].length}`));
}
