"use client";
import React, { useState, useRef, useEffect } from "react";

interface VesselData {
  id: number;
  parent: number;
  x: number;
  y: number;
  length: number;
  angle: number;
  radius: number;
  cut: number[];
}

const VesselTreePage: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const defaultVessels: VesselData[] = [
    { id: 1, parent: 0, x: 0, y: 0, length: 200, angle: 0, radius: 20, cut: [50, 100] },
    { id: 2, parent: 1, x: 200, y: 0, length: 150, angle: -0.3, radius: 20, cut: [50, 120] },
    { id: 3, parent: 1, x: 200, y: 0, length: 150, angle: 0.3, radius: 20, cut: [100] },
  ];

  const [vessels, setVessels] = useState<VesselData[]>(defaultVessels);
  const [jsonInput, setJsonInput] = useState<string>(JSON.stringify(defaultVessels, null, 2));
  const [error, setError] = useState<string>("");

  // 혈관 그리기 함수
  const drawVessel = (
    ctx: CanvasRenderingContext2D,
    vessel: VesselData,
    startX: number,
    startY: number,
    vessels: VesselData[]
  ) => {
    const endX = startX + Math.cos(vessel.angle) * vessel.length;
    const endY = startY + Math.sin(vessel.angle) * vessel.length;

    // 혈관: 흰색 채움 + 검은 테두리
    ctx.strokeStyle = "black";
    ctx.fillStyle = "white";
    ctx.lineWidth = vessel.radius;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    // 절단 표시
    if (vessel.cut) {
      vessel.cut.forEach((d, idx) => {
        const cutX = startX + Math.cos(vessel.angle) * d;
        const cutY = startY + Math.sin(vessel.angle) * d;

        ctx.save();
        ctx.translate(cutX, cutY);
        ctx.rotate(vessel.angle + Math.PI / 2); // 혈관에 수직으로
        ctx.fillStyle = "red";
        ctx.beginPath();
        ctx.ellipse(0, 0, vessel.radius * 0.8, vessel.radius * 0.1, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // 절단 번호
        ctx.fillStyle = "black";
        ctx.font = "14px Arial";
        ctx.fillText((idx + 1).toString(), cutX + 5, cutY - 5);
      });
    }

    // 자식 혈관 그리기
    vessels
      .filter((v) => v.parent === vessel.id)
      .forEach((child) => drawVessel(ctx, child, endX, endY, vessels));
  };

  // Canvas 그리기
  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Canvas 초기화
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 배경 설정
    ctx.fillStyle = "#f8f9fa";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 루트 혈관 찾기 (parent가 0인 것)
    const rootVessel = vessels.find((v) => v.parent === 0);
    if (rootVessel) {
      drawVessel(ctx, rootVessel, 100, 200, vessels);
    }
  };

  // JSON 입력 처리
  const handleJsonSubmit = () => {
    try {
      const parsedVessels = JSON.parse(jsonInput);
      
      // 데이터 유효성 검사
      if (!Array.isArray(parsedVessels)) {
        throw new Error("데이터는 배열 형태여야 합니다.");
      }

      // 각 혈관 데이터 유효성 검사
      parsedVessels.forEach((vessel, index) => {
        const required = ['id', 'parent', 'x', 'y', 'length', 'angle', 'radius'];
        required.forEach(field => {
          if (typeof vessel[field] !== 'number') {
            throw new Error(`${index + 1}번째 혈관의 ${field} 필드가 올바르지 않습니다.`);
          }
        });
        if (!Array.isArray(vessel.cut)) {
          throw new Error(`${index + 1}번째 혈관의 cut 필드는 배열이어야 합니다.`);
        }
      });

      setVessels(parsedVessels);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "JSON 파싱 오류");
    }
  };

  // 기본값 복원
  const resetToDefault = () => {
    setVessels(defaultVessels);
    setJsonInput(JSON.stringify(defaultVessels, null, 2));
    setError("");
  };

  // Canvas 다시 그리기
  useEffect(() => {
    drawCanvas();
  }, [vessels]);

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-xl p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">🌳 혈관 트리 시각화</h1>
        <p className="text-lg text-gray-600 mb-8">
          혈관의 구조와 절단 위치를 시각적으로 표현하고 분석할 수 있습니다.
        </p>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 시각화 영역 */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">혈관 트리 시각화</h2>
            <div className="flex justify-center bg-gray-50 rounded-lg p-4">
              <canvas
                ref={canvasRef}
                width={800}
                height={400}
                className="border border-gray-300 rounded max-w-full h-auto"
                style={{ backgroundColor: '#f8f9fa' }}
              />
            </div>
            <div className="mt-4 text-sm text-gray-600">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-2 bg-white border border-black rounded"></div>
                  <span>혈관</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-1 bg-red-500 rounded-full"></div>
                  <span>절단 위치</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-black text-white text-xs flex items-center justify-center rounded">1</div>
                  <span>절단 번호</span>
                </div>
              </div>
            </div>
          </div>

          {/* 데이터 입력 영역 */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">혈관 데이터 입력</h2>
            
            {/* JSON 입력 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                혈관 데이터 (JSON)
              </label>
              <textarea
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                className="w-full h-64 p-3 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="혈관 데이터를 JSON 형태로 입력하세요..."
              />
            </div>

            {/* 에러 표시 */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* 버튼들 */}
            <div className="flex space-x-3">
              <button
                onClick={handleJsonSubmit}
                className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors duration-200 font-medium"
              >
                적용하기
              </button>
              <button
                onClick={resetToDefault}
                className="flex-1 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors duration-200 font-medium"
              >
                기본값 복원
              </button>
            </div>

            {/* 데이터 형식 설명 */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">데이터 형식 설명</h3>
              <div className="text-xs text-blue-800 space-y-1">
                <p><strong>id:</strong> 혈관 고유 번호</p>
                <p><strong>parent:</strong> 부모 혈관 번호 (루트는 0)</p>
                <p><strong>x, y:</strong> 시작 좌표</p>
                <p><strong>length:</strong> 혈관 길이</p>
                <p><strong>angle:</strong> 각도 (라디안)</p>
                <p><strong>radius:</strong> 혈관 두께</p>
                <p><strong>cut:</strong> 절단 위치 배열</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VesselTreePage;