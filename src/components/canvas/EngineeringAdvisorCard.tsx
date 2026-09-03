import { useShallow } from 'zustand/react/shallow';
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ShieldCheck, Flame, Snowflake, Droplets, Layers, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react-native';
import { useCanvasStore, WALL_MATERIALS } from '../../store/canvasStore';
import { COLORS, SHADOWS, RADIUS, SPACING } from '../../theme';

export const EngineeringAdvisorCard: React.FC = () => {
  const { wallMaterialId, wallThicknessM } = useCanvasStore(useShallow(s => ({
      wallMaterialId: s.wallMaterialId,
      wallThicknessM: s.wallThicknessM,
    })));

  const [expandedSection, setExpandedSection] = useState<string | null>('pipes_safety');

  const currentMat = WALL_MATERIALS.find((m) => m.id === wallMaterialId) || WALL_MATERIALS[0];

  const toggleSection = (sec: string) => {
    setExpandedSection(expandedSection === sec ? null : sec);
  };

  return (
    <View style={styles.cardContainer}>
      <View style={styles.cardHeader}>
        <ShieldCheck size={20} color={COLORS.success} />
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>🧠 Muhandislik & Xavfsizlik Tavsiyalari</Text>
          <Text style={styles.cardSubtitle}>KMK 2.04.05-97 va xalqaro HVAC standartlari asosida</Text>
        </View>
      </View>

      <View style={styles.sectionItem}>
        <TouchableOpacity style={styles.sectionHeader} onPress={() => toggleSection('pipes_safety')} activeOpacity={0.7}>
          <View style={styles.secHeaderLeft}>
            <Droplets size={16} color={COLORS.cool} />
            <Text style={styles.secTitle}>🚰 Suv Quvurlari Xavfsizligi</Text>
          </View>
          {expandedSection === 'pipes_safety' ? <ChevronUp size={16} color={COLORS.textSecondary} /> : <ChevronDown size={16} color={COLORS.textSecondary} />}
        </TouchableOpacity>

        {expandedSection === 'pipes_safety' && (
          <View style={styles.sectionContent}>
            <View style={styles.alertBox}>
              <AlertTriangle size={15} color={COLORS.warning} />
              <Text style={styles.alertText}>
                Sovuq suv (XVS) quvurini pol ostida tyoply pol bilan birga olib o‘tish qatʼiyan taqiqlanadi!
              </Text>
            </View>
            <Text style={styles.contentText}>• <Text style={styles.bold}>Sababi:</Text> Tyoply pol (+45°C) sovuq suvni isitib, xavfli bakteriyalar ko‘payishiga olib keladi.</Text>
            <Text style={styles.contentText}>• <Text style={styles.bold}>Tavsiya:</Text> Ichimlik suvi quvurlari devor ichidan (shtroba qilib) olib o‘tilishi shart.</Text>
          </View>
        )}
      </View>

      <View style={styles.sectionItem}>
        <TouchableOpacity style={styles.sectionHeader} onPress={() => toggleSection('underfloor_layout')} activeOpacity={0.7}>
          <View style={styles.secHeaderLeft}>
            <Flame size={16} color={COLORS.heat} />
            <Text style={styles.secTitle}>🔥 Tyoply Pol Joylashuvi</Text>
          </View>
          {expandedSection === 'underfloor_layout' ? <ChevronUp size={16} color={COLORS.textSecondary} /> : <ChevronDown size={16} color={COLORS.textSecondary} />}
        </TouchableOpacity>

        {expandedSection === 'underfloor_layout' && (
          <View style={styles.sectionContent}>
            <Text style={styles.contentText}>• <Text style={styles.bold}>Chegara zonasi (Oyna tagi):</Text> Issiqlik yo‘qotilishini oldini olish uchun 15 sm zichlikda.</Text>
            <Text style={styles.contentText}>• <Text style={styles.bold}>Asosiy zona:</Text> Xonaning o‘rtasida qulay +24°C bo‘lishi uchun 25-30 sm qadam.</Text>
          </View>
        )}
      </View>

      <View style={styles.sectionItem}>
        <TouchableOpacity style={styles.sectionHeader} onPress={() => toggleSection('ac_placement')} activeOpacity={0.7}>
          <View style={styles.secHeaderLeft}>
            <Snowflake size={16} color={COLORS.cool} />
            <Text style={styles.secTitle}>❄️ Konditsionerni Joylashtirish</Text>
          </View>
          {expandedSection === 'ac_placement' ? <ChevronUp size={16} color={COLORS.textSecondary} /> : <ChevronDown size={16} color={COLORS.textSecondary} />}
        </TouchableOpacity>

        {expandedSection === 'ac_placement' && (
          <View style={styles.sectionContent}>
            <Text style={styles.contentText}>• <Text style={styles.bold}>Optimal joy:</Text> Freon trassasi qisqa (3m gacha) bo‘lishi uchun tashqi devor yaqiniga.</Text>
            <Text style={styles.contentText}>• <Text style={styles.bold}>Xavfsizlik:</Text> Havo oqimi to‘g‘ridan-to‘g‘ri insonlarga emas, balki xona aylanmasiga yo‘naltirilishi lozim.</Text>
          </View>
        )}
      </View>

      <View style={styles.sectionItem}>
        <TouchableOpacity style={styles.sectionHeader} onPress={() => toggleSection('wall_insulation')} activeOpacity={0.7}>
          <View style={styles.secHeaderLeft}>
            <Layers size={16} color={COLORS.primary} />
            <Text style={styles.secTitle}>🧱 Devor ({currentMat.name})</Text>
          </View>
          {expandedSection === 'wall_insulation' ? <ChevronUp size={16} color={COLORS.textSecondary} /> : <ChevronDown size={16} color={COLORS.textSecondary} />}
        </TouchableOpacity>

        {expandedSection === 'wall_insulation' && (
          <View style={styles.sectionContent}>
            <Text style={styles.contentText}>• <Text style={styles.bold}>Material:</Text> {currentMat.name} ({wallThicknessM * 100} sm, λ = {currentMat.conductivity} W/m·K).</Text>
            <Text style={styles.contentText}>• <Text style={styles.bold}>Samaradorlik:</Text> Shu qalinlikda energiya sarfi 35% gacha tejalishi kutilmoqda.</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginTop: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
  },
  cardSubtitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  sectionItem: {
    marginTop: SPACING.sm,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  secHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  secTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
  },
  sectionContent: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    gap: 6,
    paddingTop: 8,
  },
  alertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.warningBg,
    borderRadius: RADIUS.sm,
    padding: 10,
    gap: 8,
    marginBottom: 6,
  },
  alertText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.warning,
    flex: 1,
    lineHeight: 16,
  },
  contentText: {
    fontSize: 11.5,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
  bold: {
    fontWeight: '700',
    color: COLORS.text,
  },
});
