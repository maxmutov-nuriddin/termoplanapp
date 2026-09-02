const fs = require('fs');
const file = '/Applications/Project/AllProjects/TermoPlan/termoplanapp/src/components/canvas/RoomCanvas3D.tsx';
let code = fs.readFileSync(file, 'utf8');

// Add props
code = code.replace(
  'interface RoomCanvas3DProps {',
  'import { TouchableOpacity } from \'react-native\';\nimport { Maximize2, Minimize2 } from \'lucide-react-native\';\n\ninterface RoomCanvas3DProps {\n  isFullscreen?: boolean;\n  onToggleFullscreen?: () => void;'
);

code = code.replace(
  'export const RoomCanvas3D: React.FC<RoomCanvas3DProps> = ({\n  wallHeightM = 3.0,\n}) => {',
  'export const RoomCanvas3D: React.FC<RoomCanvas3DProps> = ({\n  wallHeightM = 3.0,\n  isFullscreen = false,\n  onToggleFullscreen,\n}) => {'
);

// Add button to overlay
const oldOverlay = `<View style={styles.overlay}>
        <Text style={styles.overlayText}>Haqiqiy 3D (WebGL)</Text>
      </View>`;

const newOverlay = `<View style={styles.overlay}>
        <Text style={styles.overlayText}>Haqiqiy 3D (WebGL)</Text>
      </View>
      {onToggleFullscreen && (
        <TouchableOpacity style={styles.fullscreenBtn} onPress={onToggleFullscreen}>
          {isFullscreen ? <Minimize2 color="#FFF" size={20} /> : <Maximize2 color="#FFF" size={20} />}
        </TouchableOpacity>
      )}`;

code = code.replace(oldOverlay, newOverlay);

// Update container style based on isFullscreen
code = code.replace(
  '<View style={styles.container}>',
  '<View style={isFullscreen ? styles.fullContainer : styles.container}>'
);

// Add styles
const oldStyles = `const styles = StyleSheet.create({
  container: {`;
const newStyles = `const styles = StyleSheet.create({
  fullContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#0F172A',
  },
  fullscreenBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  container: {`;

code = code.replace(oldStyles, newStyles);

fs.writeFileSync(file, code);
console.log('Patched RoomCanvas3D for fullscreen');
