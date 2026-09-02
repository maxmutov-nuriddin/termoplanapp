import { create } from 'zustand';
import { IPoint, IWall, IInteriorWall, IWindow, IDoor, IFurniture, IRoom } from '../types';
import {
  calculatePolygonArea,
  calculatePolygonPerimeter,
  distanceBetweenPoints,
  findNearestWallSnap,
  snapPointToOrthoAndParallel,
  ROOM_PRESETS,
  PIXELS_PER_METER,
} from '../utils/geometry';

export type CanvasTool = 'select' | 'pen_wall' | 'pen_room' | 'window' | 'door' | 'boiler' | 'manifold' | 'ac' | 'exclude_zone';
export type SeasonMode = 'winter' | 'summer';
export type HeatingPatternType = 'spiral' | 'double_snake' | 'single_snake' | 'border_zone';

export interface WallMaterialConfig {
  id: string;
  name: string;
  category: 'brick' | 'gas_block' | 'drywall' | 'cinder_block' | 'concrete';
  defaultThicknessM: number;
  conductivity: number; // W/(m·K)
}

export const WALL_MATERIALS: WallMaterialConfig[] = [
  { id: 'brick_baked', name: 'Pishgan G‘isht (Standart)', category: 'brick', defaultThicknessM: 0.38, conductivity: 0.70 },
  { id: 'gas_block', name: 'Gazoblok (D600 Termo)', category: 'gas_block', defaultThicknessM: 0.30, conductivity: 0.14 },
  { id: 'drywall_partition', name: 'Gipskarton (Ichki to‘siq)', category: 'drywall', defaultThicknessM: 0.12, conductivity: 0.19 },
  { id: 'cinder_block', name: 'Shlakoblok (Blok)', category: 'cinder_block', defaultThicknessM: 0.40, conductivity: 0.65 },
  { id: 'concrete_monolith', name: 'Monolit Beton', category: 'concrete', defaultThicknessM: 0.25, conductivity: 1.75 },
];

interface CanvasHistorySnapshot {
  roomPoints: IPoint[];
  walls: IWall[];
  interiorWalls: IInteriorWall[];
  windows: IWindow[];
  doors: IDoor[];
  furniture: IFurniture[];
  heatingExcludedZones: Array<{ id: string; points: IPoint[]; label?: string }>;
  heatingPattern?: HeatingPatternType;
  boilerPosition: IPoint | null;
  manifoldPosition: IPoint | null;
  acPosition: { x: number; y: number; targetAngle: number } | null;
}

interface CanvasState {
  seasonMode: SeasonMode;
  selectedTool: CanvasTool;
  selectedElementId: string | null;
  selectedElementType: 'window' | 'door' | 'boiler' | 'manifold' | 'ac' | 'furniture' | 'vertex' | 'drawing_vertex' | 'wall' | 'interior_wall' | 'interior_wall_start' | 'interior_wall_end' | 'exclude_zone' | null;
  selectedVertexIndex: number | null;
  selectedWallIndex: number | null;

  // Zoom, Pan & Rotation
  zoomScale: number;
  panOffset: { x: number; y: number };
  canvasRotation: number;

  // Xona poligon nuqtalari & Turi
  roomName: string;
  roomType: string;
  roomArea: number;
  roomPerimeter: number;
  roomPoints: IPoint[];
  drawingPoints: IPoint[];
  isDrawingWall: boolean;

  // Devor materiallari va qalinligi (Default)
  wallMaterialId: string;
  wallThicknessM: number;

  // Smart Orthogonal & Parallel alignment
  activeGuidelines: Array<{ type: 'x' | 'y'; val: number }>;
  isOrthoSnapped: boolean;
  showDimensions: boolean;

  // Layout Lock (Qotirish) — devor va yer o'lchamlarini bloklash
  isLayoutLocked: boolean;

  // Tyoply pol istisnolangan zonalar (issiqlik kerak bo'lmagan joylar)
  heatingExcludedZones: Array<{ id: string; points: IPoint[]; label?: string }>;

  // Tyopliy Pol Yotqizish Sxemasi (Ulitka, Dvoynaya zmeyka, Zmeyka, Kombinirovannaya)
  heatingPattern: HeatingPatternType;

  // Tarix (Undo / Ctrl+Z)
  history: CanvasHistorySnapshot[];

  walls: IWall[];
  interiorWalls: IInteriorWall[];
  windows: IWindow[];
  doors: IDoor[];
  furniture: IFurniture[];
  boilerPosition: IPoint | null;
  manifoldPosition: IPoint | null;
  acPosition: { x: number; y: number; targetAngle: number } | null;
  drawingWallStart: IPoint | null;

  // Actions
  setSeasonMode: (mode: SeasonMode) => void;
  setSelectedTool: (tool: CanvasTool) => void;
  setShowDimensions: (show: boolean) => void;
  toggleShowDimensions: () => void;
  toggleLayoutLock: () => void;
  addHeatingExcludedZone: (points: IPoint[], label?: string) => void;
  removeHeatingExcludedZone: (id: string) => void;
  setHeatingPattern: (pattern: HeatingPatternType) => void;
  setRoomType: (type: string, name?: string) => void;
  setWallParameters: (materialId: string, thicknessM: number) => void;
  setSelectedElement: (id: string | null, type: 'window' | 'door' | 'boiler' | 'manifold' | 'ac' | 'furniture' | 'vertex' | 'drawing_vertex' | 'wall' | 'interior_wall' | 'interior_wall_start' | 'interior_wall_end' | null) => void;
  setSelectedWallIndex: (idx: number | null) => void;
  setZoomScale: (zoom: number | ((prev: number) => number)) => void;
  setPanOffset: (offset: { x: number; y: number }) => void;
  panCanvas: (dx: number, dy: number) => void;
  rotateCanvas: (deltaDeg: number) => void;
  setCanvasRotation: (deg: number) => void;
  resetView: () => void;
  autoCenterRoom: (viewportWidth?: number, viewportHeight?: number) => void;
  setGuidelines: (guides: Array<{ type: 'x' | 'y'; val: number }>, isSnapped?: boolean) => void;
  clearGuidelines: () => void;

