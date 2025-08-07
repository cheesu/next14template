"use client";
import React, { useRef, useState, useEffect, useCallback } from "react";

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

const VesselVisualizationPage: React.FC = () => {
  const canvasXYRef = useRef<HTMLCanvasElement>(null);
  const canvasXZRef = useRef<HTMLCanvasElement>(null);
  const canvasYZRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [points, setPoints] = useState<Point[]>([]);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [clickedSet, setClickedSet] = useState<Set<number>>(new Set());
  const [indexInput, setIndexInput] = useState<string>("");
  const [diameterCheck, setDiameterCheck] = useState<boolean>(true);
  const [flipBackground, setFlipBackground] = useState<boolean>(false);
  const [bgImages, setBgImages] = useState<{[key: string]: HTMLImageElement | null}>({
    XY: null,
    XZ: null,
    YZ: null,
  });
  const [canvasSizes, setCanvasSizes] = useState<{[key: string]: {width: number, height: number}}>({
    XY: { width: 300, height: 300 },
    XZ: { width: 600, height: 600 },
    YZ: { width: 300, height: 300 },
  });

  const uniformRadius = 2;
  
  // ITK-SNAP 정보 기반 voxel 크기 (231 × 118 × 209)
  const voxelDimensions = {
    XY: { width: 231, height: 118 }, // mip_axial: x,y
    XZ: { width: 231, height: 209 }, // mip_cor: x,z  
    YZ: { width: 118, height: 209 }  // mip_sagittal: y,z
  };
  
  // 이미지 크기에 맞춰 캔버스 크기 계산
  const getCanvasSizeForView = (view: string, bgImage: HTMLImageElement | null) => {
    if (bgImage) {
      const maxSize = view === 'XZ' ? 600 : 400; // XZ는 메인 뷰이므로 더 크게
      const aspectRatio = bgImage.width / bgImage.height;
      
      if (aspectRatio > 1) {
        // 가로가 더 긴 경우
        return { width: maxSize, height: Math.round(maxSize / aspectRatio) };
      } else {
        // 세로가 더 긴 경우  
        return { width: Math.round(maxSize * aspectRatio), height: maxSize };
      }
    }
    
    // 기본값: voxel 비율 사용
    const voxel = voxelDimensions[view as keyof typeof voxelDimensions];
    const maxSize = view === 'XZ' ? 600 : 300;
    const aspectRatio = voxel.width / voxel.height;
    
    if (aspectRatio > 1) {
      return { width: maxSize, height: Math.round(maxSize / aspectRatio) };
    } else {
      return { width: Math.round(maxSize * aspectRatio), height: maxSize };
    }
  };

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
    
    // ITK-SNAP의 전체 voxel 공간 사용 (중요!)
    const voxel = voxelDimensions[view as keyof typeof voxelDimensions];
    const bgImage = bgImages[view];
    
    // 전체 voxel 공간의 크기 (0부터 최대값까지)
    const fullVoxelWidth = voxel.width;   // 231, 231, 118
    const fullVoxelHeight = voxel.height; // 118, 209, 209
    
    // 실제 이미지가 있으면 그 크기 기준, 없으면 voxel 크기 기준
    let targetWidth, targetHeight;
    if (bgImage) {
      targetWidth = bgImage.width;
      targetHeight = bgImage.height;
    } else {
      targetWidth = fullVoxelWidth;
      targetHeight = fullVoxelHeight;
    }
    
    // 캔버스 크기에 맞춰 스케일 계산 (전체 voxel 공간 기준)
    const scaleX = (w - padding * 2) / targetWidth;
    const scaleY = (h - padding * 2) / targetHeight;
    
    // 종횡비 보정을 위해 통일된 스케일 사용
    const uniformScale = Math.min(scaleX, scaleY);
    
    // 중앙 정렬을 위한 오프셋 계산
    const scaledWidth = targetWidth * uniformScale;
    const scaledHeight = targetHeight * uniformScale;
    const offsetX = (w - scaledWidth) / 2;
    const offsetY = (h - scaledHeight) / 2;

    points.forEach((p, i) => {
      const { a, b } = proj[i];
      
      // voxel 좌표를 이미지 픽셀 좌표로 변환
      const imageX = (a / fullVoxelWidth) * targetWidth;
      const imageY = (b / fullVoxelHeight) * targetHeight;
      
      // 캔버스 좌표로 최종 변환
      p[`screenX_${view}`] = imageX * uniformScale + offsetX;
      // PNG는 우하단이 원점이므로 Y축 방향 보정
      p[`screenY_${view}`] = h - (imageY * uniformScale + offsetY);
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
        p.idx === hoveredIdx ||
        p.idx === selectedIdx ||
        clickedSet.has(p.idx);

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
        p.idx === hoveredIdx ||
        p.idx === selectedIdx ||
        clickedSet.has(p.idx);

      if (isHighlight) {
        const x = p[`screenX_${view}`];
        const y = p[`screenY_${view}`];
        const text = p.idx.toString();
        ctx.font = "12px Arial";
        ctx.lineWidth = 2;
        ctx.strokeStyle = "white";
        ctx.strokeText(text, x + 6, y - 6);
        ctx.fillStyle = "black";
        ctx.fillText(text, x + 6, y - 6);
      }
    });
  }, [points, hoveredIdx, selectedIdx, clickedSet, diameterCheck, flipBackground, bgImages, canvases]);

  const drawAll = useCallback(() => {
    ['XY', 'XZ', 'YZ'].forEach(drawView);
  }, [drawView]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        const processedPoints = data.map(([x, y, z, d]: number[], i: number) => ({
          idx: i + 1,
          x,
          y,
          z,
          d,
          r: Math.max(2, d * 0.5),
        }));
        setPoints(processedPoints);
      } catch (error) {
        alert('JSON 파일을 읽는데 실패했습니다.');
      }
    };
    reader.readAsText(file);
  };

  const handleBackgroundUpload = (view: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // 이미지 로드 후 캔버스 크기 업데이트
        const newSize = getCanvasSizeForView(view, img);
        setCanvasSizes(prev => ({ ...prev, [view]: newSize }));
        setBgImages(prev => ({ ...prev, [view]: img }));
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

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
    setHoveredIdx(newHoveredIdx);
  };

  const handleCanvasMouseLeave = () => {
    setHoveredIdx(null);
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
        setClickedSet(prev => {
          const newSet = new Set(prev);
          if (newSet.has(p.idx)) {
            newSet.delete(p.idx);
          } else {
            newSet.add(p.idx);
          }
          return newSet;
        });
        return;
      }
    }
  };

  const handleIndexInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setIndexInput(value);
    const val = parseInt(value, 10);
    setSelectedIdx(isNaN(val) ? null : val);
  };

  useEffect(() => {
    drawAll();
  }, [drawAll, canvasSizes]);

  const selectedList = clickedSet.size === 0 
    ? "선택된 점: 없음" 
    : `선택된 점: ${Array.from(clickedSet).sort((a, b) => a - b).join(", ")}`;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          🩸 혈관 좌표 3뷰 확인 + 배경 이미지 + 클릭 선택
        </h2>
        
        {/* 파일 업로드 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            JSON 파일 업로드
          </label>
          <input
            type="file"
            accept=".json"
            onChange={handleFileUpload}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>

        {/* 컨트롤 */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">번호 검색:</label>
            <input
              type="number"
              min="1"
              value={indexInput}
              onChange={handleIndexInputChange}
              className="w-20 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="diameterCheck"
              checked={diameterCheck}
              onChange={(e) => setDiameterCheck(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="diameterCheck" className="text-sm font-medium text-gray-700">
              직경 비례 점 크기
            </label>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="flipBackground"
              checked={flipBackground}
              onChange={(e) => setFlipBackground(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="flipBackground" className="text-sm font-medium text-gray-700">
              배경 좌우 반전
            </label>
          </div>
        </div>

        {/* 캔버스 컨테이너 - XZ View 메인으로 변경 */}
        <div className="space-y-10">
          {/* 첫 번째 줄: XZ View (메인, 크게) */}
          <div className="flex justify-center">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-800 mb-4">
                🔍 XZ View (Y제거) - 메인 뷰
              </p>
              <canvas
                ref={canvasXZRef}
                width={canvasSizes.XZ.width}
                height={canvasSizes.XZ.height}
                onMouseMove={handleCanvasMouseMove('XZ')}
                onMouseLeave={handleCanvasMouseLeave}
                onClick={handleCanvasClick('XZ')}
                className="border-2 border-blue-400 rounded-lg cursor-crosshair shadow-lg"
                style={{ width: `${canvasSizes.XZ.width}px`, height: `${canvasSizes.XZ.height}px` }}
              />
              <div className="mt-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleBackgroundUpload('XZ')}
                  className="block w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>
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
                width={canvasSizes.XY.width}
                height={canvasSizes.XY.height}
                onMouseMove={handleCanvasMouseMove('XY')}
                onMouseLeave={handleCanvasMouseLeave}
                onClick={handleCanvasClick('XY')}
                className="border border-gray-300 rounded-lg cursor-crosshair shadow-sm"
                style={{ width: `${canvasSizes.XY.width}px`, height: `${canvasSizes.XY.height}px` }}
              />
              <div className="mt-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleBackgroundUpload('XY')}
                  className="block w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100"
                />
              </div>
            </div>

            <div className="text-center">
              <p className="text-lg font-semibold text-gray-700 mb-3">
                YZ View (X제거)
              </p>
              <canvas
                ref={canvasYZRef}
                width={canvasSizes.YZ.width}
                height={canvasSizes.YZ.height}
                onMouseMove={handleCanvasMouseMove('YZ')}
                onMouseLeave={handleCanvasMouseLeave}
                onClick={handleCanvasClick('YZ')}
                className="border border-gray-300 rounded-lg cursor-crosshair shadow-sm"
                style={{ width: `${canvasSizes.YZ.width}px`, height: `${canvasSizes.YZ.height}px` }}
              />
              <div className="mt-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleBackgroundUpload('YZ')}
                  className="block w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 선택된 점 표시 */}
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <div className="text-lg font-semibold text-gray-900">
            {selectedList}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VesselVisualizationPage; 