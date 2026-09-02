const fs = require('fs');
const file = '/Applications/Project/AllProjects/TermoPlan/termoplanapp/src/components/canvas/RoomCanvas3D.tsx';
let code = fs.readFileSync(file, 'utf8');

const hookStartRegex = /const \[rotX, setRotX\] = useState\(.*?\);[\s\S]*?\}\), \[\]\);/m;
const refinedHook = `const [rotX, setRotX] = useState(0.5);
  const [rotY, setRotY] = useState(-0.5);
  const lastRot = React.useRef({ x: 0.5, y: -0.5 });

  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      lastRot.current = { x: rotX, y: rotY };
    },
    onPanResponderMove: (evt, gestureState) => {
      if (gestureState.numberActiveTouches === 1) {
        setRotY(lastRot.current.y + gestureState.dx * 0.01);
        setRotX(Math.max(-Math.PI/2, Math.min(Math.PI/2, lastRot.current.x + gestureState.dy * 0.01)));
      }
    },
  }), [rotX, rotY]);`;

code = code.replace(hookStartRegex, refinedHook);

fs.writeFileSync(file, code);
console.log('Patched robust pan responder');
