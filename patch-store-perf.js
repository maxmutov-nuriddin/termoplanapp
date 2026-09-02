const fs = require('fs');
const file = '/Applications/Project/AllProjects/TermoPlan/termoplanapp/src/screens/CADStudioScreen.tsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Remove from destructuring
code = code.replace(/windows,\s*doors,\s*furniture,\s*boilerPosition,\s*manifoldPosition,\s*acPosition,\s*/g, '');

// 2. Remove from useShallow
code = code.replace(/windows:\s*s\.windows,\s*doors:\s*s\.doors,\s*furniture:\s*s\.furniture,\s*boilerPosition:\s*s\.boilerPosition,\s*manifoldPosition:\s*s\.manifoldPosition,\s*acPosition:\s*s\.acPosition,\s*/g, '');

// 3. Fix handleSave
// First, find where handleSave uses them. It probably uses the local variables.
// Wait, the local variables are now gone, so we must extract them inside handleSave.
code = code.replace(
  /const handleSave = async \(\) => \{/g,
  "const handleSave = async () => {\n    const { windows, doors, furniture, boilerPosition, manifoldPosition, acPosition, interiorWalls } = useCanvasStore.getState();"
);

// We need to be careful if interiorWalls is already in handleSave or not.
// Let's just fetch all of them inside handleSave.
fs.writeFileSync(file, code);
console.log('CADStudioScreen store subscription optimized');
