import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CloudSun, AlertTriangle, CheckCircle2 } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ClimateRegion } from '../../types';
import { COLORS, SHADOWS, RADIUS, SPACING } from '../../theme';

interface ClimateSummaryCardProps {
  region: ClimateRegion;
  compassAngle: number;
  solarFactor?: number;
  highRiskOverheating?: boolean;
}

export const ClimateSummaryCard: React.FC<ClimateSummaryCardProps> = ({
  region,
  compassAngle,
  solarFactor = 1.15,
  highRiskOverheating = false,
}) => {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <LinearGradient
          colors={[COLORS.heatLight, COLORS.heat]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.iconCircle}
        >
          <CloudSun color={COLORS.surface} size={18} />
        </LinearGradient>
        <Text style={styles.title}>Hududiy Iqlim & Quyosh Insolyatsiyasi</Text>
      </View>

      <Text style={styles.regionName}>{region.nameUz}</Text>

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statValWarm}>{region.minWinterTemp}°C</Text>
          <Text style={styles.statLbl}>Qishki hisobiy min</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValCool}>{region.maxSummerTemp}°C</Text>
          <Text style={styles.statLbl}>Yozgi hisobiy max</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statVal}>{compassAngle}°</Text>
          <Text style={styles.statLbl}>Kompas burilishi</Text>
        </View>
      </View>

      {highRiskOverheating ? (
        <View style={styles.warningBox}>
          <AlertTriangle color={COLORS.warning} size={18} />
          <Text style={styles.warningText}>
            Janub/G‘arb fasadi kuchli qiziydi. Yozgi konditsioner quvvati +25% zaxira bilan oshirildi va qishda qizib ketmaslik uchun avtomatik servo-klapan qo‘shildi.
          </Text>
        </View>
      ) : (
        <View style={styles.successBox}>
          <CheckCircle2 color={COLORS.success} size={18} />
          <Text style={styles.successText}>
            Mo‘tadil quyosh tushishi. Tabiiy isitish va qulay mikroiqlim balansi taʼminlangan.
          </Text>
        </View>
      )}
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
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
  },
  regionName: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.coolDark,
    marginTop: SPACING.sm,
    marginBottom: SPACING.md,
  },
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  statBox: {
    flex: 1,
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm + 2,
    alignItems: 'center',
  },
  statValWarm: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.heat,
  },
  statValCool: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.cool,
  },
  statVal: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
  },
  statLbl: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
  warningBox: {
    flexDirection: 'row',
    backgroundColor: COLORS.warningBg,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    gap: SPACING.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.warning,
  },
  warningText: {
    fontSize: 11.5,
    color: COLORS.heatDark,
    flex: 1,
    lineHeight: 16,
  },
  successBox: {
    flexDirection: 'row',
    backgroundColor: COLORS.successBg,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    gap: SPACING.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.success,
  },
  successText: {
    fontSize: 11.5,
    color: COLORS.primaryDark,
    flex: 1,
    lineHeight: 16,
  },
});
