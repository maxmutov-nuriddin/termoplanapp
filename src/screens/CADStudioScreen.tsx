import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  X,
  Check,
  PenTool,
  Sliders,
  Focus,
  Trash2,
  MapPin,
  Home,
  ChevronDown,
  Undo2,
  Compass,
  Layers,
  Box,
  Building,
  DoorClosed,
  Plus,
  Minus,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Sparkles,
  Eye,
  EyeOff,
  Flame,
  CornerDownRight,
} from 'lucide-react-native';
import { RoomCanvas2D } from '../components/canvas/RoomCanvas2D';
import { RoomCanvas3D } from '../components/canvas/RoomCanvas3D';
import { FigmaToolDock } from '../components/canvas/FigmaToolDock';
import { ElementPropertyBar } from '../components/canvas/ElementPropertyBar';
import { CustomButton } from '../components/common/CustomButton';
import { useCanvasStore, WALL_MATERIALS, HeatingPatternType } from '../store/canvasStore';
import { useShallow } from 'zustand/react/shallow';
import { useProjectStore } from '../store/projectStore';
import { distanceBetweenPoints, parseLocalizedFloat, ROOM_PRESETS } from '../utils/geometry';

const ROOM_TYPES = [
  { id: 'living_room', name: 'Mehmonxona (Zal)', icon: '🏠', temp: '22°C' },
  { id: 'bedroom', name: 'Yotoqxona', icon: '🛏️', temp: '20°C' },
  { id: 'kitchen', name: 'Oshxona', icon: '🍳', temp: '18°C' },
  { id: 'children_room', name: 'Bolalar xonasi', icon: '🧸', temp: '24°C' },
  { id: 'bathroom', name: 'Hammom / Sanuzel', icon: '🚿', temp: '26°C' },
  { id: 'hall', name: 'Dahliz / Koridor', icon: '🚪', temp: '18°C' },
  { id: 'office', name: 'Kabinet / Ishxona', icon: '💼', temp: '21°C' },
];

const FACADE_ORIENTATIONS = [
  { angle: 0, label: 'Shimol (0°)', desc: 'Kam quyosh tushadi, sovuqroq' },
  { angle: 45, label: 'Shimoli-Sharq (45°)', desc: 'Ertalabki yorug‘lik' },
  { angle: 90, label: 'Sharq (90°)', desc: 'Ertalabki iliq quyosh' },
  { angle: 135, label: 'Janubi-Sharq (135°)', desc: 'Yorug‘ va qulay' },
  { angle: 180, label: 'Janub (180°)', desc: 'Eng ko‘p quyosh va issiqlik' },
  { angle: 225, label: 'Janubi-G‘arb (225°)', desc: 'Kechki kuchli issiq' },
  { angle: 270, label: 'G‘arb (270°)', desc: 'Kechki botish quyoshi' },
  { angle: 315, label: 'Shimoli-G‘arb (315°)', desc: 'Soya va sovuqroq' },
];






const RoomStatsHeader = React.memo(({ currentNorthAngle, styles }: { currentNorthAngle: number, styles: any }) => {
  const roomArea = useCanvasStore(s => Math.round((s.roomArea || 0) * 10) / 10);
  return (
    <Text style={styles.headerSub}>
      Maydon: <Text style={{ color: '#38BDF8', fontWeight: '800' }}>{roomArea} m²</Text> • Fasad: {currentNorthAngle}°
    </Text>
  );
});

