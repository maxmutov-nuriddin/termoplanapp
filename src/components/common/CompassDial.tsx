import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Circle, Line, Text as SvgText, G, Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { Compass } from 'lucide-react-native';
import { COLORS, SHADOWS, RADIUS, SPACING } from '../../theme';

interface CompassDialProps {
  angle: number; // 0 to 360 degrees
  onChangeAngle: (angle: number) => void;
}

export const CompassDial: React.FC<CompassDialProps> = ({ angle, onChangeAngle }) => {
  const rotateStep = (step: number) => {
    const newAngle = ((angle + step) % 360 + 360) % 360;
    onChangeAngle(newAngle);
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Compass size={20} color={COLORS.primary} />
        <Text style={styles.title}>Dunyo Tomonlari & Quyosh Burchagi</Text>
      </View>
      <Text style={styles.subtitle}>
        Bino old fasadi qaysi tomonga qaraganligini burchak orqali belgilang (Janub/G‘arb quyoshli, Shimol sovuq).
      </Text>

      <View style={styles.dialContainer}>
        <Svg width={180} height={180} viewBox="-90 -90 180 180">
          <Defs>
            <LinearGradient id="needleGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={COLORS.heat} stopOpacity="1" />
              <Stop offset="1" stopColor={COLORS.danger} stopOpacity="1" />
            </LinearGradient>
          </Defs>

          {/* Asosiy doira */}
          <Circle cx="0" cy="0" r="75" fill={COLORS.surfaceAlt} stroke={COLORS.border} strokeWidth="2" />
          <Circle cx="0" cy="0" r="45" fill={COLORS.surface} stroke={COLORS.borderLight} strokeWidth="1" />

          {/* Dunyo tomonlari harflari */}
          <SvgText x="0" y="-55" fill={COLORS.danger} fontSize="13" fontWeight="bold" textAnchor="middle">N (Shimol)</SvgText>
          <SvgText x="60" y="4" fill={COLORS.primary} fontSize="12" fontWeight="bold" textAnchor="middle">E</SvgText>
          <SvgText x="0" y="65" fill={COLORS.heat} fontSize="12" fontWeight="bold" textAnchor="middle">S (Janub)</SvgText>
          <SvgText x="-60" y="4" fill={COLORS.warning} fontSize="12" fontWeight="bold" textAnchor="middle">W (G‘arb)</SvgText>

          {/* Aylantirilgan strelka */}
          <G transform={`rotate(${angle})`}>
            <Line x1="0" y1="0" x2="0" y2="-68" stroke="url(#needleGrad)" strokeWidth="4" strokeLinecap="round" />
            <Path d="M 0 -72 L -6 -60 L 6 -60 Z" fill={COLORS.danger} />
            <Line x1="0" y1="0" x2="0" y2="68" stroke={COLORS.textMuted} strokeWidth="3" strokeLinecap="round" />
            <Circle cx="0" cy="0" r="5" fill={COLORS.text} />
          </G>
        </Svg>
      </View>

      <View style={styles.controlsRow}>
        <TouchableOpacity style={styles.stepBtn} onPress={() => rotateStep(-45)} activeOpacity={0.7}>
          <Text style={styles.stepBtnText}>-45°</Text>
        </TouchableOpacity>
        <View style={styles.angleDisplay}>
          <Text style={styles.angleText}>{angle}°</Text>
          <Text style={styles.angleSub}>Shimoldan burilish</Text>
        </View>
        <TouchableOpacity style={styles.stepBtn} onPress={() => rotateStep(45)} activeOpacity={0.7}>
          <Text style={styles.stepBtnText}>+45°</Text>
        </TouchableOpacity>
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
    alignItems: 'center',
    marginVertical: SPACING.sm,
    ...SHADOWS.card,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
    marginBottom: SPACING.md,
    alignSelf: 'flex-start',
    lineHeight: 18,
  },
  dialContainer: {
    marginVertical: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: SPACING.sm,
  },
  stepBtn: {
    backgroundColor: COLORS.surfaceAlt,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  stepBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  angleDisplay: {
    alignItems: 'center',
  },
  angleText: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.primary,
  },
  angleSub: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
});
