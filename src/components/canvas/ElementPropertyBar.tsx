import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { RotateCw, Plus, Minus, Trash2, X, Move, FlipHorizontal, Edit3 } from 'lucide-react-native';
import { useCanvasStore } from '../../store/canvasStore';
import { useShallow } from 'zustand/react/shallow';
import { ElementDimensionModal } from './ElementDimensionModal';
import { COLORS, SHADOWS, RADIUS, SPACING } from '../../theme';

export const ElementPropertyBar: React.FC = () => {
  const {
    selectedElementId,
    selectedElementType,
    selectedVertexIndex,
    rotateSelectedElement,
    cycleDoorOpenDirection,
    resizeSelectedElement,
    deleteSelectedElement,
    setSelectedElement,
  } = useCanvasStore(
    useShallow((s) => ({
      selectedElementId: s.selectedElementId,
      selectedElementType: s.selectedElementType,
      selectedVertexIndex: s.selectedVertexIndex,
      rotateSelectedElement: s.rotateSelectedElement,
      cycleDoorOpenDirection: s.cycleDoorOpenDirection,
      resizeSelectedElement: s.resizeSelectedElement,
      deleteSelectedElement: s.deleteSelectedElement,
      setSelectedElement: s.setSelectedElement,
    }))
  );

  const [dimensionModalVisible, setDimensionModalVisible] = useState(false);

  if (!selectedElementId) return null;

  const state = useCanvasStore.getState();
  const currentWindow = selectedElementType === 'window' ? (state.windows || []).find((w) => w.id === selectedElementId) : null;
  const currentDoor = selectedElementType === 'door' ? (state.doors || []).find((d) => d.id === selectedElementId) : null;
  const currentFurn = selectedElementType === 'furniture' ? (state.furniture || []).find((f) => f.id === selectedElementId) : null;
  const currentIntWall = selectedElementType === 'interior_wall' ? (state.interiorWalls || []).find((w) => w.id === selectedElementId) : null;

  const getTitle = () => {
    if (selectedElementType === 'interior_wall') return `🧱 Devor (${currentIntWall?.length?.toFixed(2) || '3.00'}m)`;
    if (selectedElementType === 'window') return `🪟 Oyna (${currentWindow?.width?.toFixed(2) || '1.40'}m)`;
    if (selectedElementType === 'door') return `🚪 Eshik (${currentDoor?.width?.toFixed(2) || '0.90'}m)`;
    if (selectedElementType === 'boiler') return '♨️ Kotyol';
    if (selectedElementType === 'manifold') return '🚰 Kollektor';
    if (selectedElementType === 'ac') return '❄️ Konditsioner';
    if (selectedElementType === 'furniture') return `🛏️ ${currentFurn?.label || 'Mebel'}`;
    if (selectedElementType === 'drawing_vertex') {
      const num = selectedVertexIndex !== null ? selectedVertexIndex + 1 : 1;
      return `📍 Nuqta N${num}`;
    }
    if (selectedElementType === 'vertex') {
      const num = selectedVertexIndex !== null ? selectedVertexIndex + 1 : 1;
      return `📍 Burchak N${num}`;
    }
    return 'Element';
  };

  const getDoorDirectionLabel = () => {
    const dir = currentDoor?.openDirection || 'inside_right';
    if (dir === 'inside_right') return 'Ich O‘ng';
    if (dir === 'inside_left') return 'Ich Chap';
    if (dir === 'outside_right') return 'Tash O‘ng';
    if (dir === 'outside_left') return 'Tash Chap';
    return 'Ochilish';
  };

  const canDelete =
    selectedElementType === 'drawing_vertex' ||
    selectedElementType !== 'vertex' ||
    ((useCanvasStore.getState().roomPoints || []).length > 3);

  const hasDimensions = selectedElementType === 'window' || selectedElementType === 'door' || selectedElementType === 'furniture';

  return (
    <>
      <View style={styles.propBarWrapper} pointerEvents="box-none">
        <View style={styles.propBar}>
          <View style={styles.leftInfo}>
            <Move size={14} color={COLORS.primaryLight} />
            <Text style={styles.titleText} numberOfLines={1}>{getTitle()}</Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.actionsScroll}
            contentContainerStyle={styles.actionsGroup}
          >
            {hasDimensions && (
              <TouchableOpacity style={[styles.actionBtn, styles.editDimBtn]} onPress={() => setDimensionModalVisible(true)}>
                <Edit3 size={12} color={COLORS.surface} />
                <Text style={styles.editDimBtnText}>O‘lcham</Text>
              </TouchableOpacity>
            )}

            {selectedElementType === 'door' && (
              <TouchableOpacity style={[styles.actionBtn, styles.flipBtn]} onPress={cycleDoorOpenDirection}>
                <FlipHorizontal size={12} color={COLORS.surface} />
                <Text style={styles.flipBtnText}>{getDoorDirectionLabel()}</Text>
              </TouchableOpacity>
            )}

            {(selectedElementType === 'furniture' || selectedElementType === 'ac' || selectedElementType === 'window') && (
              <TouchableOpacity style={styles.actionBtn} onPress={() => rotateSelectedElement(45)}>
                <RotateCw size={12} color={COLORS.primaryLight} />
                <Text style={styles.actionBtnText}>45°</Text>
              </TouchableOpacity>
            )}

            {hasDimensions && (
              <View style={styles.stepperGroup}>
                <TouchableOpacity
                  style={styles.stepBtn}
                  onPress={() => resizeSelectedElement(selectedElementType === 'door' ? -0.05 : -0.1, -0.1)}
                >
                  <Minus size={14} color={COLORS.surface} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.stepBtn}
                  onPress={() => resizeSelectedElement(selectedElementType === 'door' ? 0.05 : 0.1, 0.1)}
                >
                  <Plus size={14} color={COLORS.surface} />
                </TouchableOpacity>
              </View>
            )}

            {canDelete && (
              <TouchableOpacity
                style={[styles.actionBtn, styles.deleteBtn]}
                onPress={deleteSelectedElement}
              >
                <Trash2 size={13} color={COLORS.danger} />
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedElement(null, null)}>
              <X size={16} color={COLORS.textMuted} />
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>

      <ElementDimensionModal
        visible={dimensionModalVisible}
        onClose={() => setDimensionModalVisible(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  propBarWrapper: {
    alignSelf: 'center',
    width: '100%',
    alignItems: 'center',
    marginBottom: 8,
  },
  propBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0F172A',
    borderRadius: RADIUS.xl,
    paddingHorizontal: SPACING.md,
    paddingVertical: 7,
    width: '92%',
    maxWidth: 440,
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.8)',
    ...SHADOWS.floating,
    elevation: 8,
  },
  leftInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginRight: 6,
    flexShrink: 0,
  },
  actionsScroll: {
    flexGrow: 0,
    flexShrink: 1,
  },
  titleText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.surface,
  },
  actionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.dark,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
    gap: 4,
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primaryLight,
  },
  editDimBtn: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primaryLight,
  },
  editDimBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.surface,
  },
  flipBtn: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success,
  },
  flipBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.surface,
  },
  stepperGroup: {
    flexDirection: 'row',
    backgroundColor: COLORS.dark,
    borderRadius: RADIUS.sm,
    padding: 2,
    gap: 2,
    borderWidth: 1,
    borderColor: COLORS.darkBorder,
  },
  stepBtn: {
    padding: 6,
  },
  deleteBtn: {
    backgroundColor: 'rgba(220, 38, 38, 0.2)',
    borderColor: COLORS.danger,
    paddingHorizontal: 8,
  },
  closeBtn: {
    padding: 4,
    marginLeft: 4,
  },
});
