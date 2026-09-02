import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Receipt, DollarSign } from 'lucide-react-native';
import { ISmeta } from '../../types';
import { formatCurrencyUzs, formatCurrencyUsd } from '../../utils/formatters';

interface SmetaTableProps {
  smeta: ISmeta;
}

export const SmetaTable: React.FC<SmetaTableProps> = ({ smeta }) => {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Receipt color="#7E22CE" size={20} />
        <Text style={styles.title}>📋 Birlashgan Materiallar & Xarajatlar Smetasi</Text>
      </View>

      {/* Summary Totals */}
      <View style={styles.summaryBox}>
        <View style={styles.sumRow}>
          <Text style={styles.sumLabel}>Qishki isitish materiallari:</Text>
          <Text style={styles.sumVal}>{formatCurrencyUzs(smeta.totalHeatingCostUzs)}</Text>
        </View>
        <View style={styles.sumRow}>
          <Text style={styles.sumLabel}>Yozgi sovutish (AC) jihozlari:</Text>
          <Text style={styles.sumVal}>{formatCurrencyUzs(smeta.totalCoolingCostUzs)}</Text>
        </View>
        <View style={styles.sumRow}>
          <Text style={styles.sumLabel}>Montaj & O‘rnatish xizmati:</Text>
          <Text style={styles.sumVal}>{formatCurrencyUzs(smeta.totalInstallationCostUzs)}</Text>
        </View>

        <View style={styles.grandTotalBox}>
          <Text style={styles.grandLabel}>JAMI HISOBIY BYUDJET:</Text>
          <Text style={styles.grandVal}>{formatCurrencyUzs(smeta.grandTotalUzs)}</Text>
          <Text style={styles.grandUsd}>~{formatCurrencyUsd(smeta.grandTotalUsd)} (1$ = {smeta.usdExchangeRate} UZS)</Text>
        </View>
      </View>

      {/* Itemized Table */}
      <Text style={styles.tableTitle}>Batafsil Spetsifikatsiya:</Text>
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.th, { flex: 2 }]}>Nomi</Text>
          <Text style={[styles.th, { flex: 1, textAlign: 'center' }]}>Miqdori</Text>
          <Text style={[styles.th, { flex: 1.2, textAlign: 'right' }]}>Jami (UZS)</Text>
        </View>

        {smeta.items?.map((item, idx) => (
          <View key={item.id || idx} style={[styles.tableRow, idx % 2 === 1 && styles.evenRow]}>
            <View style={{ flex: 2 }}>
              <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
              {item.description ? <Text style={styles.itemDesc} numberOfLines={1}>{item.description}</Text> : null}
            </View>
            <Text style={[styles.itemQty, { flex: 1, textAlign: 'center' }]}>
              {item.quantity} {item.unit}
            </Text>
            <Text style={[styles.itemPrice, { flex: 1.2, textAlign: 'right' }]}>
              {formatCurrencyUzs(item.totalPriceUzs)}
            </Text>
          </View>
        ))}
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
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  summaryBox: {
    backgroundColor: '#FAF5FF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E9D5FF',
    marginBottom: 16,
  },
  sumRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  sumLabel: {
    fontSize: 11.5,
    color: '#6B21A8',
  },
  sumVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4C1D95',
  },
  grandTotalBox: {
    borderTopWidth: 1,
    borderTopColor: '#DDD6FE',
    paddingTop: 8,
    marginTop: 6,
    alignItems: 'center',
  },
  grandLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6B21A8',
  },
  grandVal: {
    fontSize: 20,
    fontWeight: '900',
    color: '#7E22CE',
    marginTop: 2,
  },
  grandUsd: {
    fontSize: 11,
    color: '#9333EA',
    marginTop: 2,
  },
  tableTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  table: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  th: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#475569',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  evenRow: {
    backgroundColor: '#F8FAFC',
  },
  itemName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1E293B',
  },
  itemDesc: {
    fontSize: 9,
    color: '#94A3B8',
    marginTop: 1,
  },
  itemQty: {
    fontSize: 11,
    color: '#475569',
  },
  itemPrice: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F172A',
  },
});
