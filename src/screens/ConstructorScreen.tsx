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

  // 10/10 Sifat Standarti: Professional Santexnik va Bino Fizikasi Algoritmi
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

  // Qishki rejimda Tyopliy pol sxemasi tahlili va tavsiyasi
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

  // Yozgi rejimda xona maydoni va quyosh yuklamasiga qarab konditsioner tavsiyasi
  const recommendedAcInfo = useMemo(() => {
    const area = roomArea || 24;
    let btu = 9000;
    let modelName = '09 model (9 000 BTU / 2.6 kW)';
    let count = 1;
    let desc = "Kichik va o'rtacha xonalar uchun yetarli";

    if (area <= 22) {
      btu = 9000;
      modelName = '09 model (9 000 BTU / 2.6 kW)';
      count = 1;
      desc = "22 m² gacha bo'lgan yotoqxona va kichik xonalar uchun ideal";
    } else if (area <= 35) {
      btu = 12000;
      modelName = '12 model (12 000 BTU / 3.5 kW)';
      count = 1;
      desc = "25-35 m² mehmonxona va zal uchun optimal sovitish quvvati";
    } else if (area <= 55) {
      btu = 18000;
      modelName = '18 model (18 000 BTU / 5.2 kW)';
      count = 1;
      desc = "35-55 m² katta xonalar uchun yoki 2 dona 09 model tavsiya etiladi";
    } else if (area <= 75) {
      btu = 24000;
      modelName = '24 model (24 000 BTU / 7.0 kW)';
      count = 1;
      desc = "55-75 m² keng zallar uchun yoki 2 dona 12 model tavsiya etiladi";
    } else {
      btu = 36000;
      count = Math.ceil(area / 35);
      modelName = `${count} dona Multisplit (har biri 18-24 model)`;
      desc = `${area} m² katta maydon uchun ${count} ta nuqtadan muvozanatli sovitish lozim`;
    }

    return { btu, modelName, count, desc };
  }, [roomArea]);

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

  // CADStudiodan qaytganda chizmani markazga avto-moslashtirish
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
        subtitle={`${roomName || 'Mehmonxona'} • Maydon: ${roomArea || 24} m² • Fasad: ${currentProject?.compassNorthAngle || 0}°`}
        showBack
        onBack={() => navigation.goBack()}
        rightAction={
          <TouchableOpacity style={styles.headerBtn} onPress={handleOpenStudio}>
            <PenTool size={16} color="#38BDF8" />
            <Text style={styles.headerBtnText}>Chizish</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        scrollEnabled={scrollEnabled}
      >
        {/* Rejim (Qish / Yoz) Switcheri */}
        <View style={styles.section}>
          <ModeSwitch mode={seasonMode} onChange={setSeasonMode} />
        </View>

        {/* 2D / 3D Switcher va Fazo Boshqaruvi */}
        <View style={styles.viewHeader}>
          <View style={styles.vhLeft}>
            <Text style={styles.sectionTitle}>
              {dimensionMode === '2D' ? '📐 2D Arxitektura & Quvurlar' : '🏢 3D Fazo & Shamol / Quyosh Simulyatsiyasi'}
            </Text>
            <Text style={styles.sectionSub}>
              {dimensionMode === '2D'
                ? seasonMode === 'winter'
                  ? 'Isitish quvurlari va kollektor joylashuvi'
                  : 'Konditsioner aerodinamik sovuq havo oqimi'
                : '3D bino shakli, quyosh nuri va shamol oqimi'}
            </Text>
          </View>

          {/* 2D / 3D & Razmerlar Switcher */}
          <View style={styles.dimSwitcher}>
            <TouchableOpacity
              style={[styles.dimBtn, dimensionMode === '2D' && styles.dimBtnActive]}
              onPress={() => setDimensionMode('2D')}
            >
              <Layers size={14} color={dimensionMode === '2D' ? '#FFFFFF' : '#64748B'} />
              <Text style={[styles.dimBtnText, dimensionMode === '2D' && styles.dimBtnTextActive]}>2D</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.dimBtn, dimensionMode === '3D' && styles.dimBtnActive]}
              onPress={() => setDimensionMode('3D')}
            >
              <Box size={14} color={dimensionMode === '3D' ? '#FFFFFF' : '#64748B'} />
              <Text style={[styles.dimBtnText, dimensionMode === '3D' && styles.dimBtnTextActive]}>3D Fazo</Text>
            </TouchableOpacity>

            {dimensionMode === '2D' && (
              <TouchableOpacity
                style={[styles.dimBtn, !showDimensions && styles.dimBtnActive]}
                onPress={toggleShowDimensions}
              >
                {showDimensions ? <Eye size={13} color="#64748B" /> : <EyeOff size={13} color="#FFFFFF" />}
                <Text style={[styles.dimBtnText, !showDimensions && styles.dimBtnTextActive]}>
                  {showDimensions ? 'Razmer' : 'Yashirish'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Prostranstvoga Kirish Tugmasi */}
        <TouchableOpacity style={styles.enterStudioBtn} onPress={handleOpenStudio} activeOpacity={0.85}>
          <View style={styles.esbLeft}>
            <View style={styles.esbIconCircle}>
              <PenTool size={18} color="#FFFFFF" />
            </View>
            <View>
              <Text style={styles.esbTitle}>✏️ Prostranstvoda Erkin Chizish & Tahrirlash</Text>
              <Text style={styles.esbSub}>
                Alohida to‘liq sahifada devorlarni chizing, mebel va oynalarni erkin joylashtiring
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* 2D yoki 3D Ko'rinish (Canvasga tegib turganda tashqi scroll to'xtatiladi) */}
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

        {/* YOZGI REJIM: SOVUTISH VA KONDITSIONER TAVSIYALARI */}
        {seasonMode === 'summer' && (
          <View style={styles.acAdvisorCard}>
            <View style={styles.acAdvHeader}>
              <View style={styles.acAdvHeaderIcon}>
                <Snowflake size={18} color="#0284C7" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.acAdvTitle}>❄️ Yozgi Sovutish & Konditsioner Tavsiyasi</Text>
                <Text style={styles.acAdvSub}>Xona hajmi ({roomArea || 24} m²) va quyosh nuri tushishi bo‘yicha</Text>
              </View>
            </View>

            {/* Tavsiya etilgan model va quvvat */}
            <View style={styles.acModelBox}>
              <View style={styles.acModelRow}>
                <Text style={styles.acModelLabel}>Tavsiya etilgan quvvat:</Text>
                <Text style={styles.acModelValue}>{recommendedAcInfo.modelName}</Text>
              </View>
              <Text style={styles.acModelDesc}>{recommendedAcInfo.desc}</Text>
            </View>

            {/* Qayerga qo'yish kerakligi bo'yicha qoidalar */}
            <View style={styles.acRulesGrid}>
              <View style={styles.acRuleItem}>
                <MapPin size={14} color="#0284C7" />
                <Text style={styles.acRuleText}>
                  <Text style={styles.bold}>Joylashuvi:</Text> Deraza yonidagi tashqi devorga (trassa qisqa bo‘lishi uchun)
                </Text>
              </View>
              <View style={styles.acRuleItem}>
                <ShieldCheck size={14} color="#16A34A" />
                <Text style={styles.acRuleText}>
                  <Text style={styles.bold}>Salomatlik:</Text> Divan yoki krovatdan 1.5m uzoqroqda (sovuq havo to‘g‘ridan-to‘g‘ri urmasligi uchun)
                </Text>
              </View>
              <View style={styles.acRuleItem}>
                <Wind size={14} color="#38BDF8" />
                <Text style={styles.acRuleText}>
                  <Text style={styles.bold}>Havo oqimi:</Text> Shiftdan 20 sm pastda, xona markaziga 75° burchak ostida aylanma sirkulyatsiya
                </Text>
              </View>
            </View>

            {/* Avtomatik joylashtirish tugmasi */}
            <TouchableOpacity style={styles.autoPlaceAcBtn} onPress={handleAutoPlaceAc} activeOpacity={0.8}>
              <Sparkles size={16} color="#FFFFFF" />
              <Text style={styles.autoPlaceAcBtnText}>🎯 Tavsiya etilgan joyga o‘rnatish</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* QISHKI REJIM: 10/10 PROFESSIONAL SANTEXNIK ALGORITMI */}
        {dimensionMode === '2D' && seasonMode === 'winter' && (
          <View style={styles.patternAdvisorCard}>
            <View style={styles.patternHeader}>
              <View style={styles.patternHeaderIcon}>
                <Flame size={20} color="#EF4444" />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                  <Text style={styles.patternTitle}>♨️ Professional Santexnik Tizimi</Text>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: '#ECFDF5',
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: '#A7F3D0',
                    }}
                  >
                    <ShieldCheck size={12} color="#16A34A" style={{ marginRight: 4 }} />
                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#047857' }}>
                      {masterPlan.hydraulicBalancePercent}% Balans
                    </Text>
                  </View>
                </View>
                <Text style={styles.patternSub}>
                  {roomName || 'Kvartira'} ({masterPlan.totalHeatedAreaM2} m²) • {masterPlan.circuitCount} ta mustaqil chig'anoq konturi
                </Text>
              </View>
            </View>

            {/* 4 ta Tezkor Muhandislik Ko'rsatkichlari */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
              <View style={{ flex: 1, minWidth: '45%', backgroundColor: '#F8FAFC', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0' }}>
                <Text style={{ fontSize: 10.5, color: '#64748B', fontWeight: '600' }}>📏 Jami PEX Quvur:</Text>
                <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#0F172A', marginTop: 2 }}>
                  {masterPlan.billOfMaterials.pexPipe16mmM} metr (16mm)
                </Text>
              </View>
              <View style={{ flex: 1, minWidth: '45%', backgroundColor: '#F8FAFC', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0' }}>
                <Text style={{ fontSize: 10.5, color: '#64748B', fontWeight: '600' }}>🔀 Konturlar soni:</Text>
                <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#0284C7', marginTop: 2 }}>
                  {masterPlan.circuitCount} ta Ulitka (&lt;80m)
                </Text>
              </View>
              <View style={{ flex: 1, minWidth: '45%', backgroundColor: '#F8FAFC', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0' }}>
                <Text style={{ fontSize: 10.5, color: '#64748B', fontWeight: '600' }}>🎛️ Boshqaruv Shkafi:</Text>
                <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#16A34A', marginTop: 2 }}>
                  {masterPlan.circuitCount} chiqishli KL
                </Text>
              </View>
              <View style={{ flex: 1, minWidth: '45%', backgroundColor: '#F8FAFC', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0' }}>
                <Text style={{ fontSize: 10.5, color: '#64748B', fontWeight: '600' }}>🛡️ Istisno & Mebel:</Text>
                <Text style={{ fontSize: 13, fontWeight: 'bold', color: masterPlan.totalExcludedAreaM2 > 0 ? '#EF4444' : '#10B981', marginTop: 2 }}>
                  {masterPlan.totalExcludedAreaM2 > 0 ? `${masterPlan.totalExcludedAreaM2} m² chetlandi` : 'Toza reja'}
                </Text>
              </View>
            </View>

            {/* Muhandislik Xulosasi */}
            <View style={{ backgroundColor: 'rgba(2, 132, 199, 0.08)', padding: 10, borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(2, 132, 199, 0.25)' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                <ShieldCheck size={14} color="#0284C7" />
                <Text style={{ fontSize: 11.5, fontWeight: 'bold', color: '#0369A1', marginLeft: 4 }}>
                  Muhandislik va Gidravlik Standart (KMK 2.04.05-97):
                </Text>
              </View>
              <Text style={{ fontSize: 11.5, color: '#0F172A', fontWeight: '500', lineHeight: 16 }}>
                {masterPlan.expertVerdict}
              </Text>
            </View>

            {/* Arxitektura va Iqlimiy Elementlar Tahlili */}
            <View style={{ backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, padding: 10, marginBottom: 12 }}>
              <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#0F172A', marginBottom: 6 }}>
                🏗️ Bino Fizikasi va Elementlar Tahlili:
              </Text>
              <View style={{ gap: 4 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ fontSize: 11, color: '#334155', fontWeight: '600' }}>🧱 Devorlar: </Text>
                  <Text style={{ fontSize: 11, color: '#64748B', flex: 1 }}>{masterPlan.environmentalAnalysis.exteriorWallsSummary}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ fontSize: 11, color: '#334155', fontWeight: '600' }}>🪟 Oynalar: </Text>
                  <Text style={{ fontSize: 11, color: '#64748B', flex: 1 }}>{masterPlan.environmentalAnalysis.windowsSummary}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ fontSize: 11, color: '#334155', fontWeight: '600' }}>🧭 Quyosh & Shamol: </Text>
                  <Text style={{ fontSize: 11, color: '#64748B', flex: 1 }}>{masterPlan.environmentalAnalysis.solarWindSummary}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ fontSize: 11, color: '#334155', fontWeight: '600' }}>🚪 Eshiklar: </Text>
                  <Text style={{ fontSize: 11, color: '#64748B', flex: 1 }}>{masterPlan.environmentalAnalysis.doorsSummary}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ fontSize: 11, color: '#334155', fontWeight: '600' }}>🛡️ Istisno & Mebel: </Text>
                  <Text style={{ fontSize: 11, color: '#64748B', flex: 1 }}>{masterPlan.environmentalAnalysis.excludedSummary}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ fontSize: 11, color: '#334155', fontWeight: '600' }}>📐 Simmetriya & Fizika: </Text>
                  <Text style={{ fontSize: 11, color: '#64748B', flex: 1 }}>{masterPlan.environmentalAnalysis.physicsSummary}</Text>
                </View>
              </View>
            </View>

            {/* Har bir Kontur Gidravlikasi */}
            <View style={{ marginBottom: 12 }}>
              <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#0F172A', marginBottom: 6 }}>
                📋 Mustaqil Konturlar Gidravlikasi:
              </Text>
              {(masterPlan?.circuits || []).map((c: any, idx: number) => (
                <View
                  key={c.id}
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderWidth: 1,
                    borderColor: '#E2E8F0',
                    borderRadius: 8,
                    padding: 8,
                    marginBottom: 6,
                  }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <Text style={{ fontSize: 11.5, fontWeight: 'bold', color: '#0F172A' }}>
                      🌀 {idx + 1}-Kontur: {c.name}
                    </Text>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#EF4444' }}>
                      {c.pipeLengthM} metr
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 10.5, color: '#64748B' }}>
                      Qadam: {c.stepSm} sm {c.isBorderZone ? '(Chekka zona)' : ''}
                    </Text>
                    <Text style={{ fontSize: 10.5, color: '#64748B' }}>
                      Oqim: {c.flowRateL_min} L/min • ΔP: {c.pressureLossKPa} kPa
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Quvur ranglari izohi */}
            <View style={styles.legendGrid}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
                <Text style={styles.legendText}>
                  <Text style={{ fontWeight: '800', color: '#EF4444' }}>Qizil:</Text> Kirish (+45°C)
                </Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#2563EB' }]} />
                <Text style={styles.legendText}>
                  <Text style={{ fontWeight: '800', color: '#2563EB' }}>Ko‘k:</Text> Qaytish (+35°C)
                </Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#FB923C' }]} />
                <Text style={styles.legendText}>
                  <Text style={{ fontWeight: '800', color: '#C2410C' }}>KL:</Text> Kollektor
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Xona Parametrlari Xulosasi */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.sumItem}>
              <Text style={styles.sumLabel}>Maydon (S):</Text>
              <Text style={styles.sumVal}>{roomArea || 24} m²</Text>
            </View>
            <View style={styles.sumItem}>
              <Text style={styles.sumLabel}>Perimetr (P):</Text>
              <Text style={styles.sumVal}>{roomPerimeter || 20} m</Text>
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
        </View>

        {/* Intellektual Muhandislik & Xavfsizlik Tavsiyalari */}
        <EngineeringAdvisorCard />

        {/* Mikroiqlim Standartlari Badgelari */}
        <View style={styles.standardsRow}>
          <View style={styles.stdBadge}>
            <ShieldCheck size={14} color="#16A34A" />
            <Text style={styles.stdText}>KMK 2.04.05-97</Text>
          </View>
          <View style={styles.stdBadge}>
            {seasonMode === 'winter' ? <Flame size={14} color="#EF4444" /> : <Snowflake size={14} color="#0284C7" />}
            <Text style={styles.stdText}>
              {seasonMode === 'winter' ? 'Tyoply Pol (W/m²)' : 'BTU Inverter (HVAC)'}
            </Text>
          </View>
          <View style={styles.stdBadge}>
            <Compass size={14} color="#F59E0B" />
            <Text style={styles.stdText}>Fasad: {currentProject?.compassNorthAngle || 0}° Shimol</Text>
          </View>
        </View>
      </ScrollView>

      {/* Pastki Harakat Tugmasi */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom || 16 }]}>
        <CustomButton
          title="⚡ To‘liq Hisob-kitob va Smetani Chiqarish"
          onPress={handleGenerate}
          loading={loading}
          variant="primary"
          icon={<Sparkles size={18} color="#FFFFFF" />}
        />
      </View>

      <LoadingModal visible={loading} message="Mikroiqlim va smeta hisoblanmoqda..." />
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
    backgroundColor: '#F8FAFC',
  },
  headerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  headerBtnText: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  section: {
    marginBottom: 12,
  },
  viewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  vhLeft: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  sectionSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  dimSwitcher: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 10,
    padding: 3,
    gap: 2,
  },
  dimBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 7,
    gap: 3,
  },
  dimBtnActive: {
    backgroundColor: '#0284C7',
  },
  dimBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  dimBtnTextActive: {
    color: '#FFFFFF',
  },
  enterStudioBtn: {
    backgroundColor: '#0284C7',
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  esbLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  esbIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  esbTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  esbSub: {
    fontSize: 10.5,
    color: '#E0F2FE',
    marginTop: 2,
    maxWidth: '90%',
  },
  pipeLegendCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  legendHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 6,
  },
  legendHeaderTitle: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  legendGrid: {
    flexDirection: 'column',
    gap: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
  },
  legendText: {
    fontSize: 11,
    color: '#475569',
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  sumItem: {
    alignItems: 'center',
  },
  sumLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
  },
  sumVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  standardsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 12,
  },
  stdBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 4,
  },
  stdText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#334155',
  },
  canvasWrapper: {
    width: '100%',
    height: 320,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    marginVertical: 4,
  },
  acAdvisorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  acAdvHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F9FF',
  },
  acAdvHeaderIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  acAdvTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0369A1',
  },
  acAdvSub: {
    fontSize: 10.5,
    color: '#64748B',
    marginTop: 1,
  },
  acModelBox: {
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    padding: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  acModelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  acModelLabel: {
    fontSize: 11,
    color: '#0369A1',
    fontWeight: '600',
  },
  acModelValue: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0284C7',
  },
  acModelDesc: {
    fontSize: 10.5,
    color: '#475569',
    marginTop: 4,
  },
  acRulesGrid: {
    marginTop: 10,
    gap: 6,
  },
  acRuleItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: '#F8FAFC',
    padding: 8,
    borderRadius: 8,
  },
  acRuleText: {
    flex: 1,
    fontSize: 10.5,
    color: '#334155',
    lineHeight: 15,
  },
  bold: {
    fontWeight: '700',
    color: '#0F172A',
  },
  autoPlaceAcBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0284C7',
    borderRadius: 12,
    paddingVertical: 10,
    marginTop: 12,
    gap: 6,
  },
  autoPlaceAcBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  patternAdvisorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#FECACA',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  patternHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#FEF2F2',
  },
  patternHeaderIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  patternTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#991B1B',
  },
  patternSub: {
    fontSize: 10.5,
    color: '#64748B',
    marginTop: 1,
  },
  patternGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  patternBtn: {
    width: '48%',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 10,
  },
  patternBtnActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#0284C7',
  },
  patternBtnTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  patternEmoji: {
    fontSize: 18,
  },
  recBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  recBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#16A34A',
  },
  patternName: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#334155',
  },
  patternNameActive: {
    color: '#0284C7',
    fontWeight: '800',
  },
  patternStepText: {
    fontSize: 9.5,
    color: '#64748B',
    marginTop: 2,
  },
  patternDetailBox: {
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  patternDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  patternDetailTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0369A1',
  },
  recPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
  },
  recPillText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#16A34A',
  },
  patternDetailReason: {
    fontSize: 11,
    color: '#334155',
    lineHeight: 16,
    marginBottom: 10,
  },
  specRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E0F2FE',
  },
  specItem: {
    alignItems: 'center',
  },
  specLabel: {
    fontSize: 9.5,
    color: '#64748B',
  },
  specValue: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#0369A1',
    marginTop: 1,
  },
  specDivider: {
    width: 1,
    height: 18,
    backgroundColor: '#E2E8F0',
  },
  advantagesList: {
    gap: 4,
  },
  advItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  advText: {
    fontSize: 10,
    color: '#475569',
    flex: 1,
  },
  bottomBar: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
});
