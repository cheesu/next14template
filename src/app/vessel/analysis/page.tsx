"use client";
import React, { useState, useRef, useMemo, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Text, Sphere, Html } from "@react-three/drei";
import * as THREE from "three";

interface VesselPoint {
  idx: number;
  x: number;
  y: number;
  z: number;
  d: number;
  position: [number, number, number];
  radius: number;
}

interface VesselSphereProps {
  point: VesselPoint;
  isSelected: boolean;
  isHovered: boolean;
  onClick: () => void;
  onPointerOver: () => void;
  onPointerOut: () => void;
}

const VesselSphere: React.FC<VesselSphereProps> = ({
  point,
  isSelected,
  isHovered,
  onClick,
  onPointerOver,
  onPointerOut,
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame(() => {
    if (meshRef.current && (isSelected || isHovered)) {
      meshRef.current.rotation.x += 0.01;
      meshRef.current.rotation.y += 0.01;
    }
  });

  const color = isSelected ? "#0066ff" : isHovered ? "#ff6600" : "#ff0000";
  const scale = isSelected || isHovered ? 1.5 : 1;

  return (
    <group>
      <Sphere
        ref={meshRef}
        position={point.position}
        args={[point.radius * scale, 16, 16]}
        onClick={onClick}
        onPointerOver={onPointerOver}
        onPointerOut={onPointerOut}
      >
        <meshStandardMaterial color={color} />
      </Sphere>
      
      {(isSelected || isHovered) && (
        <Html
          position={[point.position[0] + point.radius + 2, point.position[1] + point.radius + 2, point.position[2]]}
          distanceFactor={10}
          style={{
            color: 'white',
            fontSize: '120px',
            fontWeight: 'bold',
            userSelect: 'none',
            pointerEvents: 'none',
            textAlign: 'center',
            textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
          }}
        >
          {point.idx}
        </Html>
      )}
    </group>
  );
};

const AxisLabels: React.FC = () => {
  return (
    <group>
      {/* X축 라벨 (좌우) */}
      <Html
        position={[35, 0, 0]}
        distanceFactor={10}
        style={{
          color: 'red',
          fontSize: '16px',
          fontWeight: 'bold',
          userSelect: 'none',
          pointerEvents: 'none',
          textAlign: 'center',
          textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
        }}
      >
        X (좌우)
      </Html>
      
      {/* Y축 라벨 (위아래) */}
      <Html
        position={[0, 35, 0]}
        distanceFactor={10}
        style={{
          color: 'green',
          fontSize: '16px',
          fontWeight: 'bold',
          userSelect: 'none',
          pointerEvents: 'none',
          textAlign: 'center',
          textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
        }}
      >
        Y (위아래)
      </Html>
      
      {/* Z축 라벨 (앞뒤) */}
      <Html
        position={[0, 0, 35]}
        distanceFactor={10}
        style={{
          color: 'blue',
          fontSize: '16px',
          fontWeight: 'bold',
          userSelect: 'none',
          pointerEvents: 'none',
          textAlign: 'center',
          textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
        }}
      >
        Z (앞뒤)
      </Html>
    </group>
  );
};

const Scene: React.FC<{
  points: VesselPoint[];
  selectedPoints: Set<number>;
  hoveredPoint: number | null;
  onPointClick: (idx: number) => void;
  onPointHover: (idx: number | null) => void;
  coordinateSystem: string;
}> = ({ points, selectedPoints, hoveredPoint, onPointClick, onPointHover, coordinateSystem }) => {
  const { camera } = useThree();

  // 자동으로 카메라 위치를 혈관 데이터에 맞게 조정 (데이터가 원점 중심으로 정렬됨)
  React.useEffect(() => {
    if (points.length > 0) {
      // 데이터 범위 계산 (이제 원점 중심이므로 더 간단)
      const box = new THREE.Box3();
      points.forEach(p => {
        box.expandByPoint(new THREE.Vector3(p.position[0], p.position[1], p.position[2]));
      });
      
      const size = box.getSize(new THREE.Vector3());
      const maxSize = Math.max(size.x, size.y, size.z);
      const distance = maxSize * 1.8; // 적절한 거리 (데이터가 중심에 있으므로)
      
      console.log('🎯 데이터 크기:', size, '카메라 거리:', distance);
      
      // 좌표계에 따라 다른 시점에서 시작 (원점 기준)
      if (coordinateSystem === 'medical') {
        // 의료 좌표계: 앞쪽에서 뒤쪽을 바라보는 시점
        camera.position.set(distance, distance * 0.5, -distance);
      } else {
        // 표준 좌표계: 대각선 위에서 내려다보는 시점
        camera.position.set(distance, distance, distance);
      }
      
      // 원점(0,0,0)을 바라봄 - 이제 데이터 중심과 일치!
      camera.lookAt(0, 0, 0);
    }
  }, [points, camera, coordinateSystem]);

  return (
    <>
      {/* 조명 */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 10, 5]} intensity={0.8} />
      <pointLight position={[-10, -10, -5]} intensity={0.5} />

      {/* 혈관 점들 */}
      {points.map((point) => (
        <VesselSphere
          key={point.idx}
          point={point}
          isSelected={selectedPoints.has(point.idx)}
          isHovered={hoveredPoint === point.idx}
          onClick={() => onPointClick(point.idx)}
          onPointerOver={() => onPointHover(point.idx)}
          onPointerOut={() => onPointHover(null)}
        />
      ))}

      {/* 좌표계 헬퍼 (더 크게) */}
      <axesHelper args={[30]} />
      
      {/* 축 라벨 */}
      <AxisLabels />
      
      {/* 중심점 표시 (작은 노란 구체) */}
      <Sphere position={[0, 0, 0]} args={[0.5]}>
        <meshBasicMaterial color="yellow" />
      </Sphere>
      
      {/* 그리드 (XZ 평면) */}
      <gridHelper args={[100, 20, "#888888", "#444444"]} rotation={[0, 0, 0]} />
      
      {/* XY 평면 그리드 (세로) */}
      <gridHelper args={[100, 20, "#888888", "#444444"]} rotation={[Math.PI/2, 0, 0]} />
      
      {/* YZ 평면 그리드 (옆면) */}
      <gridHelper args={[100, 20, "#888888", "#444444"]} rotation={[0, Math.PI/2, Math.PI/2]} />
    </>
  );
};

