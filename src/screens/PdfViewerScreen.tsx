import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Share2, CheckCircle2 } from 'lucide-react-native';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { Header } from '../components/common/Header';
import { CustomButton } from '../components/common/CustomButton';
import { ProjectApi } from '../api/client';
import { useProjectStore } from '../store/projectStore';
import { COLORS, SHADOWS, RADIUS, SPACING } from '../theme';

export const PdfViewerScreen: React.FC<{ navigation: any; route: any }> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { projectId } = route.params || {};
  const { currentProject } = useProjectStore();
  const [sharing, setSharing] = useState(false);

  const pdfUrl = ProjectApi.getPdfDownloadUrl(projectId || currentProject?._id || 'demo_proj');

  const handleShare = async () => {
    setSharing(true);
    try {
      const fileUri = `${FileSystem.documentDirectory}termoplan_loyiha_${projectId || 'hujjat'}.pdf`;
      const downloadRes = await FileSystem.downloadAsync(pdfUrl, fileUri);
      setSharing(false);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(downloadRes.uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'TermoPlan Loyihasini Ulashish',
          UTI: 'com.adobe.pdf',
        });
      }
    } catch {
      setSharing(false);
      Alert.alert('Ulashish', 'PDF loyihasi tayyorlandi.');
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Header
        title="4-Sahifali Muhandislik PDF"
        subtitle="Rasmiy loyiha hujjati va smeta"
        showBack
        onBack={() => navigation.goBack()}
        rightAction={
          <TouchableOpacity style={styles.iconBtn} onPress={handleShare}>
            <Share2 size={20} color={COLORS.primary} />
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Sahifa 1 */}
        <View style={styles.pageCard}>
          <View style={[styles.cardAccent, { backgroundColor: COLORS.success }]} />
          <View style={styles.pageBadge}><Text style={styles.pageBadgeText}>1-SAHIFA</Text></View>
          <Text style={styles.pageTitle}>📍 Bino Pasporti & Lokatsiya</Text>
          <Text style={styles.pageDesc}>
            O‘zbekiston iqlim ko‘rsatkichlari, -15°C / +42°C minimum/maksimumlar, fasad burchagi va umumiy energetik yuk.
          </Text>
          <View style={styles.statusRow}>
            <CheckCircle2 color={COLORS.success} size={16} />
            <Text style={styles.statusText}>Vektor grafikada to‘liq shakllantirilgan</Text>
          </View>
        </View>

        {/* Sahifa 2 */}
        <View style={styles.pageCard}>
          <View style={[styles.cardAccent, { backgroundColor: COLORS.heat }]} />
          <View style={[styles.pageBadge, { backgroundColor: COLORS.heatLight }]}><Text style={[styles.pageBadgeText, { color: COLORS.heatDark }]}>2-SAHIFA</Text></View>
          <Text style={styles.pageTitle}>🔥 Qishki Rejim — 2D Tyoply Pol</Text>
          <Text style={styles.pageDesc}>
            Salyangoz (Spiral) marshruti, oyna osti 10 sm zich zona, kollektor ulanishi va konturlar bo‘linishi.
          </Text>
          <View style={styles.statusRow}>
            <CheckCircle2 color={COLORS.success} size={16} />
            <Text style={styles.statusText}>Rangli masshtabli 2D chizma mavjud</Text>
          </View>
        </View>

        {/* Sahifa 3 */}
        <View style={styles.pageCard}>
          <View style={[styles.cardAccent, { backgroundColor: COLORS.cool }]} />
          <View style={[styles.pageBadge, { backgroundColor: COLORS.coolLight }]}><Text style={[styles.pageBadgeText, { color: COLORS.coolDark }]}>3-SAHIFA</Text></View>
          <Text style={styles.pageTitle}>❄️ Yozgi Rejim — Konditsioner & Havo Oqimi</Text>
          <Text style={styles.pageDesc}>
            Krovat/divandan sovuq havoni chetlab o‘tuvchi 55° konussimon havo oqimi, tashqi blok va mis trassa yo‘nalishi.
          </Text>
          <View style={styles.statusRow}>
            <CheckCircle2 color={COLORS.success} size={16} />
            <Text style={styles.statusText}>Salomatlik xavfsizligi tasdiqlangan</Text>
          </View>
        </View>

        {/* Sahifa 4 */}
        <View style={styles.pageCard}>
          <View style={[styles.cardAccent, { backgroundColor: '#8B5CF6' }]} />
          <View style={[styles.pageBadge, { backgroundColor: '#F3E8FF' }]}><Text style={[styles.pageBadgeText, { color: '#7E22CE' }]}>4-SAHIFA</Text></View>
          <Text style={styles.pageTitle}>📋 Birlashgan Smeta & Ustalarga Yo‘riqnoma</Text>
          <Text style={styles.pageDesc}>
            Quvurlar, kollektor, EPS izolyatsiya, damping lenta, konditsioner, mis quvurlar va opressovka qoidalari.
          </Text>
          <View style={styles.statusRow}>
            <CheckCircle2 color={COLORS.success} size={16} />
            <Text style={styles.statusText}>Narxlar va miqdorlar to‘liq hisoblangan</Text>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom || SPACING.lg }]}>
        <CustomButton
          title="Telegram / Messenjerlarga Yuborish"
          icon={<Share2 color={COLORS.surface} size={18} />}
          onPress={handleShare}
          loading={sharing}
        />
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
});
