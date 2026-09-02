import { useShallow } from 'zustand/react/shallow';
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { PenTool, MousePointer, RefreshCw } from 'lucide-react-native';
import { CanvasTool, useCanvasStore } from '../../store/canvasStore';

export const CanvasToolbar: React.FC = () => {
  const { selectedTool, setSelectedTool, clearCanvas } = useCanvasStore(useShallow(s => ({
      selectedTool: s.selectedTool,
      setSelectedTool: s.setSelectedTool,
      clearCanvas: s.clearCanvas,
    })));

  const tools: Array<{ id: CanvasTool; label: string; icon: React.ReactNode }> = [
    { id: 'select', label: 'Tanlash / Surish', icon: <MousePointer size={16} color={selectedTool === 'select' ? '#0284C7' : '#475569'} /> },
    { id: 'pen_wall', label: '🧱 Tashqi Devor', icon: <PenTool size={16} color={selectedTool === 'pen_wall' ? '#0284C7' : '#475569'} /> },
    { id: 'pen_room', label: '🚪 Ichki Devor (Xona)', icon: <PenTool size={16} color={selectedTool === 'pen_room' ? '#0284C7' : '#475569'} /> },
  ];

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {tools.map((t) => {
          const isActive = selectedTool === t.id;
          return (
            <TouchableOpacity
              key={t.id}
              style={[styles.toolBtn, isActive && styles.activeToolBtn]}
              onPress={() => setSelectedTool(t.id)}
              activeOpacity={0.7}
            >
              {t.icon}
              <Text style={[styles.toolLabel, isActive && styles.activeToolLabel]}>{t.label}</Text>
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity style={styles.clearBtn} onPress={clearCanvas} activeOpacity={0.7}>
          <RefreshCw size={14} color="#EF4444" />
          <Text style={styles.clearLabel}>Tozalash</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingVertical: 6,
  },
  scroll: {
    paddingHorizontal: 12,
    gap: 8,
  },
  toolBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  activeToolBtn: {
    backgroundColor: '#E0F2FE',
    borderColor: '#0284C7',
  },
  toolLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#334155',
  },
  activeToolLabel: {
    color: '#0284C7',
    fontWeight: '700',
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  clearLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#EF4444',
  },
});
