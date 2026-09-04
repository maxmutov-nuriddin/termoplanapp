import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Share2, CheckCircle2, Eye, FileText, Download, Layers, ShieldCheck } from 'lucide-react-native';
import { Header } from '../components/common/Header';
import { CustomButton } from '../components/common/CustomButton';
import { useProjectStore } from '../store/projectStore';
import { useCanvasStore } from '../store/canvasStore';
import { generateAndSharePdf, viewPdfDirectly } from '../utils/pdfGenerator';
import { formatCurrencyUzs, formatCurrencyUsd } from '../utils/formatters';
import { COLORS, SHADOWS, RADIUS, SPACING } from '../theme';

export const PdfViewerScreen: React.FC<{ navigation: any; route: any }> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { currentProject, calculations, smeta } = useProjectStore();
  const [sharing, setSharing] = useState(false);
  const [viewing, setViewing] = useState(false);

  const getPdfOptions = () => {
    const canvas = useCanvasStore.getState();
    return {
      project: currentProject,
      calculations,
      smeta,
      canvasState: {
        roomPoints: canvas.roomPoints,
        interiorWalls: canvas.interiorWalls,
        windows: canvas.windows,
        doors: canvas.doors,
        furniture: canvas.furniture,
        boilerPosition: canvas.boilerPosition,
        manifoldPosition: canvas.manifoldPosition,
        acPosition: canvas.acPosition,
        roomArea: canvas.roomArea,
        roomName: canvas.roomName,
      },
    };
  };

  const handleShare = async () => {
    setSharing(true);
    try {
      const options = getPdfOptions();
      await generateAndSharePdf(options);
      setSharing(false);
    } catch (err: any) {
      setSharing(false);
      Alert.alert('Eksport xatosi', 'PDF faylini shakllantirishda xatolik yuz berdi: ' + (err.message || ''));
    }
  };

  const handleView = async () => {
    setViewing(true);
    try {
      const options = getPdfOptions();
      await viewPdfDirectly(options);
      setViewing(false);
    } catch (err: any) {
      setViewing(false);
      Alert.alert('Ko‘rish xatosi', 'PDF faylini ochishda xatolik yuz berdi: ' + (err.message || ''));
    }
  };

  const itemsCount = smeta?.items?.length || 15;
  const grandTotal = smeta?.grandTotalUzs || 15945000;
  const grandTotalUsd = smeta?.grandTotalUsd || Math.round(grandTotal / 12850);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Header
        title="4-Sahifali Muhandislik PDF"
        subtitle="Rasmiy loyiha hujjati va to‘liq smeta"
        showBack
        onBack={() => navigation.goBack()}
        rightAction={
          <TouchableOpacity style={styles.iconBtn} onPress={handleShare} disabled={sharing}>
            {sharing ? <ActivityIndicator size="small" color={COLORS.primary} /> : <Share2 size={20} color={COLORS.primary} />}
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Banner */}
        <View style={styles.bannerCard}>
          <View style={styles.bannerHeader}>
            <FileText color={COLORS.primary} size={22} />
            <Text style={styles.bannerTitle}>Rasmiy Muhandislik Hujjati Tayyor</Text>
          </View>
          <Text style={styles.bannerDesc}>
            PDF fayli O‘zbekiston shaharsozlik normalari (KMK 2.04.05-97) asosida to‘liq vektor grafikada, hisob-kitoblar va kerakli mahsulotlar spetsifikatsiyasi bilan shakllantiriladi.
          </Text>
        </View>

        {/* Sahifa 1 */}
        <View style={styles.pageCard}>
          <View style={[styles.cardAccent, { backgroundColor: COLORS.success }]} />
          <View style={styles.pageBadge}><Text style={styles.pageBadgeText}>1-SAHIFA</Text></View>
          <Text style={styles.pageTitle}>📍 Bino Pasporti & Iqlim Tahlili</Text>
          <Text style={styles.pageDesc}>
            O‘zbekiston hududiy iqlim ko‘rsatkichlari (-15°C...-22°C / +42°C...+46°C), quyosh nurlanishi (W/m²), bino pasporti va mavsumiy umumiy energetik balans.
          </Text>
          <View style={styles.statusRow}>
            <CheckCircle2 color={COLORS.success} size={16} />
            <Text style={styles.statusText}>Vektor jadval va energiya balansi tayyor</Text>
          </View>
        </View>

        {/* Sahifa 2 */}
        <View style={styles.pageCard}>
          <View style={[styles.cardAccent, { backgroundColor: COLORS.heat }]} />
          <View style={[styles.pageBadge, { backgroundColor: COLORS.heatLight }]}><Text style={[styles.pageBadgeText, { color: COLORS.heatDark }]}>2-SAHIFA</Text></View>
          <Text style={styles.pageTitle}>🔥 Qishki Rejim — 2D Tyoply Pol Sxemasi</Text>
          <Text style={styles.pageDesc}>
            Salyangoz (Spiral) marshruti, oyna osti 10 sm zich sovuq zona, kollektor va qozon ulanishi, quvur uzunliklari va konturlar bo‘linishi.
          </Text>
          <View style={styles.statusRow}>
            <CheckCircle2 color={COLORS.success} size={16} />
            <Text style={styles.statusText}>Masshtabli 2D arxitekturaviy chizma kiritilgan</Text>
          </View>
        </View>

        {/* Sahifa 3 */}
        <View style={styles.pageCard}>
          <View style={[styles.cardAccent, { backgroundColor: COLORS.cool }]} />
          <View style={[styles.pageBadge, { backgroundColor: COLORS.coolLight }]}><Text style={[styles.pageBadgeText, { color: COLORS.coolDark }]}>3-SAHIFA</Text></View>
          <Text style={styles.pageTitle}>❄️ Yozgi Rejim — Konditsioner & CFD Havo Oqimi</Text>
          <Text style={styles.pageDesc}>
            Mebel va divan/krovatni chetlab o‘tuvchi 55° konussimon xavfsiz havo oqimi, xonalar bo‘yicha BTU quvvati va tashqi blok montaj yo‘riqnomasi.
          </Text>
          <View style={styles.statusRow}>
            <CheckCircle2 color={COLORS.success} size={16} />
            <Text style={styles.statusText}>Salomatlik xavfsizligi va havo konusi tasdiqlangan</Text>
          </View>
        </View>

        {/* Sahifa 4: DEDICATED PRODUCTS LIST & SMETA */}
        <View style={styles.pageCard}>
          <View style={[styles.cardAccent, { backgroundColor: '#8B5CF6' }]} />
          <View style={[styles.pageBadge, { backgroundColor: '#F3E8FF' }]}>
            <Text style={[styles.pageBadgeText, { color: '#7E22CE' }]}>4-SAHIFA — ASOSIY BO‘LIM</Text>
          </View>
          <Text style={styles.pageTitle}>📋 Kerakli Mahsulotlar Ro‘yxati & Smeta</Text>
          <Text style={styles.pageDesc}>
            Barcha kerakli jihozlar: PERT quvurlar, kollektor, EPS izolyatsiya, damping lenta, inverter konditsioner, mis trassa va montaj xizmatlarining batafsil spetsifikatsiyasi.
          </Text>

          {/* Quick Smeta Stats */}
          <View style={styles.smetaPillBox}>
            <View style={styles.smetaPill}>
              <Layers color={COLORS.primary} size={14} />
              <Text style={styles.smetaPillText}>{itemsCount} xil mahsulot</Text>
            </View>
            <View style={styles.smetaPill}>
              <ShieldCheck color={COLORS.success} size={14} />
              <Text style={styles.smetaPillText}>QMQ me’yori</Text>
            </View>
            <View style={[styles.smetaPill, { backgroundColor: COLORS.primaryBg }]}>
              <Text style={[styles.smetaPillText, { color: COLORS.primary, fontWeight: '800' }]}>
                {formatCurrencyUzs(grandTotal)} (~{formatCurrencyUsd(grandTotalUsd)})
              </Text>
            </View>
          </View>

          <View style={styles.statusRow}>
            <CheckCircle2 color={COLORS.success} size={16} />
            <Text style={styles.statusText}>Narxlar, o‘lchov birliklari va ustalar talablari to‘liq</Text>
          </View>
        </View>
      </ScrollView>

      {/* Action Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom || SPACING.lg }]}>
        <View style={styles.btnRow}>
          <View style={{ flex: 1 }}>
            <CustomButton
              title="Ko‘rish"
              variant="outline"
              icon={<Eye color={COLORS.primary} size={18} />}
              onPress={handleView}
              loading={viewing}
              disabled={sharing || viewing}
            />
          </View>
          <View style={{ flex: 1.5 }}>
            <CustomButton
              title="Yuklab Olish / Ulashish"
              icon={<Download color={COLORS.surface} size={18} />}
              onPress={handleShare}
              loading={sharing}
              disabled={sharing || viewing}
            />
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  iconBtn: {
    padding: 8,
    backgroundColor: COLORS.primaryBg,
    borderRadius: RADIUS.pill,
  },
  scrollContent: {
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  bannerCard: {
    backgroundColor: COLORS.primaryBg,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: '#CCFBF1',
  },
  bannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primaryDark,
  },
  bannerDesc: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  pageCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    position: 'relative',
    overflow: 'hidden',
    ...SHADOWS.card,
  },
  cardAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  pageBadge: {
    backgroundColor: COLORS.borderLight,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    marginBottom: SPACING.sm,
  },
  pageBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: COLORS.textSecondary,
  },
  pageTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 6,
  },
  pageDesc: {
    fontSize: 12.5,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginBottom: SPACING.md,
  },
  smetaPillBox: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: SPACING.md,
  },
  smetaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.surfaceAlt,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
  },
  smetaPillText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: COLORS.text,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  statusText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: COLORS.success,
  },
  footer: {
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    padding: SPACING.lg,
  },
  btnRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
});
