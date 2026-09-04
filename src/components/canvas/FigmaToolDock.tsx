import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Square, ArrowRight, MousePointer2, DoorClosed, Maximize2, Box, PenTool } from 'lucide-react-native';
import { useCanvasStore } from '../../store/canvasStore';
import { useShallow } from 'zustand/react/shallow';
import { COLORS, SHADOWS, RADIUS, SPACING } from '../../theme';

export const FigmaToolDock: React.FC = () => {
  const {
    selectedTool,
    setSelectedTool,
    roomPoints,
    loadPresetShape,
    autoCenterRoom,
    doors,
    windows,
    furniture,
    placeElementAt,
  } = useCanvasStore(
    useShallow((s) => ({
      selectedTool: s.selectedTool,
      setSelectedTool: s.setSelectedTool,
      roomPoints: s.roomPoints,
      loadPresetShape: s.loadPresetShape,
      autoCenterRoom: s.autoCenterRoom,
      doors: s.doors,
      windows: s.windows,
      furniture: s.furniture,
      placeElementAt: s.placeElementAt,
    }))
  );

  const ensureRoomExists = () => {
    const pts = (roomPoints || []).filter((p) => p && Number.isFinite(p.x) && Number.isFinite(p.y));
    if (pts.length < 3) {
      loadPresetShape('RECTANGLE');
      autoCenterRoom();
      return useCanvasStore.getState().roomPoints;
    }
    return pts;
  };

  const handleSelect = () => {
    setSelectedTool('select');
  };

  const handleRoom = () => {
    const pts = (roomPoints || []).filter((p) => p && Number.isFinite(p.x) && Number.isFinite(p.y));
    if (pts.length < 3) {
      loadPresetShape('RECTANGLE');
      autoCenterRoom();
      setSelectedTool('select');
    } else {
      setSelectedTool(selectedTool === 'pen_room' ? 'select' : 'pen_room');
    }
  };

  const handleWall = () => {
    ensureRoomExists();
    setSelectedTool(selectedTool === 'pen_wall' ? 'select' : 'pen_wall');
  };

  const handleDoor = () => {
    const pts = ensureRoomExists();
    if ((doors || []).length === 0 && pts.length >= 3) {
      const xs = pts.map((p) => p.x);
      const ys = pts.map((p) => p.y);
      const midX = (Math.min(...xs) + Math.max(...xs)) / 2;
      const maxY = Math.max(...ys);
      placeElementAt('door', { x: midX, y: maxY });
    } else {
      setSelectedTool(selectedTool === 'door' ? 'select' : 'door');
    }
  };

  const handleWindow = () => {
    const pts = ensureRoomExists();
    if ((windows || []).length === 0 && pts.length >= 3) {
      const xs = pts.map((p) => p.x);
      const ys = pts.map((p) => p.y);
      const midX = (Math.min(...xs) + Math.max(...xs)) / 2;
      const minY = Math.min(...ys);
      placeElementAt('window', { x: midX, y: minY });
    } else {
      setSelectedTool(selectedTool === 'window' ? 'select' : 'window');
    }
  };

  const handleFurniture = () => {
    const pts = ensureRoomExists();
    const xs = pts.map((p) => p.x);
    const ys = pts.map((p) => p.y);
    const midX = (Math.min(...xs) + Math.max(...xs)) / 2;
    const midY = (Math.min(...ys) + Math.max(...ys)) / 2;
    placeElementAt('furniture', { x: midX, y: midY });
  };

  const isSelectActive = selectedTool === 'select';
  const isRoomActive = selectedTool === 'pen_room';
  const isWallActive = selectedTool === 'pen_wall';
  const isDoorActive = selectedTool === 'door';
  const isWindowActive = selectedTool === 'window';
  const isFurnActive = selectedTool === 'furniture';

  return (
    <View style={styles.dockWrapper}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dockContainer}>
        {/* Tanlash */}
        <TouchableOpacity
          style={[styles.toolBtn, isSelectActive && styles.toolBtnActive]}
          onPress={handleSelect}
          activeOpacity={0.7}
        >
          <MousePointer2 size={18} color={isSelectActive ? COLORS.primaryLight : COLORS.textMuted} />
          <Text style={[styles.toolText, isSelectActive && styles.toolTextActive]}>Tanlash</Text>
        </TouchableOpacity>

        {/* Xona */}
        <TouchableOpacity
          style={[styles.toolBtn, isRoomActive && styles.toolBtnActive]}
          onPress={handleRoom}
          activeOpacity={0.7}
        >
          <Square size={18} color={isRoomActive ? COLORS.primaryLight : COLORS.textMuted} />
          <Text style={[styles.toolText, isRoomActive && styles.toolTextActive]}>Xona</Text>
        </TouchableOpacity>

        {/* To'siq */}
        <TouchableOpacity
          style={[styles.toolBtn, isWallActive && styles.toolBtnActive]}
          onPress={handleWall}
          activeOpacity={0.7}
        >
          <ArrowRight size={18} color={isWallActive ? COLORS.primaryLight : COLORS.textMuted} />
          <Text style={[styles.toolText, isWallActive && styles.toolTextActive]}>To'siq</Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        {/* Eshik */}
        <TouchableOpacity
          style={[styles.toolBtn, isDoorActive && styles.toolBtnActive]}
          onPress={handleDoor}
          activeOpacity={0.7}
        >
          <DoorClosed size={18} color={isDoorActive ? COLORS.primaryLight : COLORS.textMuted} />
          <Text style={[styles.toolText, isDoorActive && styles.toolTextActive]}>Eshik</Text>
        </TouchableOpacity>

        {/* Oyna */}
        <TouchableOpacity
          style={[styles.toolBtn, isWindowActive && styles.toolBtnActive]}
          onPress={handleWindow}
          activeOpacity={0.7}
        >
          <Maximize2 size={18} color={isWindowActive ? COLORS.primaryLight : COLORS.textMuted} />
          <Text style={[styles.toolText, isWindowActive && styles.toolTextActive]}>Oyna</Text>
        </TouchableOpacity>

        {/* Mebel */}
        <TouchableOpacity
          style={[styles.toolBtn, isFurnActive && styles.toolBtnActive]}
          onPress={handleFurniture}
          activeOpacity={0.7}
        >
          <Box size={18} color={isFurnActive ? COLORS.primaryLight : COLORS.textMuted} />
          <Text style={[styles.toolText, isFurnActive && styles.toolTextActive]}>Mebel</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  dockWrapper: {
    alignSelf: 'center',
    backgroundColor: '#0F172A', // Dark Slate CAD Surface
    borderRadius: RADIUS.xl,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderWidth: 1,
    borderColor: 'rgba(51, 65, 85, 0.8)',
    ...SHADOWS.floating,
    elevation: 8,
  },
  dockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  toolBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: RADIUS.md,
    minWidth: 50,
  },
  toolBtnActive: {
    backgroundColor: 'rgba(20, 184, 166, 0.25)', // primaryLight active background
    borderWidth: 1,
    borderColor: COLORS.primaryLight,
  },
  toolText: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 4,
    fontWeight: '600',
  },
  toolTextActive: {
    color: '#14B8A6',
    fontWeight: '800',
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: '#334155',
    marginHorizontal: 4,
  },
});
