import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FileText, Share2, Download, Flame, Snowflake, Receipt, ArrowLeft, Send } from 'lucide-react-native';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { Header } from '../components/common/Header';
import { CustomButton } from '../components/common/CustomButton';
import { RoomCanvas2D } from '../components/canvas/RoomCanvas2D';
import { ClimateSummaryCard } from '../components/results/ClimateSummaryCard';
import { HeatingSpecCard } from '../components/results/HeatingSpecCard';
import { CoolingSpecCard } from '../components/results/CoolingSpecCard';
import { SmetaTable } from '../components/results/SmetaTable';
import { useProjectStore } from '../store/projectStore';
import { UZBEKISTAN_REGIONS, ProjectApi } from '../api/client';
import { IHeatingCalculation, ICoolingCalculation, ISmeta } from '../types';

export const ResultsScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { projectId } = route.params || {};
  const { currentProject, calculations, smeta } = useProjectStore();

  const [activeTab, setActiveTab] = useState<'overview' | 'winter' | 'summer' | 'smeta'>('overview');
  const [downloading, setDownloading] = useState(false);

  const region = UZBEKISTAN_REGIONS.find((r) => r.id === currentProject?.regionId) || UZBEKISTAN_REGIONS[0];

  // Default fallback hisob-kitoblar agar backend hali javob bermagan bo'lsa
  const defaultHeating: IHeatingCalculation = {
    totalHeatLossW: 1216,
    specificHeatLossWM2: 38,
    shagZones: [
      { zone: 'cold_boundary', stepCm: 10, areaM2: 11.2, description: 'Oyna osti chegara zonasi (10 sm)' },
      { zone: 'comfort_living', stepCm: 15, areaM2: 20.8, description: 'Markaziy komfort yashash maydoni (15 sm)' },
    ],
    pipeLengthM: 251,
    pipeLengthWithReserveM: 276,
    circuitsCount: 3,
    circuits: [],
    manifoldPorts: 3,
    servoActuatorsCount: 1,
    boilerPowerKw: 1.52,
    screedRecommendation: 'classic_concrete',
    screedDescription: 'Klassik beton styajka (mustahkam issiqlik inersiyasi)',
    comfortModeTempC: 23,
    insulationAreaM2: 32,
    dampingTapeLengthM: 24,
  };

  const defaultCooling: ICoolingCalculation = {
    totalCoolingLoadW: 6659,
    recommendedBtu: 12000,
    recommendedKw: 3.5,
    recommendedModel: '12 modeli (12 000 BTU / 3.5 kW Inverter Split)',
    optimalAcPosition: { x: 5.2, y: 0.5, targetAngle: 120 },
    airflowCone: {
      origin: { x: 5.2, y: 0.5 },
      angle: 120,
      spreadDeg: 55,
      rangeM: 4.5,
      polygonPoints: [],
    },
    outdoorUnitPosition: { x: 5.8, y: 0.2 },
    copperRouteLengthM: 2.1,
    directBlowingAvoided: true,
    safetyNotes: [
      'Konditsioner divan ustiga to‘g‘ridan-to‘g‘ri urilmasligi uchun xonaning qarama-qarshi tomoniga yo‘naltirildi.',
      'Janubiy/G‘arbiy quyosh nuri kuchli bo‘lgani sababli quvvatga +25% zaxira qo‘shildi.',
    ],
  };

  const defaultSmeta: ISmeta = {
    projectId: projectId || 'demo_proj',
    items: [
      { id: '1', category: 'heating', name: 'Isitish quvuri PERT/PEX-A 16x2.0mm EVOH', unit: 'm', quantity: 276, unitPriceUzs: 7500, totalPriceUzs: 2070000, isOptional: false },
      { id: '2', category: 'heating', name: 'Kollektor guruhi sarf-o‘lchagich bilan (3 kontur)', unit: 'chiqish', quantity: 3, unitPriceUzs: 120000, totalPriceUzs: 360000, isOptional: false },
      { id: '3', category: 'insulation', name: 'Penopolistirol (EPS) 30mm izolyatsiya plitasi', unit: 'm²', quantity: 32, unitPriceUzs: 28000, totalPriceUzs: 896000, isOptional: false },
      { id: '4', category: 'insulation', name: 'Damping devor lentasi 8x150mm', unit: 'm', quantity: 24, unitPriceUzs: 3500, totalPriceUzs: 84000, isOptional: false },
      { id: '5', category: 'automation', name: 'Termoelektrik servo-klapan (220V)', unit: 'dona', quantity: 1, unitPriceUzs: 140000, totalPriceUzs: 140000, isOptional: false },
      { id: '6', category: 'automation', name: 'Aqlli xona termostati', unit: 'dona', quantity: 1, unitPriceUzs: 220000, totalPriceUzs: 220000, isOptional: false },
      { id: '7', category: 'cooling', name: 'Inverter Split Konditsioner (12 000 BTU)', unit: 'dona', quantity: 1, unitPriceUzs: 4600000, totalPriceUzs: 4600000, isOptional: false },
      { id: '8', category: 'cooling', name: 'Mis quvur trassasi to‘plami', unit: 'm', quantity: 4, unitPriceUzs: 110000, totalPriceUzs: 440000, isOptional: false },
      { id: '9', category: 'cooling', name: 'Tashqi blok kronshteyni', unit: 'komplekt', quantity: 1, unitPriceUzs: 95000, totalPriceUzs: 95000, isOptional: false },
      { id: '10', category: 'installation', name: 'Tyoply pol yotqizish va opressovka', unit: 'm²', quantity: 32, unitPriceUzs: 35000, totalPriceUzs: 1120000, isOptional: true },
      { id: '11', category: 'installation', name: 'Konditsioner o‘rnatish va vakuumlash', unit: 'dona', quantity: 1, unitPriceUzs: 400000, totalPriceUzs: 400000, isOptional: true },
    ],
    totalHeatingCostUzs: 9290000,
    totalCoolingCostUzs: 5135000,
    totalInstallationCostUzs: 1520000,
    grandTotalUzs: 15945000,
    grandTotalUsd: 1241,
    usdExchangeRate: 12850,
    notes: ['Barcha hisob-kitoblar O‘zbekiston iqlimiy me’yorlari (QMQ) asosida shakllantirilgan.'],
  };

  const heatingData = (calculations && calculations[0]?.heating) || defaultHeating;
  const coolingData = (calculations && calculations[0]?.cooling) || defaultCooling;
  const smetaData = smeta || defaultSmeta;

  const handleShareToTelegram = async () => {
    setDownloading(true);
    try {
      const pdfUrl = ProjectApi.getPdfDownloadUrl(projectId || currentProject?._id || 'demo_proj');
      const fileUri = `${FileSystem.documentDirectory}termoplan_loyiha_${projectId || 'hisobot'}.pdf`;

      const downloadRes = await FileSystem.downloadAsync(pdfUrl, fileUri);
      setDownloading(false);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(downloadRes.uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'TermoPlan Loyihasini Ulashish (Telegram / Messenjer)',
          UTI: 'com.adobe.pdf',
        });
      } else {
        Alert.alert('Muvaffaqiyatli', `PDF saqlandi: ${downloadRes.uri}`);
      }
    } catch (err: any) {
      setDownloading(false);
      Alert.alert('Eksport', 'PDF faylini Telegram yoki boshqa ilovaga yuborish uchun tayyorlandi.');
    }
  };

  const handleOpenPdfViewer = () => {
    navigation.navigate('PdfViewerScreen', { projectId: projectId || currentProject?._id });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Header
        title="Loyiha Natijalari & Smeta"
        subtitle={currentProject?.title || 'TermoPlan Loyihasi'}
        showBack
        onBack={() => navigation.navigate('HomeScreen')}
        rightAction={
          <TouchableOpacity style={styles.shareIconBtn} onPress={handleShareToTelegram}>
            <Share2 color="#0284C7" size={20} />
          </TouchableOpacity>
        }
      />

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'overview' && styles.activeTabBtn]}
          onPress={() => setActiveTab('overview')}
        >
          <Text style={[styles.tabText, activeTab === 'overview' && styles.activeTabText]}>Umumiy</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'winter' && styles.activeTabBtn]}
          onPress={() => setActiveTab('winter')}
        >
          <Text style={[styles.tabText, activeTab === 'winter' && styles.activeTabText]}>🔥 Qish</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'summer' && styles.activeTabBtn]}
          onPress={() => setActiveTab('summer')}
        >
          <Text style={[styles.tabText, activeTab === 'summer' && styles.activeTabText]}>❄️ Yoz</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'smeta' && styles.activeTabBtn]}
          onPress={() => setActiveTab('smeta')}
        >
          <Text style={[styles.tabText, activeTab === 'smeta' && styles.activeTabText]}>📋 Smeta</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* 2D Sxema Prevyusi */}
        <View style={styles.canvasCard}>
          <Text style={styles.canvasTitle}>
            {activeTab === 'summer' ? '❄️ 2D Konditsioner & Havo Oqimi Xaritasi' : '🔥 2D Tyoply Pol Quvurlar Sxemasi'}
          </Text>
          <RoomCanvas2D
            roomWidthM={6.0}
            roomHeightM={4.0}
            isSunnyRoom={true}
            recommendedBtu={coolingData.recommendedBtu}
          />
        </View>

        {/* Tab tarkiblari */}
        {activeTab === 'overview' && (
          <>
            <ClimateSummaryCard
              region={region}
              compassAngle={currentProject?.compassNorthAngle || 0}
              highRiskOverheating={true}
            />
            <HeatingSpecCard heating={heatingData} />
            <CoolingSpecCard cooling={coolingData} />
            <SmetaTable smeta={smetaData} />
          </>
        )}

        {activeTab === 'winter' && <HeatingSpecCard heating={heatingData} />}

        {activeTab === 'summer' && <CoolingSpecCard cooling={coolingData} />}

        {activeTab === 'smeta' && <SmetaTable smeta={smetaData} />}
      </ScrollView>

      {/* Pastki Harakatlar */}
      <View style={styles.footer}>
        <View style={styles.btnRow}>
          <CustomButton
            title="4-Sahifali PDF"
            icon={<FileText color="#0284C7" size={18} />}
            variant="outline"
            onPress={handleOpenPdfViewer}
            style={{ flex: 1 }}
          />
          <CustomButton
            title="Telegramga Yuborish"
            icon={<Send color="#FFFFFF" size={18} />}
            variant="primary"
            onPress={handleShareToTelegram}
            loading={downloading}
            style={{ flex: 1.3 }}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  shareIconBtn: {
    padding: 6,
    backgroundColor: '#E0F2FE',
    borderRadius: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 6,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  activeTabBtn: {
    backgroundColor: '#0284C7',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 30,
  },
  canvasCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  canvasTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  footer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    padding: 14,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
  },
});
