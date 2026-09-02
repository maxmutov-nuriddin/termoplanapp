const fs = require('fs');
const file = '/Applications/Project/AllProjects/TermoPlan/termoplanapp/src/components/canvas/DraggableElementsRenderer.tsx';
let code = fs.readFileSync(file, 'utf8');

// Fix AirflowConeRenderer props
code = code.replace(
  /<AirflowConeRenderer[\s\S]*?\/>/,
  `<AirflowConeRenderer
        roomWidthM={6.5}
        roomHeightM={5.0}
        acPos={acPosition}
        furniture={furniture || []}
      />`
);

// We need to pass roomWidthM and roomHeightM as props to DraggableElementsRenderer, 
// or just use 6.5 and 5.0 for now (like original RoomCanvas2D did for summer mode).
fs.writeFileSync(file, code);
console.log('Fixed DraggableElementsRenderer');