  // Undo (Ctrl+Z)
  pushHistorySnapshot: () => void;
  undo: () => void;

  initRoom: (room?: IRoom | null) => void;
  startDrawWall: () => void;
  addDrawPoint: (point: IPoint) => void;
  moveDrawingPoint: (index: number, newPos: IPoint) => void;
  deleteDrawingPoint: (index: number) => void;
  finishDrawWall: () => void;
  cancelDrawWall: () => void;

  // Ichki Devorlar (Peregorodkalar)
  addInteriorWall: (start: IPoint, end: IPoint, materialId?: string, thicknessM?: number) => void;
  updateInteriorWall: (id: string, params: Partial<IInteriorWall>) => void;
  deleteInteriorWall: (id: string) => void;
  setDrawingWallStart: (pt: IPoint | null) => void;

  // Devorga yangi nuqta qo'shish va burchaklarni boshqarish
  moveVertex: (index: number, newPos: IPoint) => void;
  moveWall: (wallIndex: number, dx: number, dy: number) => void;
  addVertexAtPosition: (point: IPoint) => void;
  addVertexOnWall: (wallIndex: number, point: IPoint) => void;
  deleteVertex: (index: number) => void;
  updateWallLength: (wallIndex: number, newLengthM: number) => void;
  updateWallConstruction: (wallIndex: number, params: { length?: number; thicknessM?: number; materialId?: string; materialName?: string; isExternal?: boolean }) => void;

  // Elementlarni devorga yopishish (Magnetic Snap) bilan surish va sozlash
  updateElementPosition: (id: string, type: string, x: number, y: number) => void;
  rotateSelectedElement: (deltaDeg?: number) => void;
  cycleDoorOpenDirection: () => void;
  resizeSelectedElement: (deltaW: number, deltaH?: number) => void;
  setExactElementDimension: (width: number, height?: number) => void;
  deleteSelectedElement: () => void;

  // Elementni joylashtirish
  placeElementAt: (tool: CanvasTool, pos: IPoint) => void;
  setBoilerPosition: (pos: IPoint) => void;
  setManifoldPosition: (pos: IPoint) => void;
  setAcPosition: (pos: { x: number; y: number; targetAngle: number }) => void;
  setRoomPoints: (points: IPoint[]) => void;
  setRoomDimensions: (widthM: number, heightM: number) => void;
  loadPresetShape: (shape: 'RECTANGLE' | 'L_SHAPE' | 'T_SHAPE') => void;
  clearCanvas: () => void;
}

function generateWallsFromPoints(
  points: IPoint[],
  existingWalls: IWall[] = [],
  defaultMaterial = 'brick_baked',
  defaultThickness = 0.38
): IWall[] {
  const valid = (points || []).filter((p) => p && Number.isFinite(p.x) && Number.isFinite(p.y));
  if (valid.length < 3) return [];

  const walls: IWall[] = [];
  const n = valid.length;
  for (let i = 0; i < n; i++) {
    const next = (i + 1) % n;
    const p1 = valid[i];
    const p2 = valid[next];
    const len = distanceBetweenPoints(p1, p2);

    let orientation = 'SOUTH';
    if (i === 0) orientation = 'SOUTH';
    else if (i === 1) orientation = 'WEST';
    else if (i === 2) orientation = 'NORTH';
    else if (i === 3) orientation = 'EAST';

    const existing = existingWalls[i];
    walls.push({
      id: `w_${i + 1}`,
      startPoint: p1,
      endPoint: p2,
      isExternal: existing?.isExternal ?? true,
      orientation: existing?.orientation || orientation,
      length: parseFloat(len.toFixed(2)),
      thicknessM: existing?.thicknessM ?? defaultThickness,
      materialId: existing?.materialId ?? defaultMaterial,
      materialName: existing?.materialName ?? 'Pishgan G‘isht',
    });
  }
  return walls;
}


function updateWallsOnVertexMove(
  index: number,
  newPoints: IPoint[],
  currentWalls: IWall[],
  wallMaterialId = 'brick_baked',
  wallThicknessM = 0.38
): IWall[] {
  const n = newPoints.length;
  if (!currentWalls || currentWalls.length !== n) {
    return generateWallsFromPoints(newPoints, currentWalls, wallMaterialId, wallThicknessM);
  }
  const prevIdx = (index - 1 + n) % n;
  const nextIdx = (index + 1) % n;

  const newWalls = [...currentWalls];
  const pPrev = newPoints[prevIdx];
  const pCurr = newPoints[index];
  const pNext = newPoints[nextIdx];

  const lenPrev = distanceBetweenPoints(pPrev, pCurr);
  newWalls[prevIdx] = {
    ...currentWalls[prevIdx],
    startPoint: pPrev,
    endPoint: pCurr,
    length: parseFloat(lenPrev.toFixed(2)),
  };

  const lenCurr = distanceBetweenPoints(pCurr, pNext);
  newWalls[index] = {
    ...currentWalls[index],
    startPoint: pCurr,
    endPoint: pNext,
    length: parseFloat(lenCurr.toFixed(2)),
  };

  return newWalls;
}

