import React from 'react';
import { G, Rect, Circle, Text as SvgText, Defs, Pattern, Line, Polygon } from 'react-native-svg';
import { useCanvasStore } from '../../store/canvasStore';
import { useShallow } from 'zustand/react/shallow';
import { WindowDoorRenderer } from './WindowDoorRenderer';
import { FurnitureRenderer } from './FurnitureRenderer';
import { AirflowConeRenderer } from './AirflowConeRenderer';
import { PIXELS_PER_METER } from '../../utils/geometry';

export const DraggableElementsRenderer: React.FC<{ readOnly?: boolean }> = ({ readOnly }) => {
  const scale = PIXELS_PER_METER;
  const {
    windows,
    doors,
    furniture,
    boilerPosition,
    manifoldPosition,
    acPosition,
    heatingExcludedZones,
    selectedElementId,
  } = useCanvasStore(
    useShallow((s) => ({
      windows: s.windows,
      doors: s.doors,
      furniture: s.furniture,
      boilerPosition: s.boilerPosition,
      manifoldPosition: s.manifoldPosition,
      acPosition: s.acPosition,
      heatingExcludedZones: s.heatingExcludedZones,
      selectedElementId: s.selectedElementId,
    }))
  );

  return (
    <G>
      {/* 1. Excluded Zones (Istisno Hududlar) */}
      {(heatingExcludedZones || []).map((zone) => {
        if (!zone.points || zone.points.length < 3) return null;
        const pts = zone.points.map(p => `${p.x * scale},${p.y * scale}`).join(' ');
        const cX = zone.points.reduce((sum, p) => sum + p.x, 0) / zone.points.length;
        const cY = zone.points.reduce((sum, p) => sum + p.y, 0) / zone.points.length;

        return (
          <G key={zone.id}>
            <Defs>
              <Pattern id={`hatchPattern_${zone.id}`} patternUnits="userSpaceOnUse" width="10" height="10" patternTransform="rotate(45)">
                <Line x1="0" y1="0" x2="0" y2="10" stroke="#94A3B8" strokeWidth="1.2" opacity={0.6} />
              </Pattern>
            </Defs>
            <Polygon
              points={pts}
              fill={`url(#hatchPattern_${zone.id})`}
              stroke="#EF4444"
              strokeWidth="1.5"
              strokeDasharray="4 4"
            />
            {!readOnly && (
              <G transform={`translate(${cX * scale}, ${cY * scale})`}>
                <Rect x="-25" y="-12" width="50" height="24" fill="#FFFFFF" rx="4" stroke="#EF4444" strokeWidth="1" />
                <SvgText x="0" y="4" fill="#EF4444" fontSize="10" fontWeight="bold" textAnchor="middle">
                  Ta'qiqlangan
                </SvgText>
              </G>
            )}
          </G>
        );
      })}

      <FurnitureRenderer
        furniture={furniture || []}
        selectedId={readOnly ? null : selectedElementId}
        padding={0}
      />

      <WindowDoorRenderer
        windows={windows || []}
        doors={doors || []}
        selectedId={readOnly ? null : selectedElementId}
        padding={0}
      />


      {manifoldPosition && (
        <G transform={`translate(${manifoldPosition.x * scale - 18}, ${manifoldPosition.y * scale - 15})`}>
          <Rect
            x="0"
            y="0"
            width="36"
            height="30"
            fill="#D97706"
            stroke="#92400E"
            strokeWidth="2"
            rx="6"
          />
          <Circle cx="10" cy="8" r="4" fill="#EF4444" />
          <Circle cx="26" cy="8" r="4" fill="#3B82F6" />
          <SvgText x="18" y="24" fill="#FFFFFF" fontSize="10" fontWeight="bold" textAnchor="middle">
            KL
          </SvgText>
        </G>
      )}

      {boilerPosition && (
        <G transform={`translate(${boilerPosition.x * scale - 18}, ${boilerPosition.y * scale - 20})`}>
          <Rect
            x="0"
            y="0"
            width="36"
            height="40"
            fill="#EF4444"
            stroke="#B91C1C"
            strokeWidth="2"
            rx="6"
          />
          <Circle cx="18" cy="14" r="7" fill="#FEF2F2" />
          <SvgText x="18" y="18" fill="#EF4444" fontSize="10" fontWeight="bold" textAnchor="middle">
            ♨️
          </SvgText>
          <SvgText x="18" y="32" fill="#FFFFFF" fontSize="7.5" fontWeight="bold" textAnchor="middle">
            KOTYOL
          </SvgText>
        </G>
      )}
    </G>
  );
};
