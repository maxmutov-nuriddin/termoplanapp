import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { RotateCw, Plus, Minus, Trash2, X, Move, FlipHorizontal, Edit3 } from 'lucide-react-native';
import { useCanvasStore } from '../../store/canvasStore';
import { useShallow } from 'zustand/react/shallow';
import { ElementDimensionModal } from './ElementDimensionModal';

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
    if (selectedElementType === 'interior_wall') return `🧱 Ichki Devor (${currentIntWall?.length?.toFixed(2) || '3.00'}m, ${Math.round((currentIntWall?.thicknessM || 0.12) * 100)}sm)`;
    if (selectedElementType === 'window') return `🪟 Oyna (${currentWindow?.width?.toFixed(2) || '1.40'}m)`;
    if (selectedElementType === 'door') return `🚪 Eshik (${currentDoor?.width?.toFixed(2) || '0.90'}m)`;
    if (selectedElementType === 'boiler') return '♨️ Kotyol (Qozonxona)';
    if (selectedElementType === 'manifold') return '🚰 Kollektor (KL)';
    if (selectedElementType === 'ac') return '❄️ Konditsioner';
    if (selectedElementType === 'furniture') return `🛏️ ${currentFurn?.label || 'Mebel'} (${currentFurn?.width?.toFixed(1)}x${currentFurn?.height?.toFixed(1)}m)`;
    if (selectedElementType === 'drawing_vertex') {
      const num = selectedVertexIndex !== null ? selectedVertexIndex + 1 : 1;
      return `📍 N${num} Nuqta (Chizilmoqda)`;
    }
    if (selectedElementType === 'vertex') {
      const num = selectedVertexIndex !== null ? selectedVertexIndex + 1 : 1;
      return `📍 N${num} Burchak Nuqtasi`;
    }
    return 'Element';
  };

  const getDoorDirectionLabel = () => {
    const dir = currentDoor?.openDirection || 'inside_right';
    if (dir === 'inside_right') return 'Ich O‘ng ↘';
    if (dir === 'inside_left') return 'Ich Chap ↙';
    if (dir === 'outside_right') return 'Tash O‘ng ↗';
    if (dir === 'outside_left') return 'Tash Chap ↖';
    return 'Ochilish';
  };

  const canDelete =
    selectedElementType === 'drawing_vertex' ||
    selectedElementType !== 'vertex' ||
    ((useCanvasStore.getState().roomPoints || []).length > 3);

  const hasDimensions = selectedElementType === 'window' || selectedElementType === 'door' || selectedElementType === 'furniture';

  return (
    <>
      <View style={styles.propBar}>
        <View style={styles.leftInfo}>
          <Move size={13} color="#38BDF8" />
          <Text style={styles.titleText}>{getTitle()}</Text>
        </View>

        <View style={styles.actionsGroup}>
          {/* Qo'lda aniq o'lcham yozish tugmasi */}
          {hasDimensions && (
            <TouchableOpacity style={[styles.actionBtn, styles.editDimBtn]} onPress={() => setDimensionModalVisible(true)}>
              <Edit3 size={12} color="#FFFFFF" />
              <Text style={styles.editDimBtnText}>O‘lcham</Text>
            </TouchableOpacity>
          )}

          {/* Eshikning ochilish yo'nalishini o'zgartirish (Door Swing Flip) */}
          {selectedElementType === 'door' && (
            <TouchableOpacity style={[styles.actionBtn, styles.flipBtn]} onPress={cycleDoorOpenDirection}>
              <FlipHorizontal size={12} color="#FFFFFF" />
              <Text style={styles.flipBtnText}>{getDoorDirectionLabel()}</Text>
            </TouchableOpacity>
          )}

          {/* 45° Burish (Rotate) */}
          {(selectedElementType === 'furniture' || selectedElementType === 'ac' || selectedElementType === 'window') && (
            <TouchableOpacity style={styles.actionBtn} onPress={() => rotateSelectedElement(45)}>
              <RotateCw size={12} color="#0284C7" />
              <Text style={styles.actionBtnText}>45°</Text>
            </TouchableOpacity>
          )}

          {/* O'lcham o'zgartirish (+ / -) */}
          {hasDimensions && (
            <View style={styles.stepperGroup}>
              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() => resizeSelectedElement(selectedElementType === 'door' ? -0.05 : -0.1, -0.1)}
              >
                <Minus size={12} color="#0F172A" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() => resizeSelectedElement(selectedElementType === 'door' ? 0.05 : 0.1, 0.1)}
              >
                <Plus size={12} color="#0F172A" />
              </TouchableOpacity>
            </View>
          )}

          {/* O'chirish (Delete) */}
          {canDelete && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.deleteBtn]}
              onPress={deleteSelectedElement}
            >
              <Trash2 size={13} color="#EF4444" />
            </TouchableOpacity>
          )}

          {/* Bekor qilish */}
          <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedElement(null, null)}>
            <X size={14} color="#64748B" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Aniq o'lcham yozish modali */}
      <ElementDimensionModal
        visible={dimensionModalVisible}
        onClose={() => setDimensionModalVisible(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  propBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginHorizontal: 12,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#38BDF8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  leftInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flex: 1,
  },
  titleText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  actionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingHorizontal: 7,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 3.5,
    borderWidth: 1,
    borderColor: '#334155',
  },
  actionBtnText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#38BDF8',
  },
  editDimBtn: {
    backgroundColor: '#0284C7',
    borderColor: '#0369A1',
  },
  editDimBtnText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  flipBtn: {
    backgroundColor: '#16A34A',
    borderColor: '#15803D',
  },
  flipBtnText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  stepperGroup: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 2,
    gap: 2,
  },
  stepBtn: {
    padding: 4,
  },
  deleteBtn: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    paddingHorizontal: 7,
  },
  closeBtn: {
    padding: 4,
    marginLeft: 2,
  },
});
