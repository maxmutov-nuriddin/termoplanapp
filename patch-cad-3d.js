const fs = require('fs');
const file = '/Applications/Project/AllProjects/TermoPlan/termoplanapp/src/screens/CADStudioScreen.tsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Add RoomCanvas3D import
if (!code.includes('RoomCanvas3D')) {
  code = code.replace(
    "import { RoomCanvas2D } from '../components/canvas/RoomCanvas2D';",
    "import { RoomCanvas2D } from '../components/canvas/RoomCanvas2D';\nimport { RoomCanvas3D } from '../components/canvas/RoomCanvas3D';"
  );
}
// Add Box import if missing
if (!code.includes('Box,')) {
  code = code.replace('Layers,', 'Layers,\n  Box,');
}

// 2. Add state
const stateMarker = 'const [roomTypeModalVisible, setRoomTypeModalVisible] = useState(false);';
const stateNew = `const [dimensionMode, setDimensionMode] = useState<'2D' | '3D'>('2D');\n  const [is3DFullscreen, setIs3DFullscreen] = useState(false);\n  ` + stateMarker;
code = code.replace(stateMarker, stateNew);

// 3. Render Canvas based on dimensionMode
const canvasRegex = /<RoomCanvas2D\n\s*isFullScreenStudio=\{true\}\n\s*showPipesAndAirflow=\{false\}\n\s*readOnly=\{false\}\n\s*isSunnyRoom=\{currentNorthAngle === 0 \|\| currentNorthAngle === 45\}\n\s*onSelectWall=\{handleOpenWallEditor\}\n\s*\/>/;
const canvasNew = `{dimensionMode === '2D' ? (
        <RoomCanvas2D
          isFullScreenStudio={true}
          showPipesAndAirflow={false}
          readOnly={false}
          isSunnyRoom={currentNorthAngle === 0 || currentNorthAngle === 45}
          onSelectWall={handleOpenWallEditor}
        />
      ) : (
        <View style={{ flex: 1, backgroundColor: '#000' }}>
          <RoomCanvas3D
            wallHeightM={currentProject?.defaultCeilingHeight || 3.0}
            isFullscreen={true}
            onToggleFullscreen={() => {}}
          />
        </View>
      )}`;
code = code.replace(canvasRegex, canvasNew);

// 4. Wrap Dock & Property Bar
code = code.replace(
  '<ElementPropertyBar />',
  "{dimensionMode === '2D' && <ElementPropertyBar />}"
);
code = code.replace(
  '<FigmaToolDock />',
  "{dimensionMode === '2D' && <FigmaToolDock />}"
);

// 5. Add UI toggle below header
const headerEndRegex = /<\/TouchableOpacity>\n\s*<\/View>\n\n\s*\{\/\* 3\. Chap Qatlam/;
const headerEndNew = `</TouchableOpacity>
        </View>

        {/* 2D/3D Mode Switcher */}
        <View style={{ flexDirection: 'row', alignSelf: 'center', backgroundColor: 'rgba(15, 23, 42, 0.9)', borderRadius: 20, padding: 4, marginTop: 8, borderWidth: 1, borderColor: '#334155' }}>
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 16, backgroundColor: dimensionMode === '2D' ? '#38BDF8' : 'transparent' }}
            onPress={() => setDimensionMode('2D')}
          >
            <Layers size={14} color={dimensionMode === '2D' ? '#fff' : '#94A3B8'} />
            <Text style={{ marginLeft: 6, fontSize: 13, fontWeight: '600', color: dimensionMode === '2D' ? '#fff' : '#94A3B8' }}>2D Tahrir</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 16, backgroundColor: dimensionMode === '3D' ? '#38BDF8' : 'transparent' }}
            onPress={() => setDimensionMode('3D')}
          >
            <Box size={14} color={dimensionMode === '3D' ? '#fff' : '#94A3B8'} />
            <Text style={{ marginLeft: 6, fontSize: 13, fontWeight: '600', color: dimensionMode === '3D' ? '#fff' : '#94A3B8' }}>3D Fazo</Text>
          </TouchableOpacity>
        </View>

      {/* 3. Chap Qatlam`;
code = code.replace(headerEndRegex, headerEndNew);

fs.writeFileSync(file, code);
console.log('CADStudioScreen patched for 3D');
