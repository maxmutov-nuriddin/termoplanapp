import React from 'react';
import { G, Polygon, Line, Text as SvgText, Rect } from 'react-native-svg';
import { IPoint, IWall } from '../../types';
import { PIXELS_PER_METER, distanceBetweenPoints } from '../../utils/geometry';

interface WallRendererProps {
  points?: IPoint[];
  walls?: IWall[];
  selectedWallIndex?: number | null;
  showDimensions?: boolean;
  padding?: number;
  onSelectWall?: (index: number) => void;
}

const WallRendererComponent: React.FC<WallRendererProps> = ({
  points,
  walls = [],
  selectedWallIndex,
  showDimensions = true,
  padding = 0,
}) => {
  const scale = PIXELS_PER_METER;

  const validPoints = (points || []).filter(
    (p) => p && Number.isFinite(p.x) && Number.isFinite(p.y)
  );

  const n = validPoints.length;
  if (n < 3) return null;

  const polyPointsStr = validPoints
    .map((p) => `${p.x * scale + padding},${p.y * scale + padding}`)
    .join(' ');

  return (
    <G>
      {/* 1. Xona ichki pol qatlami */}
      <Polygon
        points={polyPointsStr}
        fill="#FFFFFF"
        stroke="#CBD5E1"
        strokeWidth="1"
        strokeLinejoin="round"
      />

      {/* 2. Devor chiziqlari va o'lchamlar */}
      {validPoints.map((p1, i) => {
        const nextIdx = (i + 1) % n;
        const p2 = validPoints[nextIdx];
        const wall = walls[i];

        const x1 = p1.x * scale + padding;
        const y1 = p1.y * scale + padding;
        const x2 = p2.x * scale + padding;
        const y2 = p2.y * scale + padding;

        const isSelected = selectedWallIndex === i;
        const thicknessM = wall?.thicknessM || 0.38;
        const isExternal = wall?.isExternal !== false;

        const wallStrokeWidth = Math.max(8, Math.min(22, thicknessM * 30));
        const wallColor = isExternal ? '#0F172A' : '#475569';

        const lenM = distanceBetweenPoints(p1, p2);
        const showBadge = showDimensions && lenM >= 0.6;

        let badgeX = 0;
        let badgeY = 0;
        let displayLen = '0.00m';
        let thicknessSm = 38;

        if (showBadge) {
          const midX = (x1 + x2) / 2;
          const midY = (y1 + y2) / 2;
          thicknessSm = Math.round(thicknessM * 100);

          const dx = x2 - x1;
          const dy = y2 - y1;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const perpX = dist > 0 ? (-dy / dist) * 22 : 0;
          const perpY = dist > 0 ? (dx / dist) * 22 : 0;

          badgeX = midX + perpX;
          badgeY = midY + perpY;

          // 2cm chastotali aniq va o'ta silliq keshlanuvchi o'lcham
          const roundedM = Math.round(lenM * 50) / 50;
          displayLen = `${roundedM.toFixed(2)}m`;
        }

        const badgeWidth = isSelected ? 80 : 54;
        const badgeHeight = 20;

        return (
          <G key={`wall_full_${i}`}>
            {isSelected && (
              <Line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#38BDF8"
                strokeWidth={wallStrokeWidth + 8}
                strokeLinecap="round"
                opacity={0.5}
              />
            )}

            <Line
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={isSelected ? '#0284C7' : wallColor}
              strokeWidth={wallStrokeWidth}
              strokeLinecap="round"
              strokeDasharray={!isExternal ? '6 3' : undefined}
            />

            {showBadge && (
              <G key={`wall_dim_${i}`}>
                <Rect
                  x={badgeX - badgeWidth / 2}
                  y={badgeY - badgeHeight / 2}
                  width={badgeWidth}
                  height={badgeHeight}
                  rx="6"
                  fill={isSelected ? '#0284C7' : 'rgba(255, 255, 255, 0.95)'}
                  stroke={isSelected ? '#38BDF8' : '#CBD5E1'}
                  strokeWidth={isSelected ? 1.5 : 1}
                />
                <SvgText
                  x={badgeX}
                  y={badgeY + 4}
                  fill={isSelected ? '#FFFFFF' : '#1E293B'}
                  fontSize="9.5"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  {isSelected
                    ? `${isExternal ? '🏢' : '🚪'} ${displayLen} (${thicknessSm}sm)`
                    : displayLen}
                </SvgText>
              </G>
            )}
          </G>
        );
      })}
    </G>
  );
};

export const WallRenderer = React.memo(WallRendererComponent);
