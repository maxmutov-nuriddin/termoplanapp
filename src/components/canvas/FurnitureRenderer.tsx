import React from "react";
import { G, Rect, Text as SvgText, Line } from "react-native-svg";
import { IFurniture } from "../../types";
import { PIXELS_PER_METER } from "../../utils/geometry";

interface FurnitureRendererProps {
  furniture: IFurniture[];
  selectedId?: string | null;
  padding?: number;
}

const FurnitureRendererComponent: React.FC<FurnitureRendererProps> = ({
  furniture,
  selectedId,
  padding = 0,
}) => {
  const scale = PIXELS_PER_METER;

  return (
    <G>
      {(furniture || []).map((item, idx) => {
        const x = (item?.position?.x || 2.0) * scale + padding;
        const y = (item?.position?.y || 2.0) * scale + padding;
        const w = (item.width || 2.0) * scale;
        const h = (item.height || 1.8) * scale;
        const isSelected = selectedId === item.id;
        const rot = item.rotation || 0;

        const centerX = x + w / 2;
        const centerY = y + h / 2;

        if (item.type === "bed") {
          return (
            <G key={item.id || `bed_${idx}`} transform={`rotate(${rot}, ${centerX}, ${centerY})`}>
              {isSelected && (
                <Rect
                  x={x - 4}
                  y={y - 4}
                  width={w + 8}
                  height={h + 8}
                  fill="none"
                  stroke="#0284C7"
                  strokeWidth="2"
                  strokeDasharray="4 2"
                  rx="6"
                />
              )}
              <Rect x={x} y={y} width={w} height={h} fill="#FFFFFF" stroke="#64748B" strokeWidth="1.5" rx="4" />
              <Rect x={x} y={y} width={w} height="10" fill="#475569" rx="2" />
              <Rect x={x + 4} y={y + 14} width={w / 2 - 8} height="14" fill="#F1F5F9" stroke="#CBD5E1" rx="3" />
              <Rect x={x + w / 2 + 4} y={y + 14} width={w / 2 - 8} height="14" fill="#F1F5F9" stroke="#CBD5E1" rx="3" />
              <Line x1={x + 4} y1={y + 36} x2={x + w - 4} y2={y + 36} stroke="#E2E8F0" strokeWidth="1.5" />
              <SvgText x={centerX} y={centerY + 18} fill="#475569" fontSize="7.5" fontWeight="bold" textAnchor="middle">
                🛏️ {item.label || "Krovat"}
              </SvgText>
            </G>
          );
        } else if (item.type === "sofa") {
          return (
            <G key={item.id || `sofa_${idx}`} transform={`rotate(${rot}, ${centerX}, ${centerY})`}>
              {isSelected && (
                <Rect
                  x={x - 4}
                  y={y - 4}
                  width={w + 8}
                  height={h + 8}
                  fill="none"
                  stroke="#0284C7"
                  strokeWidth="2"
                  strokeDasharray="4 2"
                  rx="6"
                />
              )}
              <Rect x={x} y={y} width={w} height={h} fill="#FFFFFF" stroke="#64748B" strokeWidth="1.5" rx="5" />
              <Rect x={x} y={y} width={w} height="12" fill="#64748B" rx="3" />
              <Line x1={centerX} y1={y + 12} x2={centerX} y2={y + h} stroke="#CBD5E1" strokeWidth="1.5" />
              <SvgText x={centerX} y={centerY + 6} fill="#475569" fontSize="7.5" fontWeight="bold" textAnchor="middle">
                🛋️ {item.label || "Divan"}
              </SvgText>
            </G>
          );
        } else {
          return (
            <G key={item.id || `furn_${idx}`} transform={`rotate(${rot}, ${centerX}, ${centerY})`}>
              <Rect x={x} y={y} width={w} height={h} fill="#FFFFFF" stroke="#64748B" strokeWidth="1.5" rx="4" />
              <SvgText x={centerX} y={centerY + 3} fill="#334155" fontSize="8" fontWeight="bold" textAnchor="middle">
                💻 {item.label || "Stol"}
              </SvgText>
            </G>
          );
        }
      })}
    </G>
  );
};

export const FurnitureRenderer = React.memo(FurnitureRendererComponent);
