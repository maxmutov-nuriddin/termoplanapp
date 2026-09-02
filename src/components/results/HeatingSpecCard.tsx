import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Flame, ShieldCheck, Layers, Gauge } from 'lucide-react-native';
import { IHeatingCalculation } from '../../types';

interface HeatingSpecCardProps {
  heating: IHeatingCalculation;
}

export const HeatingSpecCard: React.FC<HeatingSpecCardProps> = ({ heating }) => {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Flame color="#EA580C" size={20} />
        <Text style={styles.title}>🔥 Qishki Isitish (Tyoply Pol) Tizimi</Text>
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
        <Layers size={16} color="#0284C7" />
        <View style={{ flex: 1 }}>
          <Text style={styles.infoTitle}>Quvurlar qadami (Shag):</Text>
          <Text style={styles.infoDesc}>• Oyna osti chegara zonasi: 10 sm zichlikda</Text>
          <Text style={styles.infoDesc}>• Markaziy yashash maydoni: 15 sm (Komfort)</Text>
        </View>
      </View>

      <View style={styles.infoRow}>
        <ShieldCheck size={16} color="#16A34A" />
        <View style={{ flex: 1 }}>
          <Text style={styles.infoTitle}>Konstruksiya tavsiyasi:</Text>
          <Text style={styles.infoDesc}>{heating.screedDescription}</Text>
        </View>
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
  grid2: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statItem: {
    width: '47%',
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
  valueWarm: {
    fontSize: 13,
    fontWeight: '800',
    color: '#EA580C',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 12,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
    alignItems: 'flex-start',
  },
  infoTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
  },
  infoDesc: {
    fontSize: 11,
    color: '#475569',
    marginTop: 2,
  },
});
