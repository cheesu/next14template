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
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
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

        {/* 메인 컨테이너 - 2D와 3D 나란히 배치 */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* 2D 뷰 영역 */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">2D 다중축 뷰</h3>
            {points2D.length > 0 ? (
              <VesselVisualization2D
                points={points2D}
                selectedPoints={selectedPoints}
                hoveredPoint={hoveredPoint}
                onPointClick={handlePointClick}
                onPointHover={setHoveredPoint}
                diameterCheck={scaleByDiameter}
                compact={true}
              />
            ) : (
              <div className="text-center text-gray-500 py-20">
                JSON 파일을 업로드해주세요
              </div>
            )}
          </div>

          {/* 3D 뷰 영역 */}
          <div>
            <div className="mb-2">
              <h3 className="text-lg font-semibold text-gray-800">3D 시각화</h3>
            </div>
            {vesselPoints.length > 0 ? (
              <VesselVisualization3D
                points={vesselPoints}
                selectedPoints={selectedPoints}
                hoveredPoint={hoveredPoint}
                onPointClick={handlePointClick}
                onPointHover={setHoveredPoint}
                coordinateSystem={coordinateSystem}
                height="600px"
              />
            ) : (
              <div className="bg-gray-900 rounded-lg flex items-center justify-center text-white" style={{ height: '600px' }}>
                JSON 파일을 업로드해주세요
              </div>
            )}
          </div>
        </div>

        {/* 사용법 안내 */}
        {vesselPoints.length > 0 && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="text-sm font-semibold text-blue-900 mb-2">사용법:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h5 className="text-xs font-semibold text-blue-800 mb-1">3D 뷰어:</h5>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>• 마우스 드래그: 회전</li>
                  <li>• 마우스 휠: 줌인/줌아웃</li>
                  <li>• 우클릭 드래그: 카메라 위치 이동 (좌우/상하)</li>
                </ul>
              </div>
              <div>
                <h5 className="text-xs font-semibold text-blue-800 mb-1">공통:</h5>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>• 점 클릭: 선택/해제 (2D/3D 연동)</li>
                  <li>• 점 호버: 번호 + 직경 표시</li>
                  <li>• 좌표계 변경으로 혈관 방향 조정</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* 통계 정보 */}
        {vesselPoints.length > 0 && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{vesselPoints.length}</div>
              <div className="text-gray-600">총 점 개수</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{selectedPoints.size}</div>
              <div className="text-gray-600">선택된 점</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">
                {vesselPoints.length > 0 ? (vesselPoints.reduce((sum, p) => sum + p.d, 0) / vesselPoints.length).toFixed(2) : 0}
              </div>
              <div className="text-gray-600">평균 직경</div>
            </div>
          </div>
        )}

        {/* 선택된 점 표시 */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="text-lg font-semibold text-gray-900">
            {selectedList}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VesselIntegratedPage;