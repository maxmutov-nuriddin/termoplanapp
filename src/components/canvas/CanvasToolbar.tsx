import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { MousePointer2, Thermometer, Wind } from 'lucide-react-native';
import { useCanvasStore } from '../../store/canvasStore';
import { useShallow } from 'zustand/react/shallow';
import { COLORS, SHADOWS, RADIUS, SPACING } from '../../theme';

export const CanvasToolbar: React.FC = () => {
  const { toolMode, setToolMode, seasonMode } = useCanvasStore(
    useShallow((s) => ({
      toolMode: s.toolMode,
      setToolMode: s.setToolMode,
      seasonMode: s.seasonMode,
    }))
  );

  return (
    <View style={styles.toolbarWrapper}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.toolbarContainer}>
        <TouchableOpacity
          style={[styles.toolBtn, toolMode === 'select' && styles.toolBtnActive]}
          onPress={() => setToolMode('select')}
        >
          <MousePointer2 size={16} color={toolMode === 'select' ? COLORS.primary : COLORS.textSecondary} />
          <Text style={[styles.toolText, toolMode === 'select' && styles.toolTextActive]}>Surish</Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        {seasonMode === 'winter' ? (
          <>
            <TouchableOpacity
              style={[styles.toolBtn, toolMode === 'place_manifold' && styles.toolBtnActive]}
              onPress={() => setToolMode('place_manifold')}
            >
              <Thermometer size={16} color={toolMode === 'place_manifold' ? COLORS.heat : COLORS.textSecondary} />
              <Text style={[styles.toolText, toolMode === 'place_manifold' && { color: COLORS.heat, fontWeight: '800' }]}>Kollektor</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.toolBtn, toolMode === 'place_boiler' && styles.toolBtnActive]}
              onPress={() => setToolMode('place_boiler')}
            >
              <Flame size={16} color={toolMode === 'place_boiler' ? COLORS.heat : COLORS.textSecondary} />
              <Text style={[styles.toolText, toolMode === 'place_boiler' && { color: COLORS.heat, fontWeight: '800' }]}>Kotyol</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity
            style={[styles.toolBtn, toolMode === 'place_ac' && styles.toolBtnActive]}
            onPress={() => setToolMode('place_ac')}
          >
            <Wind size={16} color={toolMode === 'place_ac' ? COLORS.cool : COLORS.textSecondary} />
            <Text style={[styles.toolText, toolMode === 'place_ac' && { color: COLORS.cool, fontWeight: '800' }]}>Konditsioner</Text>
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
