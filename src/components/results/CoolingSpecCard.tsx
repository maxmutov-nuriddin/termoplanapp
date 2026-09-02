import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Snowflake, CheckCircle2, HeartPulse, Compass } from 'lucide-react-native';
import { ICoolingCalculation } from '../../types';

interface CoolingSpecCardProps {
  cooling: ICoolingCalculation;
}

export const CoolingSpecCard: React.FC<CoolingSpecCardProps> = ({ cooling }) => {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Snowflake color="#0284C7" size={20} />
        <Text style={styles.title}>❄️ Yozgi Sovutish & Smart AC Tanlovi</Text>
      </View>

      <View style={styles.highlightBox}>
        <Text style={styles.hlTitle}>Tavsiya etilgan Konditsioner:</Text>
        <Text style={styles.hlBtu}>{cooling.recommendedBtu.toLocaleString()} BTU ({cooling.recommendedKw} kW)</Text>
        <Text style={styles.hlSub}>{cooling.recommendedModel}</Text>
      </View>

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
          <HeartPulse color="#15803D" size={16} />
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
    marginBottom: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  highlightBox: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  hlTitle: {
    fontSize: 11,
    color: '#0369A1',
    fontWeight: '600',
  },
  hlBtu: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0284C7',
    marginTop: 2,
  },
  hlSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  grid2: {
    flexDirection: 'row',
    gap: 12,
  },
  statItem: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  label: {
    fontSize: 10.5,
    color: '#64748B',
  },
  value: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 2,
  },
  valueCool: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0284C7',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 12,
  },
  safetyBox: {
    backgroundColor: '#F0FDF4',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  safetyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  safetyTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#166534',
  },
  safetyDesc: {
    fontSize: 11,
    color: '#14532D',
    marginTop: 3,
    lineHeight: 16,
  },
});
