const fs = require('fs');
const file = '/Applications/Project/AllProjects/TermoPlan/termoplanapp/src/components/canvas/RoomCanvas3D.tsx';
let code = fs.readFileSync(file, 'utf8');

// Add safe area import
if (!code.includes('useSafeAreaInsets')) {
  code = code.replace(
    'import { TouchableOpacity',
    'import { useSafeAreaInsets } from \'react-native-safe-area-context\';\nimport { TouchableOpacity'
  );
}

// Add safe area hook inside component
code = code.replace(
  'const { roomPoints, walls, furniture, seasonMode, windows, doors, acPosition } = useCanvasStore();',
  'const insets = useSafeAreaInsets();\n  const { roomPoints, walls, furniture, seasonMode, windows, doors, acPosition } = useCanvasStore();'
);

// Update button style dynamically
const oldOverlay = `{onToggleFullscreen && (
        <TouchableOpacity style={styles.fullscreenBtn} onPress={onToggleFullscreen}>
          {isFullscreen ? <Minimize2 color="#FFF" size={20} /> : <Maximize2 color="#FFF" size={20} />}
        </TouchableOpacity>
      )}`;

const newOverlay = `{onToggleFullscreen && (
        <TouchableOpacity 
          style={[
            styles.fullscreenBtn, 
            isFullscreen && { top: Math.max(insets.top, 16) + 10, left: 16, right: 'auto' }
          ]} 
          onPress={onToggleFullscreen}
        >
          {isFullscreen ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Minimize2 color="#FFF" size={20} />
              <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Orqaga (Yopish)</Text>
            </View>
          ) : (
             <Maximize2 color="#FFF" size={20} />
          )}
        </TouchableOpacity>
      )}`;

code = code.replace(oldOverlay, newOverlay);

// Also shift the overlay badge down if fullscreen
code = code.replace(
  '<View style={styles.overlay}>',
  '<View style={[styles.overlay, isFullscreen && { top: Math.max(insets.top, 16) + 10, left: \'auto\', right: 16 }]}>'
);

fs.writeFileSync(file, code);
console.log('Safe area patched');
