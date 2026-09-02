const fs = require('fs');
const file = '/Applications/Project/AllProjects/TermoPlan/termoplanapp/src/components/canvas/RoomCanvas3D.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  'const { roomPoints, walls, furniture, seasonMode } = useCanvasStore();',
  'const { roomPoints, walls, furniture, seasonMode, windows, doors, acPosition } = useCanvasStore();'
);

code = code.replace(
  '<Walls roomPoints={validPoints} wallHeight={wallHeightM} walls={walls} windows={useCanvasStore.getState().windows} doors={useCanvasStore.getState().doors} />',
  '<Walls roomPoints={validPoints} wallHeight={wallHeightM} walls={walls} windows={windows} doors={doors} />'
);

code = code.replace(
  '{seasonMode === \'summer\' && <ACUnit acPosition={useCanvasStore.getState().acPosition} height={wallHeightM} />}',
  '{seasonMode === \'summer\' && <ACUnit acPosition={acPosition} height={wallHeightM} />}'
);

fs.writeFileSync(file, code);
console.log('Hook Patched');
