"use client";
import React, { useRef, useEffect, useCallback } from "react";

interface Point {
  idx: number;
  x: number;
  y: number;
  z: number;
  d: number;
  r: number;
  [key: string]: any; // for dynamic screen coordinates
}

interface Projection {
  a: number;
  b: number;
}

interface VesselVisualization2DProps {
  points: Point[];
  selectedPoints: Set<number>;
  hoveredPoint: number | null;
  onPointClick: (idx: number) => void;
  onPointHover: (idx: number | null) => void;
  diameterCheck?: boolean;
  flipBackground?: boolean;
  bgImages?: {[key: string]: HTMLImageElement | null};
  compact?: boolean; // 작은 크기로 표시할지 여부
}

const VesselVisualization2D: React.FC<VesselVisualization2DProps> = ({
  points,
  selectedPoints,
  hoveredPoint,
  onPointClick,
  onPointHover,
  diameterCheck = true,
  flipBackground = false,
  bgImages = { XY: null, XZ: null, YZ: null },
  compact = false
}) => {
  const canvasXYRef = useRef<HTMLCanvasElement>(null);
  const canvasXZRef = useRef<HTMLCanvasElement>(null);
  const canvasYZRef = useRef<HTMLCanvasElement>(null);

  const uniformRadius = 2;
  const canvasSize = compact ? 200 : 300; // 작은 캔버스 크기
  const mainCanvasSize = compact ? 400 : 600; // XZ View 메인 캔버스 크기

  const canvases = {
    XY: canvasXYRef.current,
    XZ: canvasXZRef.current,
    YZ: canvasYZRef.current,
  };

  const getProjection = (p: Point, view: string): Projection => {
    switch(view) {
      case 'XY': return { a: p.x, b: p.y };
      case 'XZ': return { a: p.x, b: p.z };
      case 'YZ': return { a: p.y, b: p.z };
      default: return { a: 0, b: 0 };
    }
  };

  const computeScreenCoords = (view: string) => {
    const canvas = canvases[view as keyof typeof canvases];
    if (!canvas || points.length === 0) return;

    const padding = 20;
    const w = canvas.width;
    const h = canvas.height;

    const proj = points.map(p => getProjection(p, view));
    const minA = Math.min(...proj.map(p => p.a));
    const maxA = Math.max(...proj.map(p => p.a));
    const minB = Math.min(...proj.map(p => p.b));
    const maxB = Math.max(...proj.map(p => p.b));

    const scaleX = (w - padding * 2) / (maxA - minA || 1);
    const scaleY = (h - padding * 2) / (maxB - minB || 1);

    points.forEach((p, i) => {
      const { a, b } = proj[i];
      p[`screenX_${view}`] = (a - minA) * scaleX + padding;
      p[`screenY_${view}`] = h - ((b - minB) * scaleY + padding);
    });
  };

  const drawView = useCallback((view: string) => {
    const canvas = canvases[view as keyof typeof canvases];
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 배경 이미지
    const bgImage = bgImages[view];
    if (bgImage) {
      if (flipBackground) {
        ctx.save();
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
        ctx.restore();
      } else {
        ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
      }
    }

    computeScreenCoords(view);
    const useDiameter = diameterCheck;

    // 점 그리기
    points.forEach(p => {
      const isHighlight =
        p.idx === hoveredPoint ||
        selectedPoints.has(p.idx);

      const baseRadius = useDiameter ? p.r : uniformRadius;
      const radius = isHighlight ? baseRadius * 1.5 : baseRadius;

      const x = p[`screenX_${view}`];
      const y = p[`screenY_${view}`];

      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = isHighlight ? "blue" : "red";
      ctx.fill();
    });

    // 텍스트는 항상 위에
    points.forEach(p => {
      const isHighlight =
        p.idx === hoveredPoint ||
        selectedPoints.has(p.idx);

      if (isHighlight) {
        const x = p[`screenX_${view}`];
        const y = p[`screenY_${view}`];
        
        // 인덱스 번호와 직경 함께 표시
        const text = `${p.idx} (Ø${p.d.toFixed(1)})`;
        
        ctx.font = compact ? "10px Arial" : "12px Arial";
        ctx.lineWidth = 2;
        ctx.strokeStyle = "white";
        ctx.strokeText(text, x + 6, y - 6);
        ctx.fillStyle = "black";
        ctx.fillText(text, x + 6, y - 6);
      }
    });
  }, [points, hoveredPoint, selectedPoints, diameterCheck, flipBackground, bgImages, canvases, compact]);

  const drawAll = useCallback(() => {
    ['XY', 'XZ', 'YZ'].forEach(drawView);
  }, [drawView]);

  const handleCanvasMouseMove = (view: string) => (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvases[view as keyof typeof canvases];
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    let newHoveredIdx: number | null = null;
    for (const p of points) {
      const x = p[`screenX_${view}`];
      const y = p[`screenY_${view}`];
      const baseRadius = diameterCheck ? p.r : uniformRadius;
      if (Math.hypot(mouseX - x, mouseY - y) < baseRadius + 5) {
        newHoveredIdx = p.idx;
        break;
      }
    }
    onPointHover(newHoveredIdx);
  };

  const handleCanvasMouseLeave = () => {
    onPointHover(null);
  };

  const handleCanvasClick = (view: string) => (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvases[view as keyof typeof canvases];
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    for (const p of points) {
      const x = p[`screenX_${view}`];
      const y = p[`screenY_${view}`];
      const baseRadius = diameterCheck ? p.r : uniformRadius;
      if (Math.hypot(mouseX - x, mouseY - y) < baseRadius + 5) {
        onPointClick(p.idx);
        return;
      }
    }
  };

  useEffect(() => {
    drawAll();
  }, [drawAll]);

  if (compact) {
    // 작은 크기 레이아웃 (통합 뷰용)
    return (
      <div className="space-y-4">
        {/* XZ View (메인) */}
        <div className="text-center">
          <p className="text-sm font-semibold text-gray-700 mb-2">
            XZ View (메인)
          </p>
          <canvas
            ref={canvasXZRef}
            width={mainCanvasSize}
            height={mainCanvasSize}
            onMouseMove={handleCanvasMouseMove('XZ')}
            onMouseLeave={handleCanvasMouseLeave}
            onClick={handleCanvasClick('XZ')}
            className="border border-gray-300 rounded-lg cursor-crosshair shadow-sm"
          />
        </div>

        {/* XY, YZ Views */}
        <div className="grid grid-cols-2 gap-2">
          <div className="text-center">
            <p className="text-xs font-medium text-gray-600 mb-1">XY View</p>
            <canvas
              ref={canvasXYRef}
              width={canvasSize}
              height={canvasSize}
              onMouseMove={handleCanvasMouseMove('XY')}
              onMouseLeave={handleCanvasMouseLeave}
              onClick={handleCanvasClick('XY')}
              className="border border-gray-300 rounded cursor-crosshair"
            />
          </div>

          <div className="text-center">
            <p className="text-xs font-medium text-gray-600 mb-1">YZ View</p>
            <canvas
              ref={canvasYZRef}
              width={canvasSize}
              height={canvasSize}
              onMouseMove={handleCanvasMouseMove('YZ')}
              onMouseLeave={handleCanvasMouseLeave}
              onClick={handleCanvasClick('YZ')}
              className="border border-gray-300 rounded cursor-crosshair"
            />
          </div>
        </div>
      </div>
    );
  }

  // 기본 크기 레이아웃 (원본과 동일)
  return (
    <div className="space-y-10">
      {/* 첫 번째 줄: XZ View (메인, 크게) */}
      <div className="flex justify-center">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-800 mb-4">
            🔍 XZ View (Y제거) - 메인 뷰
          </p>
          <canvas
            ref={canvasXZRef}
            width={mainCanvasSize}
            height={mainCanvasSize}
            onMouseMove={handleCanvasMouseMove('XZ')}
            onMouseLeave={handleCanvasMouseLeave}
            onClick={handleCanvasClick('XZ')}
            className="border-2 border-blue-400 rounded-lg cursor-crosshair shadow-lg"
          />
        </div>
      </div>

      {/* 두 번째 줄: XY, YZ Views (작게) */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 justify-items-center">
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-700 mb-3">
            XY View (Z제거)
          </p>
          <canvas
            ref={canvasXYRef}
            width={canvasSize}
            height={canvasSize}
            onMouseMove={handleCanvasMouseMove('XY')}
            onMouseLeave={handleCanvasMouseLeave}
            onClick={handleCanvasClick('XY')}
            className="border border-gray-300 rounded-lg cursor-crosshair shadow-sm"
          />
        </div>

        <div className="text-center">
          <p className="text-lg font-semibold text-gray-700 mb-3">
            YZ View (X제거)
          </p>
          <canvas
            ref={canvasYZRef}
            width={canvasSize}
            height={canvasSize}
            onMouseMove={handleCanvasMouseMove('YZ')}
            onMouseLeave={handleCanvasMouseLeave}
            onClick={handleCanvasClick('YZ')}
            className="border border-gray-300 rounded-lg cursor-crosshair shadow-sm"
          />
        </div>
      </div>
    </div>
  );
};

export default VesselVisualization2D;