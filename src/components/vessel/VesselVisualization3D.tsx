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
  coordinateSystem: string;
}

const VesselSphere: React.FC<VesselSphereProps> = ({
  point,
  isSelected,
  isHovered,
  coordinateSystem,
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame(() => {
    if (meshRef.current && (isSelected || isHovered)) {
      meshRef.current.rotation.x += 0.01;
      meshRef.current.rotation.y += 0.01;
    }
  });

  const color = isSelected ? "#0066ff" : isHovered ? "#0066ff" : "#ff0000";
  const scale = isSelected || isHovered ? 1.5 : 1;

  // 선택된 좌표계에 따른 변환
  let transformedPosition: [number, number, number];
  
  switch(coordinateSystem) {
    case 'RAS': // Right-Anterior-Superior
      transformedPosition = [
        point.position[0],   // Right: 양수 X
        point.position[1],   // Anterior: 양수 Y
        point.position[2]    // Superior: 양수 Z
      ];
      break;
    case 'LPS': // Left-Posterior-Superior  
      transformedPosition = [
        -point.position[0],  // Left: 음수 X
        -point.position[1],  // Posterior: 음수 Y
        point.position[2]    // Superior: 양수 Z
      ];
      break;
    case 'LPI': // Left-Posterior-Inferior
    default:
      transformedPosition = [
        -point.position[0],  // Left: 음수 X
        -point.position[1],  // Posterior: 음수 Y
        -point.position[2]   // Inferior: 음수 Z
      ];
      break;
  }

  return (
    <group>
      <Sphere
        ref={meshRef}
        position={transformedPosition}
        args={[point.radius * scale, 16, 16]}
        userData={{ vesselPointIdx: point.idx }}
      >
        <meshStandardMaterial color={color} />
      </Sphere>
      
      {(isSelected || isHovered) && (
        <Html
          position={[transformedPosition[0] + point.radius + 2, transformedPosition[1] + point.radius + 2, transformedPosition[2]]}
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

const AxisLabels: React.FC<{ coordinateSystem: string }> = ({ coordinateSystem }) => {
  const getAxisLabels = () => {
    switch(coordinateSystem) {
      case 'RAS':
        return {
          x: { pos: [35, 0, 0], label: '+X (Right 오른쪽)' },
          y: { pos: [0, 35, 0], label: '+Y (Anterior 전방)' },
          z: { pos: [0, 0, 35], label: '+Z (Superior 위)' }
        };
      case 'LPS':
        return {
          x: { pos: [-35, 0, 0], label: '-X (Left 왼쪽)' },
          y: { pos: [0, -35, 0], label: '-Y (Posterior 후방)' },
          z: { pos: [0, 0, 35], label: '+Z (Superior 위)' }
        };
      case 'LPI':
      default:
        return {
          x: { pos: [-35, 0, 0], label: '-X (Left 왼쪽)' },
          y: { pos: [0, -35, 0], label: '-Y (Posterior 후방)' },
          z: { pos: [0, 0, -35], label: '-Z (Inferior 아래)' }
        };
    }
  };

  const labels = getAxisLabels();

  return (
    <group>
      {/* X축 라벨 */}
      <Html
        position={labels.x.pos as [number, number, number]}
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
        {labels.x.label}
      </Html>
      
      {/* Y축 라벨 */}
      <Html
        position={labels.y.pos as [number, number, number]}
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
        {labels.y.label}
      </Html>
      
      {/* Z축 라벨 */}
      <Html
        position={labels.z.pos as [number, number, number]}
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
        {labels.z.label}
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
  const { camera, raycaster, mouse, scene, gl } = useThree();
  const groupRef = useRef<THREE.Group>(null);

  // 마우스 이벤트 처리
  const handlePointerMove = React.useCallback((event: any) => {
    const rect = gl.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    
    if (groupRef.current) {
      const intersects = raycaster.intersectObjects(groupRef.current.children, true);
      
      if (intersects.length > 0) {
        // 가장 가까운(첫 번째) 교차점만 선택
        const closestIntersect = intersects[0];
        const userData = closestIntersect.object.userData;
        if (userData && userData.vesselPointIdx !== undefined) {
          onPointHover(userData.vesselPointIdx);
        }
      } else {
        onPointHover(null);
      }
    }
  }, [camera, raycaster, mouse, onPointHover, gl.domElement]);

  const handlePointerClick = React.useCallback((event: any) => {
    const rect = gl.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    
    if (groupRef.current) {
      const intersects = raycaster.intersectObjects(groupRef.current.children, true);
      
      if (intersects.length > 0) {
        // 가장 가까운(첫 번째) 교차점만 선택
        const closestIntersect = intersects[0];
        const userData = closestIntersect.object.userData;
        if (userData && userData.vesselPointIdx !== undefined) {
          onPointClick(userData.vesselPointIdx);
        }
      }
    }
  }, [camera, raycaster, mouse, onPointClick, gl.domElement]);

  React.useEffect(() => {
    const canvas = gl.domElement;
    canvas.addEventListener('pointermove', handlePointerMove);
    canvas.addEventListener('click', handlePointerClick);
    
    return () => {
      canvas.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('click', handlePointerClick);
    };
  }, [handlePointerMove, handlePointerClick, gl.domElement]);

  // 자동으로 카메라 위치를 혈관 데이터에 맞게 조정 (LPS 좌표계)
  React.useEffect(() => {
    if (points.length > 0) {
      const box = new THREE.Box3();
      points.forEach(p => {
        // 선택된 좌표계에 따른 변환으로 bounding box 계산
        let x, y, z;
        switch(coordinateSystem) {
          case 'RAS':
            x = p.position[0]; y = p.position[1]; z = p.position[2];
            break;
          case 'LPS':
            x = -p.position[0]; y = -p.position[1]; z = p.position[2];
            break;
          case 'LPI':
          default:
            x = -p.position[0]; y = -p.position[1]; z = -p.position[2];
            break;
        }
        box.expandByPoint(new THREE.Vector3(x, y, z));
      });
      
      const size = box.getSize(new THREE.Vector3());
      const maxSize = Math.max(size.x, size.y, size.z);
      const distance = maxSize * 1.8;
      
      // 좌표계에 따른 카메라 위치 조정
      switch(coordinateSystem) {
        case 'RAS':
          camera.position.set(distance, distance * 0.8, distance);
          break;
        case 'LPS':
          camera.position.set(-distance, -distance * 0.8, distance);
          break;
        case 'LPI':
        default:
          camera.position.set(-distance, -distance * 0.8, distance);
          break;
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
      <group ref={groupRef}>
        {points.map((point) => (
          <VesselSphere
            key={point.idx}
            point={point}
            isSelected={selectedPoints.has(point.idx)}
            isHovered={hoveredPoint === point.idx}
            coordinateSystem={coordinateSystem}
          />
        ))}
      </group>

      {/* 좌표계 헬퍼 (더 크게) */}
      <axesHelper args={[30]} />
      
      {/* 축 라벨 */}
      <AxisLabels coordinateSystem={coordinateSystem} />
      
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