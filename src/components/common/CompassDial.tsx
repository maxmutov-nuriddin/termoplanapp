import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Circle, Line, Text as SvgText, G, Path } from 'react-native-svg';
import { RotateCw, Compass } from 'lucide-react-native';

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
        <Compass size={20} color="#0284C7" />
        <Text style={styles.title}>Dunyo Tomonlari & Quyosh Burchagi</Text>
      </View>
      <Text style={styles.subtitle}>
        Bino old fasadi qaysi tomonga qaraganligini burchak orqali belgilang (Janub/G‘arb quyoshli, Shimol sovuq).
      </Text>

      <View style={styles.dialContainer}>
        <Svg width={180} height={180} viewBox="-90 -90 180 180">
          {/* Asosiy doira */}
          <Circle cx="0" cy="0" r="75" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="2" />
          <Circle cx="0" cy="0" r="45" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />

          {/* Dunyo tomonlari harflari */}
          <SvgText x="0" y="-55" fill="#DC2626" fontSize="13" fontWeight="bold" textAnchor="middle">N (Shimol)</SvgText>
          <SvgText x="60" y="4" fill="#0284C7" fontSize="12" fontWeight="bold" textAnchor="middle">E</SvgText>
          <SvgText x="0" y="65" fill="#EA580C" fontSize="12" fontWeight="bold" textAnchor="middle">S (Janub)</SvgText>
          <SvgText x="-60" y="4" fill="#D97706" fontSize="12" fontWeight="bold" textAnchor="middle">W (G‘arb)</SvgText>

          {/* Aylantirilgan strelka */}
          <G transform={`rotate(${angle})`}>
            <Line x1="0" y1="0" x2="0" y2="-68" stroke="#DC2626" strokeWidth="4" strokeLinecap="round" />
            <Path d="M 0 -72 L -6 -60 L 6 -60 Z" fill="#DC2626" />
            <Line x1="0" y1="0" x2="0" y2="68" stroke="#64748B" strokeWidth="3" strokeLinecap="round" />
            <Circle cx="0" cy="0" r="5" fill="#0F172A" />
          </G>
        </Svg>
      </View>

      <View style={styles.controlsRow}>
        <TouchableOpacity style={styles.stepBtn} onPress={() => rotateStep(-45)}>
          <Text style={styles.stepBtnText}>-45°</Text>
        </TouchableOpacity>
        <View style={styles.angleDisplay}>
          <Text style={styles.angleText}>{angle}°</Text>
          <Text style={styles.angleSub}>Shimoldan burilish</Text>
        </View>
        <TouchableOpacity style={styles.stepBtn} onPress={() => rotateStep(45)}>
          <Text style={styles.stepBtnText}>+45°</Text>
        </TouchableOpacity>
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
    alignItems: 'center',
    marginVertical: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  dialContainer: {
    marginVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 8,
  },
  stepBtn: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  stepBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  angleDisplay: {
    alignItems: 'center',
  },
  angleText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0284C7',
  },
  angleSub: {
    fontSize: 10,
    color: '#94A3B8',
  },
});