const VesselAnalysisPage: React.FC = () => {
  const [points, setPoints] = useState<VesselPoint[]>([]);
  const [selectedPoints, setSelectedPoints] = useState<Set<number>>(new Set());
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
  const [scaleByDiameter, setScaleByDiameter] = useState<boolean>(true);
  const [coordinateSystem, setCoordinateSystem] = useState<string>('standard'); // 'standard' or 'medical'

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        
        // 🎯 1단계: 데이터 중심점 계산
        let centerX = 0, centerY = 0, centerZ = 0;
        data.forEach(([x, y, z]: number[]) => {
          centerX += x;
          centerY += y;
          centerZ += z;
        });
        centerX /= data.length;
        centerY /= data.length;
        centerZ /= data.length;
        
        console.log('🎯 데이터 중심점:', { centerX, centerY, centerZ });
        
        // 🎯 2단계: 중심점을 원점으로 이동시켜서 점들 생성
        const processedPoints: VesselPoint[] = data.map(([x, y, z, d]: number[], i: number) => {
          // 원본 좌표에서 중심점을 빼서 원점 중심으로 이동
          const centeredX = x - centerX;
          const centeredY = y - centerY;
          const centeredZ = z - centerZ;
          
          // 좌표계 변환 (이제 중심이 맞춰진 좌표로)
          let position: [number, number, number];
          if (coordinateSystem === 'medical') {
            // 의료 좌표계: X는 그대로, Y(전후)→Z, Z(위아래)→Y
            position = [centeredX, centeredZ, centeredY]; // [좌우, 위아래, 앞뒤]
          } else {
            // 표준 좌표계: 중심이 맞춰진 좌표
            position = [centeredX, centeredY, centeredZ];
          }
          
          return {
            idx: i + 1,
            x: centeredX,  // 중심이 맞춰진 좌표 저장
            y: centeredY,
            z: centeredZ,
            d,
            position,
            radius: scaleByDiameter ? Math.max(0.5, d * 0.3) : 1,
          };
        });
        
        console.log('🎯 중심 맞춤 완료! 점 개수:', processedPoints.length);
        setPoints(processedPoints);
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
  React.useEffect(() => {
    if (points.length > 0) {
      const updatedPoints = points.map(point => {
        let position: [number, number, number];
        if (coordinateSystem === 'medical') {
          position = [point.x, point.z, point.y]; // [좌우, 위아래, 앞뒤]
        } else {
          position = [point.x, point.y, point.z];
        }
        return { ...point, position };
      });
      setPoints(updatedPoints);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coordinateSystem]);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          🩸 3D 혈관 분석 시각화
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

        {/* 3D 캔버스 */}
        <div className="bg-gray-900 rounded-lg overflow-hidden" style={{ height: '600px' }}>
          <Canvas camera={{ position: [50, 50, 50], fov: 75 }}>
            <Suspense fallback={null}>
              <Scene
                points={points}
                selectedPoints={selectedPoints}
                hoveredPoint={hoveredPoint}
                onPointClick={handlePointClick}
                onPointHover={setHoveredPoint}
                coordinateSystem={coordinateSystem}
              />
              <OrbitControls 
                enablePan={true}
                enableZoom={true}
                enableRotate={true}
                dampingFactor={0.1}
                screenSpacePanning={true}
              />
            </Suspense>
          </Canvas>
        </div>

        {/* 좌표계 설명 */}
        <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
          <h4 className="text-sm font-semibold text-yellow-900 mb-2">좌표계 정보:</h4>
          <div className="text-sm text-yellow-800">
            {coordinateSystem === 'medical' ? (
              <div>
                <p>• <span className="text-red-600 font-bold">빨간색 X축</span>: 좌우 방향</p>
                <p>• <span className="text-green-600 font-bold">초록색 Y축</span>: 위아래 방향 (원본 Z축)</p>
                <p>• <span className="text-blue-600 font-bold">파란색 Z축</span>: 앞뒤 방향 (원본 Y축)</p>
                <p>• <span className="text-gray-600">회색 격자</span>: 바닥면 (XZ 평면)</p>
              </div>
            ) : (
              <div>
                <p>• <span className="text-red-600 font-bold">빨간색 X축</span>: 좌우 방향</p>
                <p>• <span className="text-green-600 font-bold">초록색 Y축</span>: 위아래 방향</p>
                <p>• <span className="text-blue-600 font-bold">파란색 Z축</span>: 앞뒤 방향</p>
                <p>• <span className="text-gray-600">회색 격자</span>: 바닥면 (XZ 평면)</p>
              </div>
            )}
          </div>
        </div>

        {/* 사용법 안내 */}
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <h4 className="text-sm font-semibold text-blue-900 mb-2">사용법:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• 마우스 드래그: 회전</li>
            <li>• 마우스 휠: 줌인/줌아웃</li>
            <li>• 우클릭 드래그: 카메라 위치 이동 (좌우/상하)</li>
            <li>• 점 클릭: 선택/해제</li>
            <li>• 점 호버: 번호 + 직경 표시</li>
            <li>• 좌표계 변경: 혈관 방향이 이상하면 &quot;의료&quot; 좌표계 선택</li>
          </ul>
        </div>

        {/* 통계 정보 */}
        {points.length > 0 && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{points.length}</div>
              <div className="text-gray-600">총 점 개수</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{selectedPoints.size}</div>
              <div className="text-gray-600">선택된 점</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">
                {points.length > 0 ? (points.reduce((sum, p) => sum + p.d, 0) / points.length).toFixed(2) : 0}
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

export default VesselAnalysisPage; 