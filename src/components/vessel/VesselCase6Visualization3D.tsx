"use client";
import React, { useRef, Suspense, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Sphere, Html, Line } from "@react-three/drei";
import * as THREE from "three";

interface ProcessedVesselPoint {
  idx: number;
  node_id: string;
  branch_id: string;
  x: number;
  y: number;
  z: number;
  diameter: number;
  position: [number, number, number];
  radius: number;
  branch_classification: number;
  is_aorta: boolean;
  depth: number;
}

interface VesselCase6SphereProps {
  point: ProcessedVesselPoint;
  isSelected: boolean;
  isHovered: boolean;
  coordinateSystem: string;
  showBranchColors: boolean;
}

// 브랜치별 색상 매핑
const getBranchColor = (
  point: ProcessedVesselPoint,
  showBranchColors: boolean
): string => {
  if (!showBranchColors) {
    return point.is_aorta ? "#ff0000" : "#ff6666";
  }

  // 브랜치 ID에 따른 색상 매핑
  const branchColorMap: { [key: string]: string } = {
    A1: "#ff0000", // 메인 동맥 - 빨강
    L1: "#00ff00", // 좌측 메인 - 초록
    R1: "#0000ff", // 우측 메인 - 파랑
    ACC1: "#ff00ff", // 악세사리 - 마젠타
    L1a: "#00ffff", // 좌측 파생1 - 시안
    L1b: "#ffff00", // 좌측 파생2 - 노랑
    R1a: "#ff8000", // 우측 파생1 - 오렌지
    R1b: "#8000ff", // 우측 파생2 - 보라
    ACC1a: "#ff0080", // 악세사리 파생 - 핑크
    "L1a-1": "#80ff80", // 3차 파생 - 연초록
    "R1a-1": "#8080ff", // 3차 파생 - 연파랑
    L2: "#40ff40", // 추가 브랜치 - 밝은 초록
    R2: "#4040ff", // 추가 브랜치 - 밝은 파랑
  };

  return branchColorMap[point.branch_id] || "#888888";
};

const VesselCase6Sphere: React.FC<VesselCase6SphereProps> = ({
  point,
  isSelected,
  isHovered,
  coordinateSystem,
  showBranchColors,
}) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (meshRef.current && (isSelected || isHovered)) {
      meshRef.current.rotation.x += 0.01;
      meshRef.current.rotation.y += 0.01;
    }
  });

  const baseColor = getBranchColor(point, showBranchColors);
  const color = isSelected ? "#ffffff" : isHovered ? "#ffff00" : baseColor;
  const scale = isSelected ? 1.8 : isHovered ? 1.4 : 1;

  // 좌표계 변환
  let transformedPosition: [number, number, number];

  if (coordinateSystem === "medical") {
    transformedPosition = [point.x, point.z, point.y]; // [좌우, 위아래, 앞뒤]
  } else {
    transformedPosition = [point.x, point.y, point.z];
  }

  return (
    <group>
      <Sphere
        ref={meshRef}
        position={transformedPosition}
        args={[point.radius * scale, 16, 16]}
        userData={{ vesselPointIdx: point.idx }}
      >
        <meshStandardMaterial
          color={color}
          emissive={isSelected ? "#333333" : "#000000"}
          roughness={0.3}
          metalness={0.1}
        />
      </Sphere>

      {(isSelected || isHovered) && (
        <Html
          position={[
            transformedPosition[0] + point.radius + 2,
            transformedPosition[1] + point.radius + 2,
            transformedPosition[2],
          ]}
          distanceFactor={10}
          style={{
            color: "white",
            fontSize: "120px",
            fontWeight: "bold",
            userSelect: "none",
            pointerEvents: "none",
            textAlign: "center",
            textShadow: "2px 2px 4px rgba(0,0,0,0.8)",
            backgroundColor: "rgba(0,0,0,0.7)",
            padding: "8px",
            borderRadius: "8px",
            border: "2px solid #fff",
          }}
        >
          <div>
            <div style={{ color: "#ffff00" }}>#{point.idx}</div>
            <div style={{ fontSize: "80px", color: "#00ffff" }}>
              {point.branch_id}
            </div>
            <div style={{ fontSize: "80px", color: "#ffd700" }}>
              Ø{point.diameter.toFixed(1)}mm
            </div>
            <div style={{ fontSize: "60px", color: "#ff8080" }}>
              D{point.depth}
            </div>
          </div>
        </Html>
      )}
    </group>
  );
};

