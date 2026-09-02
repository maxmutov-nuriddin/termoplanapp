import React, { useMemo } from 'react';
import { G, Polyline, Path, Rect, Text as SvgText, Defs, ClipPath, Polygon, Circle } from 'react-native-svg';
import { IPoint, IWall, IInteriorWall, IDoor, IWindow } from '../../types';
import { generateRealisticFloorHeating, PIXELS_PER_METER } from '../../utils/geometry';

/**
 * PEX Quvurlarning burchaklardagi silliq fizik bukilish radiusi (R = 8px ≈ 80-100mm)
 */
function parsePointsStringToSmoothPath(pointsStr: string, radius = 7): string {
  if (!pointsStr) return '';
  const pairs = pointsStr.trim().split(/\s+/);
  const pts: Array<{ x: number; y: number }> = [];
  for (const pair of pairs) {
    const [xStr, yStr] = pair.split(',');
    const x = parseFloat(xStr);
    const y = parseFloat(yStr);
    if (Number.isFinite(x) && Number.isFinite(y)) {
      pts.push({ x, y });
    }
  }

  if (pts.length < 2) return '';
  if (pts.length === 2) {
    return `M ${pts[0].x} ${pts[0].y} L ${pts[1].x} ${pts[1].y}`;
  }

  let d = `M ${pts[0].x} ${pts[0].y}`;

  for (let i = 1; i < pts.length - 1; i++) {
    const p0 = pts[i - 1];
    const p1 = pts[i];
    const p2 = pts[i + 1];

    const v1x = p0.x - p1.x;
    const v1y = p0.y - p1.y;
    const len1 = Math.hypot(v1x, v1y);

    const v2x = p2.x - p1.x;
    const v2y = p2.y - p1.y;
    const len2 = Math.hypot(v2x, v2y);

    if (len1 < 0.1 || len2 < 0.1) {
      d += ` L ${p1.x} ${p1.y}`;
      continue;
    }

    const r = Math.min(radius, len1 / 2, len2 / 2);

    const startX = p1.x + (v1x / len1) * r;
    const startY = p1.y + (v1y / len1) * r;

    const endX = p1.x + (v2x / len2) * r;
    const endY = p1.y + (v2y / len2) * r;

    d += ` L ${startX.toFixed(1)} ${startY.toFixed(1)}`;
    d += ` Q ${p1.x.toFixed(1)} ${p1.y.toFixed(1)} ${endX.toFixed(1)} ${endY.toFixed(1)}`;
  }

  const last = pts[pts.length - 1];
  d += ` L ${last.x.toFixed(1)} ${last.y.toFixed(1)}`;
  return d;
}

interface HeatingPipeRendererProps {
  roomPoints: IPoint[];
  manifoldPos?: IPoint | null;
  boilerPos?: IPoint | null;
  interiorWalls?: IInteriorWall[];
  doors?: IDoor[];
  windows?: IWindow[];
  furniture?: any[];
  excludedZones?: Array<{ points: IPoint[] }>;
  pattern?: 'spiral' | 'double_snake' | 'single_snake' | 'border_zone';
  isSunny?: boolean;
  padding?: number;
  compassNorthAngle?: number;
  walls?: IWall[];
}

