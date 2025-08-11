"use client";
import React, { useState, useEffect } from "react";
import VesselVisualization2D from "@/components/vessel/VesselVisualization2D";
import VesselVisualizationVTK from "@/components/vessel/VesselVisualizationVTK";
import coordsData from "@/mock/coords.json";

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

const VesselVTKPage: React.FC = () => {
  const [vesselPoints, setVesselPoints] = useState<VesselPoint[]>([]);
  const [points2D, setPoints2D] = useState<Point[]>([]);
  const [selectedPoints, setSelectedPoints] = useState<Set<number>>(new Set());
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
  const [scaleByDiameter, setScaleByDiameter] = useState<boolean>(true);
  const [coordinateSystem, setCoordinateSystem] = useState<string>('standard');
  const [renderingMode, setRenderingMode] = useState<'points' | 'wireframe'>('points');
  const [useDefaultData, setUseDefaultData] = useState<boolean>(false);
  const [uploadStatus, setUploadStatus] = useState<string>('');

  // 기본 데이터 로드
  useEffect(() => {
    if (useDefaultData) {
      loadCoordinateData(coordsData);
    }
  }, [useDefaultData, coordinateSystem, scaleByDiameter]);

  // 데이터 변경 추적
  useEffect(() => {
    console.log('=== vesselPoints 상태 변경 ===');
    console.log('vesselPoints 길이:', vesselPoints.length);
    console.log('첫 번째 점:', vesselPoints[0]);
  }, [vesselPoints]);

  useEffect(() => {
    console.log('=== points2D 상태 변경 ===');
    console.log('points2D 길이:', points2D.length);
  }, [points2D]);

  const loadCoordinateData = (data: number[][]) => {
    console.log('=== loadCoordinateData 함수 시작 ===');
    console.log('입력 데이터:', data.slice(0, 3), '... (총', data.length, '개)');
    
    try {
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
      
      console.log('중심점:', { centerX, centerY, centerZ });
      
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
          d: d || 2.0, // 기본 직경 설정
          position,
          radius: scaleByDiameter ? Math.max(0.5, (d || 2.0) * 0.3) : 1,
        };
      });
      
      console.log('처리된 점들 샘플:', processedPoints.slice(0, 3));
      console.log('총 처리된 점 개수:', processedPoints.length);
      
      // 3D용 VesselPoint 배열 생성
      console.log('setVesselPoints 호출 전');
      setVesselPoints(processedPoints);
      console.log('setVesselPoints 호출 후');
      
      // 2D용 Point 배열 생성
      const points2DArray: Point[] = processedPoints.map(point => ({
        idx: point.idx,
        x: point.x,
        y: point.y,
        z: point.z,
        d: point.d,
        r: Math.max(2, point.d * 0.5),
      }));
      
      console.log('setPoints2D 호출 전');
      setPoints2D(points2DArray);
      console.log('setPoints2D 호출 후');
      
      setSelectedPoints(new Set());
      
      console.log('=== loadCoordinateData 함수 완료 ===');
    } catch (error) {
      console.error('=== loadCoordinateData 함수 오류 ===');
      console.error(error);
      throw error;
    }
  };

  const loadDefaultData = () => {
    console.log('기본 데이터 로드 시작');
    setUseDefaultData(true);
    setUploadStatus('📊 기본 샘플 데이터 로드 중...');
    loadCoordinateData(coordsData);
    setUploadStatus(`✅ ${coordsData.length}개 기본 데이터 로드 완료!`);
    setTimeout(() => setUploadStatus(''), 3000);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    console.log('=== 파일 업로드 시작 ===');
    console.log('선택된 파일:', file);
    
    if (!file) {
      console.log('파일이 선택되지 않음');
      return;
    }

    setUploadStatus('📁 파일 읽는 중...');
    console.log('파일 정보:', {
      name: file.name,
      size: file.size,
      type: file.type
    });

    const reader = new FileReader();
    
    reader.onerror = (error) => {
      console.error('파일 읽기 에러:', error);
      setUploadStatus('❌ 파일 읽기 실패');
    };
    
    reader.onload = (e) => {
      try {
        console.log('파일 읽기 완료');
        console.log('파일 내용 길이:', e.target?.result?.toString().length);
        
        const data = JSON.parse(e.target?.result as string);
        console.log('JSON 파싱 성공');
        console.log('데이터 타입:', typeof data);
        console.log('데이터 길이:', Array.isArray(data) ? data.length : 'Not Array');
        console.log('첫 번째 요소:', data[0]);
        
        if (!Array.isArray(data)) {
          throw new Error('데이터가 배열이 아닙니다');
        }
        
        if (data.length === 0) {
          throw new Error('빈 배열입니다');
        }
        
        setUploadStatus(`✅ ${data.length}개 점 로드 완료!`);
        setUseDefaultData(false);
        
        console.log('=== loadCoordinateData 호출 전 ===');
        console.log('현재 vesselPoints 길이:', vesselPoints.length);
        
        loadCoordinateData(data);
        
        console.log('=== loadCoordinateData 호출 후 ===');
        
        // 3초 후 상태 메시지 제거
        setTimeout(() => setUploadStatus(''), 3000);
      } catch (error) {
        console.error('=== 파일 처리 오류 ===');
        console.error('오류 상세:', error);
        setUploadStatus('❌ 파일 읽기 실패');
        alert(`JSON 파일을 읽는데 실패했습니다.\n오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
        setTimeout(() => setUploadStatus(''), 3000);
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

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">
          🔬 VTK.js 혈관 3D 모형 - 고급 과학 시각화
        </h2>
        
        {/* 파일 업로드 및 기본 데이터 로드 */}
        <div className="mb-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              JSON 파일 업로드 (혈관 좌표 데이터)
            </label>
            <input
              type="file"
              accept=".json"
              onChange={(e) => {
                handleFileUpload(e);
                // 파일 입력 초기화 (같은 파일을 다시 업로드할 수 있도록)
                e.target.value = '';
              }}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            <p className="text-xs text-gray-500 mt-1">
              형식: [[x,y,z,d], [x,y,z,d], ...] 배열
            </p>
            {uploadStatus && (
              <div className="mt-2 text-sm font-medium text-blue-600">
                {uploadStatus}
              </div>
            )}
          </div>
          <div className="flex items-end">
            <button
              onClick={loadDefaultData}
              className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 transition-colors"
            >
              기본 샘플 데이터 로드
            </button>
          </div>
        </div>

        {/* VTK 전용 컨트롤 */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="text-lg font-semibold text-blue-900 mb-4">🎛️ VTK.js 설정</h4>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">렌더링 모드:</label>
              <select
                value={renderingMode}
                onChange={(e) => setRenderingMode(e.target.value as 'points' | 'wireframe')}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 bg-white"
              >
                <option value="points">포인트 (구체)</option>
                <option value="wireframe">와이어프레임 (선)</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">좌표계:</label>
              <select
                value={coordinateSystem}
                onChange={(e) => setCoordinateSystem(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 bg-white"
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
          </div>

          <div className="mt-4">
            <button
              onClick={resetView}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg text-sm hover:bg-gray-600 transition-colors"
            >
              선택 초기화
            </button>
          </div>
        </div>

        {/* 메인 컨테이너 - VTK 3D와 2D 비교 뷰 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 xl:gap-8">
          {/* VTK 3D 뷰 영역 (메인) */}
          <div className="lg:col-span-2">
            {vesselPoints.length > 0 ? (
              <VesselVisualizationVTK
                points={vesselPoints}
                selectedPoints={selectedPoints}
                hoveredPoint={hoveredPoint}
                onPointClick={handlePointClick}
                onPointHover={setHoveredPoint}
                coordinateSystem={coordinateSystem}
                height="700px"
                renderingMode={renderingMode}
                scaleByDiameter={scaleByDiameter}
              />
            ) : (
              <div className="bg-gray-900 rounded-lg flex items-center justify-center text-white min-h-[700px]">
                <div className="text-center">
                  <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-xl">VTK.js 혈관 3D 시각화</p>
                  <p className="text-gray-400 mt-2">JSON 파일을 업로드하거나 기본 데이터를 로드해주세요</p>
                </div>
              </div>
            )}
          </div>

          {/* 2D 비교 뷰 영역 */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">📊 2D 비교 뷰</h3>
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
              <div className="text-center text-gray-500 py-16">
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p>데이터를 로드해주세요</p>
              </div>
            )}
          </div>

          {/* VTK 정보 */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">🔬 VTK.js 특징</h3>
            <div className="space-y-4 text-sm">
              <div className="p-3 bg-red-50 rounded-lg">
                <h4 className="font-semibold text-red-900 mb-2">기본 색상</h4>
                <ul className="space-y-1 text-red-700">
                  <li>• 🔴 빨간색: 기본 혈관 점</li>
                  <li>• 🔵 파란색: 마우스 오버 / 선택</li>
                  <li>• 크기: 직경에 비례한 구체</li>
                </ul>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <h4 className="font-semibold text-green-900 mb-2">상호작용</h4>
                <ul className="space-y-1 text-green-700">
                  <li>• 마우스 오버: 툴팁 표시</li>
                  <li>• 클릭: 선택 및 고정 툴팁</li>
                  <li>• 드래그: 회전</li>
                  <li>• 휠: 줌인/아웃</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* 통계 정보 */}
        {vesselPoints.length > 0 && (
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
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

            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center">
                <div className="p-3 bg-orange-500 rounded-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <div className="text-lg font-bold text-gray-900">{renderingMode}</div>
                  <div className="text-gray-600 font-medium">렌더링 모드</div>
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

export default VesselVTKPage;
