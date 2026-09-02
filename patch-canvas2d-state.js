const fs = require('fs');
const file = '/Applications/Project/AllProjects/TermoPlan/termoplanapp/src/components/canvas/RoomCanvas2D.tsx';
let code = fs.readFileSync(file, 'utf8');

const fields = ['heatingExcludedZones', 'furniture', 'windows', 'doors', 'acPosition', 'boilerPosition', 'manifoldPosition'];

for (const f of fields) {
  // Regex to replace variable usage with useCanvasStore.getState().[variable]
  // We have to be careful to only replace them where they stand alone as identifiers.
  // Using a regex like `\b${f}\b` but not inside useCanvasStore.getState().${f}
  const regex = new RegExp(`\\b${f}\\b(?!:)`, 'g');
  // First, temporarily replace useCanvasStore.getState().f with a placeholder so it's not double-replaced
  code = code.replace(new RegExp(`useCanvasStore\\.getState\\(\\)\\.${f}`, 'g'), `__PLACEHOLDER_${f}__`);
  // Now replace all naked usages
  code = code.replace(regex, `useCanvasStore.getState().${f}`);
  // Restore placeholders
  code = code.replace(new RegExp(`__PLACEHOLDER_${f}__`, 'g'), `useCanvasStore.getState().${f}`);
}

fs.writeFileSync(file, code);
console.log('Fixed variable usages to use getState()');
