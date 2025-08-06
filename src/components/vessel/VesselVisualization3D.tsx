"use client";
import React, { useRef, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Sphere, Html } from "@react-three/drei";
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
          <div>
            {point.idx}
            <br />
            <span style={{ fontSize: '80px', color: '#ffd700' }}>
              Ø{point.d.toFixed(1)}
            </span>
          </div>
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

  // 자동으로 카메라 위치를 혈관 데이터에 맞게 조정
  React.useEffect(() => {
    if (points.length > 0) {
      const box = new THREE.Box3();
      points.forEach(p => {
        box.expandByPoint(new THREE.Vector3(p.position[0], p.position[1], p.position[2]));
      });
      
      const size = box.getSize(new THREE.Vector3());
      const maxSize = Math.max(size.x, size.y, size.z);
      const distance = maxSize * 1.8;
      
      // 좌표계에 따라 다른 시점에서 시작
      if (coordinateSystem === 'medical') {
        camera.position.set(distance, distance * 0.5, -distance);
      } else {
        camera.position.set(distance, distance, distance);
      }
      
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

interface VesselVisualization3DProps {
  points: VesselPoint[];
  selectedPoints: Set<number>;
  hoveredPoint: number | null;
  onPointClick: (idx: number) => void;
  onPointHover: (idx: number | null) => void;
  coordinateSystem?: string;
  height?: string;
  showControls?: boolean;
}

const VesselVisualization3D: React.FC<VesselVisualization3DProps> = ({
  points,
  selectedPoints,
  hoveredPoint,
  onPointClick,
  onPointHover,
  coordinateSystem = 'standard',
  height = '600px',
  showControls = true
}) => {
  return (
    <div className="bg-gray-900 rounded-lg overflow-hidden" style={{ height }}>
      <Canvas camera={{ position: [50, 50, 50], fov: 75 }}>
        <Suspense fallback={null}>
          <Scene
            points={points}
            selectedPoints={selectedPoints}
            hoveredPoint={hoveredPoint}
            onPointClick={onPointClick}
            onPointHover={onPointHover}
            coordinateSystem={coordinateSystem}
          />
          {showControls && (
            <OrbitControls 
              enablePan={true}
              enableZoom={true}
              enableRotate={true}
              dampingFactor={0.1}
              screenSpacePanning={true}
            />
          )}
        </Suspense>
      </Canvas>
    </div>
  );
};

export default VesselVisualization3D;