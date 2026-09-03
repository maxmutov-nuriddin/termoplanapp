import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Square, ArrowRight, MousePointer2, Refrigerator } from 'lucide-react-native';
import { useCanvasStore } from '../../store/canvasStore';
import { useShallow } from 'zustand/react/shallow';
import { COLORS, SHADOWS, RADIUS, SPACING } from '../../theme';

export const FigmaToolDock: React.FC = () => {
  const { toolMode, setToolMode } = useCanvasStore(
    useShallow((s) => ({
      toolMode: s.toolMode,
      setToolMode: s.setToolMode,
    }))
  );

  return (
    <View style={styles.dockWrapper}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dockContainer}>
        <TouchableOpacity
          style={[styles.toolBtn, toolMode === 'select' && styles.toolBtnActive]}
          onPress={() => setToolMode('select')}
        >
          <MousePointer2 size={18} color={toolMode === 'select' ? COLORS.primaryLight : COLORS.textMuted} />
          <Text style={[styles.toolText, toolMode === 'select' && styles.toolTextActive]}>Tanlash</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.toolBtn, toolMode === 'draw_room' && styles.toolBtnActive]}
          onPress={() => setToolMode('draw_room')}
        >
          <Square size={18} color={toolMode === 'draw_room' ? COLORS.primaryLight : COLORS.textMuted} />
          <Text style={[styles.toolText, toolMode === 'draw_room' && styles.toolTextActive]}>Xona</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.toolBtn, toolMode === 'draw_interior_wall' && styles.toolBtnActive]}
          onPress={() => setToolMode('draw_interior_wall')}
        >
          <ArrowRight size={18} color={toolMode === 'draw_interior_wall' ? COLORS.primaryLight : COLORS.textMuted} />
          <Text style={[styles.toolText, toolMode === 'draw_interior_wall' && styles.toolTextActive]}>To'siq</Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity
          style={[styles.toolBtn, toolMode === 'place_door' && styles.toolBtnActive]}
          onPress={() => setToolMode('place_door')}
        >
          <Square size={18} color={toolMode === 'place_door' ? COLORS.primaryLight : COLORS.textMuted} />
          <Text style={[styles.toolText, toolMode === 'place_door' && styles.toolTextActive]}>Eshik</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.toolBtn, toolMode === 'place_window' && styles.toolBtnActive]}
          onPress={() => setToolMode('place_window')}
        >
          <Square size={18} color={toolMode === 'place_window' ? COLORS.primaryLight : COLORS.textMuted} />
          <Text style={[styles.toolText, toolMode === 'place_window' && styles.toolTextActive]}>Oyna</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.toolBtn, toolMode === 'place_furniture' && styles.toolBtnActive]}
          onPress={() => setToolMode('place_furniture')}
        >
          <Refrigerator size={18} color={toolMode === 'place_furniture' ? COLORS.primaryLight : COLORS.textMuted} />
          <Text style={[styles.toolText, toolMode === 'place_furniture' && styles.toolTextActive]}>Mebel</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  dockWrapper: {
    position: 'absolute',
    bottom: SPACING.xl,
    alignSelf: 'center',
    backgroundColor: COLORS.darkSurface,
    borderRadius: RADIUS.xl,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
    ...SHADOWS.floating,
  },
  dockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  toolBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: RADIUS.md,
  },
  toolBtnActive: {
    backgroundColor: 'rgba(20, 184, 166, 0.15)', // primaryLight with opacity
  },
  toolText: {
    fontSize: 9.5,
    color: COLORS.textMuted,
    marginTop: 4,
    fontWeight: '600',
  },
  toolTextActive: {
    color: COLORS.primaryLight,
    fontWeight: '800',
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: COLORS.darkBorder,
    marginHorizontal: 4,
  },
});
