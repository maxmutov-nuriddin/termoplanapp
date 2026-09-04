import React from 'react';
import { G, Polygon, Rect, Circle, Text as SvgText, Line, Defs, LinearGradient, Stop } from 'react-native-svg';
import { IFurniture, IInteriorWall, IPoint } from '../../types';
import { PIXELS_PER_METER } from '../../utils/geometry';

interface AirflowConeRendererProps {
  roomWidthM: number;
  roomHeightM: number;
  acPos: {
    x: number;
    y: number;
    targetAngle: number;
    maxRangeM?: number;
    btu?: number;
    label?: string;
  };
  furniture?: IFurniture[];
  recommendedBtu?: number;
  showDimensions?: boolean;
  padding?: number;
  interiorWalls?: IInteriorWall[];
  roomPolygon?: IPoint[];
}

function raySegmentIntersect(
  p0: { x: number; y: number },
  dir: { x: number; y: number },
  a: { x: number; y: number },
  b: { x: number; y: number }
): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const denom = dir.x * dy - dir.y * dx;
  if (Math.abs(denom) < 1e-6) return Infinity;
  const t = ((a.x - p0.x) * dy - (a.y - p0.y) * dx) / denom;
  const u = ((a.x - p0.x) * dir.y - (a.y - p0.y) * dir.x) / denom;
  if (t > 0.15 && u >= -0.05 && u <= 1.05) {
    return t;
  }
  return Infinity;
}

const AirflowConeRendererComponent: React.FC<AirflowConeRendererProps> = ({
  roomWidthM,
  roomHeightM,
  acPos,
  furniture = [],
  recommendedBtu = 12000,
  showDimensions = true,
  padding = 0,
  interiorWalls = [],
  roomPolygon = [],
}) => {
  const scale = PIXELS_PER_METER;

  const originX = acPos.x * scale + padding;
  const originY = acPos.y * scale + padding;

  const angleRad = (acPos.targetAngle * Math.PI) / 180;
  const spreadRad = (50 * Math.PI) / 180;

  const leftAngle = angleRad - spreadRad / 2;
  const rightAngle = angleRad + spreadRad / 2;

  let baseRangeM = acPos.maxRangeM || Math.min(roomWidthM, roomHeightM) * 0.9;
  baseRangeM = Math.max(1.0, Math.min(baseRangeM, 3.8));

  // Ray-cast to any interior walls or outer room boundaries to stop airflow before hitting walls
  let minCenterT = baseRangeM;
  let minLeftT = baseRangeM;
  let minRightT = baseRangeM;

  const segments: Array<{ a: { x: number; y: number }; b: { x: number; y: number } }> = [];
  for (const iw of interiorWalls || []) {
    if (iw && iw.startPoint && iw.endPoint) {
      segments.push({ a: iw.startPoint, b: iw.endPoint });
    }
  }
  if (roomPolygon && roomPolygon.length >= 3) {
    for (let i = 0; i < roomPolygon.length; i++) {
      segments.push({ a: roomPolygon[i], b: roomPolygon[(i + 1) % roomPolygon.length] });
    }
  }

  const centerDir = { x: Math.cos(angleRad), y: Math.sin(angleRad) };
  const leftDir = { x: Math.cos(leftAngle), y: Math.sin(leftAngle) };
  const rightDir = { x: Math.cos(rightAngle), y: Math.sin(rightAngle) };

  for (const seg of segments) {
    const tC = raySegmentIntersect(acPos, centerDir, seg.a, seg.b);
    if (tC < minCenterT) minCenterT = tC;

    const tL = raySegmentIntersect(acPos, leftDir, seg.a, seg.b);
    if (tL < minLeftT) minLeftT = tL;

    const tR = raySegmentIntersect(acPos, rightDir, seg.a, seg.b);
    if (tR < minRightT) minRightT = tR;
  }

  // Quvvat va aerodinamika: to'siqqa yetishdan 15 sm oldin tugaydi
  const rangeCenterPx = Math.max(0.6, minCenterT - 0.15) * scale;
  const rangeLeftPx = Math.max(0.6, minLeftT - 0.15) * scale;
  const rangeRightPx = Math.max(0.6, minRightT - 0.15) * scale;

  const p1 = `${originX.toFixed(1)},${originY.toFixed(1)}`;
  const p2 = `${(originX + leftDir.x * rangeLeftPx).toFixed(1)},${(originY + leftDir.y * rangeLeftPx).toFixed(1)}`;
  const p3 = `${(originX + centerDir.x * rangeCenterPx).toFixed(1)},${(originY + centerDir.y * rangeCenterPx).toFixed(1)}`;
  const p4 = `${(originX + rightDir.x * rangeRightPx).toFixed(1)},${(originY + rightDir.y * rangeRightPx).toFixed(1)}`;

  const conePoints = `${p1} ${p2} ${p3} ${p4}`;

  let badgeOffsetX = -22;
  let badgeOffsetY = 12;

  if (acPos.targetAngle >= 225 && acPos.targetAngle <= 315) {
    // Pastdan tepaga qarab
    badgeOffsetY = -22;
  } else if (acPos.targetAngle > 315 || acPos.targetAngle < 45) {
    // Chapdan o'ngga qarab
    badgeOffsetX = -48;
    badgeOffsetY = -7;
  } else if (acPos.targetAngle >= 135 && acPos.targetAngle < 225) {
    // O'ngdan chapga qarab
    badgeOffsetX = 6;
    badgeOffsetY = -7;
  }

  const btuVal = acPos.btu || recommendedBtu || 12000;
  const btuText = `${Math.round(btuVal / 1000)}K BTU`;

  return (
    <G>
      <Defs>
        <LinearGradient id="acAirGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#38BDF8" stopOpacity="0.55" />
          <Stop offset="50%" stopColor="#0284C7" stopOpacity="0.2" />
          <Stop offset="100%" stopColor="#0284C7" stopOpacity="0.0" />
        </LinearGradient>
      </Defs>

      {/* 2D Aerodinamik Sovuq Havo Konusi (Devor va to'siqlardan o'tmaydi) */}
      <Polygon points={conePoints} fill="url(#acAirGradient)" />

      {/* Konditsioner Bloki (Sleek AC Badge) */}
      {showDimensions && (
        <G transform={`translate(${originX + badgeOffsetX}, ${originY + badgeOffsetY})`}>
          <Rect x="0" y="0" width="44" height="14" fill="#0F172A" rx="4" stroke="#38BDF8" strokeWidth="1.2" opacity="0.95" />
          <SvgText x="22" y="10" fill="#38BDF8" fontSize="8" fontWeight="800" textAnchor="middle">
            {btuText}
          </SvgText>
        </G>
      )}
    </G>
  );
};

export const AirflowConeRenderer = React.memo(AirflowConeRendererComponent);
