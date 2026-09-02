import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { MousePointer, PenTool, Maximize2, DoorClosed, Flame, Wind, Gauge, Lock, Unlock, Ban } from 'lucide-react-native';
import { CanvasTool, useCanvasStore } from '../../store/canvasStore';
import { useShallow } from 'zustand/react/shallow';

export const FigmaToolDock: React.FC = () => {
  const { selectedTool, setSelectedTool, isLayoutLocked, toggleLayoutLock } = useCanvasStore(
    useShallow((s) => ({
      selectedTool: s.selectedTool,
      setSelectedTool: s.setSelectedTool,
      isLayoutLocked: s.isLayoutLocked,
      toggleLayoutLock: s.toggleLayoutLock,
    }))
  );

  const dockItems: Array<{ id: CanvasTool; label: string; icon: React.ReactNode }> = [
    { id: 'select', label: 'Tanlash', icon: <MousePointer size={18} color={selectedTool === 'select' ? '#FFFFFF' : '#94A3B8'} /> },
    { id: 'pen_wall', label: 'Tashqi Devor', icon: <PenTool size={18} color={selectedTool === 'pen_wall' ? '#FFFFFF' : '#38BDF8'} /> },
    { id: 'pen_room', label: 'Ichki Devor', icon: <PenTool size={18} color={selectedTool === 'pen_room' ? '#FFFFFF' : '#38BDF8'} /> },
    { id: 'window', label: '+ Oyna', icon: <Maximize2 size={18} color={selectedTool === 'window' ? '#FFFFFF' : '#38BDF8'} /> },
    { id: 'door', label: '+ Eshik', icon: <DoorClosed size={18} color={selectedTool === 'door' ? '#FFFFFF' : '#4ADE80'} /> },
    { id: 'boiler', label: '+ Kotyol', icon: <Flame size={18} color={selectedTool === 'boiler' ? '#FFFFFF' : '#EF4444'} /> },
    { id: 'manifold', label: '+ Kollektor', icon: <Gauge size={18} color={selectedTool === 'manifold' ? '#FFFFFF' : '#FB923C'} /> },
    { id: 'ac', label: '+ AC', icon: <Wind size={18} color={selectedTool === 'ac' ? '#FFFFFF' : '#38BDF8'} /> },
    { id: 'exclude_zone', label: 'Yer Istisno', icon: <Ban size={18} color={selectedTool === 'exclude_zone' ? '#FFFFFF' : '#EF4444'} /> },
  ];

  return (
    <View style={styles.dockContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dockScroll}>
        <TouchableOpacity
          style={[styles.dockBtn, isLayoutLocked && styles.dockBtnDangerActive]}
          onPress={toggleLayoutLock}
          activeOpacity={0.7}
        >
          {isLayoutLocked ? <Lock size={18} color="#FFFFFF" /> : <Unlock size={18} color="#94A3B8" />}
          <Text style={[styles.dockLabel, isLayoutLocked && styles.dockLabelActive]}>
            {isLayoutLocked ? 'Qotirilgan' : 'Qotirish'}
          </Text>
        </TouchableOpacity>

        <View style={styles.dockDivider} />

        {dockItems.map((item) => {
          const isActive = selectedTool === item.id;
          return (
            <TouchableOpacity
              key={item.id}
              style={[styles.dockBtn, isActive && styles.dockBtnActive]}
              onPress={() => setSelectedTool(item.id)}
              activeOpacity={0.7}
            >
              {item.icon}
              <Text style={[styles.dockLabel, isActive && styles.dockLabelActive]}>{item.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  dockContainer: {
    backgroundColor: '#0F172A',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginHorizontal: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  dockScroll: {
    gap: 6,
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  dockBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    paddingHorizontal: 11,
    paddingVertical: 7,
    minWidth: 58,
  },
  dockBtnActive: {
    backgroundColor: '#0284C7',
  },
  dockBtnDangerActive: {
    backgroundColor: '#EF4444',
  },
  dockDivider: {
    width: 1,
    height: '60%',
    backgroundColor: '#334155',
    marginHorizontal: 4,
  },
  dockLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    marginTop: 3,
  },
  dockLabelActive: {
    color: '#FFFFFF',
  },
});
