import React from "react";
import { Text, View } from "react-native";
import Svg, { Circle, Line, Polyline, Text as SvgText } from "react-native-svg";

import { useAppPalette } from "@/hooks/use-app-palette";

type Point = {
  label: string;
  value: number | null;
};

type Props = {
  points: Point[];
  height?: number;
  valueSuffix?: string;
  emptyMessage?: string;
};

export function AnalyticsLineChart({
  points,
  height = 150,
  valueSuffix = "",
  emptyMessage = "Not enough history yet",
}: Props) {
  const palette = useAppPalette();
  const valid = points.filter((point) => point.value != null) as Array<{
    label: string;
    value: number;
  }>;

  if (valid.length < 2) {
    return (
      <View style={{ height, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: palette.textMuted }}>{emptyMessage}</Text>
      </View>
    );
  }

  const width = 320;
  const paddingX = 28;
  const paddingTop = 16;
  const paddingBottom = 28;
  const chartHeight = height - paddingTop - paddingBottom;
  const chartWidth = width - paddingX * 2;
  const values = valid.map((point) => point.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const spread = Math.max(maxValue - minValue, 1);

  const coordinates = valid.map((point, index) => {
    const x =
      paddingX +
      (valid.length === 1 ? chartWidth / 2 : (index / (valid.length - 1)) * chartWidth);
    const normalized = (point.value - minValue) / spread;
    const y = paddingTop + chartHeight - normalized * chartHeight;
    return { ...point, x, y };
  });

  return (
    <View style={{ width: "100%", alignItems: "center" }}>
      <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
        <Line
          x1={paddingX}
          y1={paddingTop + chartHeight}
          x2={width - paddingX}
          y2={paddingTop + chartHeight}
          stroke={palette.surfaceAlt}
          strokeWidth={1}
        />

        <Polyline
          points={coordinates.map((point) => `${point.x},${point.y}`).join(" ")}
          fill="none"
          stroke={palette.primary}
          strokeWidth={3}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {coordinates.map((point, index) => (
          <React.Fragment key={`${point.label}-${index}`}>
            <Circle
              cx={point.x}
              cy={point.y}
              r={4}
              fill={palette.primary}
            />
            <SvgText
              x={point.x}
              y={Math.max(point.y - 9, 10)}
              fill={palette.text}
              fontSize="9"
              textAnchor="middle"
            >
              {`${Math.round(point.value)}${valueSuffix}`}
            </SvgText>
            <SvgText
              x={point.x}
              y={height - 8}
              fill={palette.textMuted}
              fontSize="9"
              textAnchor="middle"
            >
              {point.label}
            </SvgText>
          </React.Fragment>
        ))}
      </Svg>
    </View>
  );
}
