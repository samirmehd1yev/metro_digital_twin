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
  normal: "#2ECC88",
  peak: "#FFB800",
  event: "#FF4444",
  delay: "#FF8C00",
};

function formatYAxis(value: number): string {
  return `${(value / 1000).toFixed(1)}k`;
}

interface TooltipPayloadItem { value: number }
interface CustomTooltipProps { active?: boolean; payload?: TooltipPayloadItem[]; label?: string }

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0c0f16] text-zinc-300 text-[10px] font-mono rounded px-2 py-1 border border-zinc-700/50 shadow-lg">
      {label} — <span className="text-emerald-400">{payload[0].value.toLocaleString()}</span> pax
    </div>
  );
}

export default function ForecastChart({ points, scenario }: Props) {
  if (!points.length) {
    return <div className="h-[120px] w-full bg-zinc-800/20 animate-pulse rounded" />;
  }

  const color = STROKE_COLORS[scenario];

  return (
    <ResponsiveContainer width="100%" height={120}>
      <AreaChart data={points}>
        <CartesianGrid stroke="#ffffff06" />
        <XAxis
          dataKey="hour"
          tick={{ fontSize: 9, fill: "#52525b", fontFamily: "monospace" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={formatYAxis}
          tick={{ fontSize: 9, fill: "#52525b", fontFamily: "monospace" }}
          axisLine={false}
          tickLine={false}
          width={30}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="flow"
          stroke={color}
          strokeWidth={1.5}
          fill={color}
          fillOpacity={0.08}
          dot={{ r: 2.5, fill: color, strokeWidth: 0 }}
          activeDot={{ r: 4, fill: color, stroke: `${color}40`, strokeWidth: 4 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