const RoomDimensionsEditor = React.memo(({ isLayoutLocked, styles }: { isLayoutLocked: boolean, styles: any }) => {
  const setRoomDimensions = useCanvasStore(s => s.setRoomDimensions);
  const dims = useCanvasStore(
    useShallow(s => {
      const valid = (s.roomPoints || []).filter((p) => p && Number.isFinite(p.x) && Number.isFinite(p.y));
      if (valid.length !== 4) return null;
      const xs = valid.map((p) => p.x);
      const ys = valid.map((p) => p.y);
      const w = Math.round((Math.max(...xs) - Math.min(...xs)) * 10) / 10;
      const h = Math.round((Math.max(...ys) - Math.min(...ys)) * 10) / 10;
      return { width: w, height: h };
    })
  );

  const handleAdjustRoomWidth = (delta: number) => {
    const currentW = dims?.width || 6.0;
    const currentH = dims?.height || 4.0;
    const newW = Math.max(2.0, Math.min(25.0, currentW + delta));
    setRoomDimensions(newW, currentH);
  };

  const handleAdjustRoomHeight = (delta: number) => {
    const currentW = dims?.width || 6.0;
    const currentH = dims?.height || 4.0;
    const newH = Math.max(2.0, Math.min(25.0, currentH + delta));
    setRoomDimensions(currentW, newH);
  };

  if (!dims || isLayoutLocked) return null;

  return (
    <View style={styles.dimensionStepperBar}>
      <View style={styles.dimStepperItem}>
        <Text style={styles.dimStepperLabel}>Eni:</Text>
        <TouchableOpacity onPress={() => handleAdjustRoomWidth(-0.5)} style={styles.stepBtn}><Minus size={14} color="#FFF" /></TouchableOpacity>
        <Text style={styles.dimStepperValue}>{dims.width.toFixed(1)}m</Text>
        <TouchableOpacity onPress={() => handleAdjustRoomWidth(0.5)} style={styles.stepBtn}><Plus size={14} color="#FFF" /></TouchableOpacity>
      </View>
      <View style={styles.dimDivider} />
      <View style={styles.dimStepperItem}>
        <Text style={styles.dimStepperLabel}>Bo'yi:</Text>
        <TouchableOpacity onPress={() => handleAdjustRoomHeight(-0.5)} style={styles.stepBtn}><Minus size={14} color="#FFF" /></TouchableOpacity>
        <Text style={styles.dimStepperValue}>{dims.height.toFixed(1)}m</Text>
        <TouchableOpacity onPress={() => handleAdjustRoomHeight(0.5)} style={styles.stepBtn}><Plus size={14} color="#FFF" /></TouchableOpacity>
      </View>
    </View>
  );
});

