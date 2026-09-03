import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Snowflake, HeartPulse } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ICoolingCalculation } from '../../types';
import { COLORS, SHADOWS, RADIUS, SPACING } from '../../theme';

interface CoolingSpecCardProps {
  cooling: ICoolingCalculation;
}

export const CoolingSpecCard: React.FC<CoolingSpecCardProps> = ({ cooling }) => {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <LinearGradient
          colors={[COLORS.cool, COLORS.coolDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.iconCircle}
        >
          <Snowflake color={COLORS.surface} size={18} />
        </LinearGradient>
        <Text style={styles.title}>Yozgi Sovutish & Smart AC Tanlovi</Text>
      </View>

      <LinearGradient
        colors={[COLORS.coolLight, COLORS.bg]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.highlightBox}
      >
        <Text style={styles.hlTitle}>Tavsiya etilgan Konditsioner:</Text>
        <Text style={styles.hlBtu}>{cooling.recommendedBtu.toLocaleString()} BTU ({cooling.recommendedKw} kW)</Text>
        <Text style={styles.hlSub}>{cooling.recommendedModel}</Text>
      </LinearGradient>

      <View style={styles.grid2}>
        <View style={styles.statItem}>
          <Text style={styles.label}>Sovutish yuki:</Text>
          <Text style={styles.valueCool}>{cooling.totalCoolingLoadW} W</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.label}>Mis trassa uzunligi:</Text>
          <Text style={styles.value}>~{cooling.copperRouteLengthM} metr</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.safetyBox}>
        <View style={styles.safetyHeader}>
          <HeartPulse color={COLORS.success} size={16} />
          <Text style={styles.safetyTitle}>Salomatlik & Xavfsiz Joylashuv:</Text>
        </View>
        <Text style={styles.safetyDesc}>
          • {cooling.directBlowingAvoided ? '✅ Krovat/divanga to‘g‘ridan-to‘g‘ri sovuq havo urilmaydi.' : '⚠️ Diqqat: Mebel ustiga havo tushmasligi uchun parda burchagi sozlandi.'}
        </Text>
        {cooling.safetyNotes?.map((n, i) => (
          <Text key={i} style={styles.safetyDesc}>• {n}</Text>
        ))}
        <Text style={styles.safetyDesc}>• 55° burchakda xona diagonali bo‘ylab aylanish taʼminlandi.</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
    ...SHADOWS.card,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
  },
  highlightBox: {
    borderWidth: 1,
    borderColor: COLORS.coolLight,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  hlTitle: {
    fontSize: 11.5,
    color: COLORS.coolDark,
    fontWeight: '600',
  },
  hlBtu: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.cool,
    marginTop: 2,
  },
  hlSub: {
    fontSize: 11.5,
    color: COLORS.textSecondary,
    marginTop: 3,
    fontWeight: '500',
  },
  grid2: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  statItem: {
    flex: 1,
    backgroundColor: COLORS.bg,
    padding: SPACING.sm + 2,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  label: {
    fontSize: 10.5,
    color: COLORS.textSecondary,
  },
  value: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 2,
  },
  valueCool: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.cool,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginVertical: SPACING.md,
  },
  safetyBox: {
    backgroundColor: COLORS.successBg,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.success,
  },
  safetyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs + 2,
    marginBottom: SPACING.xs + 2,
  },
  safetyTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  safetyDesc: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 3,
    lineHeight: 16,
  },
});
