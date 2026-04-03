"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import type { Scenario, ForecastPoint } from "@/lib/types";

interface Props {
  points: ForecastPoint[];
  scenario: Scenario;
}

const STROKE_COLORS: Record<Scenario, string> = {
  normal: "#10b981",
  peak: "#f59e0b",
  event: "#ef4444",
  delay: "#71717a",
};

function formatYAxis(value: number): string {
  return `${(value / 1000).toFixed(1)}k`;
}

interface TooltipPayloadItem {
  value: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-zinc-800 text-white text-xs rounded px-2 py-1 border border-zinc-700">
      {label} &mdash; {payload[0].value.toLocaleString()} sərnişin
    </div>
  );
}

export default function ForecastChart({ points, scenario }: Props) {
  if (!points.length) {
    return (
      <div className="h-[140px] w-full bg-zinc-800 animate-pulse rounded" />
    );
  }

  const color = STROKE_COLORS[scenario];

  return (
    <ResponsiveContainer width="100%" height={140}>
      <AreaChart data={points}>
        <CartesianGrid stroke="transparent" />
        <XAxis
          dataKey="hour"
          tick={{ fontSize: 10, fill: "#71717a" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={formatYAxis}
          tick={{ fontSize: 10, fill: "#71717a" }}
          axisLine={false}
          tickLine={false}
          width={35}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="flow"
          stroke={color}
          strokeWidth={1.5}
          fill={color}
          fillOpacity={0.1}
          dot={{ r: 3, fill: color }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
