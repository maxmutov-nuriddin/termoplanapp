import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, TextInput, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import {
  Sparkles,
  Compass,
  PenTool,
  Layers,
  Box,
  Maximize2,
  ShieldCheck,
  Flame,
  Snowflake,
  Info,
  Eye,
  EyeOff,
  Wind,
  MapPin,
  CheckCircle2,
  KeyRound,
  ExternalLink,
  X,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Header } from '../components/common/Header';
import { ModeSwitch } from '../components/common/ModeSwitch';
import { RoomCanvas2D } from '../components/canvas/RoomCanvas2D';
import { RoomCanvas3D } from '../components/canvas/RoomCanvas3D';
import { EngineeringAdvisorCard } from '../components/canvas/EngineeringAdvisorCard';
import { CustomButton } from '../components/common/CustomButton';
import { LoadingModal } from '../components/common/LoadingModal';
import { useCanvasStore } from '../store/canvasStore';
import { useShallow } from 'zustand/react/shallow';
import { useProjectStore } from '../store/projectStore';
import { ROOM_PRESETS } from '../utils/geometry';
import { analyzeRoomHeatingPattern } from '../utils/hvacAdvisor';
import { calculateMasterPlumberPlan } from '../utils/masterPlumberEngine';
import { COLORS, SHADOWS, RADIUS, SPACING } from '../theme';

