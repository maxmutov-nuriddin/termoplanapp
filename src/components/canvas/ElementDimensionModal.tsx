import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { Check, X, Maximize2 } from 'lucide-react-native';
import { useCanvasStore } from '../../store/canvasStore';
import { useShallow } from 'zustand/react/shallow';
import { parseLocalizedFloat, distanceBetweenPoints } from '../../utils/geometry';

interface ElementDimensionModalProps {
  visible: boolean;
  onClose: () => void;
}

export const ElementDimensionModal: React.FC<ElementDimensionModalProps> = ({ visible, onClose }) => {
  const {
    selectedElementId,
    selectedElementType,
    selectedWallIndex,
    roomPoints,
    windows,
    doors,
    furniture,
    updateWallLength,
    setExactElementDimension
  } = useCanvasStore(useShallow(s => ({
      selectedElementId: s.selectedElementId,
      selectedElementType: s.selectedElementType,
      selectedWallIndex: s.selectedWallIndex,
      roomPoints: s.roomPoints,
      windows: s.windows,
      doors: s.doors,
      furniture: s.furniture,
      updateWallLength: s.updateWallLength,
      setExactElementDimension: s.setExactElementDimension,
    })));

  const [inputWidth, setInputWidth] = useState('');
  const [inputHeight, setInputHeight] = useState('');

  const currentWindow = selectedElementType === 'window' ? windows.find((w) => w.id === selectedElementId) : null;
  const currentDoor = selectedElementType === 'door' ? doors.find((d) => d.id === selectedElementId) : null;
  const currentFurn = selectedElementType === 'furniture' ? furniture.find((f) => f.id === selectedElementId) : null;

  useEffect(() => {
    if (selectedElementType === 'window' && currentWindow) {
      setInputWidth(Number(currentWindow.width || 1.4).toFixed(2));
      setInputHeight(Number(currentWindow.height || 1.5).toFixed(2));
    } else if (selectedElementType === 'door' && currentDoor) {
      setInputWidth(Number(currentDoor.width || 0.9).toFixed(2));
    } else if (selectedElementType === 'furniture' && currentFurn) {
      setInputWidth(Number(currentFurn.width || 2.0).toFixed(2));
      setInputHeight(Number(currentFurn.height || 1.8).toFixed(2));
    } else if (selectedWallIndex !== null && roomPoints && roomPoints.length >= 3) {
      const nextIdx = (selectedWallIndex + 1) % roomPoints.length;
      const curLen = distanceBetweenPoints(roomPoints[selectedWallIndex], roomPoints[nextIdx]);
      setInputWidth((curLen || 4.0).toFixed(2));
    }
  }, [visible, selectedElementId, selectedElementType, selectedWallIndex]);

  if (!visible) return null;

  const handleSave = () => {
    const parsedW = parseLocalizedFloat(inputWidth);
    const parsedH = parseLocalizedFloat(inputHeight);

    if (selectedWallIndex !== null && parsedW >= 0.4 && parsedW <= 40) {
      updateWallLength(selectedWallIndex, parsedW);
    } else if (parsedW >= 0.3 && parsedW <= 30) {
      setExactElementDimension(parsedW, parsedH > 0 ? parsedH : undefined);
    }
    onClose();
  };

  const getTitle = () => {
    if (selectedWallIndex !== null) return `🧱 ${selectedWallIndex + 1}-Devor Uzunligi`;
    if (selectedElementType === 'window') return '🪟 Oyna O‘lchamini Kiritish';
    if (selectedElementType === 'door') return '🚪 Eshik O‘lchamini Kiritish';
    if (selectedElementType === 'furniture') return `🛏️ ${currentFurn?.label || 'Mebel'} O‘lchami`;
    return '📏 O‘lchamni Kiritish';
  };

  const windowPresets = [0.8, 1.0, 1.2, 1.4, 1.6, 1.8, 2.0, 2.4];
  const doorPresets = [0.7, 0.8, 0.9, 1.0, 1.2];
  const wallPresets = [2.5, 3.0, 3.5, 4.0, 4.5, 5.0, 6.0];

  const currentWNum = parseLocalizedFloat(inputWidth);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.kavWrapper}
          >
            <View style={styles.modalCard}>
              {/* Sarlavha */}
              <View style={styles.headerRow}>
                <View style={styles.titleGroup}>
                  <Maximize2 size={18} color="#0284C7" />
                  <Text style={styles.titleText}>{getTitle()}</Text>
                </View>
                <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                  <X size={18} color="#64748B" />
                </TouchableOpacity>
              </View>

              <Text style={styles.subText}>
                Aniq o‘lchamni qo‘lda yozing (nuqta yoki vergul bilan) yoki pastdagi andazalardan tanlang:
              </Text>

              {/* Eni / Uzunligi Kiritish Maydoni */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>
                  {selectedWallIndex !== null
                    ? 'Devor Uzunligi:'
                    : selectedElementType === 'furniture'
                    ? 'Eni (Kengligi):'
                    : 'Eni (Metrda):'}
                </Text>
                <View style={styles.inputRow}>
                  <TextInput
                    style={styles.textInput}
                    keyboardType="numeric"
                    value={inputWidth}
                    onChangeText={(val) => setInputWidth(val.replace(/,/g, '.'))}
                    selectTextOnFocus
                    autoFocus
                  />
                  <Text style={styles.unitText}>metr</Text>
                </View>
              </View>

              {/* Bo'yi Kiritish (Mebel yoki Oyna uchun) */}
              {(selectedElementType === 'furniture' || selectedElementType === 'window') && selectedWallIndex === null && (
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Bo‘yi (Balandligi):</Text>
                  <View style={styles.inputRow}>
                    <TextInput
                      style={styles.textInput}
                      keyboardType="numeric"
                      value={inputHeight}
                      onChangeText={(val) => setInputHeight(val.replace(/,/g, '.'))}
                      selectTextOnFocus
                    />
                    <Text style={styles.unitText}>metr</Text>
                  </View>
                </View>
              )}

              {/* Tayyor Andazalar (Quick Presets) */}
              <View style={styles.presetsWrapper}>
                <Text style={styles.presetsTitle}>Standart andazalar:</Text>
                <View style={styles.presetChipsRow}>
                  {selectedWallIndex !== null &&
                    wallPresets.map((p) => (
                      <TouchableOpacity
                        key={`wall_p_${p}`}
                        style={[styles.presetChip, currentWNum === p && styles.presetChipActive]}
                        onPress={() => setInputWidth(p.toFixed(2))}
                      >
                        <Text style={[styles.presetChipText, currentWNum === p && styles.presetChipTextActive]}>
                          {p.toFixed(1)}m
                        </Text>
                      </TouchableOpacity>
                    ))}

                  {selectedWallIndex === null &&
                    selectedElementType === 'window' &&
                    windowPresets.map((p) => (
                      <TouchableOpacity
                        key={`win_p_${p}`}
                        style={[styles.presetChip, currentWNum === p && styles.presetChipActive]}
                        onPress={() => setInputWidth(p.toFixed(2))}
                      >
                        <Text style={[styles.presetChipText, currentWNum === p && styles.presetChipTextActive]}>
                          {p.toFixed(1)}m
                        </Text>
                      </TouchableOpacity>
                    ))}

                  {selectedWallIndex === null &&
                    selectedElementType === 'door' &&
                    doorPresets.map((p) => (
                      <TouchableOpacity
                        key={`door_p_${p}`}
                        style={[styles.presetChip, currentWNum === p && styles.presetChipActive]}
                        onPress={() => setInputWidth(p.toFixed(2))}
                      >
                        <Text style={[styles.presetChipText, currentWNum === p && styles.presetChipTextActive]}>
                          {p.toFixed(2)}m
                        </Text>
                      </TouchableOpacity>
                    ))}

                  {selectedWallIndex === null && selectedElementType === 'furniture' && (
                    <>
                      <TouchableOpacity
                        style={styles.presetChip}
                        onPress={() => {
                          setInputWidth('2.00');
                          setInputHeight('1.80');
                        }}
                      >
                        <Text style={styles.presetChipText}>2.0x1.8m (Katta)</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.presetChip}
                        onPress={() => {
                          setInputWidth('1.40');
                          setInputHeight('0.80');
                        }}
                      >
                        <Text style={styles.presetChipText}>1.4x0.8m (Stol)</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.presetChip}
                        onPress={() => {
                          setInputWidth('2.20');
                          setInputHeight('1.00');
                        }}
                      >
                        <Text style={styles.presetChipText}>2.2x1.0m (Divan)</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </View>

              {/* Stepper (+ / - 0.1m) */}
              <View style={styles.stepperRow}>
                <TouchableOpacity
                  style={styles.stepBtn}
                  onPress={() => {
                    const w = parseLocalizedFloat(inputWidth) || 1.0;
                    setInputWidth(Math.max(0.4, w - 0.1).toFixed(2));
                  }}
                >
                  <Text style={styles.stepBtnText}>- 0.10 m</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.stepBtn}
                  onPress={() => {
                    const w = parseLocalizedFloat(inputWidth) || 1.0;
                    setInputWidth((w + 0.1).toFixed(2));
                  }}
                >
                  <Text style={styles.stepBtnText}>+ 0.10 m</Text>
                </TouchableOpacity>

                {selectedWallIndex !== null && (
                  <TouchableOpacity
                    style={styles.stepBtn}
                    onPress={() => {
                      const w = parseLocalizedFloat(inputWidth) || 1.0;
                      setInputWidth((w + 1.0).toFixed(2));
                    }}
                  >
                    <Text style={styles.stepBtnText}>+ 1.0 m</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Tugmalar */}
              <View style={styles.actionsRow}>
                <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                  <Text style={styles.cancelBtnText}>Bekor qilish</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                  <Check size={16} color="#FFFFFF" />
                  <Text style={styles.saveBtnText}>Saqlash</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.78)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    zIndex: 999,
  },
  kavWrapper: {
    width: '100%',
    maxWidth: 380,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  titleText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  closeBtn: {
    padding: 4,
  },
  subText: {
    fontSize: 11.5,
    color: '#64748B',
    marginBottom: 14,
  },
  inputContainer: {
    marginBottom: 10,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 4,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderColor: '#0284C7',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  textInput: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0284C7',
    textAlign: 'center',
    minWidth: 80,
  },
  unitText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
    marginLeft: 6,
  },
  presetsWrapper: {
    marginTop: 6,
    marginBottom: 12,
  },
  presetsTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 6,
  },
  presetChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  presetChip: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  presetChipActive: {
    backgroundColor: '#0284C7',
    borderColor: '#0284C7',
  },
  presetChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  presetChipTextActive: {
    color: '#FFFFFF',
  },
  stepperRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  stepBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingVertical: 7,
    alignItems: 'center',
  },
  stepBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#334155',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#64748B',
  },
  saveBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16A34A',
    borderRadius: 10,
    paddingVertical: 10,
    gap: 6,
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  saveBtnText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
