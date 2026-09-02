const ClipperLib = require('clipper-lib');

const subj = new ClipperLib.Paths();
const subj_path = new ClipperLib.Path();
subj_path.push(
  new ClipperLib.IntPoint(0, 0),
  new ClipperLib.IntPoint(40, 0),
  new ClipperLib.IntPoint(40, 20),
  new ClipperLib.IntPoint(70, 20),
  new ClipperLib.IntPoint(70, 50),
  new ClipperLib.IntPoint(30, 50),
  new ClipperLib.IntPoint(30, 30),
  new ClipperLib.IntPoint(0, 30)
);
subj.push(subj_path);

const co = new ClipperLib.ClipperOffset();
co.AddPaths(subj, ClipperLib.JoinType.jtRound, ClipperLib.EndType.etClosedPolygon);

const solution = new ClipperLib.Paths();
co.Execute(solution, -5); // offset inward by 5 units

console.log("Original points:", subj_path.length);
console.log("Solution paths count:", solution.length);
if (solution.length > 0) {
    console.log("First solution points:", solution[0].length);
    console.log("First point:", solution[0][0].X, solution[0][0].Y);
}