export const ConstructorScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const { projectId } = route.params || {};
  const { currentProject, currentRoom, calculateProject, saveRoom } = useProjectStore();
  const {
    seasonMode,
    setSeasonMode,
    roomName,
    roomType,
    roomArea,
    roomPerimeter,
    roomPoints,
    walls,
    interiorWalls,
    windows,
    doors,
    furniture,
    manifoldPosition,
    boilerPosition,
    heatingExcludedZones,
    acPosition,
    heatingPattern,
    setHeatingPattern,
    showDimensions,
    toggleShowDimensions,
    updateElementPosition,
    initRoom,
    autoCenterRoom,
  } = useCanvasStore(
    useShallow((s) => ({
      seasonMode: s.seasonMode,
      setSeasonMode: s.setSeasonMode,
      roomName: s.roomName,
      roomType: s.roomType,
      roomArea: s.roomArea,
      roomPerimeter: s.roomPerimeter,
      roomPoints: s.roomPoints,
      walls: s.walls,
      interiorWalls: s.interiorWalls,
      windows: s.windows,
      doors: s.doors,
      furniture: s.furniture,
      manifoldPosition: s.manifoldPosition,
      boilerPosition: s.boilerPosition,
      heatingExcludedZones: s.heatingExcludedZones,
      acPosition: s.acPosition,
      heatingPattern: s.heatingPattern,
      setHeatingPattern: s.setHeatingPattern,
      showDimensions: s.showDimensions,
      toggleShowDimensions: s.toggleShowDimensions,
      updateElementPosition: s.updateElementPosition,
      initRoom: s.initRoom,
      autoCenterRoom: s.autoCenterRoom,
    }))
  );

  const [dimensionMode, setDimensionMode] = useState<'2D' | '3D'>('2D');
  const [is3DFullscreen, setIs3DFullscreen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [scrollEnabled, setScrollEnabled] = useState(true);

  const masterPlanRef = useRef<any>(null);
  const masterPlan = useMemo(() => {
    if (!isFocused && masterPlanRef.current) return masterPlanRef.current;
    const res = calculateMasterPlumberPlan(
      roomPoints || [],
      manifoldPosition,
      boilerPosition,
      interiorWalls || [],
      heatingExcludedZones || [],
      doors || [],
      windows || [],
      furniture || [],
      roomName || 'Mehmonxona',
      roomType || 'living_room',
      currentProject?.compassNorthAngle || 0,
      walls || []
    );
    masterPlanRef.current = res;
    return res;
  }, [
    isFocused,
    roomPoints,
    manifoldPosition,
    boilerPosition,
    interiorWalls,
    heatingExcludedZones,
    doors,
    windows,
    furniture,
    roomName,
    roomType,
    currentProject?.compassNorthAngle,
    walls,
  ]);

  const heatingAnalysisRef = useRef<any>(null);
  const heatingAnalysis = useMemo(() => {
    if (!isFocused && heatingAnalysisRef.current) return heatingAnalysisRef.current;
    const res = analyzeRoomHeatingPattern(
      roomPoints || [],
      walls || [],
      windows || [],
      interiorWalls || [],
      roomType || 'living_room',
      currentProject?.compassNorthAngle || 0
    );
    heatingAnalysisRef.current = res;
    return res;
  }, [isFocused, roomPoints, walls, windows, interiorWalls, roomType, currentProject?.compassNorthAngle]);

  const activePatternOption = useMemo(() => {
    return (heatingAnalysis?.options || []).find((o: any) => o.id === heatingPattern) || heatingAnalysis.options[0];
  }, [heatingAnalysis, heatingPattern]);

  const recommendedAcInfo = useMemo(() => {
    const area = roomArea || 0;
    const height = currentProject?.defaultCeilingHeight || 3.0;
    const volume = Math.round(area * height);
    const windowCount = (windows || []).length;
    const isSunny = currentProject?.compassNorthAngle === 0 || currentProject?.compassNorthAngle === 45;

    if (area === 0) return { modelName: 'Hali chizilmadi', desc: 'Iltimos, avval xonani chizing.', countText: '0 dona', totalKw: '0 kW', placementNote: 'Xonani chizing', heatGainDesc: 'Deraza va maydon aniqlanmagan' };

    // Boshlang'ich hajm bo'yicha issiqlik quvvati (40 W/m³)
    let baseWatts = volume * 40;
    // Har bir deraza uchun +350W issiqlik kirishi
    const windowBonus = windowCount * 350;
    // Quyoshli xona uchun +15% issiqlik
    const solarFactor = isSunny ? 1.15 : 1.0;
    
    const totalWatts = Math.round((baseWatts + windowBonus) * solarFactor);
    const totalKw = (totalWatts / 1000).toFixed(1);
    const totalBtu = Math.round(totalWatts * 3.412);

    let modelName = '09 model (9 000 BTU / 2.6 kW)';
    let countText = '1 dona split-sistema';
    let desc = `${area} m² xona (${volume} m³ hajm) va ${windowCount > 0 ? `${windowCount} ta deraza` : "derazasiz xona"} uchun optimal quvvat`;

    if (totalWatts <= 2800) {
      modelName = '09 model (9 000 BTU / 2.6 kW)';
      countText = '1 dona split-sistema';
    } else if (totalWatts <= 4000) {
      modelName = '12 model (12 000 BTU / 3.5 kW)';
      countText = '1 dona split-sistema';
    } else if (totalWatts <= 6500) {
      if (area > 40) {
        modelName = '2 dona 09 model (18 000 BTU jami)';
        countText = '2 dona split-sistema (muvozanatli sovitish)';
      } else {
        modelName = '18 model (18 000 BTU / 5.2 kW)';
        countText = '1 dona split-sistema';
      }
    } else if (totalWatts <= 9000) {
      modelName = '2 dona 12 model (24 000 BTU jami)';
      countText = '2 dona split-sistema (xona bo‘ylab teng sovitish)';
    } else {
      const units = Math.ceil(totalWatts / 3500);
      modelName = `${units} dona 12/18 model (Multisplit)`;
      countText = `${units} dona split-sistema`;
    }

    const placementNote = windowCount > 0 
      ? `Deraza (Oyna) yonidagi tashqi devorga (oynadan kiruvchi ${windowCount * 350}W issiqlikni birinchi bo'lib to'sadi)`
      : `Xonaning eng uzun devori markaziga shiftdan 20 sm pastda o'rnatish`;

    const heatGainDesc = `${windowCount > 0 ? `${windowCount} ta deraza va ` : ''}${volume} m³ hajm uchun issiqlik yuklamasi: ${totalKw} kW (${totalBtu.toLocaleString()} BTU/h)`;

    return { modelName, countText, desc, totalKw, totalBtu, placementNote, heatGainDesc, windowCount, volume };
  }, [roomArea, windows, currentProject?.defaultCeilingHeight, currentProject?.compassNorthAngle]);

  const handleAutoPlaceAc = () => {
    const pts = roomPoints && roomPoints.length >= 3 ? roomPoints : ROOM_PRESETS.RECTANGLE(6.0, 4.0);
    let optX = pts[0].x + 1.2;
    let optY = pts[0].y;

    if (windows && windows.length > 0) {
      const w = windows[0];
      optX = w.position.x + 0.8;
      optY = w.position.y;
    }

    updateElementPosition('ac', 'ac', optX, optY);
  };

  useEffect(() => {
    if (currentRoom && currentRoom.points && currentRoom.points.length >= 3) {
      initRoom(currentRoom);
    } else {
      autoCenterRoom(360, 300);
    }
  }, [currentRoom]);

  useFocusEffect(
    useCallback(() => {
      autoCenterRoom(360, 300);
    }, [autoCenterRoom])
  );

  const handleOpenStudio = () => {
    navigation.navigate('CADStudioScreen', { projectId });
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const projId = projectId || currentProject?._id || currentProject?.id || 'proj_active';
      
      await saveRoom({
        name: roomName || 'Asosiy xona',
        area: roomArea || 24,
        perimeter: roomPerimeter || 20,
        ceilingHeight: currentProject?.defaultCeilingHeight || 3.0,
        points: roomPoints && roomPoints.length >= 3 ? roomPoints : ROOM_PRESETS.RECTANGLE(6.0, 4.0),
        walls: walls || [],
        interiorWalls: interiorWalls || [],
        windows: windows || [],
        doors: doors || [],
        furniture: furniture || [],
        manifoldPosition: manifoldPosition || undefined,
        acPosition: acPosition || undefined,
      });

      await calculateProject(projId);
      setLoading(false);
      navigation.navigate('ResultsScreen', { projectId: projId });
    } catch {
      setLoading(false);
      navigation.navigate('ResultsScreen', { projectId: projectId || 'proj_active' });
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Header
        title={currentProject?.title || 'Mikroiqlim Loyihasi'}
        subtitle={`${roomName || 'Kvartira'} • ${roomArea || 0} m² • ${currentProject?.compassNorthAngle || 0}°`}
        showBack
        onBack={() => navigation.goBack()}
        rightAction={
          <TouchableOpacity style={styles.headerBtn} onPress={handleOpenStudio} activeOpacity={0.7}>
            <PenTool size={16} color={COLORS.primary} />
            <Text style={styles.headerBtnText}>Chizish</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        scrollEnabled={scrollEnabled && dimensionMode === '2D'}
      >
        <View style={styles.section}>
          <ModeSwitch mode={seasonMode} onChange={setSeasonMode} />
        </View>

        <View style={styles.viewHeader}>
          <View style={styles.vhLeft}>
            <Text style={styles.sectionTitle}>
              {dimensionMode === '2D' ? '📐 Arxitektura & Quvurlar' : '🏢 3D Fazo Simulyatsiyasi'}
            </Text>
            <Text style={styles.sectionSub}>
              {dimensionMode === '2D'
                ? seasonMode === 'winter'
                  ? 'Isitish quvurlari va kollektor joylashuvi'
                  : 'Konditsioner aerodinamik sovuq havo oqimi'
                : '3D bino shakli va quyosh nuri'}
            </Text>
          </View>

          <View style={styles.dimSwitcher}>
            <TouchableOpacity
              style={[styles.dimBtn, dimensionMode === '2D' && styles.dimBtnActive]}
              onPress={() => setDimensionMode('2D')}
            >
              <Layers size={14} color={dimensionMode === '2D' ? COLORS.primary : COLORS.textSecondary} />
              <Text style={[styles.dimBtnText, dimensionMode === '2D' && styles.dimBtnTextActive]}>2D</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.dimBtn, dimensionMode === '3D' && styles.dimBtnActive]}
              onPress={() => setDimensionMode('3D')}
            >
              <Box size={14} color={dimensionMode === '3D' ? COLORS.primary : COLORS.textSecondary} />
              <Text style={[styles.dimBtnText, dimensionMode === '3D' && styles.dimBtnTextActive]}>3D Fazo</Text>
            </TouchableOpacity>

            {dimensionMode === '2D' && (
              <TouchableOpacity
                style={[styles.dimBtn, !showDimensions && styles.dimBtnActive]}
                onPress={toggleShowDimensions}
              >
                {showDimensions ? <Eye size={14} color={COLORS.textSecondary} /> : <EyeOff size={14} color={COLORS.danger} />}
                <Text style={[styles.dimBtnText, !showDimensions && styles.dimBtnTextActive]}>
                  {showDimensions ? 'Razmer' : 'Yashirish'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <TouchableOpacity style={styles.enterStudioBtnWrapper} onPress={handleOpenStudio} activeOpacity={0.85}>
          <View style={styles.enterStudioBtn}>
            <View style={styles.esbLeft}>
              <View style={styles.esbIconCircle}>
                <PenTool size={18} color={COLORS.primary} />
              </View>
              <View>
                <Text style={styles.esbTitle}>Prostranstvoda Erkin Chizish</Text>
                <Text style={styles.esbSub}>
                  Devorlarni chizing va elementlarni joylashtiring
                </Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>

        <View style={styles.canvasWrapper}>
          {isFocused && (
            dimensionMode === '2D' ? (
              <RoomCanvas2D
                readOnly={true}
                showPipesAndAirflow={true}
                isSunnyRoom={currentProject?.compassNorthAngle === 0 || currentProject?.compassNorthAngle === 45}
              />
            ) : (
              <RoomCanvas3D
                wallHeightM={currentProject?.defaultCeilingHeight || 3.0}
                onToggleFullscreen={() => setIs3DFullscreen(true)}
              />
            )
          )}
        </View>

        {seasonMode === 'summer' && (
          <View style={[styles.acAdvisorCard, { borderColor: COLORS.coolLight }]}>
            <View style={[styles.acAdvHeader, { borderBottomColor: COLORS.coolLight }]}>
              <View style={[styles.acAdvHeaderIcon, { backgroundColor: COLORS.coolLight }]}>
                <Snowflake size={18} color={COLORS.cool} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.acAdvTitle, { color: COLORS.coolDark }]}>❄️ Yozgi Sovutish Tavsiyasi</Text>
                <Text style={styles.acAdvSub}>Xona hajmi ({roomArea || 0} m²) bo‘yicha</Text>
              </View>
            </View>

            <View style={[styles.acModelBox, { backgroundColor: COLORS.coolLight, borderColor: COLORS.cool }]}>
              <View style={styles.acModelRow}>
                <Text style={[styles.acModelLabel, { color: COLORS.coolDark, marginBottom: 4 }]}>Tavsiya etilgan quvvat:</Text>
                <Text style={[styles.acModelValue, { color: COLORS.cool, flexWrap: 'wrap' }]}>{recommendedAcInfo.modelName}</Text>
              </View>
              <Text style={styles.acModelDesc}>{recommendedAcInfo.desc}</Text>
            </View>

            <View style={styles.acRulesGrid}>
              <View style={styles.acRuleItem}>
                <Layers size={14} color={COLORS.cool} />
                <Text style={styles.acRuleText}>
                  <Text style={styles.bold}>Tavsiya etilgan soni:</Text> {recommendedAcInfo.countText}
                </Text>
              </View>

              <View style={styles.acRuleItem}>
                <Flame size={14} color={COLORS.heat} />
                <Text style={styles.acRuleText}>
                  <Text style={styles.bold}>Issiqlik yuklamasi:</Text> {recommendedAcInfo.heatGainDesc}
                </Text>
              </View>

              <View style={styles.acRuleItem}>
                <MapPin size={14} color={COLORS.primaryLight} />
                <Text style={styles.acRuleText}>
                  <Text style={styles.bold}>Joylashuv sababi:</Text> {recommendedAcInfo.placementNote}
                </Text>
              </View>
            </View>

            <TouchableOpacity style={styles.autoPlaceAcBtn} onPress={handleAutoPlaceAc} activeOpacity={0.8}>
              <Sparkles size={16} color={COLORS.surface} />
              <Text style={styles.autoPlaceAcBtnText}>🎯 Tavsiya etilgan joyga o‘rnatish</Text>
            </TouchableOpacity>
          </View>
        )}

        {dimensionMode === '2D' && seasonMode === 'winter' && (
          <View style={[styles.patternAdvisorCard, { borderColor: COLORS.heatLight }]}>
            <View style={[styles.patternHeader, { borderBottomColor: COLORS.heatLight }]}>
              <View style={[styles.patternHeaderIcon, { backgroundColor: COLORS.heatLight }]}>
                <Flame size={20} color={COLORS.heat} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4, flexWrap: 'wrap', gap: 6 }}>
                  <Text style={[styles.patternTitle, { color: COLORS.primaryDark, flexShrink: 1 }]}>♨️ Professional Santexnik Tizimi</Text>
                  <View style={[styles.balansBadge, { backgroundColor: COLORS.successBg, borderColor: COLORS.success }]}>
                    <ShieldCheck size={12} color={COLORS.success} style={{ marginRight: 4 }} />
                    <Text style={{ fontSize: 11, fontWeight: '700', color: COLORS.success }}>
                      {masterPlan.hydraulicBalancePercent}% Balans
                    </Text>
                  </View>
                </View>
                <Text style={styles.patternSub}>
                  {roomName || 'Kvartira'} ({masterPlan.totalHeatedAreaM2} m²) • {masterPlan.circuitCount} ta kontur
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12, marginTop: 12 }}>
              <View style={styles.engStatBox}>
                <Text style={styles.engStatLabel}>📏 Jami Quvur:</Text>
                <Text style={styles.engStatVal}>
                  {masterPlan.billOfMaterials.pexPipe16mmM} m (16mm)
                </Text>
              </View>
              <View style={styles.engStatBox}>
                <Text style={styles.engStatLabel}>🔀 Konturlar soni:</Text>
                <Text style={[styles.engStatVal, { color: COLORS.cool }]}>
                  {masterPlan.circuitCount} ta Ulitka
                </Text>
              </View>
              <View style={styles.engStatBox}>
                <Text style={styles.engStatLabel}>🎛️ Boshqaruv:</Text>
                <Text style={[styles.engStatVal, { color: COLORS.success }]}>
                  {masterPlan.circuitCount} chiqishli KL
                </Text>
              </View>
              <View style={styles.engStatBox}>
                <Text style={styles.engStatLabel}>🛡️ Istisno & Mebel:</Text>
                <Text style={[styles.engStatVal, { color: masterPlan.totalExcludedAreaM2 > 0 ? COLORS.danger : COLORS.success }]}>
                  {masterPlan.totalExcludedAreaM2 > 0 ? `${masterPlan.totalExcludedAreaM2} m² chetlandi` : 'Toza reja'}
                </Text>
              </View>
            </View>

            <View style={styles.engineeringVerdict}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                <ShieldCheck size={14} color={COLORS.primary} />
                <Text style={{ fontSize: 11.5, fontWeight: 'bold', color: COLORS.primaryDark, marginLeft: 4 }}>
                  Muhandislik va Gidravlik Standart (KMK 2.04.05-97):
                </Text>
              </View>
              <Text style={{ fontSize: 11.5, color: COLORS.text, fontWeight: '500', lineHeight: 16 }}>
                {masterPlan.expertVerdict}
              </Text>
            </View>

            <View style={styles.analysisBox}>
              <Text style={{ fontSize: 12, fontWeight: 'bold', color: COLORS.text, marginBottom: 6 }}>
                🏗️ Bino Fizikasi va Elementlar Tahlili:
              </Text>
              <View style={{ gap: 6 }}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}><Text style={styles.analysisLabel}>🧱 Devorlar: </Text><Text style={[styles.analysisVal, { flexShrink: 1 }]}>{masterPlan.environmentalAnalysis.exteriorWallsSummary}</Text></View>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}><Text style={styles.analysisLabel}>🪟 Oynalar: </Text><Text style={[styles.analysisVal, { flexShrink: 1 }]}>{masterPlan.environmentalAnalysis.windowsSummary}</Text></View>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}><Text style={styles.analysisLabel}>🧭 Quyosh: </Text><Text style={[styles.analysisVal, { flexShrink: 1 }]}>{masterPlan.environmentalAnalysis.solarWindSummary}</Text></View>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}><Text style={styles.analysisLabel}>🚪 Eshiklar: </Text><Text style={[styles.analysisVal, { flexShrink: 1 }]}>{masterPlan.environmentalAnalysis.doorsSummary}</Text></View>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}><Text style={styles.analysisLabel}>📐 Fizika: </Text><Text style={[styles.analysisVal, { flexShrink: 1 }]}>{masterPlan.environmentalAnalysis.physicsSummary}</Text></View>
              </View>
            </View>

            <View style={styles.legendGrid}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: COLORS.danger }]} />
                <Text style={styles.legendText}><Text style={{ fontWeight: '800', color: COLORS.danger }}>Qizil:</Text> Kirish (+45°C)</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: COLORS.cool }]} />
                <Text style={styles.legendText}><Text style={{ fontWeight: '800', color: COLORS.cool }}>Ko‘k:</Text> Qaytish (+35°C)</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: COLORS.warning }]} />
                <Text style={styles.legendText}><Text style={{ fontWeight: '800', color: COLORS.warningDark || '#C2410C' }}>KL:</Text> Kollektor</Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.sumItem}>
              <Text style={styles.sumLabel}>Maydon (S):</Text>
              <Text style={styles.sumVal}>{roomArea || 0} m²</Text>
            </View>
            <View style={styles.sumItem}>
              <Text style={styles.sumLabel}>Perimetr (P):</Text>
              <Text style={styles.sumVal}>{roomPerimeter || 0} m</Text>
            </View>
            <View style={styles.sumItem}>
              <Text style={styles.sumLabel}>Balandlik (H):</Text>
              <Text style={styles.sumVal}>{currentProject?.defaultCeilingHeight || 3.0} m</Text>
            </View>
            <View style={styles.sumItem}>
              <Text style={styles.sumLabel}>Burchaklar:</Text>
              <Text style={styles.sumVal}>{roomPoints?.length || 0} ta</Text>
            </View>
          </View>
        </View>        <View style={styles.standardsRow}>
          <View style={styles.stdBadge}>
            <ShieldCheck size={14} color={COLORS.success} />
            <Text style={styles.stdText}>KMK 2.04.05-97</Text>
          </View>
          <View style={styles.stdBadge}>
            {seasonMode === 'winter' ? <Flame size={14} color={COLORS.heat} /> : <Snowflake size={14} color={COLORS.cool} />}
            <Text style={styles.stdText}>
              {seasonMode === 'winter' ? 'Tyoply Pol (W/m²)' : 'BTU Inverter (HVAC)'}
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom || SPACING.lg }]}>
        <CustomButton
          title="⚡ Loyiha & Smetani Chiqarish"
          onPress={handleGenerate}
          loading={loading}
          variant="primary"
          icon={<Sparkles size={18} color={COLORS.surface} />}
        />
      </View>

      <LoadingModal visible={loading} message="Hisoblanmoqda..." />
      <Modal visible={is3DFullscreen} animationType="slide" presentationStyle="fullScreen">
        <RoomCanvas3D
          wallHeightM={currentProject?.defaultCeilingHeight || 3.0}
          isFullscreen={true}
          onToggleFullscreen={() => setIs3DFullscreen(false)}
        />
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  headerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryBg,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.primaryLight,
    gap: 4,
  },
  headerBtnText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '800',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: 32,
  },
  section: {
    marginBottom: SPACING.md,
  },
  viewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  vhLeft: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
  },
  sectionSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  dimSwitcher: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: RADIUS.pill,
    padding: 3,
    gap: 2,
  },
  dimBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.pill,
    gap: 4,
  },
  dimBtnActive: {
    backgroundColor: COLORS.surface,
    ...SHADOWS.card,
  },
  dimBtnText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  dimBtnTextActive: {
    fontWeight: '800',
    color: COLORS.text,
  },
  enterStudioBtnWrapper: {
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.primaryLight,
    ...SHADOWS.card,
  },
  enterStudioBtn: {
    padding: SPACING.md,
  },
  esbLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  esbIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  esbTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: COLORS.text,
  },
  esbSub: {
    fontSize: 11.5,
    color: COLORS.textSecondary,
    marginTop: 3,
    maxWidth: '95%',
  },
  canvasWrapper: {
    width: '100%',
    height: 340,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    marginVertical: 4,
  },
  acAdvisorCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginTop: SPACING.md,
    borderWidth: 1,
    ...SHADOWS.card,
  },
  acAdvHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  acAdvHeaderIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acAdvTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  acAdvSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  acModelBox: {
    borderRadius: RADIUS.md,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
  },
  acModelRow: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  acModelLabel: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  acModelValue: {
    fontSize: 13,
    fontWeight: '800',
  },
  acModelDesc: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  acRulesGrid: {
    marginTop: 12,
    gap: 8,
  },
  acRuleItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: COLORS.surfaceAlt,
    padding: 10,
    borderRadius: RADIUS.sm,
  },
  acRuleText: {
    flex: 1,
    fontSize: 11,
    color: COLORS.text,
    lineHeight: 16,
  },
  bold: {
    fontWeight: '800',
    color: COLORS.text,
  },
  autoPlaceAcBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: 12,
    marginTop: 14,
    gap: 8,
  },
  autoPlaceAcBtnText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: COLORS.surface,
  },
  patternAdvisorCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginTop: SPACING.md,
    borderWidth: 1,
    ...SHADOWS.card,
  },
  patternHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  patternHeaderIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  patternTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  balansBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
  },
  patternSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  engStatBox: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: COLORS.surfaceAlt,
    padding: 10,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  engStatLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  engStatVal: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.text,
    marginTop: 4,
  },
  engineeringVerdict: {
    backgroundColor: COLORS.primaryBg,
    padding: 12,
    borderRadius: RADIUS.md,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.primaryLight,
  },
  analysisBox: {
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: 12,
    marginBottom: 12,
  },
  analysisLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
    width: 80,
  },
  analysisVal: {
    fontSize: 11,
    color: COLORS.text,
    flex: 1,
    fontWeight: '500',
    lineHeight: 16,
  },
  legendGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 11.5,
    color: COLORS.textSecondary,
  },
  summaryCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginTop: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  sumItem: {
    alignItems: 'center',
  },
  sumLabel: {
    fontSize: 10.5,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  sumVal: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
    marginTop: 4,
  },
  standardsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: SPACING.md,
  },
  stdBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  stdText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.text,
  },
  bottomBar: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
});
