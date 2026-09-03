import React from 'react';
import { G, Rect, Path, Text as SvgText, Line, Circle } from 'react-native-svg';
import { IWindow, IDoor } from '../../types';
import { PIXELS_PER_METER } from '../../utils/geometry';

interface WindowDoorRendererProps {
  windows: IWindow[];
  doors: IDoor[];
  selectedId?: string | null;
  showDimensions?: boolean;
  padding?: number;
}

const WindowDoorRendererComponent: React.FC<WindowDoorRendererProps> = ({
  windows,
  doors,
  selectedId,
  showDimensions = true,
  padding = 0,
}) => {
  const scale = PIXELS_PER_METER;

  return (
    <G>
      {/* 1. OYNALAR (WINDOWS) */}
      {(windows || []).map((win, idx) => {
        const posX = (win.position?.x || 2.0) * scale + padding;
        const posY = (win.position?.y || 1.0) * scale + padding;
        const wPx = (win.width || 1.4) * scale;
        const rot = win.rotation || 0;
        const isSelected = selectedId === win.id;
        const halfW = wPx / 2;

        const isUpsideDown = (rot > 90 && rot < 270) || (rot < -90 && rot > -270);
        const badgeRot = isUpsideDown ? 180 : 0;

        return (
          <G
            key={win.id || `win_${idx}`}
            transform={`translate(${posX}, ${posY}) rotate(${rot})`}
          >
            {/* Tanlangan paytdagi nurli halqa */}
            {isSelected && (
              <Rect
                x={-halfW - 6}
                y={-10}
                width={wPx + 12}
                height={20}
                fill="rgba(56, 189, 248, 0.2)"
                stroke="#0284C7"
                strokeWidth="1.8"
                strokeDasharray="4 2"
                rx="4"
              />
            )}

            {/* Devor o'rni / Oyna korpusi (CAD Window Sill) */}
            <Rect
              x={-halfW}
              y={-5}
              width={wPx}
              height={10}
              fill="#FFFFFF"
              stroke="#0284C7"
              strokeWidth="1.5"
              rx="2"
            />

            {/* 2 qavatli oyna oynalari */}
            <Line
              x1={-halfW + 2}
              y1={-1.5}
              x2={halfW - 2}
              y2={-1.5}
              stroke="#38BDF8"
              strokeWidth="1.2"
            />
            <Line
              x1={-halfW + 2}
              y1={1.5}
              x2={halfW - 2}
              y2={1.5}
              stroke="#38BDF8"
              strokeWidth="1.2"
            />

            {/* Oyna qirg'oq chekkalari */}
            <Line x1={-halfW} y1={-6} x2={-halfW} y2={6} stroke="#0F172A" strokeWidth="2.5" strokeLinecap="square" />
            <Line x1={halfW} y1={-6} x2={halfW} y2={6} stroke="#0F172A" strokeWidth="2.5" strokeLinecap="square" />

            {/* Oyna o'lchami yozuvi (Har doim o'ng tomoni tepaga qarab turadi) */}
            {showDimensions && (
              <G transform={`translate(0, -14) rotate(${badgeRot})`}>
                <Rect
                  x={-24}
                  y={-8}
                  width={48}
                  height={13}
                  fill="#0284C7"
                  rx={3}
                />
                <SvgText
                  x={0}
                  y={1.5}
                  fill="#FFFFFF"
                  fontSize={7.5}
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  {`🪟 ${Number(win.width || 1.4).toFixed(2)}m`}
                </SvgText>
              </G>
            )}
          </G>
        );
      })}

      {/* 2. ESHIKLAR (DOORS) */}
      {(doors || []).map((door, idx) => {
        const posX = (door.position?.x || 2.0) * scale + padding;
        const posY = (door.position?.y || 2.0) * scale + padding;
        const wPx = (door.width || 0.9) * scale;
        const rot = door.rotation || 0;
        const isSelected = selectedId === door.id;
        const halfW = wPx / 2;

        const openDir = door.openDirection || 'inside_right';

        let isInside = true;
        let isRight = true;

        if (openDir === 'inside_left') {
          isInside = true;
          isRight = false;
        } else if (openDir === 'outside_right') {
          isInside = false;
          isRight = true;
        } else if (openDir === 'outside_left') {
          isInside = false;
          isRight = false;
        }

        const ySign = isInside ? 1 : -1;
        const hingeX = isRight ? halfW : -halfW;
        const openY = ySign * wPx;
        const sweepFlag = isRight ? (isInside ? 1 : 0) : (isInside ? 0 : 1);

        const arcStartX = isRight ? -halfW : halfW;
        const arcStartY = 0;
        const arcEndX = hingeX;
        const arcEndY = openY;

        const arcPath = `M ${arcStartX} ${arcStartY} A ${wPx} ${wPx} 0 0 ${sweepFlag} ${arcEndX} ${arcEndY}`;

        const isUpsideDown = (rot > 90 && rot < 270) || (rot < -90 && rot > -270);
        const badgeRot = isUpsideDown ? 180 : 0;

        return (
          <G
            key={door.id || `door_${idx}`}
            transform={`translate(${posX}, ${posY}) rotate(${rot})`}
          >
            {/* Tanlangan paytdagi nurli indikator */}
            {isSelected && (
              <Rect
                x={-halfW - 6}
                y={-10}
                width={wPx + 12}
                height={20}
                fill="rgba(34, 197, 94, 0.2)"
                stroke="#16A34A"
                strokeWidth="1.8"
                strokeDasharray="4 2"
                rx="4"
              />
            )}

            {/* Eshik teshigi o'rni */}
            <Rect
              x={-halfW}
              y={-4}
              width={wPx}
              height={8}
              fill="#FFFFFF"
              stroke="#16A34A"
              strokeWidth="1.2"
              rx="1"
            />

            {/* Eshik tirgagi chekkalari (Jambs) */}
            <Line x1={-halfW} y1={-6} x2={-halfW} y2={6} stroke="#0F172A" strokeWidth="2.5" strokeLinecap="square" />
            <Line x1={halfW} y1={-6} x2={halfW} y2={6} stroke="#0F172A" strokeWidth="2.5" strokeLinecap="square" />

            {/* Ochilish yoyi (Dotted Swing Arc) */}
            <Path
              d={arcPath}
              fill="none"
              stroke="#16A34A"
              strokeWidth="1.2"
              strokeDasharray="3 3"
              opacity={0.8}
            />

            {/* Ochilgan eshik qanoti (Open Door Leaf) */}
            <Line
              x1={hingeX}
              y1={0}
              x2={hingeX}
              y2={openY}
              stroke="#16A34A"
              strokeWidth="2.4"
              strokeLinecap="round"
            />

            {/* Eshik tutqichi / Menteşa nuqtasi */}
            <Circle cx={hingeX} cy={0} r={2.5} fill="#15803D" />

            {/* Eshik razmeri va yo'nalishi yozuvi (Har doim o'ng tomoni tepada turadi) */}
            {showDimensions && (
              <G transform={`translate(0, ${ySign * (wPx / 2 + 10)}) rotate(${badgeRot})`}>
                <Rect
                  x={-30}
                  y={-7}
                  width={60}
                  height={13}
                  fill="#16A34A"
                  rx={3}
                />
                <SvgText
                  x={0}
                  y={2.5}
                  fill="#FFFFFF"
                  fontSize={7}
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  {`🚪 ${Number(door.width || 0.9).toFixed(2)}m ${isInside ? '↓Ich' : '↑Tash'}`}
                </SvgText>
              </G>
            )}
          </G>
        );
      })}
    </G>
  );
};

export const WindowDoorRenderer = React.memo(WindowDoorRendererComponent);
