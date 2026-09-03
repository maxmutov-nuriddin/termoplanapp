import React, { useState, useRef, useMemo } from 'react';
import { View, StyleSheet, PanResponder, GestureResponderEvent, Dimensions, Text } from 'react-native';
import Svg, { Defs, Pattern, Rect, Circle, Line, Polyline, Text as SvgText, G } from 'react-native-svg';
import { useCanvasStore } from '../../store/canvasStore';
import { useShallow } from 'zustand/react/shallow';
import { WallRenderer } from './WallRenderer';
import { InteriorWallRenderer } from './InteriorWallRenderer';
import { WindowDoorRenderer } from './WindowDoorRenderer';
import { FurnitureRenderer } from './FurnitureRenderer';
import { HeatingPipeRenderer } from './HeatingPipeRenderer';
import { AirflowConeRenderer } from './AirflowConeRenderer';
import { DraggableElementsRenderer } from './DraggableElementsRenderer';
import {
  PIXELS_PER_METER,
  projectPointOnSegment,
  findNearestWallSnap,
  findNearestVertexOrWallSnap,
  snapWallOrthoAngle,
  calculateAcCountAndPositions,
} from '../../utils/geometry';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface RoomCanvas2DProps {
  roomWidthM?: number;
  roomHeightM?: number;
  isSunnyRoom?: boolean;
  recommendedBtu?: number;
  isFullScreenStudio?: boolean;
  showPipesAndAirflow?: boolean;
  readOnly?: boolean;
  onSelectWall?: (index: number) => void;
}


const StaticBackgroundGrid = React.memo(
  ({ panX, panY, isFullScreen, width, height }: { panX: number; panY: number; isFullScreen: boolean; width: number; height: number }) => {
    return (
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Svg width={width} height={height}>
          <Defs>
            <Pattern
              id="studioDots"
              width="24"
              height="24"
              patternUnits="userSpaceOnUse"
              patternTransform={`translate(${panX}, ${panY})`}
            >
              <Circle cx="2" cy="2" r="1.2" fill={isFullScreen ? '#334155' : '#CBD5E1'} />
            </Pattern>
          </Defs>
          <Rect width="100%" height="100%" fill={isFullScreen ? '#0B1120' : '#FFFFFF'} />
          <Rect width="100%" height="100%" fill="url(#studioDots)" />
        </Svg>
      </View>
    );
  },
  (prev, next) =>
    prev.panX === next.panX &&
    prev.panY === next.panY &&
    prev.isFullScreen === next.isFullScreen &&
    prev.width === next.width &&
    prev.height === next.height
);