export const CADStudioScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { projectId } = route.params || {};
  const { currentProject, saveRoom, updateProject } = useProjectStore();
  const {
    selectedTool,
    roomName,
    roomType,
    drawingWallStart,
    seasonMode,
    heatingPattern,
    setHeatingPattern,
    wallMaterialId,
    wallThicknessM,
    showDimensions,
    toggleShowDimensions,
    isLayoutLocked,
    history,
    undo,
    setRoomType,
    loadPresetShape,
    setRoomDimensions,
    updateWallConstruction,
    setDrawingWallStart,
    autoCenterRoom,
    setZoomScale,
    clearCanvas,
  } = useCanvasStore(
    useShallow((s) => ({
      selectedTool: s.selectedTool,
      roomName: s.roomName,
      roomType: s.roomType,
      drawingWallStart: s.drawingWallStart,
      seasonMode: s.seasonMode,
      heatingPattern: s.heatingPattern,
      setHeatingPattern: s.setHeatingPattern,
      wallMaterialId: s.wallMaterialId,
      wallThicknessM: s.wallThicknessM,
      showDimensions: s.showDimensions,
      toggleShowDimensions: s.toggleShowDimensions,
      isLayoutLocked: s.isLayoutLocked,
      history: s.history,
      undo: s.undo,
      setRoomType: s.setRoomType,
      loadPresetShape: s.loadPresetShape,
      setRoomDimensions: s.setRoomDimensions,
      updateWallConstruction: s.updateWallConstruction,
      setDrawingWallStart: s.setDrawingWallStart,
      autoCenterRoom: s.autoCenterRoom,
      setZoomScale: s.setZoomScale,
      clearCanvas: s.clearCanvas,
    }))
  );

  const [selectedWallIndex, setSelectedWallIndex] = useState<number | null>(null);
  const [editWallModalVisible, setEditWallModalVisible] = useState(false);

  // Individual devor parametrlari
  const [wallInputLength, setWallInputLength] = useState('');
  const [wallEditMaterialId, setWallEditMaterialId] = useState('brick_baked');
  const [wallEditThicknessSm, setWallEditThicknessSm] = useState('38');
  const [wallEditIsExternal, setWallEditIsExternal] = useState(true);

  const [dimensionMode, setDimensionMode] = useState<'2D' | '3D'>('2D');
  const [is3DFullscreen, setIs3DFullscreen] = useState(false);
  const [roomTypeModalVisible, setRoomTypeModalVisible] = useState(false);
  const [facadeModalVisible, setFacadeModalVisible] = useState(false);

  const currentNorthAngle = currentProject?.compassNorthAngle || 0;

  // Joriy to'rtburchak o'lchamlari (Eni va Bo'yi)
  

  const handleOpenWallEditor = (wallIdx: number) => {
    const rp = useCanvasStore.getState().roomPoints;
    const activePoints = rp && rp.length >= 3 ? rp : ROOM_PRESETS.RECTANGLE(6.0, 4.0);
    if (wallIdx < 0 || wallIdx >= activePoints.length) return;
    setSelectedWallIndex(wallIdx);
    const nextIdx = (wallIdx + 1) % activePoints.length;
    const currentLen = distanceBetweenPoints(activePoints[wallIdx], activePoints[nextIdx]);
    const currentWall = (useCanvasStore.getState().walls || [])[wallIdx];

    setWallInputLength((currentLen || 4.0).toFixed(2));
    setWallEditMaterialId(currentWall?.materialId || wallMaterialId);
    setWallEditThicknessSm(((currentWall?.thicknessM || wallThicknessM) * 100).toFixed(0));
    setWallEditIsExternal(currentWall?.isExternal !== false);
    setEditWallModalVisible(true);
  };

  const handleSaveWallConstruction = () => {
    const lenParsed = parseLocalizedFloat(wallInputLength);
    const thickSm = parseLocalizedFloat(wallEditThicknessSm);
    const thickM = thickSm > 0 ? thickSm / 100 : 0.38;

    if (isNaN(lenParsed) || lenParsed <= 0.4 || lenParsed > 40) {
      Alert.alert('Xatolik', 'Iltimos, 0.5 dan 40 metrgacha bo‘lgan to‘g‘ri devor uzunligini kiriting.');
      return;
    }

    const selectedMat = WALL_MATERIALS.find((m) => m.id === wallEditMaterialId) || WALL_MATERIALS[0];

    if (selectedWallIndex !== null) {
      updateWallConstruction(selectedWallIndex, {
        length: lenParsed,
        thicknessM: thickM,
        materialId: selectedMat.id,
        materialName: selectedMat.name,
        isExternal: wallEditIsExternal,
      });
    }
    setEditWallModalVisible(false);
  };

  const adjustWallLength = (delta: number) => {
    const current = parseLocalizedFloat(wallInputLength) || 5.0;
    const newVal = Math.max(0.5, current + delta);
    setWallInputLength(newVal.toFixed(2));
  };

  const adjustWallThicknessSm = (delta: number) => {
    const current = parseLocalizedFloat(wallEditThicknessSm) || 38;
    const newVal = Math.max(5, current + delta);
    setWallEditThicknessSm(newVal.toFixed(0));
  };

  const handleSelectMaterialPreset = (mat: typeof WALL_MATERIALS[0]) => {
    setWallEditMaterialId(mat.id);
    setWallEditThicknessSm((mat.defaultThicknessM * 100).toFixed(0));
  };

  const handleSplitWallToBend = () => {
    if (selectedWallIndex === null) return;
    const pts = useCanvasStore.getState().roomPoints;
    const n = pts.length;
    if (n < 3) return;
    const p1 = pts[selectedWallIndex];
    const p2 = pts[(selectedWallIndex + 1) % n];
    const mid = {
      x: parseFloat(((p1.x + p2.x) / 2).toFixed(2)),
      y: parseFloat(((p1.y + p2.y) / 2).toFixed(2)),
    };
    useCanvasStore.getState().addVertexOnWall(selectedWallIndex, mid);
    setEditWallModalVisible(false);
  };

  const handleClearConfirm = () => {
    Alert.alert(
      'Xonani tozalash',
      'Rostdan ham barcha chizilgan devorlar va elementlarni tozalab tashlamoqchimisiz?',
      [
        { text: 'Bekor qilish', style: 'cancel' },
        { text: 'Tozalash', style: 'destructive', onPress: clearCanvas },
      ]
    );
  };

  const handleSelectRoomType = (typeItem: typeof ROOM_TYPES[0]) => {
    setRoomType(typeItem.id, typeItem.name);
    setRoomTypeModalVisible(false);
  };

  const handleSelectFacade = async (angle: number) => {
    const projId = projectId || currentProject?._id || currentProject?.id || 'proj_active';
    await updateProject(projId, { compassNorthAngle: angle });
    setFacadeModalVisible(false);
  };

  const handleSaveAndReturn = async () => {
    try {
      autoCenterRoom();

      const state = useCanvasStore.getState();
      await saveRoom({
        windows: state.windows || [],
        doors: state.doors || [],
        furniture: state.furniture || [],
        boilerPosition: state.boilerPosition || undefined,
        manifoldPosition: state.manifoldPosition || undefined,
        acPosition: state.acPosition || undefined,
        name: roomName || 'Mehmonxona (Zal)',
        roomType: (roomType as any) || 'living_room',
        area: useCanvasStore.getState().roomArea || 0,
        perimeter: useCanvasStore.getState().roomPerimeter || 0,
        ceilingHeight: currentProject?.defaultCeilingHeight || 3.0,
        points: useCanvasStore.getState().roomPoints || [],
        walls: useCanvasStore.getState().walls || [],
        interiorWalls: useCanvasStore.getState().interiorWalls || [],
                                                        wallThicknessM,
        wallMaterial: wallMaterialId,
      });
    } catch {
      // safe fallback
    }
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      {/* 1. To'liq Ekran Chizish Doskasi */}
      {dimensionMode === '2D' ? (
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
      )}

      {/* 2. Yuqori Suzuvchi Boshqaruv Qatlami */}
      <View style={[styles.topOverlay, { paddingTop: insets.top + 4 }]} pointerEvents="box-none">
        {/* Header */}
        <View style={styles.floatingTopHeader}>
          <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
            <X size={18} color="#F8FAFC" />
          </TouchableOpacity>

          {/* Xona turi / Asosiy bo'lim tanlash */}
          <TouchableOpacity
            style={styles.roomTypeSelectorBtn}
            onPress={() => setRoomTypeModalVisible(true)}
            activeOpacity={0.8}
          >
            <View style={styles.centerInfo}>
              <View style={styles.roomTypeRow}>
                <Text style={styles.headerTitle}>{roomName || 'Mehmonxona (Zal)'}</Text>
                <ChevronDown size={14} color="#38BDF8" />
              </View>
              <RoomStatsHeader currentNorthAngle={currentNorthAngle} styles={styles} />
            </View>
          </TouchableOpacity>

          {/* Ortga / Undo Tugmasi */}
          <TouchableOpacity
            style={[styles.undoBtn, history.length === 0 && { opacity: 0.5 }]}
            onPress={undo}
            disabled={history.length === 0}
            activeOpacity={0.7}
          >
            <Undo2 size={16} color="#38BDF8" />
          </TouchableOpacity>

          {/* Saqlash Tugmasi */}
          <TouchableOpacity style={styles.saveBtn} onPress={handleSaveAndReturn} activeOpacity={0.8}>
            <Check size={16} color="#FFFFFF" />
            <Text style={styles.saveBtnText}>Saqlash</Text>
          </TouchableOpacity>
        </View>

        {/* Tezkor Shakllar Paneli */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.presetsScrollView}
          contentContainerStyle={styles.presetsRow}
        >
          {!isLayoutLocked && (
            <>
              <TouchableOpacity
                style={styles.presetChip}
                onPress={() => {
                  loadPresetShape('RECTANGLE');
                  autoCenterRoom();
                }}
              >
                <Text style={styles.presetChipText}>⏹️ To‘rtburchak</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.presetChip}
                onPress={() => {
                  loadPresetShape('L_SHAPE');
                  autoCenterRoom();
                }}
              >
                <Text style={styles.presetChipText}>📐 L-Shakl</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.presetChip}
                onPress={() => {
                  loadPresetShape('T_SHAPE');
                  autoCenterRoom();
                }}
              >
                <Text style={styles.presetChipText}>🔲 T-Shakl</Text>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity style={styles.iconChip} onPress={() => autoCenterRoom()}>
            <Focus size={14} color="#38BDF8" />
          </TouchableOpacity>


          <TouchableOpacity
            style={[styles.presetChip, isLayoutLocked && styles.presetChipDangerActive]}
            onPress={() => useCanvasStore.getState().toggleLayoutLock()}
          >
            <Text style={[styles.presetChipText, isLayoutLocked && styles.presetChipTextActive]}>
              {isLayoutLocked ? '🔒 Qotirilgan' : '🔓 Qotirish'}
            </Text>
          </TouchableOpacity>

          {!isLayoutLocked && (
            <TouchableOpacity style={styles.iconChipDanger} onPress={handleClearConfirm}>
              <Trash2 size={14} color="#EF4444" />
            </TouchableOpacity>
          )}
        </ScrollView>

        {/* 3. XONA O'LCHAMLARINI TEZKOR O'ZGARTIRISH PANELLARI (Qulay Slider/Stepper) */}
        <RoomDimensionsEditor isLayoutLocked={isLayoutLocked} styles={styles} />

        {/* Devor chizish yo'riqnomasi */}
        {selectedTool === 'pen_room' && (
          <View style={styles.penInstructionBanner}>
            <Text style={styles.penInstructionText}>
              {drawingWallStart
                ? '🎯 Devor tugash nuqtasini bosing'
                : '🚪 Ichki devor (Xona): boshlanadigan joyni bosing'}
            </Text>
            {drawingWallStart && (
              <TouchableOpacity
                style={styles.cancelPenBtn}
                onPress={() => setDrawingWallStart(null)}
              >
                <X size={12} color="#EF4444" />
                <Text style={styles.cancelPenText}>Bekor</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {selectedTool === 'pen_wall' && (
          <View style={styles.penInstructionBanner}>
            <Text style={styles.penInstructionText}>
              🧱 Tashqi Devor: Perimetr burchaklarini bosib chizing
            </Text>
          </View>
        )}

        {selectedTool === 'exclude_zone' && (
          <View style={styles.penInstructionBanner}>
            <Text style={styles.penInstructionText}>
              🚫 Yer Istisno: Pol isitilmaydigan joylarni belgilang yoki o‘chiring (×)
            </Text>
          </View>
        )}
      </View>

      {/* Yon Tomondagi Zoom va Fasad Boshqaruvi */}
      <View style={styles.rightFloatControls} pointerEvents="box-none">
        <TouchableOpacity
          style={styles.rightFloatBtn}
          onPress={() => setZoomScale((z) => Math.min(3.5, z * 1.25))}
        >
          <ZoomIn size={18} color="#38BDF8" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.rightFloatBtn}
          onPress={() => setZoomScale((z) => Math.max(0.4, z * 0.8))}
        >
          <ZoomOut size={18} color="#38BDF8" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.rightFloatBtn}
          onPress={toggleShowDimensions}
        >
          {showDimensions ? <Eye size={18} color="#38BDF8" /> : <EyeOff size={18} color="#F59E0B" />}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.rightFloatBtn}
          onPress={() => setFacadeModalVisible(true)}
        >
          <Compass size={18} color="#F59E0B" />
        </TouchableOpacity>


      </View>

      {/* 4 & 5. Pastki Element Xususiyatlari Paneli va Figma Uskunalar Paneli (Dock) */}
      {dimensionMode === '2D' && (
        <View
          style={[styles.bottomOverlay, { paddingBottom: Math.max(insets.bottom, 12) }]}
          pointerEvents="box-none"
        >
          <ElementPropertyBar />
          <FigmaToolDock />
        </View>
      )}

      {/* Devor Konstruksiyasini Sozlash Modali */}
      <Modal visible={editWallModalVisible} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.kavWrapper}>
              <View style={styles.modalCard}>
                <ScrollView showsVerticalScrollIndicator={false}>
                  <View style={styles.modalHeaderRow}>
                    <Text style={styles.modalTitle}>
                      🧱 Devor #{selectedWallIndex !== null ? selectedWallIndex + 1 : 1} Konstruktsiyasi
                    </Text>
                    <TouchableOpacity onPress={() => setEditWallModalVisible(false)}>
                      <X size={20} color="#94A3B8" />
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.fieldLabel}>Devor Turi (Vazifasi):</Text>
                  <View style={styles.roleToggleRow}>
                    <TouchableOpacity
                      style={[styles.roleBtn, wallEditIsExternal && styles.roleBtnActive]}
                      onPress={() => setWallEditIsExternal(true)}
                    >
                      <Building size={16} color={wallEditIsExternal ? '#FFFFFF' : '#64748B'} />
                      <Text style={[styles.roleBtnText, wallEditIsExternal && styles.roleBtnTextActive]}>
                        🏢 Tashqi Devor (Fasad)
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.roleBtn, !wallEditIsExternal && styles.roleBtnActive]}
                      onPress={() => setWallEditIsExternal(false)}
                    >
                      <DoorClosed size={16} color={!wallEditIsExternal ? '#FFFFFF' : '#64748B'} />
                      <Text style={[styles.roleBtnText, !wallEditIsExternal && styles.roleBtnTextActive]}>
                        🚪 Ichki Peregorodka
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.fieldLabel}>Devor Uzunligi (Metrda):</Text>
                  <View style={styles.stepperInputRow}>
                    <TouchableOpacity style={styles.stepperBtn} onPress={() => adjustWallLength(-0.5)}>
                      <Text style={styles.stepperBtnText}>-0.5m</Text>
                    </TouchableOpacity>
                    <TextInput
                      style={styles.stepperInput}
                      value={wallInputLength}
                      onChangeText={setWallInputLength}
                      keyboardType="numeric"
                      placeholder="4.00"
                    />
                    <TouchableOpacity style={styles.stepperBtn} onPress={() => adjustWallLength(0.5)}>
                      <Text style={styles.stepperBtnText}>+0.5m</Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.fieldLabel}>Devor Materiali:</Text>
                  <View style={styles.materialsList}>
                    {WALL_MATERIALS.map((mat) => {
                      const isSelected = wallEditMaterialId === mat.id;
                      return (
                        <TouchableOpacity
                          key={mat.id}
                          style={[styles.matCard, isSelected && styles.matCardActive]}
                          onPress={() => handleSelectMaterialPreset(mat)}
                        >
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.matCardName, isSelected && styles.matCardNameActive]}>
                              {mat.name}
                            </Text>
                            <Text style={styles.matCardSub}>
                              Standart: {(mat.defaultThicknessM * 100).toFixed(0)}sm • λ={mat.conductivity} W/m·K
                            </Text>
                          </View>
                          {isSelected && <Check size={16} color="#0284C7" />}
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <Text style={styles.fieldLabel}>Devor Qalinligi (sm):</Text>
                  <View style={styles.stepperInputRow}>
                    <TouchableOpacity style={styles.stepperBtn} onPress={() => adjustWallThicknessSm(-5)}>
                      <Text style={styles.stepperBtnText}>-5 sm</Text>
                    </TouchableOpacity>
                    <TextInput
                      style={styles.stepperInput}
                      value={wallEditThicknessSm}
                      onChangeText={setWallEditThicknessSm}
                      keyboardType="numeric"
                      placeholder="38"
                    />
                    <TouchableOpacity style={styles.stepperBtn} onPress={() => adjustWallThicknessSm(5)}>
                      <Text style={styles.stepperBtnText}>+5 sm</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Devorni bukish / yangi burchak qo'shish */}
                  <TouchableOpacity
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: '#F0F9FF',
                      borderWidth: 1.5,
                      borderColor: '#0284C7',
                      borderRadius: 10,
                      paddingVertical: 12,
                      marginTop: 14,
                      marginBottom: 8,
                      gap: 8,
                    }}
                    onPress={handleSplitWallToBend}
                  >
                    <CornerDownRight size={18} color="#0284C7" />
                    <Text style={{ fontSize: 13.5, fontWeight: 'bold', color: '#0284C7' }}>
                      ✂️ Devorni Bukish (Yangi Burchak Qo‘shish)
                    </Text>
                  </TouchableOpacity>

                  <View style={styles.modalActionButtons}>
                    <TouchableOpacity
                      style={styles.modalCancelBtn}
                      onPress={() => setEditWallModalVisible(false)}
                    >
                      <Text style={styles.modalCancelText}>Bekor qilish</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.modalSaveBtn}
                      onPress={handleSaveWallConstruction}
                    >
                      <Text style={styles.modalSaveText}>Saqlash</Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </View>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Xona Turi Tanlash Modali */}
      <Modal visible={roomTypeModalVisible} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setRoomTypeModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.roomTypeCard}>
              <Text style={styles.roomTypeModalTitle}>🏠 Xona Turini Tanlang</Text>
              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 380 }}>
                {ROOM_TYPES.map((rt) => {
                  const isSelected = roomType === rt.id;
                  return (
                    <TouchableOpacity
                      key={rt.id}
                      style={[styles.roomTypeItem, isSelected && styles.roomTypeItemActive]}
                      onPress={() => handleSelectRoomType(rt)}
                    >
                      <Text style={styles.rtIcon}>{rt.icon}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.rtName, isSelected && styles.rtNameActive]}>{rt.name}</Text>
                        <Text style={styles.rtSub}>Tavsiya harorat: {rt.temp}</Text>
                      </View>
                      {isSelected && <Check size={18} color="#0284C7" />}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Fasad Yo'nalishi Modali */}
      <Modal visible={facadeModalVisible} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setFacadeModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.roomTypeCard}>
              <Text style={styles.roomTypeModalTitle}>🧭 Asosiy Fasad Yo‘nalishi</Text>
              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 380 }}>
                {FACADE_ORIENTATIONS.map((fo) => {
                  const isSelected = currentNorthAngle === fo.angle;
                  return (
                    <TouchableOpacity
                      key={fo.angle}
                      style={[styles.roomTypeItem, isSelected && styles.roomTypeItemActive]}
                      onPress={() => handleSelectFacade(fo.angle)}
                    >
                      <Compass size={20} color={isSelected ? '#0284C7' : '#64748B'} />
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={[styles.rtName, isSelected && styles.rtNameActive]}>{fo.label}</Text>
                        <Text style={styles.rtSub}>{fo.desc}</Text>
                      </View>
                      {isSelected && <Check size={18} color="#0284C7" />}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1120',
  },
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    paddingHorizontal: 12,
  },
  floatingTopHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 8,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#1E293B',
  },
  roomTypeSelectorBtn: {
    flex: 1,
  },
  centerInfo: {
    flex: 1,
  },
  roomTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  headerSub: {
    fontSize: 10.5,
    color: '#94A3B8',
    marginTop: 1,
  },
  undoBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#1E293B',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16A34A',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    gap: 4,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  presetsScrollView: {
    marginTop: 8,
  },
  presetsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingRight: 16,
  },
  bottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 95,
  },
  presetChip: {
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  presetChipActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.2)',
    borderColor: 'rgba(56, 189, 248, 0.5)',
  },
  presetChipDangerActive: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderColor: 'rgba(239, 68, 68, 0.5)',
  },
  presetChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  presetChipTextActive: {
    color: '#38BDF8',
  },
  iconChip: {
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    borderRadius: 10,
    padding: 7,
    borderWidth: 1,
    borderColor: '#334155',
  },
  iconChipDanger: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderRadius: 10,
    padding: 7,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  dimensionStepperBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(15, 23, 42, 0.94)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#0284C7',
    alignSelf: 'center',
  },
  dimStepperItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dimStepperLabel: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#38BDF8',
  },
  stepBtn: {
    backgroundColor: '#0284C7',
    borderRadius: 6,
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dimStepperValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    minWidth: 42,
    textAlign: 'center',
  },
  dimDivider: {
    width: 1,
    height: 18,
    backgroundColor: '#334155',
    marginHorizontal: 12,
  },
  rightFloatControls: {
    position: 'absolute',
    right: 12,
    top: 200,
    gap: 8,
    zIndex: 90,
  },
  rightFloatBtn: {
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    padding: 16,
  },
  kavWrapper: {
    width: '100%',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    maxHeight: '90%',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 15.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#334155',
    marginTop: 10,
    marginBottom: 6,
  },
  roleToggleRow: {
    flexDirection: 'row',
    gap: 8,
  },
  roleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  roleBtnActive: {
    backgroundColor: '#0284C7',
  },
  roleBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  roleBtnTextActive: {
    color: '#FFFFFF',
  },
  stepperInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepperBtn: {
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  stepperBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0284C7',
  },
  stepperInput: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingVertical: 9,
    paddingHorizontal: 12,
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
  materialsList: {
    gap: 6,
  },
  matCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  matCardActive: {
    backgroundColor: '#F0F9FF',
    borderColor: '#0284C7',
  },
  matCardName: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#1E293B',
  },
  matCardNameActive: {
    color: '#0284C7',
  },
  matCardSub: {
    fontSize: 10.5,
    color: '#64748B',
    marginTop: 1,
  },
  modalActionButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  modalCancelBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  modalSaveBtn: {
    flex: 1.5,
    backgroundColor: '#0284C7',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalSaveText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  roomTypeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
  },
  roomTypeModalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 14,
  },
  roomTypeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  roomTypeItemActive: {
    backgroundColor: '#F0F9FF',
    borderColor: '#0284C7',
  },
  rtIcon: {
    fontSize: 22,
    marginRight: 10,
  },
  rtName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E293B',
  },
  rtNameActive: {
    color: '#0284C7',
  },
  rtSub: {
    fontSize: 10.5,
    color: '#64748B',
    marginTop: 1,
  },
  penInstructionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0284C7',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginTop: 8,
    alignSelf: 'center',
    gap: 8,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  penInstructionText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  cancelPenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  cancelPenText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#EF4444',
  },
});