export const useCanvasStore = create<CanvasState>((set, get) => ({
  seasonMode: 'winter',
  selectedTool: 'select',
  selectedElementId: null,
  selectedElementType: null,
  selectedVertexIndex: null,
  selectedWallIndex: null,

  zoomScale: 1.0,
  panOffset: { x: 0, y: 0 },
  canvasRotation: 0,

  roomName: 'Mehmonxona (Zal)',
  roomType: 'living_room',
  roomArea: 0,
  roomPerimeter: 0,
  roomPoints: [],
  drawingPoints: [],
  isDrawingWall: false,

  wallMaterialId: 'brick_baked',
  wallThicknessM: 0.38,

  activeGuidelines: [],
  isOrthoSnapped: false,
  showDimensions: true,
  isLayoutLocked: false,
  heatingExcludedZones: [],
  heatingPattern: 'spiral',
  history: [],

  walls: [],
  interiorWalls: [],
  windows: [],
  doors: [],
  furniture: [],
  boilerPosition: null,
  manifoldPosition: null,
  acPosition: null,
  drawingWallStart: null,

  pushHistorySnapshot: () => {
    const state = get();
    const snapshot: CanvasHistorySnapshot = {
      roomPoints: [...state.roomPoints],
      walls: [...state.walls],
      interiorWalls: state.interiorWalls.map((w) => ({
        ...w,
        startPoint: { ...w.startPoint },
        endPoint: { ...w.endPoint },
      })),
      windows: [...state.windows],
      doors: [...state.doors],
      furniture: [...state.furniture],
      heatingExcludedZones: (state.heatingExcludedZones || []).map((z) => ({
        ...z,
        points: z.points.map((p) => ({ ...p })),
      })),
      heatingPattern: state.heatingPattern,
      boilerPosition: state.boilerPosition ? { ...state.boilerPosition } : null,
      manifoldPosition: state.manifoldPosition ? { ...state.manifoldPosition } : null,
      acPosition: state.acPosition ? { ...state.acPosition } : null,
    };
    set((s) => ({ history: [...s.history.slice(-20), snapshot] }));
  },

  undo: () => {
    const { history } = get();
    if (history.length === 0) return;

    const previous = history[history.length - 1];
    const newHistory = history.slice(0, -1);

    const area = calculatePolygonArea(previous.roomPoints);
    const perimeter = calculatePolygonPerimeter(previous.roomPoints);

    set({
      roomPoints: previous.roomPoints,
      walls: previous.walls,
      interiorWalls: previous.interiorWalls || [],
      windows: previous.windows,
      doors: previous.doors,
      furniture: previous.furniture,
      heatingExcludedZones: previous.heatingExcludedZones || [],
      heatingPattern: previous.heatingPattern || 'spiral',
      boilerPosition: previous.boilerPosition,
      manifoldPosition: previous.manifoldPosition,
      acPosition: previous.acPosition,
      roomArea: area,
      roomPerimeter: perimeter,
      history: newHistory,
      selectedElementId: null,
      selectedElementType: null,
      drawingWallStart: null,
      activeGuidelines: [],
      isOrthoSnapped: false,
    });
  },

  setSeasonMode: (mode) => set({ seasonMode: mode }),
  setShowDimensions: (show) => set({ showDimensions: show }),
  toggleShowDimensions: () => set((state) => ({ showDimensions: !state.showDimensions })),
  toggleLayoutLock: () => set((state) => ({ isLayoutLocked: !state.isLayoutLocked })),
  addHeatingExcludedZone: (points, label) => {
    get().pushHistorySnapshot();
    set((state) => ({
      heatingExcludedZones: [
        ...state.heatingExcludedZones,
        { id: `zone_${Date.now()}`, points, label: label || `Zona ${state.heatingExcludedZones.length + 1}` },
      ],
    }));
  },
  removeHeatingExcludedZone: (id) => {
    get().pushHistorySnapshot();
    set((state) => ({
      heatingExcludedZones: state.heatingExcludedZones.filter((z) => z.id !== id),
      selectedElementId: null,
      selectedElementType: null,
    }));
  },
  setHeatingPattern: (pattern) => {
    get().pushHistorySnapshot();
    set({ heatingPattern: pattern });
  },
  setSelectedTool: (tool) => {
    if (tool === 'pen_wall') {
      set({
        selectedTool: tool,
        isDrawingWall: true,
        drawingPoints: [],
        selectedElementId: null,
        selectedElementType: null,
        drawingWallStart: null,
      });
    } else if (tool === 'pen_room') {
      set({
        selectedTool: tool,
        isDrawingWall: false,
        drawingPoints: [],
        selectedElementId: null,
        selectedElementType: null,
        drawingWallStart: null,
      });
    } else {
      set({
        selectedTool: tool,
        isDrawingWall: false,
        drawingWallStart: null,
      });
    }
  },
  setRoomType: (type, name) => {
    const defaultNames: Record<string, string> = {
      living_room: 'Mehmonxona (Zal)',
      bedroom: 'Yotoqxona',
      kitchen: 'Oshxona',
      children_room: 'Bolalar xonasi',
      bathroom: 'Hammom / Sanuzel',
      hall: 'Dahliz / Koridor',
      office: 'Kabinet / Ishxona',
    };
    set({ roomType: type, roomName: name || defaultNames[type] || 'Xona' });
  },
  setWallParameters: (materialId, thicknessM) => {
    const { walls, roomPoints } = get();
    const updatedWalls = generateWallsFromPoints(roomPoints, walls, materialId, thicknessM);
    set({ wallMaterialId: materialId, wallThicknessM: thicknessM, walls: updatedWalls });
  },
  setSelectedElement: (id, type) => {
    let vIdx: number | null = null;
    if ((type === 'vertex' || type === 'drawing_vertex') && id && (id.startsWith('vertex_') || id.startsWith('draw_pt_'))) {
      vIdx = parseInt(id.replace('vertex_', '').replace('draw_pt_', ''), 10);
    }
    set({ selectedElementId: id, selectedElementType: type, selectedVertexIndex: vIdx });
  },
  setSelectedWallIndex: (idx) => set({ selectedWallIndex: idx }),
  setZoomScale: (zoom) => set((state) => ({ zoomScale: typeof zoom === 'function' ? zoom(state.zoomScale) : zoom })),
  setPanOffset: (offset) => set({ panOffset: offset }),
  panCanvas: (dx, dy) =>
    set((state) => ({
      panOffset: {
        x: state.panOffset.x + dx,
        y: state.panOffset.y + dy,
      },
    })),
  rotateCanvas: (deltaDeg) =>
    set((state) => ({
      canvasRotation: (state.canvasRotation + deltaDeg + 360) % 360,
    })),
  setCanvasRotation: (deg) => set({ canvasRotation: (deg + 360) % 360 }),
  resetView: () => set({ zoomScale: 1.0, panOffset: { x: 0, y: 0 }, canvasRotation: 0 }),
  setGuidelines: (guides, isSnapped = true) => set({ activeGuidelines: guides, isOrthoSnapped: isSnapped }),
  clearGuidelines: () => set({ activeGuidelines: [], isOrthoSnapped: false }),

  autoCenterRoom: (viewportWidth = 360, viewportHeight = 300) => {
    const { roomPoints } = get();
    const valid = (roomPoints || []).filter((p) => p && Number.isFinite(p.x) && Number.isFinite(p.y));
    if (valid.length < 3) {
      set({ panOffset: { x: 0, y: 0 }, zoomScale: 1.0, canvasRotation: 0, activeGuidelines: [], isOrthoSnapped: false });
      return;
    }

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    for (const p of valid) {
      minX = Math.min(minX, p.x);
      maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y);
      maxY = Math.max(maxY, p.y);
    }

    const roomW_m = Math.max(1, maxX - minX);
    const roomH_m = Math.max(1, maxY - minY);
    const roomW_px = roomW_m * PIXELS_PER_METER;
    const roomH_px = roomH_m * PIXELS_PER_METER;

    const margin = 48;
    const fitScale = Math.min(
      1.35,
      Math.max(0.4, Math.min((viewportWidth - margin) / roomW_px, (viewportHeight - margin) / roomH_px))
    );

    const centerX_m = (minX + maxX) / 2;
    const centerY_m = (minY + maxY) / 2;

    const targetPanX = viewportWidth / 2 - centerX_m * PIXELS_PER_METER * fitScale;
    const targetPanY = viewportHeight / 2 - centerY_m * PIXELS_PER_METER * fitScale;

    set({
      panOffset: { x: parseFloat(targetPanX.toFixed(1)), y: parseFloat(targetPanY.toFixed(1)) },
      zoomScale: parseFloat(fitScale.toFixed(2)),
      canvasRotation: 0,
      selectedElementId: null,
      selectedElementType: null,
      selectedVertexIndex: null,
      selectedWallIndex: null,
      activeGuidelines: [],
      isOrthoSnapped: false,
    });
  },

  initRoom: (room) => {
    if (!room || !room.points || room.points.length < 3) {
      set({
        roomName: room?.name || 'Mehmonxona (Zal)',
        roomType: room?.roomType || 'living_room',
        roomArea: 0,
        roomPerimeter: 0,
        roomPoints: [],
        drawingPoints: [],
        isDrawingWall: false,
        walls: [],
        interiorWalls: [],
        windows: [],
        doors: [],
        furniture: [],
        boilerPosition: null,
        manifoldPosition: null,
        acPosition: null,
        drawingWallStart: null,
        panOffset: { x: 0, y: 0 },
        canvasRotation: 0,
        activeGuidelines: [],
        isOrthoSnapped: false,
        history: [],
      });
      return;
    }

    const pts = room.points;
    const initialWalls = (room.walls && room.walls.length === pts.length)
      ? room.walls
      : generateWallsFromPoints(pts, [], room.wallMaterial || 'brick_baked', room.wallThicknessM || 0.38);

    set({
      roomName: room.name || 'Mehmonxona (Zal)',
      roomType: room.roomType || 'living_room',
      roomArea: calculatePolygonArea(pts) || room.area || 0,
      roomPerimeter: calculatePolygonPerimeter(pts) || room.perimeter || 0,
      roomPoints: pts,
      walls: initialWalls,
      interiorWalls: room.interiorWalls || [],
      windows: room.windows || [],
      doors: room.doors || [],
      furniture: room.furniture || [],
      boilerPosition: room.boilerPosition || null,
      manifoldPosition: room.manifoldPosition || null,
      acPosition: room.acPosition || null,
      drawingWallStart: null,
      wallThicknessM: room.wallThicknessM || 0.38,
      wallMaterialId: room.wallMaterial || 'brick_baked',
      canvasRotation: 0,
      activeGuidelines: [],
      isOrthoSnapped: false,
      history: [],
    });
    get().autoCenterRoom(360, 300);
  },

  addInteriorWall: (start, end, materialId = 'drywall_partition', thicknessM = 0.12) => {
    get().pushHistorySnapshot();
    const id = `int_wall_${Date.now()}`;
    const len = distanceBetweenPoints(start, end);
    const mat = WALL_MATERIALS.find((m) => m.id === materialId) || WALL_MATERIALS[2];

    const newWall: IInteriorWall = {
      id,
      startPoint: start,
      endPoint: end,
      length: len,
      thicknessM: thicknessM || mat.defaultThicknessM,
      materialId: mat.id,
      materialName: mat.name,
    };

    set((state) => ({
      interiorWalls: [...state.interiorWalls, newWall],
      drawingWallStart: null,
      selectedElementId: id,
      selectedElementType: 'interior_wall',
      selectedTool: 'select',
      activeGuidelines: [],
      isOrthoSnapped: false,
    }));
  },

  updateInteriorWall: (id, params) => {
    get().pushHistorySnapshot();
    set((state) => ({
      interiorWalls: state.interiorWalls.map((w) => {
        if (w.id !== id) return w;
        const updated = { ...w, ...params };
        if (params.startPoint || params.endPoint) {
          updated.length = distanceBetweenPoints(
            params.startPoint || w.startPoint,
            params.endPoint || w.endPoint
          );
        }
        return updated;
      }),
    }));
  },

  deleteInteriorWall: (id) => {
    get().pushHistorySnapshot();
    set((state) => ({
      interiorWalls: state.interiorWalls.filter((w) => w.id !== id),
      selectedElementId: null,
      selectedElementType: null,
    }));
  },

  setDrawingWallStart: (pt) => set({ drawingWallStart: pt }),

  startDrawWall: () => {
    get().pushHistorySnapshot();
    set({ isDrawingWall: true, drawingPoints: [], selectedElementId: null, selectedElementType: null, activeGuidelines: [], isOrthoSnapped: false });
  },

  addDrawPoint: (point) => {
    const { drawingPoints } = get();
    if (drawingPoints.length >= 3) {
      const first = drawingPoints[0];
      const dist = distanceBetweenPoints(point, first);
      if (dist < 0.6) {
        get().finishDrawWall();
        return;
      }
    }

    const { snappedPoint } = snapPointToOrthoAndParallel(point, drawingPoints, -1);
    set({ drawingPoints: [...drawingPoints, snappedPoint] });
  },

  moveDrawingPoint: (index, newPos) => {
    const { drawingPoints } = get();
    if (index < 0 || index >= drawingPoints.length) return;
    const { snappedPoint, guides, isOrtho } = snapPointToOrthoAndParallel(newPos, drawingPoints, index);
    const updated = [...drawingPoints];
    updated[index] = snappedPoint;
    set({
      drawingPoints: updated,
      activeGuidelines: guides,
      isOrthoSnapped: isOrtho,
    });
  },

  deleteDrawingPoint: (index) => {
    const { drawingPoints } = get();
    if (index < 0 || index >= drawingPoints.length) return;
    const updated = drawingPoints.filter((_, i) => i !== index);
    set({ drawingPoints: updated, selectedElementId: null, selectedElementType: null });
  },

  finishDrawWall: () => {
    const { drawingPoints, walls, wallMaterialId, wallThicknessM } = get();
    if (drawingPoints.length >= 3) {
      get().pushHistorySnapshot();
      const area = calculatePolygonArea(drawingPoints);
      const perimeter = calculatePolygonPerimeter(drawingPoints);
      const newWalls = generateWallsFromPoints(drawingPoints, walls, wallMaterialId, wallThicknessM);
      set({
        roomPoints: drawingPoints,
        walls: newWalls,
        roomArea: area,
        roomPerimeter: perimeter,
        drawingPoints: [],
        isDrawingWall: false,
        selectedTool: 'select',
        activeGuidelines: [],
        isOrthoSnapped: false,
      });
    } else {
      set({ isDrawingWall: false, drawingPoints: [] });
    }
  },

  cancelDrawWall: () => set({ isDrawingWall: false, drawingPoints: [], selectedTool: 'select', activeGuidelines: [], isOrthoSnapped: false }),

  moveVertex: (index, newPos) => {
    const { roomPoints, walls, wallMaterialId, wallThicknessM } = get();
    if (index < 0 || index >= roomPoints.length) return;
    const { snappedPoint, guides, isOrtho } = snapPointToOrthoAndParallel(newPos, roomPoints, index);
    const updated = [...roomPoints];
    updated[index] = snappedPoint;
    const area = calculatePolygonArea(updated);
    const perimeter = calculatePolygonPerimeter(updated);
    const updatedWalls = updateWallsOnVertexMove(index, updated, walls, wallMaterialId, wallThicknessM);
    set({
      roomPoints: updated,
      walls: updatedWalls,
      roomArea: area,
      roomPerimeter: perimeter,
      activeGuidelines: guides,
      isOrthoSnapped: isOrtho,
    });
  },

  moveWall: (wallIndex, dx, dy) => {
    const { roomPoints, walls, wallMaterialId, wallThicknessM } = get();
    if (wallIndex < 0 || wallIndex >= roomPoints.length) return;
    const n = roomPoints.length;
    const nextIdx = (wallIndex + 1) % n;
    const updated = [...roomPoints];
    updated[wallIndex] = {
      x: parseFloat((updated[wallIndex].x + dx).toFixed(2)),
      y: parseFloat((updated[wallIndex].y + dy).toFixed(2)),
    };
    updated[nextIdx] = {
      x: parseFloat((updated[nextIdx].x + dx).toFixed(2)),
      y: parseFloat((updated[nextIdx].y + dy).toFixed(2)),
    };
    const area = calculatePolygonArea(updated);
    const perimeter = calculatePolygonPerimeter(updated);
    const updatedWalls = generateWallsFromPoints(updated, walls, wallMaterialId, wallThicknessM);
    set({
      roomPoints: updated,
      walls: updatedWalls,
      roomArea: area,
      roomPerimeter: perimeter,
    });
  },

  addVertexAtPosition: (point) => {
    const { roomPoints } = get();
    if (!roomPoints || roomPoints.length < 3) {
      get().addDrawPoint(point);
      return;
    }

    let closestWallIdx = 0;
    let minDistance = Infinity;

    for (let i = 0; i < roomPoints.length; i++) {
      const next = (i + 1) % roomPoints.length;
      const p1 = roomPoints[i];
      const p2 = roomPoints[next];
      const midX = (p1.x + p2.x) / 2;
      const midY = (p1.y + p2.y) / 2;
      const d = Math.hypot(point.x - midX, point.y - midY);
      if (d < minDistance) {
        minDistance = d;
        closestWallIdx = i;
      }
    }

    get().addVertexOnWall(closestWallIdx, point);
  },

  addVertexOnWall: (wallIndex, point) => {
    const { roomPoints, walls, wallMaterialId, wallThicknessM } = get();
    if (wallIndex < 0 || wallIndex >= roomPoints.length) return;
    get().pushHistorySnapshot();
    const updated = [...roomPoints];
    updated.splice(wallIndex + 1, 0, point);
    const area = calculatePolygonArea(updated);
    const perimeter = calculatePolygonPerimeter(updated);
    const updatedWalls = generateWallsFromPoints(updated, walls, wallMaterialId, wallThicknessM);
    set({
      roomPoints: updated,
      walls: updatedWalls,
      roomArea: area,
      roomPerimeter: perimeter,
      selectedElementId: `vertex_${wallIndex + 1}`,
      selectedElementType: 'vertex',
      selectedVertexIndex: wallIndex + 1,
    });
  },

  deleteVertex: (index) => {
    const { roomPoints, walls, wallMaterialId, wallThicknessM } = get();
    if (roomPoints.length <= 3) return;
    get().pushHistorySnapshot();
    const updated = roomPoints.filter((_, i) => i !== index);
    const area = calculatePolygonArea(updated);
    const perimeter = calculatePolygonPerimeter(updated);
    const updatedWalls = generateWallsFromPoints(updated, walls, wallMaterialId, wallThicknessM);
    set({
      roomPoints: updated,
      walls: updatedWalls,
      roomArea: area,
      roomPerimeter: perimeter,
      selectedElementId: null,
      selectedElementType: null,
      selectedVertexIndex: null,
    });
  },

  updateWallLength: (wallIndex, newLengthM) => {
    get().updateWallConstruction(wallIndex, { length: newLengthM });
  },

  updateWallConstruction: (wallIndex, params) => {
    const { roomPoints, walls, wallMaterialId, wallThicknessM } = get();
    if (wallIndex < 0 || wallIndex >= roomPoints.length) return;

    get().pushHistorySnapshot();

    let updatedPoints = [...roomPoints];
    if (params.length && params.length > 0.4) {
      const p1 = roomPoints[wallIndex];
      const nextIdx = (wallIndex + 1) % roomPoints.length;
      const p2 = roomPoints[nextIdx];
      const currentLen = distanceBetweenPoints(p1, p2);
      if (currentLen > 0) {
        const ratio = params.length / currentLen;
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        updatedPoints[nextIdx] = {
          x: parseFloat((p1.x + dx * ratio).toFixed(2)),
          y: parseFloat((p1.y + dy * ratio).toFixed(2)),
        };
      }
    }

    const updatedWalls = generateWallsFromPoints(updatedPoints, walls, wallMaterialId, wallThicknessM);
    if (updatedWalls[wallIndex]) {
      if (params.thicknessM !== undefined) updatedWalls[wallIndex].thicknessM = params.thicknessM;
      if (params.materialId !== undefined) updatedWalls[wallIndex].materialId = params.materialId;
      if (params.materialName !== undefined) updatedWalls[wallIndex].materialName = params.materialName;
      if (params.isExternal !== undefined) updatedWalls[wallIndex].isExternal = params.isExternal;
    }

    const area = calculatePolygonArea(updatedPoints);
    const perimeter = calculatePolygonPerimeter(updatedPoints);

    set({
      roomPoints: updatedPoints,
      walls: updatedWalls,
      roomArea: area,
      roomPerimeter: perimeter,
      selectedWallIndex: null,
    });
  },

  updateElementPosition: (id, type, rawX, rawY) => {
    const { roomPoints, interiorWalls } = get();
    const rawPoint = { x: rawX, y: rawY };

    if (type === 'window') {
      const snap = findNearestWallSnap(rawPoint, roomPoints, 1.4, interiorWalls);
      set((state) => ({
        windows: state.windows.map((w) =>
          w.id === id
            ? {
                ...w,
                position: snap.position,
                rotation: snap.snapped ? snap.rotation : w.rotation || 0,
                wallId: snap.snapped ? (snap.interiorWallId || `w_${snap.wallIndex + 1}`) : w.wallId,
              }
            : w
        ),
      }));
    } else if (type === 'door') {
      const snap = findNearestWallSnap(rawPoint, roomPoints, 1.4, interiorWalls);
      set((state) => ({
        doors: state.doors.map((d) =>
          d.id === id
            ? {
                ...d,
                position: snap.position,
                rotation: snap.snapped ? snap.rotation : d.rotation || 0,
                wallId: snap.snapped ? (snap.interiorWallId || `w_${snap.wallIndex + 1}`) : d.wallId,
              }
            : d
        ),
      }));
    } else if (type === 'boiler') {
      const snap = findNearestWallSnap(rawPoint, roomPoints, 1.2, interiorWalls);
      set({ boilerPosition: snap.snapped ? snap.position : rawPoint });
    } else if (type === 'manifold') {
      const snap = findNearestWallSnap(rawPoint, roomPoints, 1.2, interiorWalls);
      set({ manifoldPosition: snap.snapped ? snap.position : rawPoint });
    } else if (type === 'ac') {
      const snap = findNearestWallSnap(rawPoint, roomPoints, 1.2, interiorWalls);
      set((state) => ({
        acPosition: {
          x: snap.snapped ? snap.position.x : rawPoint.x,
          y: snap.snapped ? snap.position.y : rawPoint.y,
          targetAngle: snap.snapped ? (snap.rotation + 90) % 360 : (state.acPosition?.targetAngle || 75),
        },
      }));
    } else if (type === 'furniture') {
      const snap = findNearestWallSnap(rawPoint, roomPoints, 0.6, interiorWalls);
      set((state) => ({
        furniture: state.furniture.map((f) =>
          f.id === id ? { ...f, position: rawPoint, rotation: snap.snapped ? snap.rotation : f.rotation } : f
        ),
      }));
    }
  },

  rotateSelectedElement: (deltaDeg = 45) => {
    const { selectedElementId, selectedElementType } = get();
    if (!selectedElementId) return;

    if (selectedElementType === 'window') {
      set((state) => ({
        windows: state.windows.map((w) =>
          w.id === selectedElementId ? { ...w, rotation: ((w.rotation || 0) + deltaDeg) % 360 } : w
        ),
      }));
    } else if (selectedElementType === 'door') {
      set((state) => ({
        doors: state.doors.map((d) =>
          d.id === selectedElementId ? { ...d, rotation: ((d.rotation || 0) + deltaDeg) % 360 } : d
        ),
      }));
    } else if (selectedElementType === 'ac') {
      set((state) => ({
        acPosition: state.acPosition
          ? {
              ...state.acPosition,
              targetAngle: (state.acPosition.targetAngle + deltaDeg) % 360,
            }
          : null,
      }));
    }
  },

  cycleDoorOpenDirection: () => {
    const { selectedElementId, selectedElementType } = get();
    if (!selectedElementId || selectedElementType !== 'door') return;

    const dirs = ['inside_right', 'inside_left', 'outside_right', 'outside_left'];
    set((state) => ({
      doors: state.doors.map((d) => {
        if (d.id !== selectedElementId) return d;
        const currentIdx = dirs.indexOf(d.openDirection || 'inside_right');
        const nextDir = dirs[(currentIdx + 1) % dirs.length];
        return { ...d, openDirection: nextDir };
      }),
    }));
  },

  resizeSelectedElement: (deltaW, deltaH = 0) => {
    const { selectedElementId, selectedElementType } = get();
    if (!selectedElementId) return;

    if (selectedElementType === 'window') {
      set((state) => ({
        windows: state.windows.map((w) =>
          w.id === selectedElementId
            ? { ...w, width: Math.max(0.6, Math.min(3.5, parseFloat(((w.width || 1.4) + deltaW).toFixed(2)))) }
            : w
        ),
      }));
    } else if (selectedElementType === 'door') {
      set((state) => ({
        doors: state.doors.map((d) =>
          d.id === selectedElementId
            ? { ...d, width: Math.max(0.6, Math.min(1.6, parseFloat(((d.width || 0.9) + deltaW).toFixed(2)))) }
            : d
        ),
      }));
    }
  },

  setExactElementDimension: (width, height) => {
    const { selectedElementId, selectedElementType } = get();
    if (!selectedElementId) return;

    if (selectedElementType === 'window') {
      set((state) => ({
        windows: state.windows.map((w) =>
          w.id === selectedElementId ? { ...w, width: Math.max(0.6, Math.min(3.5, width)) } : w
        ),
      }));
    } else if (selectedElementType === 'door') {
      set((state) => ({
        doors: state.doors.map((d) =>
          d.id === selectedElementId ? { ...d, width: Math.max(0.6, Math.min(1.6, width)) } : d
        ),
      }));
    }
  },

  deleteSelectedElement: () => {
    const { selectedElementId, selectedElementType } = get();
    if (!selectedElementId) return;

    get().pushHistorySnapshot();

    if (selectedElementType === 'drawing_vertex' && selectedElementId.startsWith('draw_pt_')) {
      const idx = parseInt(selectedElementId.replace('draw_pt_', ''), 10);
      if (!isNaN(idx)) {
        get().deleteDrawingPoint(idx);
        return;
      }
    }

    if (selectedElementType === 'vertex' && selectedElementId.startsWith('vertex_')) {
      const idx = parseInt(selectedElementId.replace('vertex_', ''), 10);
      if (!isNaN(idx)) {
        get().deleteVertex(idx);
        return;
      }
    }

    if (selectedElementType === 'window') {
      set((state) => ({
        windows: state.windows.filter((w) => w.id !== selectedElementId),
        selectedElementId: null,
        selectedElementType: null,
      }));
    } else if (selectedElementType === 'door') {
      set((state) => ({
        doors: state.doors.filter((d) => d.id !== selectedElementId),
        selectedElementId: null,
        selectedElementType: null,
      }));
    } else if (selectedElementType === 'boiler') {
      set({
        boilerPosition: null,
        selectedElementId: null,
        selectedElementType: null,
      });
    } else if (selectedElementType === 'manifold') {
      set({
        manifoldPosition: null,
        selectedElementId: null,
        selectedElementType: null,
      });
    } else if (selectedElementType === 'ac') {
      set({
        acPosition: null,
        selectedElementId: null,
        selectedElementType: null,
      });
    } else if (selectedElementType === 'interior_wall') {
      set((state) => ({
        interiorWalls: state.interiorWalls.filter((w) => w.id !== selectedElementId),
        selectedElementId: null,
        selectedElementType: null,
      }));
    } else if (selectedElementType === 'furniture') {
      set((state) => ({
        furniture: state.furniture.filter((f) => f.id !== selectedElementId),
        selectedElementId: null,
        selectedElementType: null,
      }));
    } else if (selectedElementType === 'exclude_zone') {
      set((state) => ({
        heatingExcludedZones: state.heatingExcludedZones.filter((z) => z.id !== selectedElementId),
        selectedElementId: null,
        selectedElementType: null,
      }));
    }
  },

  placeElementAt: (tool, pos) => {
    const { roomPoints, interiorWalls } = get();
    get().pushHistorySnapshot();
    const id = `${tool}_${Date.now()}`;

    if (tool === 'window') {
      const snap = findNearestWallSnap(pos, roomPoints, 2.5, interiorWalls);
      const finalPos = snap.snapped ? snap.position : pos;
      const rot = snap.snapped ? snap.rotation : 0;
      set((state) => ({
        windows: [
          ...state.windows,
          {
            id,
            position: finalPos,
            width: 1.4,
            height: 1.5,
            rotation: rot,
            orientation: 'SOUTH',
            type: 'ordinary',
            wallId: snap.snapped ? (snap.interiorWallId || `w_${snap.wallIndex + 1}`) : undefined,
          },
        ],
        selectedElementId: id,
        selectedElementType: 'window',
        selectedTool: 'select',
      }));
    } else if (tool === 'door') {
      const snap = findNearestWallSnap(pos, roomPoints, 2.5, interiorWalls);
      const finalPos = snap.snapped ? snap.position : pos;
      const rot = snap.snapped ? snap.rotation : 0;
      set((state) => ({
        doors: [
          ...state.doors,
          {
            id,
            position: finalPos,
            width: 0.9,
            rotation: rot,
            openDirection: 'inside_right',
            wallId: snap.snapped ? (snap.interiorWallId || `w_${snap.wallIndex + 1}`) : undefined,
          },
        ],
        selectedElementId: id,
        selectedElementType: 'door',
        selectedTool: 'select',
      }));
    } else if (tool === 'boiler') {
      const snap = findNearestWallSnap(pos, roomPoints, 1.2, interiorWalls);
      const bPos = snap.snapped ? snap.position : pos;
      const mPos = { x: parseFloat((bPos.x + 0.6).toFixed(2)), y: parseFloat(bPos.y.toFixed(2)) };
      set({
        boilerPosition: bPos,
        manifoldPosition: mPos,
        selectedElementId: 'boiler',
        selectedElementType: 'boiler',
        selectedTool: 'select',
      });
    } else if (tool === 'manifold') {
      const snap = findNearestWallSnap(pos, roomPoints, 1.2, interiorWalls);
      set({ manifoldPosition: snap.snapped ? snap.position : pos, selectedElementId: 'manifold', selectedElementType: 'manifold', selectedTool: 'select' });
    } else if (tool === 'ac') {
      const snap = findNearestWallSnap(pos, roomPoints, 1.2, interiorWalls);
      set({
        acPosition: {
          x: snap.snapped ? snap.position.x : pos.x,
          y: snap.snapped ? snap.position.y : pos.y,
          targetAngle: snap.snapped ? (snap.rotation + 90) % 360 : 75,
        },
        selectedElementId: 'ac',
        selectedElementType: 'ac',
        selectedTool: 'select',
      });
    }
  },

  setBoilerPosition: (pos) => set({ boilerPosition: pos }),
  setManifoldPosition: (pos) => set({ manifoldPosition: pos }),
  setAcPosition: (pos) => set({ acPosition: pos }),

  setRoomPoints: (points) => {
    const { walls, wallMaterialId, wallThicknessM } = get();
    const valid = (points || []).filter((p) => p && Number.isFinite(p.x) && Number.isFinite(p.y));
    const area = calculatePolygonArea(valid);
    const perimeter = calculatePolygonPerimeter(valid);
    const updatedWalls = generateWallsFromPoints(valid, walls, wallMaterialId, wallThicknessM);
    set({
      roomPoints: valid,
      walls: updatedWalls,
      roomArea: area,
      roomPerimeter: perimeter,
    });
  },

  setRoomDimensions: (widthM: number, heightM: number) => {
    get().pushHistorySnapshot();
    const { walls, wallMaterialId, wallThicknessM } = get();
    const w = Math.max(1.5, Math.min(30.0, widthM));
    const h = Math.max(1.5, Math.min(30.0, heightM));

    const pts = ROOM_PRESETS.RECTANGLE(w, h);
    const area = calculatePolygonArea(pts);
    const perimeter = calculatePolygonPerimeter(pts);
    const updatedWalls = generateWallsFromPoints(pts, walls, wallMaterialId, wallThicknessM);

    set({
      roomPoints: pts,
      walls: updatedWalls,
      roomArea: area,
      roomPerimeter: perimeter,
      isDrawingWall: false,
      drawingPoints: [],
    });
  },

  loadPresetShape: (shape) => {
    get().pushHistorySnapshot();
    const { walls, wallMaterialId, wallThicknessM } = get();
    let pts: IPoint[];
    if (shape === 'L_SHAPE') pts = ROOM_PRESETS.L_SHAPE();
    else if (shape === 'T_SHAPE') pts = ROOM_PRESETS.T_SHAPE();
    else pts = ROOM_PRESETS.RECTANGLE(6.0, 4.0);

    const area = calculatePolygonArea(pts);
    const perimeter = calculatePolygonPerimeter(pts);
    const newWalls = generateWallsFromPoints(pts, walls, wallMaterialId, wallThicknessM);

    set({
      roomPoints: pts,
      walls: newWalls,
      roomArea: area,
      roomPerimeter: perimeter,
      isDrawingWall: false,
      drawingPoints: [],
      activeGuidelines: [],
      isOrthoSnapped: false,
    });
  },

  clearCanvas: () => {
    get().pushHistorySnapshot();
    set({
      roomPoints: [],
      walls: [],
      windows: [],
      doors: [],
      furniture: [],
      drawingPoints: [],
      isDrawingWall: false,
      selectedElementId: null,
      selectedElementType: null,
      selectedVertexIndex: null,
      roomArea: 0,
      roomPerimeter: 0,
      canvasRotation: 0,
      activeGuidelines: [],
      isOrthoSnapped: false,
    });
  },
}));
