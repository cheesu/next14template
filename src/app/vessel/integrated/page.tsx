"use client";
import React, { useState, useEffect } from "react";
import VesselVisualization2D from "@/components/vessel/VesselVisualization2D";
import VesselVisualization3D from "@/components/vessel/VesselVisualization3D";

interface VesselPoint {
  idx: number;
  x: number;
  y: number;
  z: number;
  d: number;
  position: [number, number, number];
  radius: number;
}

// 2D와 3D 뷰어가 호환되는 Point 인터페이스
interface Point {
  idx: number;
  x: number;
  y: number;
  z: number;
  d: number;
  r: number;
  [key: string]: any;
}

const VesselIntegratedPage: React.FC = () => {
  const [vesselPoints, setVesselPoints] = useState<VesselPoint[]>([]);
  const [points2D, setPoints2D] = useState<Point[]>([]);
  const [selectedPoints, setSelectedPoints] = useState<Set<number>>(new Set());
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
  const [scaleByDiameter, setScaleByDiameter] = useState<boolean>(true);
  const [coordinateSystem, setCoordinateSystem] = useState<string>('standard');

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        
        // 데이터 중심점 계산
        let centerX = 0, centerY = 0, centerZ = 0;
        data.forEach(([x, y, z]: number[]) => {
          centerX += x;
          centerY += y;
          centerZ += z;
        });
        centerX /= data.length;
        centerY /= data.length;
        centerZ /= data.length;
        
        // 중심점을 원점으로 이동시켜서 점들 생성
        const processedPoints: VesselPoint[] = data.map(([x, y, z, d]: number[], i: number) => {
          const centeredX = x - centerX;
          const centeredY = y - centerY;
          const centeredZ = z - centerZ;
          
          let position: [number, number, number];
          if (coordinateSystem === 'medical') {
            position = [centeredX, centeredZ, centeredY];
          } else {
            position = [centeredX, centeredY, centeredZ];
          }
          
          return {
            idx: i + 1,
            x: centeredX,
            y: centeredY,
            z: centeredZ,
            d,
            position,
            radius: scaleByDiameter ? Math.max(0.5, d * 0.3) : 1,
          };
        });
        
        // 3D용 VesselPoint 배열 생성
        setVesselPoints(processedPoints);
        
        // 2D용 Point 배열 생성
        const points2DArray: Point[] = processedPoints.map(point => ({
          idx: point.idx,
          x: point.x,
          y: point.y,
          z: point.z,
          d: point.d,
          r: Math.max(2, point.d * 0.5),
        }));
        setPoints2D(points2DArray);
        
        setSelectedPoints(new Set());
      } catch (error) {
        alert('JSON 파일을 읽는데 실패했습니다.');
      }
    };
    reader.readAsText(file);
  };

  const handlePointClick = (idx: number) => {
    setSelectedPoints(prev => {
      const newSet = new Set(prev);
      if (newSet.has(idx)) {
        newSet.delete(idx);
      } else {
        newSet.add(idx);
      }
      return newSet;
    });
  };

  const selectedList = selectedPoints.size === 0 
    ? "선택된 점: 없음" 
    : `선택된 점: ${Array.from(selectedPoints).sort((a, b) => a - b).join(", ")}`;

  const resetView = () => {
    setSelectedPoints(new Set());
    setHoveredPoint(null);
  };

  // 좌표계 변경 시 점들 다시 계산
  useEffect(() => {
    if (vesselPoints.length > 0) {
      const updatedVesselPoints = vesselPoints.map(point => {
        let position: [number, number, number];
        if (coordinateSystem === 'medical') {
          position = [point.x, point.z, point.y]; // [좌우, 위아래, 앞뒤]
        } else {
          position = [point.x, point.y, point.z];
        }
        return { ...point, position };
      });
      setVesselPoints(updatedVesselPoints);
    }
  }, [coordinateSystem]);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">
          🩸 통합 혈관 분석 - 2D + 3D 동시 뷰
        </h2>
        
        {/* 파일 업로드 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            JSON 파일 업로드 (혈관 좌표 데이터)
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
            <label className="text-sm font-medium text-gray-700">좌표계:</label>
            <select
              value={coordinateSystem}
              onChange={(e) => setCoordinateSystem(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="standard">표준 (XYZ)</option>
              <option value="medical">의료 (X좌우, Z위아래, Y앞뒤)</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="scaleByDiameter"
              checked={scaleByDiameter}
              onChange={(e) => setScaleByDiameter(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="scaleByDiameter" className="text-sm font-medium text-gray-700">
              직경 비례 크기
            </label>
          </div>

          <button
            onClick={resetView}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg text-sm hover:bg-gray-600 transition-colors"
          >
            선택 초기화
          </button>
        </div>

        {/* 메인 컨테이너 - 반응형 2D와 3D 배치 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 xl:gap-8">
          {/* 2D 뷰 영역 */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 lg:p-8 order-2 lg:order-1 shadow-sm">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">📊 2D 다중축 뷰</h3>
            {points2D.length > 0 ? (
              <div className="w-full">
                <VesselVisualization2D
                  points={points2D}
                  selectedPoints={selectedPoints}
                  hoveredPoint={hoveredPoint}
                  onPointClick={handlePointClick}
                  onPointHover={setHoveredPoint}
                  diameterCheck={scaleByDiameter}
                  compact={true}
                />
              </div>
            ) : (
              <div className="text-center text-gray-500 py-16 lg:py-20">
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p>JSON 파일을 업로드해주세요</p>
              </div>
            )}
          </div>

          {/* 3D 뷰 영역 */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 lg:p-8 order-1 lg:order-2 shadow-sm">
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-900">🎯 3D 시각화</h3>
            </div>
            <div className="w-full">
              {vesselPoints.length > 0 ? (
                <VesselVisualization3D
                  points={vesselPoints}
                  selectedPoints={selectedPoints}
                  hoveredPoint={hoveredPoint}
                  onPointClick={handlePointClick}
                  onPointHover={setHoveredPoint}
                  coordinateSystem={coordinateSystem}
                  height="500px"
                />
              ) : (
                <div className="bg-gray-900 rounded-lg flex items-center justify-center text-white min-h-[500px]">
                  <div className="text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p>JSON 파일을 업로드해주세요</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 사용법 안내 - 반응형 개선 */}
        {vesselPoints.length > 0 && (
          <div className="mt-8 p-6 bg-blue-50 rounded-xl border border-blue-200 shadow-sm">
            <div className="flex items-center mb-4">
              <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h4 className="text-base font-semibold text-blue-900">사용법 안내</h4>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h5 className="text-sm font-semibold text-blue-800 mb-3 flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                  3D 뷰어 조작법
                </h5>
                <ul className="text-sm text-blue-700 space-y-2">
                  <li className="flex items-start">
                    <span className="text-blue-500 mr-2">•</span>
                    <span><strong>마우스 드래그:</strong> 3D 모델 회전</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-500 mr-2">•</span>
                    <span><strong>마우스 휠:</strong> 줌인/줌아웃</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-500 mr-2">•</span>
                    <span><strong>우클릭 드래그:</strong> 카메라 위치 이동</span>
                  </li>
                </ul>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h5 className="text-sm font-semibold text-blue-800 mb-3 flex items-center">
                  <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                  공통 기능
                </h5>
                <ul className="text-sm text-blue-700 space-y-2">
                  <li className="flex items-start">
                    <span className="text-purple-500 mr-2">•</span>
                    <span><strong>점 클릭:</strong> 선택/해제 (2D/3D 연동)</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-purple-500 mr-2">•</span>
                    <span><strong>점 호버:</strong> 번호 + 직경 표시</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-purple-500 mr-2">•</span>
                    <span><strong>좌표계 변경:</strong> 혈관 방향 조정</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* 통계 정보 - 반응형 그리드 */}
        {vesselPoints.length > 0 && (
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center">
                <div className="p-3 bg-blue-500 rounded-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <div className="text-3xl font-bold text-gray-900">{vesselPoints.length}</div>
                  <div className="text-gray-600 font-medium">총 점 개수</div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center">
                <div className="p-3 bg-purple-500 rounded-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="ml-4">
                  <div className="text-3xl font-bold text-gray-900">{selectedPoints.size}</div>
                  <div className="text-gray-600 font-medium">선택된 점</div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm sm:col-span-2 lg:col-span-1">
              <div className="flex items-center">
                <div className="p-3 bg-green-500 rounded-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <div className="text-3xl font-bold text-gray-900">
                    {vesselPoints.length > 0 ? (vesselPoints.reduce((sum, p) => sum + p.d, 0) / vesselPoints.length).toFixed(2) : 0}
                  </div>
                  <div className="text-gray-600 font-medium">평균 직경</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 선택된 점 표시 */}
        <div className="mt-8 p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="text-lg font-semibold text-gray-900">
            {selectedList}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VesselIntegratedPage;