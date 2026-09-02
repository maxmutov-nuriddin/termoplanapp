import React from 'react';
import { G, Line, Circle, Rect, Text as SvgText } from 'react-native-svg';
import { IInteriorWall, IPoint } from '../../types';
import { PIXELS_PER_METER, distanceBetweenPoints } from '../../utils/geometry';

interface InteriorWallRendererProps {
  interiorWalls: IInteriorWall[];
  selectedId?: string | null;
  drawingWallStart?: IPoint | null;
  showDimensions?: boolean;
  readOnly?: boolean;
  padding?: number;
  onSelectWall?: (id: string) => void;
}

const InteriorWallRendererComponent: React.FC<InteriorWallRendererProps> = ({
  interiorWalls = [],
  selectedId,
  drawingWallStart,
  showDimensions = true,
  readOnly = false,
  padding = 0,
  onSelectWall,
}) => {
  const scale = PIXELS_PER_METER;

  return (
    <G>
      {/* 1. Mavjud Ichki Devorlar (Peregorodkalar) */}
      {interiorWalls.map((wall) => {
        const x1 = wall.startPoint.x * scale + padding;
        const y1 = wall.startPoint.y * scale + padding;
        const x2 = wall.endPoint.x * scale + padding;
        const y2 = wall.endPoint.y * scale + padding;

        const isSelected = selectedId === wall.id;
        const thicknessM = wall.thicknessM || 0.12;
        const thicknessSm = Math.round(thicknessM * 100);
        const wallStrokeWidth = Math.max(6, Math.min(18, thicknessM * scale));

        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;
        const lenM = wall.length || distanceBetweenPoints(wall.startPoint, wall.endPoint);

        const dx = x2 - x1;
        const dy = y2 - y1;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const perpX = dist > 0 ? (-dy / dist) * 18 : 0;
        const perpY = dist > 0 ? (dx / dist) * 18 : 0;

        const labelX = midX + perpX;
        const labelY = midY + perpY;
        const badgeWidth = isSelected ? 86 : 64;
        const badgeHeight = 20;

        return (
          <G key={`int_wall_${wall.id}`}>
            {/* Tanlangan devor nurlanishi */}
            {isSelected && (
              <Line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#38BDF8"
                strokeWidth={wallStrokeWidth + 6}
                strokeLinecap="round"
                opacity={0.6}
              />
            )}

            {/* Asosiy Ichki Devor Chizig'i */}
            <Line
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={isSelected ? '#0284C7' : '#475569'}
              strokeWidth={wallStrokeWidth}
              strokeLinecap="round"
              strokeDasharray="6 3"
            />

            {/* Devor o'lchami yorlig'i (Badge) */}
            {lenM >= 0.5 && showDimensions && (
              <G>
                <Line
                  x1={midX}
                  y1={midY}
                  x2={labelX}
                  y2={labelY}
                  stroke="#94A3B8"
                  strokeWidth="0.8"
                  strokeDasharray="2 2"
                />

                <Rect
                  x={labelX - badgeWidth / 2}
                  y={labelY - badgeHeight / 2}
                  width={badgeWidth}
                  height={badgeHeight}
                  rx="6"
                  fill={isSelected ? '#0284C7' : 'rgba(255, 255, 255, 0.95)'}
                  stroke={isSelected ? '#38BDF8' : '#94A3B8'}
                  strokeWidth={isSelected ? 1.5 : 1}
                />

                <SvgText
                  x={labelX}
                  y={labelY + 4}
                  fill={isSelected ? '#FFFFFF' : '#0F172A'}
                  fontSize="9.5"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  {isSelected ? `🚪 ${lenM.toFixed(2)}m (${thicknessSm}sm)` : `🚪 ${lenM.toFixed(2)}m`}
                </SvgText>
              </G>
            )}

            {/* Tugun nuqtalarini siljitish tutqichlari (Start & End Handles) */}
            {!readOnly && (
              <>
                <Circle
                  cx={x1}
                  cy={y1}
                  r={isSelected ? 6.5 : 4.5}
                  fill={isSelected ? '#0284C7' : '#FFFFFF'}
                  stroke="#0284C7"
                  strokeWidth="2"
                />
                <Circle
                  cx={x2}
                  cy={y2}
                  r={isSelected ? 6.5 : 4.5}
                  fill={isSelected ? '#0284C7' : '#FFFFFF'}
                  stroke="#0284C7"
                  strokeWidth="2"
                />
              </>
            )}
          </G>
        );
      })}

      {/* 2. Yangi Ichki Devor Boshlanish Nuqtasi (Pulsing Indicator) */}
      {drawingWallStart && (
        <G>
          <Circle
            cx={drawingWallStart.x * scale + padding}
            cy={drawingWallStart.y * scale + padding}
            r="12"
            fill="rgba(56, 189, 248, 0.25)"
            stroke="#38BDF8"
            strokeWidth="2"
            strokeDasharray="4 2"
          />
          <Circle
            cx={drawingWallStart.x * scale + padding}
            cy={drawingWallStart.y * scale + padding}
            r="5"
            fill="#0284C7"
            stroke="#FFFFFF"
            strokeWidth="1.5"
          />
        </G>
      )}
    </G>
  );
};

export const InteriorWallRenderer = React.memo(InteriorWallRendererComponent);
