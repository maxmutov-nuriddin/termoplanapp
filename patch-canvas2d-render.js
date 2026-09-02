const fs = require('fs');
const file = '/Applications/Project/AllProjects/TermoPlan/termoplanapp/src/components/canvas/RoomCanvas2D.tsx';
let code = fs.readFileSync(file, 'utf8');

// The block to replace starts at {/* 1.1 Excluded Zones (Istisno Hududlar) */}
// and ends right before {/* 4. Quvurlar va Konditsioner */}
// We will replace it with DraggableElementsRenderer

const startMarker = "{/* 1.1 Excluded Zones (Istisno Hududlar) */}";
const endMarker = "{/* 4. Quvurlar va Konditsioner */}";

const startIndex = code.indexOf(startMarker);
const endIndex = code.indexOf(endMarker);

if (startIndex !== -1 && endIndex !== -1) {
  const newBlock = `<DraggableElementsRenderer readOnly={readOnly} />\n\n            `;
  code = code.substring(0, startIndex) + newBlock + code.substring(endIndex);
}

// Now we need to remove the Boiler rendering which is after the Pipes
const boilerStart = "{/* Kotyol (Qozon / Isitish Manbai) */}";
const boilerEnd = "{/* 5. Parallel & 90° Smart Tekislash";

const bStartIndex = code.indexOf(boilerStart);
const bEndIndex = code.indexOf(boilerEnd);

if (bStartIndex !== -1 && bEndIndex !== -1) {
  code = code.substring(0, bStartIndex) + code.substring(bEndIndex);
}

fs.writeFileSync(file, code);
console.log('RoomCanvas2D renders replaced');
