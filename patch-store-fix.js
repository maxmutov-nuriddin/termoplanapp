const fs = require('fs');
const file = '/Applications/Project/AllProjects/TermoPlan/termoplanapp/src/screens/CADStudioScreen.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  'await saveRoom({',
  'const state = useCanvasStore.getState();\n      await saveRoom({\n        windows: state.windows || [],\n        doors: state.doors || [],\n        furniture: state.furniture || [],\n        boilerPosition: state.boilerPosition || undefined,\n        manifoldPosition: state.manifoldPosition || undefined,\n        acPosition: state.acPosition || undefined,'
);

// Now remove the old lines inside saveRoom:
code = code.replace(/windows: windows \|\| \[\],\n/g, '');
code = code.replace(/doors: doors \|\| \[\],\n/g, '');
code = code.replace(/furniture: furniture \|\| \[\],\n/g, '');
code = code.replace(/boilerPosition: boilerPosition \|\| undefined,\n/g, '');
code = code.replace(/manifoldPosition: manifoldPosition \|\| undefined,\n/g, '');
code = code.replace(/acPosition: acPosition \|\| undefined,\n/g, '');

fs.writeFileSync(file, code);
console.log('Fixed handleSaveAndReturn in CADStudioScreen');
