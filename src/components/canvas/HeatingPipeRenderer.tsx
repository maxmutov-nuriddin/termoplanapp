import React, { useMemo } from 'react';
import { G, Path, Rect, Text as SvgText, Circle } from 'react-native-svg';
import { IPoint, IWall, IInteriorWall, IDoor, IWindow } from '../../types';
import { generateRealisticFloorHeating, PIXELS_PER_METER, calculatePolygonArea } from '../../utils/geometry';
// @ts-ignore
import Offset from 'polygon-offset';

/**
 * PEX Quvurlarning burchaklardagi silliq fizik bukilish radiusi (R = 7px)
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

function computeOrthogonalPolygonInset(polygon: IPoint[], d: number): IPoint[] | null {
  const n = polygon.length;
  if (n < 3) return null;
  let area = 0;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += polygon[i].x * polygon[j].y - polygon[j].x * polygon[i].y;
  }
  const isClockwise = area > 0;
  const pts = isClockwise ? [...polygon] : [...polygon].reverse();

  const lines: Array<{ type: 'horiz' | 'vert'; val: number }> = [];
  for (let i = 0; i < n; i++) {
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;

    if (Math.abs(dy) <= Math.abs(dx)) {
      const shiftY = dx >= 0 ? d : -d;
      lines.push({ type: 'horiz', val: p1.y + shiftY });
    } else {
      const shiftX = dy >= 0 ? -d : d;
      lines.push({ type: 'vert', val: p1.x + shiftX });
    }
  }

  const insetPts: IPoint[] = [];
  for (let i = 0; i < n; i++) {
    const prevLine = lines[(i - 1 + n) % n];
    const currLine = lines[i];
    let x: number, y: number;
    if (prevLine.type === 'horiz' && currLine.type === 'vert') {
      x = currLine.val;
      y = prevLine.val;
    } else if (prevLine.type === 'vert' && currLine.type === 'horiz') {
      x = prevLine.val;
      y = currLine.val;
    } else {
      x = pts[i].x;
      y = pts[i].y;
    }
    insetPts.push({ x: parseFloat(x.toFixed(3)), y: parseFloat(y.toFixed(3)) });
  }

  let newArea = 0;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    newArea += insetPts[i].x * insetPts[j].y - insetPts[j].x * insetPts[i].y;
  }
  if (Math.abs(newArea) / 2 < 0.3) return null;
  return insetPts;
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

  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  valid.forEach(p => {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  });

  const mX = manifoldPos && Number.isFinite(manifoldPos.x)
    ? manifoldPos.x * scale + padding
    : (minX + 0.35) * scale + padding;
  const mY = manifoldPos && Number.isFinite(manifoldPos.y)
    ? manifoldPos.y * scale + padding
    : (minY + 0.35) * scale + padding;

  const renderedCircuits = useMemo(() => {
    if (valid.length < 3) return [];

    const boxArea = (maxX - minX) * (maxY - minY);
    const polyArea = calculatePolygonArea(valid);
    const isRectangle = valid.length === 4 && Math.abs(boxArea - polyArea) < 0.05 * boxArea;

    const isLShape = valid.length === 6;

    // 1. L-Shaklli xonalar uchun maxsus 6-tomonli uzluksiz Two-Lane Bifilar Spiral
    if (isLShape) {
      const xVals = [...new Set(valid.map(p => p.x))].sort((a, b) => a - b);
      const yVals = [...new Set(valid.map(p => p.y))].sort((a, b) => a - b);
      const midX = xVals.find(x => x > minX && x < maxX) || (minX + maxX) / 2;
      const midY = yVals.find(y => y > minY && y < maxY) || (minY + maxY) / 2;

      const p = 0.18 * scale;
      const margin = 0.28 * scale;

      let xL1 = minX * scale + margin;
      let xR1_top = maxX * scale - margin;
      let yB1_top = midY * scale - margin;
      let xR1_bot = midX * scale - margin;
      let yB1_bot = maxY * scale - margin;
      let yT1 = minY * scale + margin;

      let xL2 = xL1 + p;
      let xR2_top = xR1_top - p;
      let yB2_top = yB1_top - p;
      let xR2_bot = xR1_bot - p;
      let yB2_bot = yB1_bot - p;
      let yT2 = yT1 + p;

      const feed: Array<{ x: number; y: number }> = [];
      const ret: Array<{ x: number; y: number }> = [];

      feed.push({ x: mX, y: yT1 });
      ret.push({ x: mX, y: yT2 });

      while (xR2_bot - xL2 >= 2.0 * p && yB2_top - yT2 >= 2.0 * p) {
        // 1. Top
        feed.push({ x: xR1_top, y: yT1 });
        ret.push({ x: xR2_top, y: yT2 });

        // 2. Right
        feed.push({ x: xR1_top, y: yB1_top });
        ret.push({ x: xR2_top, y: yB2_top });

        // 3. Inner Horiz
        feed.push({ x: xR1_bot, y: yB1_top });
        ret.push({ x: xR2_bot, y: yB2_top });

        // 4. Inner Vert
        feed.push({ x: xR1_bot, y: yB1_bot });
        ret.push({ x: xR2_bot, y: yB2_bot });

        // 5. Bottom
        feed.push({ x: xL1, y: yB1_bot });
        ret.push({ x: xL2, y: yB2_bot });

        // 6. Left: step inward for next loop
        feed.push({ x: xL1, y: yT1 + 2 * p });
        ret.push({ x: xL2, y: yT2 + 2 * p });

        xL1 += 2 * p;
        xR1_top -= 2 * p;
        yB1_top -= 2 * p;
        xR1_bot -= 2 * p;
        yB1_bot -= 2 * p;
        yT1 += 2 * p;

        xL2 += 2 * p;
        xR2_top -= 2 * p;
        yB2_top -= 2 * p;
        xR2_bot -= 2 * p;
        yB2_bot -= 2 * p;
        yT2 += 2 * p;
      }

      const lastF = feed[feed.length - 1];
      const lastR = ret[ret.length - 1];
      feed.push({ x: lastF.x + p, y: lastF.y });
      feed.push({ x: lastR.x, y: lastR.y });

      const returnOutward = ret.reverse();

      return [
        {
          id: 'circuit_l_shape_1',
          feedPoints: feed.map(pt => `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`).join(' '),
          returnPoints: returnOutward.map(pt => `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`).join(' '),
        }
      ];
    }

    // 2. Boshqa murakkab poligonlar uchun
    if (!isRectangle) {
      const rings: Array<Array<{ x: number; y: number }>> = [];
      for (let d = 0.28; d <= 2.5; d += 0.18) {
        const r = computeOrthogonalPolygonInset(valid, d);
        if (!r) break;
        let isValid = true;
        for (let k = 0; k < r.length; k++) {
          const nextK = (k + 1) % r.length;
          const origDx = valid[nextK].x - valid[k].x;
          const origDy = valid[nextK].y - valid[k].y;
          const newDx = r[nextK].x - r[k].x;
          const newDy = r[nextK].y - r[k].y;
          if (origDx * newDx < -0.01 || origDy * newDy < -0.01) {
            isValid = false;
            break;
          }
        }
        if (!isValid) break;
        rings.push(r.map(p => ({ x: p.x * scale, y: p.y * scale })));
      }

      if (rings.length >= 2) {
        const polyFeed: Array<{ x: number; y: number }> = [];
        const polyRet: Array<{ x: number; y: number }> = [];

        polyFeed.push({ x: mX, y: rings[0][0].y });
        polyRet.push({ x: mX, y: rings[1][0].y });

        const pairCount = Math.floor(rings.length / 2);
        for (let k = 0; k < pairCount; k++) {
          const rF = rings[2 * k];
          const rR = rings[2 * k + 1];

          for (let i = 0; i < rF.length; i++) {
            polyFeed.push(rF[i]);
            polyRet.push(rR[i]);
          }

          if (k < pairCount - 1) {
            const nextF = rings[2 * (k + 1)];
            const nextR = rings[2 * (k + 1) + 1];
            polyFeed.push({ x: nextF[0].x, y: rF[rF.length - 1].y });
            polyRet.push({ x: nextR[0].x, y: rR[rR.length - 1].y });
          }
        }

        const lastF = polyFeed[polyFeed.length - 1];
        const lastR = polyRet[polyRet.length - 1];
        polyFeed.push({ x: lastF.x, y: lastR.y });
        polyFeed.push({ x: lastR.x, y: lastR.y });

        const polyRetOutward = polyRet.reverse();

        return [
          {
            id: 'circuit_polygon_shape_1',
            feedPoints: polyFeed.map(pt => `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`).join(' '),
            returnPoints: polyRetOutward.map(pt => `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`).join(' '),
          }
        ];
      }
    }

    // 2. Standart to'rtburchak xonalar uchun Two-Lane Bifilar Spiral
    const margin = 0.28 * scale;
    const p = 0.18 * scale; // 18cm quvur oraliq qadami

    let xL1 = minX * scale + margin;
    let xR1 = maxX * scale - margin;
    let yT1 = minY * scale + margin;
    let yB1 = maxY * scale - margin;

    let xL2 = xL1 + p;
    let xR2 = xR1 - p;
    let yT2 = yT1 + p;
    let yB2 = yB1 - p;

    const feed: Array<{ x: number; y: number }> = [];
    const ret: Array<{ x: number; y: number }> = [];

    // 1. Kollektor (KL) shkafiga parallel ulanish (mutlaqo 0 kesishuv)
    feed.push({ x: mX, y: yT1 });
    ret.push({ x: mX, y: yT2 });

    // 2. Parallel spiral qavatlari (0 kesishuv, 0 ustma-ust tushish)
    while (xR2 - xL2 >= 2.5 * p && yB2 - yT2 >= 2.5 * p) {
      feed.push({ x: xR1, y: yT1 });
      ret.push({ x: xR2, y: yT2 });

      feed.push({ x: xR1, y: yB1 });
      ret.push({ x: xR2, y: yB2 });

      // Bottom side: o'ngdan chapga to'liq devor bo'yigacha
      feed.push({ x: xL1, y: yB1 });
      ret.push({ x: xL2, y: yB2 });

      // Left side: pastdan keyingi ichki qavat tepasigacha
      feed.push({ x: xL1, y: yT1 + 2 * p });
      ret.push({ x: xL2, y: yT2 + 2 * p });

      xL1 += 2 * p;
      xR1 -= 2 * p;
      yT1 += 2 * p;
      yB1 -= 2 * p;

      xL2 += 2 * p;
      xR2 -= 2 * p;
      yT2 += 2 * p;
      yB2 -= 2 * p;
    }

    // 3. Markaziy 180° hairpin burilish (Feed -> Return)
    const lastF = feed[feed.length - 1];
    const lastR = ret[ret.length - 1];
    feed.push({ x: lastF.x + p, y: lastF.y });
    feed.push({ x: lastR.x, y: lastR.y });

    // 4. Return quvurini teskari (outward) tartibda kollektorga qaytarish
    const returnOutward = ret.reverse();

    const feedPtsStr = feed.map(pt => `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`).join(' ');
    const retPtsStr = returnOutward.map(pt => `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`).join(' ');

    return [
      {
        id: 'circuit_clean_bifilar_1',
        feedPoints: feedPtsStr,
        returnPoints: retPtsStr,
      }
    ];
  }, [valid, mX, mY, minX, maxX, minY, maxY, scale]);

  return (
    <G>
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

        {/* 2. XONALAR ICHIDAGI KONTURLAR */}
        <G>
          {renderedCircuits.map((circuit, idx) => {
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
