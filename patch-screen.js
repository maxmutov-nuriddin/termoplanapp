const fs = require('fs');
const file = '/Applications/Project/AllProjects/TermoPlan/termoplanapp/src/screens/ConstructorScreen.tsx';
let code = fs.readFileSync(file, 'utf8');

// Add import Modal
if (!code.includes('Modal,')) {
  code = code.replace('import { View, Text, StyleSheet, ScrollView, TouchableOpacity', 'import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal');
}

// Add state for 3D fullscreen
if (!code.includes('const [is3DFullscreen, setIs3DFullscreen] = useState(false);')) {
  code = code.replace(
    'const [isGenerating, setIsGenerating] = useState(false);',
    'const [isGenerating, setIsGenerating] = useState(false);\n  const [is3DFullscreen, setIs3DFullscreen] = useState(false);'
  );
}

// Update RoomCanvas3D usage to pass props
const oldRoomCanvasUsage = `<RoomCanvas3D
              wallHeightM={currentProject?.defaultCeilingHeight || 3.0}
              isSunnyRoom={true}
              recommendedBtu={recommendedAcInfo.btu}
              sunAzimuth={currentProject?.compassNorthAngle ? (180 - currentProject.compassNorthAngle + 360) % 360 : 180}
              windAngle={315}
            />`;
const newRoomCanvasUsage = `<RoomCanvas3D
              wallHeightM={currentProject?.defaultCeilingHeight || 3.0}
              onToggleFullscreen={() => setIs3DFullscreen(true)}
            />`;

if (code.includes(oldRoomCanvasUsage)) {
  code = code.replace(oldRoomCanvasUsage, newRoomCanvasUsage);
}

// Add Modal at the end of ConstructorScreen
const oldReturn = `    </View>
  );
};`;
const newReturn = `      <Modal visible={is3DFullscreen} animationType="slide" presentationStyle="fullScreen">
        <RoomCanvas3D
          wallHeightM={currentProject?.defaultCeilingHeight || 3.0}
          isFullscreen={true}
          onToggleFullscreen={() => setIs3DFullscreen(false)}
        />
      </Modal>
    </View>
  );
};`;

if (code.includes(oldReturn) && !code.includes('<Modal visible={is3DFullscreen}')) {
  code = code.replace(oldReturn, newReturn);
}

fs.writeFileSync(file, code);
console.log('Patched ConstructorScreen');
