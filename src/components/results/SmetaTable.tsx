import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Receipt } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ISmeta } from '../../types';
import { formatCurrencyUzs, formatCurrencyUsd } from '../../utils/formatters';
import { COLORS, SHADOWS, RADIUS, SPACING } from '../../theme';

interface SmetaTableProps {
  smeta: ISmeta;
}

export const SmetaTable: React.FC<SmetaTableProps> = ({ smeta }) => {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <LinearGradient
          colors={[COLORS.primary, COLORS.primaryLight]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.iconCircle}
        >
          <Receipt color={COLORS.surface} size={18} />
        </LinearGradient>
        <Text style={styles.title}>Birlashgan Materiallar & Xarajatlar Smetasi</Text>
      </View>

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
          <Text style={styles.grandLabel}>JAMI HISOBIY BYUDJET</Text>
          <Text style={styles.grandVal}>{formatCurrencyUzs(smeta.grandTotalUzs)}</Text>
          <Text style={styles.grandUsd}>~{formatCurrencyUsd(smeta.grandTotalUsd)} (1$ = {smeta.usdExchangeRate} UZS)</Text>
        </View>
      </View>

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
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.lg,
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
  summaryBox: {
    backgroundColor: COLORS.primaryBg,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.lg,
  },
  sumRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs + 2,
  },
  sumLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  sumVal: {
    fontSize: 12.5,
    fontWeight: '700',
    color: COLORS.text,
  },
  grandTotalBox: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: SPACING.sm + 2,
    marginTop: SPACING.xs + 2,
    alignItems: 'center',
  },
  grandLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primaryDark,
    letterSpacing: 0.5,
  },
  grandVal: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.primary,
    marginTop: 2,
  },
  grandUsd: {
    fontSize: 11.5,
    color: COLORS.textSecondary,
    marginTop: 2,
    fontWeight: '500',
  },
  tableTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  table: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceAlt,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm,
  },
  th: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm + 2,
    paddingHorizontal: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  evenRow: {
    backgroundColor: COLORS.bg,
  },
  itemName: {
    fontSize: 11.5,
    fontWeight: '600',
    color: COLORS.text,
  },
  itemDesc: {
    fontSize: 9.5,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  itemQty: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  itemPrice: {
    fontSize: 11.5,
    fontWeight: '700',
    color: COLORS.text,
  },
});