// 브랜치 연결선을 그리는 컴포넌트
const VesselConnections: React.FC<{
  points: ProcessedVesselPoint[];
  coordinateSystem: string;
  showBranchColors: boolean;
}> = ({ points, coordinateSystem, showBranchColors }) => {
  const connections = useMemo(() => {
    const branchGroups: { [key: string]: ProcessedVesselPoint[] } = {};

    // 브랜치별로 점들을 그룹화
    points.forEach((point) => {
      if (!branchGroups[point.branch_id]) {
        branchGroups[point.branch_id] = [];
      }
      branchGroups[point.branch_id].push(point);
    });

    const lines: Array<{
      points: [number, number, number][];
      color: string;
      branchId: string;
    }> = [];

    // 각 브랜치 내에서 점들을 연결
    Object.entries(branchGroups).forEach(([branchId, branchPoints]) => {
      if (branchPoints.length < 2) return;

      // 점들을 idx 순서로 정렬
      const sortedPoints = [...branchPoints].sort((a, b) => a.idx - b.idx);

      const linePoints: [number, number, number][] = sortedPoints.map(
        (point) => {
          if (coordinateSystem === "medical") {
            return [point.x, point.z, point.y];
          } else {
            return [point.x, point.y, point.z];
          }
        }
      );

      const color = getBranchColor(sortedPoints[0], showBranchColors);

      lines.push({
        points: linePoints,
        color,
        branchId,
      });
    });

    return lines;
  }, [points, coordinateSystem, showBranchColors]);

  return (
    <>
      {connections.map((connection, index) => (
        <Line
          key={`${connection.branchId}-${index}`}
          points={connection.points}
          color={connection.color}
          lineWidth={3}
          dashed={false}
        />
      ))}
    </>
  );
};

interface VesselCase6Visualization3DProps {
  points: ProcessedVesselPoint[];
  selectedPoints: Set<number>;
  hoveredPoint: number | null;
  onPointClick: (idx: number) => void;
  onPointHover: (idx: number | null) => void;
  coordinateSystem: string;
  showBranchColors: boolean;
  height?: string;
}

const VesselCase6Scene: React.FC<{
  points: ProcessedVesselPoint[];
  selectedPoints: Set<number>;
  hoveredPoint: number | null;
  onPointClick: (idx: number) => void;
  onPointHover: (idx: number | null) => void;
  coordinateSystem: string;
  showBranchColors: boolean;
}> = ({
  points,
  selectedPoints,
  hoveredPoint,
  onPointClick,
  onPointHover,
  coordinateSystem,
  showBranchColors,
}) => {
  const { camera, raycaster, mouse, scene } = useThree();

  const handleClick = (event: any) => {
    event.stopPropagation();

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);

    for (const intersect of intersects) {
      const userData = intersect.object.userData;
      if (userData && userData.vesselPointIdx) {
        onPointClick(userData.vesselPointIdx);
        return;
      }
    }
  };

  const handlePointerMove = (event: any) => {
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);

    let foundHover = false;
    for (const intersect of intersects) {
      const userData = intersect.object.userData;
      if (userData && userData.vesselPointIdx) {
        onPointHover(userData.vesselPointIdx);
        foundHover = true;
        break;
      }
    }

    if (!foundHover) {
      onPointHover(null);
    }
  };

  return (
    <group onClick={handleClick} onPointerMove={handlePointerMove}>
      {/* 브랜치 연결선 */}
      <VesselConnections
        points={points}
        coordinateSystem={coordinateSystem}
        showBranchColors={showBranchColors}
      />

      {/* 혈관 노드들 */}
      {points.map((point) => (
        <VesselCase6Sphere
          key={point.idx}
          point={point}
          isSelected={selectedPoints.has(point.idx)}
          isHovered={hoveredPoint === point.idx}
          coordinateSystem={coordinateSystem}
          showBranchColors={showBranchColors}
        />
      ))}

      {/* 조명 */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <directionalLight position={[-10, -10, -5]} intensity={0.5} />

      {/* 좌표축 표시 */}
      <axesHelper args={[50]} />
    </group>
  );
};

const VesselCase6Visualization3D: React.FC<VesselCase6Visualization3DProps> = ({
  points,
  selectedPoints,
  hoveredPoint,
  onPointClick,
  onPointHover,
  coordinateSystem,
  showBranchColors,
  height = "500px",
}) => {
  return (
    <div style={{ width: "100%", height }}>
      <Canvas
        camera={{
          position: [100, 100, 100],
          fov: 50,
          near: 0.1,
          far: 2000,
        }}
        style={{ background: "#1a1a1a" }}
      >
        <Suspense fallback={null}>
          <VesselCase6Scene
            points={points}
            selectedPoints={selectedPoints}
            hoveredPoint={hoveredPoint}
            onPointClick={onPointClick}
            onPointHover={onPointHover}
            coordinateSystem={coordinateSystem}
            showBranchColors={showBranchColors}
          />
          <OrbitControls
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            maxDistance={500}
            minDistance={10}
          />
        </Suspense>
      </Canvas>

      {/* 브랜치 색상 범례 */}
      {showBranchColors && (
        <div className="absolute top-4 right-4 bg-black bg-opacity-80 text-white p-4 rounded-lg text-sm">
          <h4 className="font-bold mb-2">브랜치 색상</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-red-500 rounded mr-2"></div>
              <span>A1 (동맥)</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded mr-2"></div>
              <span>L1 (좌측)</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-500 rounded mr-2"></div>
              <span>R1 (우측)</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-pink-500 rounded mr-2"></div>
              <span>ACC1 (악세사리)</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-cyan-500 rounded mr-2"></div>
              <span>L1a</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-yellow-500 rounded mr-2"></div>
              <span>L1b</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-orange-500 rounded mr-2"></div>
              <span>R1a</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-purple-500 rounded mr-2"></div>
              <span>R1b</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VesselCase6Visualization3D;


