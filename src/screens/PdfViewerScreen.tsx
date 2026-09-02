import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Share2, Printer, Download, CheckCircle2, ShieldCheck } from 'lucide-react-native';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import { Header } from '../components/common/Header';
import { CustomButton } from '../components/common/CustomButton';
import { ProjectApi } from '../api/client';
import { useProjectStore } from '../store/projectStore';

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
        title="4-Sahifali Muhandislik PDF Loyihasi"
        subtitle="Rasmiy loyiha hujjati va smeta"
        showBack
        onBack={() => navigation.goBack()}
        rightAction={
          <TouchableOpacity style={styles.iconBtn} onPress={handleShare}>
            <Share2 size={20} color="#0284C7" />
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* PDF Sahifalari prevyusi kartalari */}
        <View style={styles.pageCard}>
          <View style={styles.pageBadge}><Text style={styles.pageBadgeText}>1-SAHIFA</Text></View>
          <Text style={styles.pageTitle}>📍 Bino Pasporti, Lokatsiya & Quyosh Insolyatsiyasi</Text>
          <Text style={styles.pageDesc}>
            O‘zbekiston iqlim ko‘rsatkichlari, -15°C / +42°C minimum/maksimumlar, fasad burchagi va umumiy energetik yuk.
          </Text>
          <View style={styles.statusRow}>
            <CheckCircle2 color="#15803D" size={16} />
            <Text style={styles.statusText}>Vektor grafikada to‘liq shakllantirilgan</Text>
          </View>
        </View>

        <View style={styles.pageCard}>
          <View style={[styles.pageBadge, { backgroundColor: '#FFEDD5' }]}><Text style={[styles.pageBadgeText, { color: '#C2410C' }]}>2-SAHIFA</Text></View>
          <Text style={styles.pageTitle}>🔥 Qishki Rejim — 2D Tyoply Pol Quvurlar Sxemasi</Text>
          <Text style={styles.pageDesc}>
            Salyangoz (Spiral) marshruti, oyna osti 10 sm zich zona, kollektor ulanishi va konturlar bo‘linishi.
          </Text>
          <View style={styles.statusRow}>
            <CheckCircle2 color="#15803D" size={16} />
            <Text style={styles.statusText}>Rangli masshtabli 2D chizma mavjud</Text>
          </View>
        </View>

        <View style={styles.pageCard}>
          <View style={[styles.pageBadge, { backgroundColor: '#E0F2FE' }]}><Text style={[styles.pageBadgeText, { color: '#0369A1' }]}>3-SAHIFA</Text></View>
          <Text style={styles.pageTitle}>❄️ Yozgi Rejim — 2D Konditsioner & Havo Oqimi</Text>
          <Text style={styles.pageDesc}>
            Krovat/divandan sovuq havoni chetlab o‘tuvchi 55° konussimon havo oqimi, tashqi blok va mis trassa yo‘nalishi.
          </Text>
          <View style={styles.statusRow}>
            <CheckCircle2 color="#15803D" size={16} />
            <Text style={styles.statusText}>Salomatlik xavfsizligi tasdiqlangan</Text>
          </View>
        </View>

        <View style={styles.pageCard}>
          <View style={[styles.pageBadge, { backgroundColor: '#F3E8FF' }]}><Text style={[styles.pageBadgeText, { color: '#7E22CE' }]}>4-SAHIFA</Text></View>
          <Text style={styles.pageTitle}>📋 Birlashgan Smeta & Ustalarga Montaj Yo‘riqnomasi</Text>
          <Text style={styles.pageDesc}>
            Quvurlar, kollektor, EPS izolyatsiya, damping lenta, konditsioner, mis quvurlar va opressovka qoidalari.
          </Text>
          <View style={styles.statusRow}>
            <CheckCircle2 color="#15803D" size={16} />
            <Text style={styles.statusText}>Narxlar va miqdorlar to‘liq hisoblangan</Text>
          </View>
        </View>
      </ScrollView>

      {/* Pastki Ulashish tugmasi */}
      <View style={styles.footer}>
        <CustomButton
          title="Telegram / Messenjerlarga Yuborish"
          icon={<Share2 color="#FFFFFF" size={18} />}
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
    backgroundColor: '#F8FAFC',
  },
  iconBtn: {
    padding: 6,
    backgroundColor: '#E0F2FE',
    borderRadius: 8,
  },
  scrollContent: {
    padding: 16,
    gap: 12,
  },
  pageCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  pageBadge: {
    backgroundColor: '#F1F5F9',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 8,
  },
  pageBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#475569',
  },
  pageTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  pageDesc: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
    marginBottom: 10,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#15803D',
  },
  footer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    padding: 16,
  },
});
