import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Flame, ShieldCheck, Layers } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { IHeatingCalculation } from '../../types';
import { COLORS, SHADOWS, RADIUS, SPACING } from '../../theme';

interface HeatingSpecCardProps {
  heating: IHeatingCalculation;
}

export const HeatingSpecCard: React.FC<HeatingSpecCardProps> = ({ heating }) => {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <LinearGradient
          colors={[COLORS.heat, COLORS.heatDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.iconCircle}
        >
          <Flame color={COLORS.surface} size={18} />
        </LinearGradient>
        <Text style={styles.title}>Qishki Isitish (Tyoply Pol) Tizimi</Text>
      </View>

      <View style={styles.grid2}>
        <View style={styles.statItem}>
          <Text style={styles.label}>Quvurlar uzunligi (+10%):</Text>
          <Text style={styles.valueWarm}>{heating.pipeLengthWithReserveM} metr</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.label}>Konturlar soni:</Text>
          <Text style={styles.value}>{heating.circuitsCount} ta (Maks 85m)</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.label}>Issiqlik yo‘qotilishi:</Text>
          <Text style={styles.value}>{heating.totalHeatLossW} W ({heating.specificHeatLossWM2} W/m²)</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.label}>Qozon quvvati:</Text>
          <Text style={styles.valueWarm}>{heating.boilerPowerKw} kW</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.infoRow}>
        <View style={styles.infoIconBoxCool}>
          <Layers size={16} color={COLORS.cool} />
        </View>
        <View style={styles.infoTextWrapper}>
          <Text style={styles.infoTitle}>Quvurlar qadami (Shag):</Text>
          <Text style={styles.infoDesc}>• Oyna osti chegara zonasi: 10 sm zichlikda</Text>
          <Text style={styles.infoDesc}>• Markaziy yashash maydoni: 15 sm (Komfort)</Text>
        </View>
      </View>

      <View style={styles.infoRow}>
        <View style={styles.infoIconBoxSuccess}>
          <ShieldCheck size={16} color={COLORS.success} />
        </View>
        <View style={styles.infoTextWrapper}>
          <Text style={styles.infoTitle}>Konstruksiya tavsiyasi:</Text>
          <Text style={styles.infoDesc}>{heating.screedDescription}</Text>
        </View>
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
  grid2: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  statItem: {
    width: '48%',
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
    marginTop: 3,
  },
  valueWarm: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.heat,
    marginTop: 3,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginVertical: SPACING.md,
  },
  infoRow: {
    flexDirection: 'row',
    gap: SPACING.sm + 2,
    marginTop: SPACING.sm,
    alignItems: 'flex-start',
  },
  infoIconBoxCool: {
    padding: 6,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.coolLight,
  },
  infoIconBoxSuccess: {
    padding: 6,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.successBg,
  },
  infoTextWrapper: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
  },
  infoDesc: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
});
