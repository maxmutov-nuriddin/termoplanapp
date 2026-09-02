import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Flame, Snowflake } from 'lucide-react-native';
import { SeasonMode } from '../../store/canvasStore';

interface ModeSwitchProps {
  mode: SeasonMode;
  onChange: (mode: SeasonMode) => void;
}

export const ModeSwitch: React.FC<ModeSwitchProps> = ({ mode, onChange }) => {
  const isWinter = mode === 'winter';

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.tab, isWinter && styles.winterActiveTab]}
        onPress={() => onChange('winter')}
        activeOpacity={0.8}
      >
        <Flame size={16} color={isWinter ? '#FFFFFF' : '#EA580C'} />
        <Text style={[styles.tabText, isWinter && styles.activeTabText]}>🔥 Qish (Isitish)</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, !isWinter && styles.summerActiveTab]}
        onPress={() => onChange('summer')}
        activeOpacity={0.8}
      >
        <Snowflake size={16} color={!isWinter ? '#FFFFFF' : '#0284C7'} />
        <Text style={[styles.tabText, !isWinter && styles.activeTabText]}>❄️ Yoz (Sovutish)</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  winterActiveTab: {
    backgroundColor: '#EA580C',
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  summerActiveTab: {
    backgroundColor: '#0284C7',
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
});
