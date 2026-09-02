import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Sun, CloudSun, AlertTriangle, CheckCircle2 } from 'lucide-react-native';
import { ClimateRegion } from '../../types';

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
        <CloudSun color="#EA580C" size={20} />
        <Text style={styles.title}>📍 Hududiy Iqlim & Quyosh Insolyatsiyasi</Text>
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
          <AlertTriangle color="#B45309" size={16} />
          <Text style={styles.warningText}>
            Janub/G‘arb fasadi kuchli qiziydi. Yozgi konditsioner quvvati +25% zaxira bilan oshirildi va qishda qizib ketmaslik uchun avtomatik servo-klapan qo‘shildi.
          </Text>
        </View>
      ) : (
        <View style={styles.successBox}>
          <CheckCircle2 color="#15803D" size={16} />
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
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  regionName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0284C7',
    marginTop: 6,
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  statValWarm: {
    fontSize: 16,
    fontWeight: '800',
    color: '#EA580C',
  },
  statValCool: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0284C7',
  },
  statVal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#334155',
  },
  statLbl: {
    fontSize: 9.5,
    color: '#64748B',
    marginTop: 2,
    textAlign: 'center',
  },
  warningBox: {
    flexDirection: 'row',
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    padding: 10,
    gap: 8,
    alignItems: 'center',
  },
  warningText: {
    fontSize: 11,
    color: '#92400E',
    flex: 1,
    lineHeight: 15,
  },
  successBox: {
    flexDirection: 'row',
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    padding: 10,
    gap: 8,
    alignItems: 'center',
  },
  successText: {
    fontSize: 11,
    color: '#166534',
    flex: 1,
    lineHeight: 15,
  },
});
