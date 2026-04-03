"use client";

import { useEffect, useRef } from "react";

interface Props {
  score: number;
  size?: number;
}

function scoreColor(score: number): string {
  if (score >= 80) return "#2ECC88";
  if (score >= 60) return "#FFB800";
  if (score >= 40) return "#FF8C00";
  return "#FF4444";
}

function scoreGlow(score: number): string {
  if (score >= 80) return "#2ECC8840";
  if (score >= 60) return "#FFB80030";
  if (score >= 40) return "#FF8C0030";
  return "#FF444440";
}

function scoreLabel(score: number): string {
  if (score >= 80) return "HEALTHY";
  if (score >= 60) return "STRESSED";
  if (score >= 40) return "DEGRADED";
  return "CRITICAL";
}

export default function ResilienceGauge({ score, size = 160 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef({ current: 0, target: score });
  const rafRef = useRef(0);

  animRef.current.target = score;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;

    const draw = () => {
      const a = animRef.current;
      a.current += (a.target - a.current) * 0.08;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, size, size);

      const cx = size / 2;
      const cy = size / 2 + 10;
      const r = size * 0.38;
      const startAngle = Math.PI * 0.8;
      const endAngle = Math.PI * 2.2;
      const sweepAngle = endAngle - startAngle;
      const color = scoreColor(a.current);
      const glow = scoreGlow(a.current);

      // Background track
      ctx.beginPath();
      ctx.arc(cx, cy, r, startAngle, endAngle);
      ctx.strokeStyle = "#ffffff0a";
      ctx.lineWidth = 10;
      ctx.lineCap = "round";
      ctx.stroke();

      // Glow
      const valueAngle = startAngle + (a.current / 100) * sweepAngle;
      ctx.beginPath();
      ctx.arc(cx, cy, r, startAngle, valueAngle);
      ctx.strokeStyle = glow;
      ctx.lineWidth = 16;
      ctx.lineCap = "round";
      ctx.stroke();

      // Value arc
      ctx.beginPath();
      ctx.arc(cx, cy, r, startAngle, valueAngle);
      ctx.strokeStyle = color;
      ctx.lineWidth = 8;
      ctx.lineCap = "round";
      ctx.stroke();

      // Tick marks
      for (let i = 0; i <= 10; i++) {
        const angle = startAngle + (i / 10) * sweepAngle;
        const inner = r - 16;
        const outer = r - 12;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(angle) * inner, cy + Math.sin(angle) * inner);
        ctx.lineTo(cx + Math.cos(angle) * outer, cy + Math.sin(angle) * outer);
        ctx.strokeStyle = "#ffffff15";
        ctx.lineWidth = 1;
        ctx.lineCap = "butt";
        ctx.stroke();
      }

      // Score number
      ctx.fillStyle = color;
      ctx.font = `bold ${size * 0.22}px 'Courier New', monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(Math.round(a.current).toString(), cx, cy - 4);

      // Label
      ctx.fillStyle = "#71717a";
      ctx.font = `bold ${size * 0.065}px 'Courier New', monospace`;
      ctx.fillText(scoreLabel(a.current), cx, cy + size * 0.16);

      // Title
      ctx.fillStyle = "#52525b";
      ctx.font = `${size * 0.055}px 'Courier New', monospace`;
      ctx.fillText("RESILIENCE", cx, cy + size * 0.26);

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [size]);

  return <canvas ref={canvasRef} className="mx-auto" />;
}
