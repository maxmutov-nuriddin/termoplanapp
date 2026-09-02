const fs = require('fs');
const file = '/Applications/Project/AllProjects/TermoPlan/termoplanapp/src/components/canvas/RoomCanvas3D.tsx';
let code = fs.readFileSync(file, 'utf8');

const hookStartRegex = /const \[rotX, setRotX\].*?\}\), \[rotX, rotY\]\);/ms;

const refinedHook = `const rotX = React.useRef(0.5);
  const rotY = React.useRef(-0.5);
  const lastRot = React.useRef({ x: 0.5, y: -0.5 });
  const [, setRenderTrigger] = useState(0);

  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      lastRot.current = { x: rotX.current, y: rotY.current };
    },
    onPanResponderMove: (evt, gestureState) => {
      if (gestureState.numberActiveTouches === 1) {
        rotY.current = lastRot.current.y + gestureState.dx * 0.01;
        rotX.current = Math.max(-Math.PI/2, Math.min(Math.PI/2, lastRot.current.x + gestureState.dy * 0.01));
        setRenderTrigger(v => v + 1);
      }
    },
  }), []);`;

code = code.replace(hookStartRegex, refinedHook);

// Also replace the group rotation usage
code = code.replace('<group rotation={[rotX, rotY, 0]}>', '<group rotation={[rotX.current, rotY.current, 0]}>');

fs.writeFileSync(file, code);
console.log('Patched final robust pan responder');
