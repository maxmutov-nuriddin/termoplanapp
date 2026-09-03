import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Flame, Snowflake } from 'lucide-react-native';
import { SeasonMode } from '../../store/canvasStore';
import { COLORS, SHADOWS, RADIUS } from '../../theme';

interface ModeSwitchProps {
  mode: SeasonMode;
  onChange: (mode: SeasonMode) => void;
}

export const ModeSwitch: React.FC<ModeSwitchProps> = ({ mode, onChange }) => {
  const isWinter = mode === 'winter';

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.tabWrapper}
        onPress={() => onChange('winter')}
        activeOpacity={0.9}
      >
        <View style={[styles.tab, isWinter && styles.activeTab]}>
          <Flame size={15} color={isWinter ? COLORS.heat : COLORS.textMuted} />
          <Text style={[styles.tabText, isWinter && styles.activeTabText]}>Qishki Rejim</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.tabWrapper}
        onPress={() => onChange('summer')}
        activeOpacity={0.9}
      >
        <View style={[styles.tab, !isWinter && styles.activeTab]}>
          <Snowflake size={15} color={!isWinter ? COLORS.cool : COLORS.textMuted} />
          <Text style={[styles.tabText, !isWinter && styles.activeTabText]}>Yozgi Rejim</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: RADIUS.pill,
    padding: 3,
  },
  tabWrapper: {
    flex: 1,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: RADIUS.pill,
    gap: 6,
    backgroundColor: 'transparent',
  },
  activeTab: {
    backgroundColor: COLORS.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  activeTabText: {
    fontWeight: '700',
    color: COLORS.text,
  },
});
