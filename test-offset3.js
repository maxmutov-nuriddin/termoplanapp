const Offset = require('polygon-offset');
const basePoly = [
  [1000, 1000],
  [7000, 1000],
  [7000, 5000],
  [1000, 5000],
  [1000, 1000]
];
const result = new Offset().data(basePoly).padding(150);
console.log("Padding 150 result:");
console.log(result);
