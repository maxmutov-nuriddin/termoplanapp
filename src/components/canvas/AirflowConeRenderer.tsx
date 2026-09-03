import React from 'react';
import { G, Polygon, Rect, Circle, Text as SvgText, Line, Defs, LinearGradient, Stop } from 'react-native-svg';
import { IFurniture } from '../../types';
import { PIXELS_PER_METER } from '../../utils/geometry';

interface AirflowConeRendererProps {
  roomWidthM: number;
  roomHeightM: number;
  acPos: { x: number; y: number; targetAngle: number };
  furniture: IFurniture[];
  recommendedBtu?: number;
  padding?: number;
}

const AirflowConeRendererComponent: React.FC<AirflowConeRendererProps> = ({
  roomWidthM,
  roomHeightM,
  acPos,
  furniture,
  recommendedBtu = 12000,
  padding = 0,
}) => {
  const scale = PIXELS_PER_METER;

  const originX = acPos.x * scale + padding;
  const originY = acPos.y * scale + padding;

  const angleRad = (acPos.targetAngle * Math.PI) / 180;
  const spreadRad = (55 * Math.PI) / 180;
  const rangePx = Math.min(roomWidthM, roomHeightM) * scale * 1.05;

  const leftAngle = angleRad - spreadRad / 2;
  const rightAngle = angleRad + spreadRad / 2;

  const p1 = `${originX},${originY}`;
  const p2 = `${originX + Math.cos(leftAngle) * rangePx},${originY + Math.sin(leftAngle) * rangePx}`;
  const p3 = `${originX + Math.cos(angleRad) * rangePx * 1.15},${originY + Math.sin(angleRad) * rangePx * 1.15}`;
  const p4 = `${originX + Math.cos(rightAngle) * rangePx},${originY + Math.sin(rightAngle) * rangePx}`;

  const conePoints = `${p1} ${p2} ${p3} ${p4}`;

  const isBottom = acPos.targetAngle === 270;
  const badgeOffsetY = isBottom ? -22 : 12;

  const btuText = recommendedBtu ? `${Math.round(recommendedBtu / 1000)}K BTU` : 'AC';

  return (
    <G>
      <Defs>
        <LinearGradient id="acAirGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#38BDF8" stopOpacity="0.55" />
          <Stop offset="50%" stopColor="#0284C7" stopOpacity="0.2" />
          <Stop offset="100%" stopColor="#0284C7" stopOpacity="0.0" />
        </LinearGradient>
      </Defs>

      {/* 2D Aerodinamik Sovuq Havo Konusi */}
      <Polygon points={conePoints} fill="url(#acAirGradient)" />

      {/* Konditsioner Bloki (Sleek AC Badge) */}
      <G transform={`translate(${originX - 22}, ${originY + badgeOffsetY})`}>
        <Rect x="0" y="0" width="44" height="14" fill="#0F172A" rx="4" stroke="#38BDF8" strokeWidth="1.2" opacity="0.92" />
        <SvgText x="22" y="10" fill="#38BDF8" fontSize="8" fontWeight="800" textAnchor="middle">
          {btuText}
        </SvgText>
      </G>
    </G>
  );
};

export const AirflowConeRenderer = React.memo(AirflowConeRendererComponent);
