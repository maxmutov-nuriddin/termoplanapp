const fs = require('fs');
const file = '/Applications/Project/AllProjects/TermoPlan/termoplanapp/src/components/canvas/RoomCanvas3D.tsx';
let code = fs.readFileSync(file, 'utf8');

const panRegex = /if \(gestureState\.numberActiveTouches === 1 && cameraMode === '3D'\) \{[\s\S]*?\} else if \(gestureState\.numberActiveTouches === 2\) \{[\s\S]*?\}/;

const panNew = `if (gestureState.numberActiveTouches === 1) {
        if (cameraMode === '3D') {
          rotY.current = lastRot.current.y + gestureState.dx * 0.01;
          rotX.current = Math.max(-Math.PI/2, Math.min(Math.PI/2, lastRot.current.x + gestureState.dy * 0.01));
        } else {
          // 1-finger panning in 2D mode!
          panX.current = lastPan.current.x - gestureState.dx * 0.05;
          panZ.current = lastPan.current.z - gestureState.dy * 0.05;
        }
      } else if (gestureState.numberActiveTouches === 2) {
        panX.current = lastPan.current.x - gestureState.dx * 0.05;
        panZ.current = lastPan.current.z - gestureState.dy * 0.05;
      }`;

code = code.replace(panRegex, panNew);

fs.writeFileSync(file, code);
console.log('Fixed 1-finger pan in 2D mode');