export const RoomCanvas2D: React.FC<RoomCanvas2DProps> = ({
  roomWidthM,
  roomHeightM,
  isSunnyRoom = false,
  recommendedBtu = 12000,
  isFullScreenStudio = false,
  showPipesAndAirflow = false,
  readOnly = false,
  onSelectWall,
}) => {
  const {
    roomArea,
    seasonMode,
    selectedTool,
    selectedElementId,
    selectedElementType,
    selectedWallIndex,
    roomPoints,
    drawingPoints,
    isDrawingWall,
    walls,
    interiorWalls,
    drawingWallStart,
    panOffset,
    zoomScale,
    canvasRotation,
    activeGuidelines,
    isOrthoSnapped,
    showDimensions,
  } = useCanvasStore(useShallow(s => ({
    roomArea: s.roomArea,
    seasonMode: s.seasonMode,
    selectedTool: s.selectedTool,
    selectedElementId: s.selectedElementId,
    selectedElementType: s.selectedElementType,
    selectedWallIndex: s.selectedWallIndex,
    roomPoints: s.roomPoints,
    drawingPoints: s.drawingPoints,
    isDrawingWall: s.isDrawingWall,
    walls: s.walls,
    interiorWalls: s.interiorWalls,
    drawingWallStart: s.drawingWallStart,
    panOffset: s.panOffset,
    zoomScale: s.zoomScale,
    canvasRotation: s.canvasRotation,
    activeGuidelines: s.activeGuidelines,
    isOrthoSnapped: s.isOrthoSnapped,
    showDimensions: s.showDimensions,
  })));

  const {
    panCanvas,
    rotateCanvas,
    rotateSelectedElement,
    setZoomScale,
    addDrawPoint,
    moveDrawingPoint,
    deleteDrawingPoint,
    finishDrawWall,
    addInteriorWall,
    updateInteriorWall,
    deleteInteriorWall,
    setDrawingWallStart,
    placeElementAt,
    setSelectedElement,
    setSelectedWallIndex,
    updateElementPosition,
    moveVertex,
    moveWall,
    deleteVertex,
    setGuidelines,
    clearGuidelines,
  } = useCanvasStore.getState();

  const scale = PIXELS_PER_METER;





  const validRoomPoints = (roomPoints || []).filter((p) => p && Number.isFinite(p.x) && Number.isFinite(p.y));
  const validDrawingPoints = (drawingPoints || []).filter((p) => p && Number.isFinite(p.x) && Number.isFinite(p.y));

  const canvasWidth = isFullScreenStudio ? SCREEN_WIDTH : Math.min(SCREEN_WIDTH - 24, 380);
  const canvasHeight = isFullScreenStudio ? SCREEN_HEIGHT : 320;

  const [draggedTarget, setDraggedTarget] = useState<{
    id: string;
    type: 'furniture' | 'window' | 'door' | 'boiler' | 'manifold' | 'ac' | 'vertex' | 'drawing_vertex' | 'wall_drag' | 'two_finger_pan' | 'three_finger_rotate' | 'readonly_pan' | 'canvas_pan' | 'interior_wall' | 'interior_wall_start' | 'interior_wall_end';
    vertexIndex?: number;
  } | null>(null);

  const isReshapingRoom = draggedTarget?.type === 'vertex' || 
                          draggedTarget?.type === 'wall_drag' || 
                          draggedTarget?.type === 'drawing_vertex' || 
                          draggedTarget?.type?.startsWith('interior_wall');


  const [activeVertexBubble, setActiveVertexBubble] = useState<number | null>(null);

  const lastTouchRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const lastWorldRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const lastPinchDistRef = useRef<number>(0);
  const lastAngleRef = useRef<number>(0);
  const prevTouchCountRef = useRef<number>(0);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

  const screenToWorld = (screenX: number, screenY: number): { x: number; y: number } => {
    const { panOffset: currentPan, zoomScale: currentZoom } = useCanvasStore.getState();
    const worldX = (screenX - currentPan.x) / (scale * currentZoom);
    const worldY = (screenY - currentPan.y) / (scale * currentZoom);
    return {
      x: Number(worldX.toFixed(2)),
      y: Number(worldY.toFixed(2)),
    };
  };


  const draggedTargetRef = useRef(draggedTarget);
  draggedTargetRef.current = draggedTarget;

  const validRoomPointsRef = useRef(validRoomPoints);
  validRoomPointsRef.current = validRoomPoints;

  const readOnlyRef = useRef(readOnly);
  readOnlyRef.current = readOnly;

  const isDrawingWallRef = useRef(isDrawingWall);
  isDrawingWallRef.current = isDrawingWall;

  const rafIdRef = useRef<number | null>(null);
  const pendingUpdateRef = useRef<(() => void) | null>(null);

  const scheduleUpdate = (fn: () => void) => {
    pendingUpdateRef.current = fn;
    if (rafIdRef.current === null) {
      rafIdRef.current = requestAnimationFrame(() => {
        rafIdRef.current = null;
        if (pendingUpdateRef.current) {
          const update = pendingUpdateRef.current;
          pendingUpdateRef.current = null;
          update();
        }
      });
    }
  };

  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => !readOnlyRef.current,
    onStartShouldSetPanResponderCapture: () => !readOnlyRef.current,
    onMoveShouldSetPanResponder: () => !readOnlyRef.current,
    onMoveShouldSetPanResponderCapture: () => !readOnlyRef.current,
    onPanResponderTerminationRequest: () => false,
    onShouldBlockNativeResponder: () => true,
    onPanResponderGrant: (evt: GestureResponderEvent) => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }

      const state = useCanvasStore.getState();
      const currentSelectedTool = state.selectedTool;
      const currentInteriorWalls = state.interiorWalls || [];
      const currentRoomPoints = (state.roomPoints || []).filter((p) => p && Number.isFinite(p.x) && Number.isFinite(p.y));
      const currentDrawingPoints = (state.drawingPoints || []).filter((p) => p && Number.isFinite(p.x) && Number.isFinite(p.y));
      const currentZoom = state.zoomScale;

      const touches = evt.nativeEvent.touches;
      const numTouches = touches ? touches.length : 1;
      prevTouchCountRef.current = numTouches;

      // 3 BARMOQDA AYLANISH
      if (!readOnlyRef.current && touches && touches.length >= 3) {
        const midX = (touches[0].pageX + touches[1].pageX + touches[2].pageX) / 3;
        const midY = (touches[0].pageY + touches[1].pageY + touches[2].pageY) / 3;
        lastAngleRef.current = Math.atan2(touches[0].pageY - midY, touches[0].pageX - midX) * (180 / Math.PI);
        lastTouchRef.current = { x: midX, y: midY };
        setDraggedTarget({ id: 'three_finger_rotate', type: 'three_finger_rotate' });
        return;
      }

      // 2 BARMOQDA PROSTRANSTVANI SUDRASH & ZOOM (Sakrab ketmasligi uchun barqaror boshlash)
      if (touches && touches.length >= 2) {
        const t1 = touches[0];
        const t2 = touches[1];
        const dist = Math.hypot(t2.pageX - t1.pageX, t2.pageY - t1.pageY);
        lastPinchDistRef.current = dist;
        lastTouchRef.current = {
          x: (t1.pageX + t2.pageX) / 2,
          y: (t1.pageY + t2.pageY) / 2,
        };
        setDraggedTarget({ id: 'two_finger_pan', type: 'two_finger_pan' });
        return;
      }

      const { locationX, locationY } = evt.nativeEvent;
      lastTouchRef.current = { x: locationX, y: locationY };

      if (readOnlyRef.current) {
        setDraggedTarget({ id: 'readonly_pan', type: 'readonly_pan' });
        return;
      }

      const { x: xM, y: yM } = screenToWorld(locationX, locationY);
      lastWorldRef.current = { x: xM, y: yM };

      // 1. DOCKDAN ASBOB TANLANGAN BO'LSA (Bir zumda to'g'ri joylashtirish)
      if (currentSelectedTool !== 'select' && currentSelectedTool !== 'pen_wall') {
        placeElementAt(currentSelectedTool, { x: xM, y: yM });
        return;
      }

      // 2. DEVOR PEN TANLANGAN BO'LSA (Erkin nuqta / Ichki devor chizish)
      if (currentSelectedTool === 'pen_wall') {
        if (currentRoomPoints.length >= 3) {
          // Ichki devor chizish rejimi: devor yoki burchakka to'liq magnit tutashish
          const currentStart = state.drawingWallStart;
          if (!currentStart) {
            const snap = findNearestVertexOrWallSnap({ x: xM, y: yM }, currentRoomPoints, currentInteriorWalls, 0.5);
            setDrawingWallStart(snap.snapped ? snap.position : { x: xM, y: yM });
          } else {
            const orthoRes = snapWallOrthoAngle(currentStart, { x: xM, y: yM }, currentRoomPoints, currentInteriorWalls);
            const dist = Math.hypot(orthoRes.endPoint.x - currentStart.x, orthoRes.endPoint.y - currentStart.y);
            if (dist >= 0.4) {
              addInteriorWall(currentStart, orthoRes.endPoint);
            }
            setDrawingWallStart(null);
            clearGuidelines();
          }
          return;
        } else {
          // 0 dan yangi xona chizish rejimi
          if (isDrawingWallRef.current) {
            for (let i = 0; i < validDrawingPoints.length; i++) {
              const pt = validDrawingPoints[i];
              if (Math.abs(xM - pt.x) < 0.5 / zoomScale && Math.abs(yM - pt.y) < 0.5 / zoomScale) {
                if (i === 0 && validDrawingPoints.length >= 3) {
                  finishDrawWall();
                  return;
                }
                setSelectedElement(`draw_pt_${i}`, 'drawing_vertex');
                setDraggedTarget({ id: `draw_pt_${i}`, type: 'drawing_vertex', vertexIndex: i });
                setActiveVertexBubble(i);
                return;
              }
            }
            addDrawPoint({ x: xM, y: yM });
          } else {
            addDrawPoint({ x: xM, y: yM });
          }
          return;
        }
      }

      // 2.5. ICHKI DEVORLAR (Peregorodkalar) TUGUNLARI
      for (const iw of currentInteriorWalls) {
        if (Math.abs(xM - iw.startPoint.x) < 0.5 / currentZoom && Math.abs(yM - iw.startPoint.y) < 0.5 / zoomScale) {
          setSelectedElement(iw.id, 'interior_wall');
          setDraggedTarget({ id: iw.id, type: 'interior_wall_start' });
          return;
        }
        if (Math.abs(xM - iw.endPoint.x) < 0.5 / currentZoom && Math.abs(yM - iw.endPoint.y) < 0.5 / zoomScale) {
          setSelectedElement(iw.id, 'interior_wall');
          setDraggedTarget({ id: iw.id, type: 'interior_wall_end' });
          return;
        }
      }

      // 3. BURCHAK TUGUNLARINI USHLAB SILJITISH (Vertex drag) - Qulay va sezgir hitbox
      const vertexHitRadius = Math.max(0.65 / currentZoom, 32 / (scale * currentZoom));
      for (let i = 0; i < currentRoomPoints.length; i++) {
        const p = currentRoomPoints[i];
        if (Math.hypot(xM - p.x, yM - p.y) < vertexHitRadius) {
          setSelectedElement(`vertex_${i}`, 'vertex');
          setDraggedTarget({ id: `vertex_${i}`, type: 'vertex', vertexIndex: i });
          setActiveVertexBubble(i);
          return;
        }
      }

      // 4. MEBELLAR USTIGA BOSILGANMI?
      for (const f of useCanvasStore.getState().furniture || []) {
        const fx = f.position.x;
        const fy = f.position.y;
        const fw = f.width || 2.0;
        const fh = f.height || 1.8;
        if (xM >= fx - 0.2 && xM <= fx + fw + 0.2 && yM >= fy - 0.2 && yM <= fy + fh + 0.2) {
          setSelectedElement(f.id, 'furniture');
          setDraggedTarget({ id: f.id, type: 'furniture' });
          setActiveVertexBubble(null);
          return;
        }
      }

      // 5. OYNALAR USTIGA BOSILGANMI?
      for (const w of useCanvasStore.getState().windows || []) {
        const wx = w.position.x;
        const wy = w.position.y;
        if (Math.abs(xM - wx) < 0.7 && Math.abs(yM - wy) < 0.5) {
          setSelectedElement(w.id, 'window');
          setDraggedTarget({ id: w.id, type: 'window' });
          setActiveVertexBubble(null);
          return;
        }
      }

      // 6. ESHIKLAR USTIGA BOSILGANMI?
      for (const d of useCanvasStore.getState().doors || []) {
        const dx = d.position.x;
        const dy = d.position.y;
        if (Math.abs(xM - dx) < 0.6 && Math.abs(yM - dy) < 0.6) {
          setSelectedElement(d.id, 'door');
          setDraggedTarget({ id: d.id, type: 'door' });
          setActiveVertexBubble(null);
          return;
        }
      }

      // 7. AC USTIGA BOSILGANMI?
      const acPosition = useCanvasStore.getState().acPosition;
      if (acPosition && Math.abs(xM - acPosition.x) < 0.6 && Math.abs(yM - acPosition.y) < 0.6) {
        setSelectedElement('ac', 'ac');
        setDraggedTarget({ id: 'ac', type: 'ac' });
        setActiveVertexBubble(null);
        return;
      }

      // 7.5. KOTYOL (QOZON) USTIGA BOSILGANMI?
      const boilerPosition = useCanvasStore.getState().boilerPosition;
      if (boilerPosition && Math.abs(xM - boilerPosition.x) < 0.6 && Math.abs(yM - boilerPosition.y) < 0.6) {
        setSelectedElement('boiler', 'boiler');
        setDraggedTarget({ id: 'boiler', type: 'boiler' });
        setActiveVertexBubble(null);
        return;
      }

      // 8. KOLLEKTOR (KL) USTIGA BOSILGANMI?
      const manifoldPosition = useCanvasStore.getState().manifoldPosition;
      if (manifoldPosition && Math.abs(xM - manifoldPosition.x) < 0.6 && Math.abs(yM - manifoldPosition.y) < 0.6) {
        setSelectedElement('manifold', 'manifold');
        setDraggedTarget({ id: 'manifold', type: 'manifold' });
        setActiveVertexBubble(null);
        return;
      }

      // 8.5. ICHKI DEVOR LINIYASI TANLASH
      for (const iw of currentInteriorWalls) {
        const { distance } = projectPointOnSegment({ x: xM, y: yM }, iw.startPoint, iw.endPoint);
        if (distance < 0.28 / currentZoom) {
          setSelectedElement(iw.id, 'interior_wall');
          setDraggedTarget({ id: iw.id, type: 'interior_wall' });
          lastWorldRef.current = { x: xM, y: yM };
          return;
        }
      }

      // 9. DEVOR LINIYASI USTIGA BOSILGANMI (Aniq tor hitbox bilan)
      let closestWallIdx = -1;
      let minWallDist = 0.25 / currentZoom;
      for (let i = 0; i < currentRoomPoints.length; i++) {
        const next = (i + 1) % currentRoomPoints.length;
        const p1 = currentRoomPoints[i];
        const p2 = currentRoomPoints[next];
        const { distance } = projectPointOnSegment({ x: xM, y: yM }, p1, p2);
        if (distance < minWallDist) {
          minWallDist = distance;
          closestWallIdx = i;
        }
      }

      if (closestWallIdx !== -1) {
        setSelectedWallIndex(closestWallIdx);
        setDraggedTarget({ id: `wall_${closestWallIdx}`, type: 'wall_drag', vertexIndex: closestWallIdx });
        lastWorldRef.current = { x: xM, y: yM };
        if (onSelectWall) onSelectWall(closestWallIdx);
        return;
      }

      // Bo'sh joyga bosilsa (Svobodniy fazoni 1 barmoqda surish)
      setSelectedElement(null, null);
      setSelectedWallIndex(null);
      setActiveVertexBubble(null);
      clearGuidelines();
      setDraggedTarget({ id: 'canvas_pan', type: 'canvas_pan' });
    },
    onPanResponderMove: (evt: GestureResponderEvent) => {
      const touches = evt.nativeEvent.touches;
      const numTouches = touches ? touches.length : 0;

      // Barmoqlar soni o'zgarganda (1 -> 2 yoki 2 -> 1) sakrashni oldini olish
      if (numTouches !== prevTouchCountRef.current) {
        prevTouchCountRef.current = numTouches;
        if (numTouches === 2) {
          lastPinchDistRef.current = Math.hypot(touches[1].pageX - touches[0].pageX, touches[1].pageY - touches[0].pageY);
          lastTouchRef.current = {
            x: (touches[0].pageX + touches[1].pageX) / 2,
            y: (touches[0].pageY + touches[1].pageY) / 2,
          };
          return;
        } else if (numTouches === 1) {
          lastTouchRef.current = { x: touches[0].pageX, y: touches[0].pageY };
          lastPinchDistRef.current = 0;
        }
      }

      // 3 BARMOQDA AYLANISH
      if (!readOnlyRef.current && touches && touches.length >= 3) {
        const midX = (touches[0].pageX + touches[1].pageX + touches[2].pageX) / 3;
        const midY = (touches[0].pageY + touches[1].pageY + touches[2].pageY) / 3;
        const currentAngle = Math.atan2(touches[0].pageY - midY, touches[0].pageX - midX) * (180 / Math.PI);
        const delta = currentAngle - lastAngleRef.current;
        lastAngleRef.current = currentAngle;

        if (selectedElementId && (selectedElementType === 'furniture' || selectedElementType === 'ac')) {
          rotateSelectedElement(delta);
        } else {
          rotateCanvas(delta);
        }
        return;
      }

      // 2 BARMOQDA SILLIQ ZOOM & PAN (Sakramasdan)
      if (touches && touches.length === 2) {
        const t1 = touches[0];
        const t2 = touches[1];
        const currentDist = Math.hypot(t2.pageX - t1.pageX, t2.pageY - t1.pageY);
        const midX = (t1.pageX + t2.pageX) / 2;
        const midY = (t1.pageY + t2.pageY) / 2;

        if (lastPinchDistRef.current > 10 && currentDist > 10) {
          const pinchRatio = currentDist / lastPinchDistRef.current;
          if (pinchRatio > 0.6 && pinchRatio < 1.6) {
            setZoomScale((prev) => Math.min(3.5, Math.max(0.4, prev * pinchRatio)));
          }
        }

        const dx = midX - lastTouchRef.current.x;
        const dy = midY - lastTouchRef.current.y;
        if (Math.abs(dx) < 60 && Math.abs(dy) < 60) {
          scheduleUpdate(() => {
            panCanvas(dx, dy);
          });
        }

        lastPinchDistRef.current = currentDist;
        lastTouchRef.current = { x: midX, y: midY };
        return;
      }

      // 1 BARMOQDA SVOBODNIY FAZONI SUDRASH (CANVAS PANNING)
      if (draggedTargetRef.current?.type === 'canvas_pan' || (readOnlyRef.current && draggedTargetRef.current?.type === 'readonly_pan')) {
        const { locationX, locationY } = evt.nativeEvent;
        const dx = locationX - lastTouchRef.current.x;
        const dy = locationY - lastTouchRef.current.y;
        lastTouchRef.current = { x: locationX, y: locationY };
        if (Math.abs(dx) < 80 && Math.abs(dy) < 80) {
          scheduleUpdate(() => {
            panCanvas(dx, dy);
          });
        }
        return;
      }

      if (!draggedTargetRef.current || readOnlyRef.current) return;
      const { locationX, locationY } = evt.nativeEvent;
      lastTouchRef.current = { x: locationX, y: locationY };
      const { x: newXM, y: newYM } = screenToWorld(locationX, locationY);

      // ICHKI DEVORLARNI SUDRASH (Burchaklar va devorlarga magnit ulanish va Lazer chiziqlar bilan)
      if (draggedTargetRef.current?.type === 'interior_wall_start') {
        const targetId = draggedTargetRef.current.id;
        scheduleUpdate(() => {
          const current = (useCanvasStore.getState().interiorWalls || []).find((w) => w.id === targetId);
          const fixedPt = current?.endPoint || { x: newXM, y: newYM };
          const orthoRes = snapWallOrthoAngle(fixedPt, { x: newXM, y: newYM }, validRoomPointsRef.current, (useCanvasStore.getState().interiorWalls || []).filter(w => w.id !== targetId));
          updateInteriorWall(targetId, { startPoint: orthoRes.endPoint });
          if (orthoRes.guidelines.length > 0) {
            setGuidelines(orthoRes.guidelines, orthoRes.isOrtho);
          } else {
            clearGuidelines();
          }
        });
        return;
      } else if (draggedTargetRef.current?.type === 'interior_wall_end') {
        const targetId = draggedTargetRef.current.id;
        scheduleUpdate(() => {
          const current = (useCanvasStore.getState().interiorWalls || []).find((w) => w.id === targetId);
          const fixedPt = current?.startPoint || { x: newXM, y: newYM };
          const orthoRes = snapWallOrthoAngle(fixedPt, { x: newXM, y: newYM }, validRoomPointsRef.current, (useCanvasStore.getState().interiorWalls || []).filter(w => w.id !== targetId));
          updateInteriorWall(targetId, { endPoint: orthoRes.endPoint });
          if (orthoRes.guidelines.length > 0) {
            setGuidelines(orthoRes.guidelines, orthoRes.isOrtho);
          } else {
            clearGuidelines();
          }
        });
        return;
      } else if (draggedTargetRef.current?.type === 'interior_wall') {
        const targetId = draggedTargetRef.current.id;
        const dxM = newXM - lastWorldRef.current.x;
        const dyM = newYM - lastWorldRef.current.y;
        lastWorldRef.current = { x: newXM, y: newYM };
        scheduleUpdate(() => {
          const current = (useCanvasStore.getState().interiorWalls || []).find((w) => w.id === targetId);
          if (current) {
            updateInteriorWall(targetId, {
              startPoint: { x: current.startPoint.x + dxM, y: current.startPoint.y + dyM },
              endPoint: { x: current.endPoint.x + dxM, y: current.endPoint.y + dyM },
            });
          }
        });
        return;
      }

      // DEVOR LINIYASINI TO'LIQ SUDRASH
      if (draggedTargetRef.current?.type === 'wall_drag' && draggedTargetRef.current?.vertexIndex !== undefined) {
        const vIdx = draggedTargetRef.current.vertexIndex;
        const dxM = newXM - lastWorldRef.current.x;
        const dyM = newYM - lastWorldRef.current.y;
        lastWorldRef.current = { x: newXM, y: newYM };
        scheduleUpdate(() => {
          moveWall(vIdx, dxM, dyM);
        });
        return;
      }

      // BURCHAKNI SUDRASH (Vertex Drag)
      if (draggedTargetRef.current?.type === 'drawing_vertex' && draggedTargetRef.current?.vertexIndex !== undefined) {
        const vIdx = draggedTargetRef.current.vertexIndex;
        scheduleUpdate(() => {
          moveDrawingPoint(vIdx, { x: newXM, y: newYM });
        });
      } else if (draggedTargetRef.current?.type === 'vertex' && draggedTargetRef.current?.vertexIndex !== undefined) {
        const vIdx = draggedTargetRef.current.vertexIndex;
        scheduleUpdate(() => {
          moveVertex(vIdx, { x: newXM, y: newYM });
        });
      } else if (draggedTargetRef.current?.type !== 'two_finger_pan' && draggedTargetRef.current?.type !== 'three_finger_rotate') {
        const targetId = draggedTargetRef.current?.id;
        const targetType = draggedTargetRef.current?.type;
        if (targetId && targetType) {
          scheduleUpdate(() => {
            updateElementPosition(targetId, targetType, newXM, newYM);
          });
        }
      }
    },
    onPanResponderRelease: () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      if (pendingUpdateRef.current) {
        pendingUpdateRef.current();
        pendingUpdateRef.current = null;
      }
      setDraggedTarget(null);
      lastPinchDistRef.current = 0;
      prevTouchCountRef.current = 0;
      clearGuidelines();
    },
  }), []);

  return (
    <View style={isFullScreenStudio ? styles.fullscreenContainer : styles.overviewContainer}>
      <View {...panResponder.panHandlers} style={isFullScreenStudio ? styles.fullscreenWrapper : styles.overviewWrapper}>
        <StaticBackgroundGrid panX={panOffset.x % 24} panY={panOffset.y % 24} isFullScreen={isFullScreenStudio} width={canvasWidth} height={canvasHeight} />
        <Svg width={canvasWidth} height={canvasHeight}>

          {/* Bo'sh xona bo'lsa yo'riqnoma */}
          {!isDrawingWall && validRoomPoints.length === 0 && (
            <G transform={`translate(${canvasWidth / 2}, ${canvasHeight / 2 - 20})`}>
              <Circle cx="0" cy="-20" r="30" fill="rgba(15, 118, 110, 0.1)" />
              <SvgText x="0" y="-14" fill="#0F766E" fontSize="22" textAnchor="middle">
                ✏️
              </SvgText>
              <SvgText x="0" y="24" fill={isFullScreenStudio ? '#F8FAFC' : '#0F172A'} fontSize="14" fontWeight="bold" textAnchor="middle">
                Xona Hali Chizilmagan
              </SvgText>
              <SvgText x="0" y="44" fill="#64748B" fontSize="11" textAnchor="middle">
                Pastdagi "Devor Pen" yordamida chizing
              </SvgText>
              <SvgText x="0" y="60" fill="#64748B" fontSize="11" textAnchor="middle">
                yoki "To'rtburchak" shablonni tanlang
              </SvgText>
            </G>
          )}

          {/* Butun Loyiha Fazosi */}
          <G transform={`translate(${panOffset.x}, ${panOffset.y}) scale(${zoomScale})`}>
            {/* 1. Xona Devorlari va Pol Poligoni */}
            {!isDrawingWall && validRoomPoints.length >= 3 ? (
              <WallRenderer
                points={validRoomPoints}
                walls={walls || []}
                selectedWallIndex={readOnly ? null : selectedWallIndex}
                showDimensions={showDimensions}
                padding={0}
                onSelectWall={(idx) => {
                  if (readOnly) return;
                  setSelectedWallIndex(idx);
                  if (onSelectWall) onSelectWall(idx);
                }}
              />
            ) : null}

            {/* 1.5. Ichki Devorlar (Peregorodkalar) */}
            {!isDrawingWall && (
              <InteriorWallRenderer
                interiorWalls={interiorWalls || []}
                selectedId={readOnly ? null : selectedElementId}
                drawingWallStart={drawingWallStart}
                showDimensions={showDimensions}
                readOnly={readOnly}
                padding={0}
                onSelectWall={(id) => {
                  if (readOnly) return;
                  setSelectedElement(id, 'interior_wall');
                }}
              />
            )}

            {/* 2. Eshiklar, Oynalar, Mebellar va Uskunalar */}
            {!isDrawingWall && <DraggableElementsRenderer readOnly={readOnly} />}

            {/* 4. Quvurlar va Konditsioner */}
            {showPipesAndAirflow && !isDrawingWall && !isReshapingRoom && seasonMode === 'winter' && validRoomPoints.length >= 3 && (
              <HeatingPipeRenderer
                roomPoints={validRoomPoints}
                manifoldPos={useCanvasStore.getState().manifoldPosition || { x: 0.8, y: 0.8 }}
                interiorWalls={interiorWalls || []}
                isSunny={isSunnyRoom}
                padding={0}
              />
            )}

            {showPipesAndAirflow && !isDrawingWall && !isReshapingRoom && seasonMode === 'summer' && validRoomPoints.length >= 3 && (() => {
              const windows = useCanvasStore.getState().windows || [];
              const acCalc = calculateAcCountAndPositions(validRoomPoints, roomArea || 0, 3.0, windows.length, isSunnyRoom);
              const listToRender = (acCalc.positions && acCalc.positions.length > 0)
                ? acCalc.positions
                : [{ x: 1.2, y: 0.5, targetAngle: 90 }];
              return (
                <>
                  {listToRender.map((pos, idx) => (
                    <AirflowConeRenderer
                      key={`ac_render_${idx}`}
                      roomWidthM={roomArea ? Math.sqrt(roomArea) * 1.3 : 6.5}
                      roomHeightM={roomArea ? Math.sqrt(roomArea) * 1.3 : 5.0}
                      acPos={pos}
                      furniture={useCanvasStore.getState().furniture || []}
                      recommendedBtu={recommendedBtu}
                    />
                  ))}
                </>
              );
            })()}

            {/* 5. Parallel & 90° Smart Tekislash Yo'naltiruvchi Chiziqlari (Guidelines) */}
            {!readOnly &&
              activeGuidelines &&
              activeGuidelines.map((g, gIdx) => {
                if (g.type === 'x') {
                  const lineX = g.val * scale;
                  return (
                    <Line
                      key={`guide_x_${gIdx}`}
                      x1={lineX}
                      y1={-4000}
                      x2={lineX}
                      y2={4000}
                      stroke="#38BDF8"
                      strokeWidth={1.8 / zoomScale}
                      strokeDasharray="6 3"
                    />
                  );
                } else {
                  const lineY = g.val * scale;
                  return (
                    <Line
                      key={`guide_y_${gIdx}`}
                      x1={-4000}
                      y1={lineY}
                      x2={4000}
                      y2={lineY}
                      stroke="#38BDF8"
                      strokeWidth={1.8 / zoomScale}
                      strokeDasharray="6 3"
                    />
                  );
                }
              })}

            {/* 6. Burchak Tugunlari */}
            {!readOnly &&
              !isDrawingWall &&
              validRoomPoints.map((p, idx) => {
                const px = p.x * scale;
                const py = p.y * scale;
                const isSelected = selectedElementId === `vertex_${idx}`;
                const showBubble = activeVertexBubble === idx && !draggedTarget;

                return (
                  <G key={`v_handle_${idx}`}>
                    <Circle
                      cx={px}
                      cy={py}
                      r={isSelected ? 8.5 / zoomScale : 5.5 / zoomScale}
                      fill={isSelected ? '#0284C7' : '#FFFFFF'}
                      stroke="#0284C7"
                      strokeWidth={2 / zoomScale}
                    />

                    {isSelected && (
                      <Circle
                        cx={px}
                        cy={py}
                        r={16 / zoomScale}
                        fill="rgba(56, 189, 248, 0.2)"
                        stroke="#38BDF8"
                        strokeWidth={1.2 / zoomScale}
                      />
                    )}

                    {showBubble && (
                      <G transform={`translate(${px - 34 / zoomScale}, ${py - 36 / zoomScale})`}>
                        <Rect
                          x="0"
                          y="0"
                          width={32 / zoomScale}
                          height={20 / zoomScale}
                          fill="#0F172A"
                          stroke="#38BDF8"
                          strokeWidth={1 / zoomScale}
                          rx={5 / zoomScale}
                        />
                        <SvgText
                          x={16 / zoomScale}
                          y={14 / zoomScale}
                          fill="#38BDF8"
                          fontSize={9 / zoomScale}
                          fontWeight="bold"
                          textAnchor="middle"
                        >
                          🖐️ Surish
                        </SvgText>

                        {validRoomPoints.length > 3 && (
                          <G
                            transform={`translate(${36 / zoomScale}, 0)`}
                            onPress={() => {
                              deleteVertex(idx);
                              setActiveVertexBubble(null);
                            }}
                          >
                            <Rect
                              x="0"
                              y="0"
                              width={32 / zoomScale}
                              height={20 / zoomScale}
                              fill="#EF4444"
                              rx={5 / zoomScale}
                            />
                            <SvgText
                              x={16 / zoomScale}
                              y={14 / zoomScale}
                              fill="#FFFFFF"
                              fontSize={9 / zoomScale}
                              fontWeight="bold"
                              textAnchor="middle"
                            >
                              🗑️ O‘chirish
                            </SvgText>
                          </G>
                        )}
                      </G>
                    )}
                  </G>
                );
              })}

            {/* 7. Vector Pen holatidagi nuqtalar */}
            {isDrawingWall && validDrawingPoints.length > 0 && (
              <G>
                <Polyline
                  points={validDrawingPoints.map((p) => `${p.x * scale},${p.y * scale}`).join(' ')}
                  fill="none"
                  stroke="#38BDF8"
                  strokeWidth={3 / zoomScale}
                  strokeDasharray="4 2"
                />
                {validDrawingPoints.map((p, idx) => {
                  const px = p.x * scale;
                  const py = p.y * scale;
                  const isSelected = selectedElementId === `draw_pt_${idx}`;
                  const showBubble = activeVertexBubble === idx && !draggedTarget;

                  return (
                    <G key={`draw_pt_${idx}`}>
                      <Circle
                        cx={px}
                        cy={py}
                        r={isSelected ? 12 / zoomScale : 8.5 / zoomScale}
                        fill={isSelected ? '#0284C7' : '#38BDF8'}
                        stroke="#FFFFFF"
                        strokeWidth={2.5 / zoomScale}
                      />
                      <SvgText
                        x={px}
                        y={py - 12 / zoomScale}
                        fill="#38BDF8"
                        fontSize={9.5 / zoomScale}
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        {`N${idx + 1}`}
                      </SvgText>

                      {isSelected && (
                        <Circle
                          cx={px}
                          cy={py}
                          r={20 / zoomScale}
                          fill="rgba(56, 189, 248, 0.25)"
                          stroke="#38BDF8"
                          strokeWidth={1.5 / zoomScale}
                          strokeDasharray="4 2"
                        />
                      )}

                      {showBubble && (
                        <G transform={`translate(${px - 34 / zoomScale}, ${py - 36 / zoomScale})`}>
                          <Rect
                            x="0"
                            y="0"
                            width={32 / zoomScale}
                            height={20 / zoomScale}
                            fill="#0F172A"
                            stroke="#38BDF8"
                            strokeWidth={1 / zoomScale}
                            rx={5 / zoomScale}
                          />
                          <SvgText
                            x={16 / zoomScale}
                            y={14 / zoomScale}
                            fill="#38BDF8"
                            fontSize={9 / zoomScale}
                            fontWeight="bold"
                            textAnchor="middle"
                          >
                            🖐️ Surish
                          </SvgText>

                          <G
                            transform={`translate(${36 / zoomScale}, 0)`}
                            onPress={() => {
                              deleteDrawingPoint(idx);
                              setActiveVertexBubble(null);
                            }}
                          >
                            <Rect
                              x="0"
                              y="0"
                              width={32 / zoomScale}
                              height={20 / zoomScale}
                              fill="#EF4444"
                              rx={5 / zoomScale}
                            />
                            <SvgText
                              x={16 / zoomScale}
                              y={14 / zoomScale}
                              fill="#FFFFFF"
                              fontSize={9 / zoomScale}
                              fontWeight="bold"
                              textAnchor="middle"
                            >
                              🗑️ O‘chirish
                            </SvgText>
                          </G>
                        </G>
                      )}
                    </G>
                  );
                })}
              </G>
            )}
          </G>


        </Svg>
        {!readOnly && isOrthoSnapped && (
          <View pointerEvents="none" style={styles.orthoSnappedBadge}>
            <Text style={styles.orthoSnappedBadgeText}>📐 90° Parallel Tekis</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  orthoSnappedBadge: {
    position: 'absolute',
    bottom: 65,
    alignSelf: 'center',
    backgroundColor: 'rgba(2, 132, 199, 0.95)',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 13,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  orthoSnappedBadgeText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: 'bold',
  },
  fullscreenContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  fullscreenWrapper: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overviewContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  overviewWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
});