const HeatingPipeRendererComponent: React.FC<HeatingPipeRendererProps> = ({
  roomPoints,
  manifoldPos,
  boilerPos,
  interiorWalls = [],
  doors = [],
  windows = [],
  furniture = [],
  excludedZones = [],
  pattern = 'spiral',
  isSunny = false,
  padding = 0,
  compassNorthAngle = 0,
  walls = [],
}) => {
  const scale = PIXELS_PER_METER;

  const valid = useMemo(
    () => (roomPoints || []).filter((p) => p && Number.isFinite(p.x) && Number.isFinite(p.y)),
    [roomPoints]
  );

  const clipPolygonStr = useMemo(() => {
    if (valid.length < 3) return '';
    return valid.map((p) => `${p.x * scale + padding},${p.y * scale + padding}`).join(' ');
  }, [valid, scale, padding]);

  const { circuits, boilerSupplyMain, boilerReturnMain } = useMemo(() => {
    if (valid.length < 3) return { circuits: [], boilerSupplyMain: undefined, boilerReturnMain: undefined, feedPoints: '', returnPoints: '', totalLengthM: 0 };
    return generateRealisticFloorHeating(
      valid,
      manifoldPos || undefined,
      interiorWalls || [],
      excludedZones || [],
      pattern,
      doors || [],
      windows || [],
      boilerPos,
      furniture || [],
      compassNorthAngle,
      walls || []
    );
  }, [valid, manifoldPos?.x, manifoldPos?.y, boilerPos?.x, boilerPos?.y, interiorWalls, doors, windows, excludedZones, pattern, furniture, compassNorthAngle, walls]);

  if (valid.length < 3) return null;

  const mX = (manifoldPos?.x || 1.0) * scale + padding;
  const mY = (manifoldPos?.y || 1.0) * scale + padding;

  return (
    <G>
      <Defs>
        <ClipPath id="roomHeatingClip">
          <Polygon points={clipPolygonStr} />
        </ClipPath>
      </Defs>

      <G transform={`translate(${padding}, ${padding})`}>
        {/* 1. KOTYOL VA KOLLEKTOR O'RTASIDAGI ASOSIY 2 TA MAGISTRAL TRUBA */}
        {boilerSupplyMain && (
          <Path
            d={parsePointsStringToSmoothPath(boilerSupplyMain, 10)}
            fill="none"
            stroke="#EF4444"
            strokeWidth="4.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.95}
          />
        )}
        {boilerReturnMain && (
          <Path
            d={parsePointsStringToSmoothPath(boilerReturnMain, 10)}
            fill="none"
            stroke="#2563EB"
            strokeWidth="4.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.95}
          />
        )}

        {/* 2. XONALAR ICHIDAGI KONTURLAR (Har bir xona mustaqil toza silliq kontur) */}
        {/* We don't apply the clipPath here because we want to see if the algorithm itself stays inside the room!
            The polygon-offset algorithm guarantees it. If we clip, we hide bugs. Let's rely on the math.
            But we'll keep the clip just in case, wait, if we clip, the clip path is ALREADY translated because
            clipPolygonStr has +padding inside it! So clipPath shouldn't be inside the translated group, OR
            clipPolygonStr should NOT have +padding!
        */}
        <G clipPath="url(#roomHeatingClip)" transform={`translate(${-padding}, ${-padding})`}>
           {/* wait, if clipPolygonStr has padding, and we are inside translate(padding), we must translate back for the clip OR draw pipes shifted */}
           <G transform={`translate(${padding}, ${padding})`}>
            {circuits.map((circuit, idx) => {
              const feedPath = parsePointsStringToSmoothPath(circuit.feedPoints, 7);
              const returnPath = parsePointsStringToSmoothPath(circuit.returnPoints, 7);

              return (
                <G key={circuit.id || idx}>
                  {feedPath ? (
                    <Path d={feedPath} fill="none" stroke="#EF4444" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" opacity={0.95} />
                  ) : null}
                  {returnPath ? (
                    <Path d={returnPath} fill="none" stroke="#2563EB" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" opacity={0.92} />
                  ) : null}
                </G>
              );
            })}
          </G>
        </G>
      </G>

      {/* 3. Kollektor (KL) Shkafi */}
      <G transform={`translate(${mX - 16}, ${mY - 16})`}>
        <Rect
          x="0"
          y="0"
          width="32"
          height="32"
          fill="#FB923C"
          rx="6"
          stroke="#C2410C"
          strokeWidth="2"
        />
        <Circle cx="10" cy="10" r="3" fill="#EF4444" />
        <Circle cx="22" cy="10" r="3" fill="#2563EB" />
        <SvgText
          x="16"
          y="23"
          fill="#FFFFFF"
          fontSize="9.5"
          fontWeight="bold"
          textAnchor="middle"
        >
          KL
        </SvgText>
      </G>
    </G>
  );
};

export const HeatingPipeRenderer = React.memo(HeatingPipeRendererComponent);
