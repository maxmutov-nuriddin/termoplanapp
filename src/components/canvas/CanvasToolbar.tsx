import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { MousePointer2, Thermometer, Wind, Flame } from 'lucide-react-native';
import { useCanvasStore } from '../../store/canvasStore';
import { useShallow } from 'zustand/react/shallow';
import { COLORS, SHADOWS, RADIUS, SPACING } from '../../theme';

export const CanvasToolbar: React.FC = () => {
  const { selectedTool, setSelectedTool, seasonMode } = useCanvasStore(
    useShallow((s) => ({
      selectedTool: s.selectedTool,
      setSelectedTool: s.setSelectedTool,
      seasonMode: s.seasonMode,
    }))
  );

  return (
    <View style={styles.toolbarWrapper}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.toolbarContainer}>
        <TouchableOpacity
          style={[styles.toolBtn, selectedTool === 'select' && styles.toolBtnActive]}
          onPress={() => setSelectedTool('select')}
        >
          <MousePointer2 size={16} color={selectedTool === 'select' ? COLORS.primary : COLORS.textSecondary} />
          <Text style={[styles.toolText, selectedTool === 'select' && styles.toolTextActive]}>Surish</Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        {seasonMode === 'winter' ? (
          <>
            <TouchableOpacity
              style={[styles.toolBtn, selectedTool === 'manifold' && styles.toolBtnActive]}
              onPress={() => setSelectedTool('manifold')}
            >
              <Thermometer size={16} color={selectedTool === 'manifold' ? COLORS.heat : COLORS.textSecondary} />
              <Text style={[styles.toolText, selectedTool === 'manifold' && { color: COLORS.heat, fontWeight: '800' }]}>Kollektor</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.toolBtn, selectedTool === 'boiler' && styles.toolBtnActive]}
              onPress={() => setSelectedTool('boiler')}
            >
              <Flame size={16} color={selectedTool === 'boiler' ? COLORS.heat : COLORS.textSecondary} />
              <Text style={[styles.toolText, selectedTool === 'boiler' && { color: COLORS.heat, fontWeight: '800' }]}>Kotyol</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity
            style={[styles.toolBtn, selectedTool === 'ac' && styles.toolBtnActive]}
            onPress={() => setSelectedTool('ac')}
          >
            <Wind size={16} color={selectedTool === 'ac' ? COLORS.cool : COLORS.textSecondary} />
            <Text style={[styles.toolText, selectedTool === 'ac' && { color: COLORS.cool, fontWeight: '800' }]}>Konditsioner</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  toolbarWrapper: {
    backgroundColor: COLORS.surface,
    paddingVertical: 6,
    paddingHorizontal: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  toolbarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  toolBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceAlt,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    gap: 6,
  },
  toolBtnActive: {
    backgroundColor: COLORS.primaryBg,
    borderColor: COLORS.primaryLight,
  },
  toolText: {
    fontSize: 11.5,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  toolTextActive: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  divider: {
    width: 1,
    height: 20,
    backgroundColor: COLORS.border,
    marginHorizontal: 4,
  },
});
