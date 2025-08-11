"use client";
import React, { useRef, useEffect, useState } from "react";
// VTK.js 렌더링 프로파일을 전역 등록 (필수)
import '@kitware/vtk.js/Rendering/Profiles/All';

interface VesselPoint {
  idx: number;
  x: number;
  y: number;
  z: number;
  d: number;
  position: [number, number, number];
  radius: number;
}

interface VesselVisualizationVTKProps {
  points: VesselPoint[];
  selectedPoints: Set<number>;
  hoveredPoint: number | null;
  onPointClick?: (idx: number) => void;
  onPointHover?: (idx: number | null) => void;
  coordinateSystem?: string;
  height?: string;
  renderingMode?: 'points' | 'wireframe';
  scaleByDiameter?: boolean;
}

const VesselVisualizationVTK: React.FC<VesselVisualizationVTKProps> = ({
  points,
  selectedPoints,
  hoveredPoint,
  onPointClick = () => {},
  onPointHover = () => {},
  coordinateSystem = 'standard',
  height = '600px',
  renderingMode = 'points',
  scaleByDiameter = true
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);
  const vtkObjectsRef = useRef<any>({});
  const fsrwRef = useRef<any>(null);
  const actorMapRef = useRef<Map<any, { idx: number; x: number; y: number; z: number; d: number }>>(new Map());
  const selectedSetRef = useRef<Set<number>>(new Set());
  const hoveredActorRef = useRef<any>(null);
  const [tooltips, setTooltips] = useState<{
    [key: number]: {
      x: number;
      y: number;
      idx: number;
      coord: [number, number, number];
      d: number;
      pinned: boolean;
      worldPos: [number, number, number];
    };
  }>({});
  const [hoverTooltip, setHoverTooltip] = useState<{
    x: number;
    y: number;
    idx: number;
    coord: [number, number, number];
    d: number;
    pinned: boolean;
  } | null>(null);

  // selectedPoints와 hoveredPoint prop 변경 시 3D 뷰 업데이트
  useEffect(() => {
    if (!vtkObjectsRef.current?.actors || !fsrwRef.current) return;
    
    // 모든 액터의 색상을 기본값으로 리셋
    vtkObjectsRef.current.actors.forEach(({ actor, idx }: { actor: any; idx: number }) => {
      if (selectedPoints.has(idx)) {
        // 선택된 상태: 파란색
        actor.getProperty().setColor(0, 0.4, 1);
      } else if (hoveredPoint === idx) {
        // 호버된 상태: 파란색
        actor.getProperty().setColor(0, 0.4, 1);
      } else {
        // 기본 상태: 빨간색
        actor.getProperty().setColor(0.8, 0.1, 0.1);
      }
    });
    
    // selectedSetRef 동기화
    selectedSetRef.current = new Set(selectedPoints);
    
    // 선택된 항목들의 고정 툴팁 업데이트
    const currentTooltips = { ...tooltips };
    
    // 선택 해제된 항목들의 툴팁 제거
    Object.keys(currentTooltips).forEach(key => {
      const idx = parseInt(key);
      if (!selectedPoints.has(idx)) {
        delete currentTooltips[idx];
      }
    });
    
    // 새로 선택된 항목들의 툴팁 추가 (단, 화면 좌표는 나중에 계산)
    selectedPoints.forEach(idx => {
      if (!currentTooltips[idx]) {
        const pointData = points.find(p => p.idx === idx);
        if (pointData) {
          currentTooltips[idx] = {
            x: 0, // 임시값, updateTooltipPositions에서 계산됨
            y: 0, // 임시값
            idx: idx,
            coord: [pointData.x, pointData.y, pointData.z],
            d: pointData.d,
            pinned: true,
            worldPos: [pointData.x, pointData.y, pointData.z]
          };
        }
      }
    });
    
    setTooltips(currentTooltips);
    
    if (fsrwRef.current) {
      fsrwRef.current.render();
    }
  }, [selectedPoints, hoveredPoint, points]);

  useEffect(() => {
    if (points.length === 0) {
      console.log('포인트 없음 - VTK 초기화 안함');
      return;
    }

    const initVTK = async () => {
      try {
        console.log('🚀 VTK.js 정말 기본부터 시작');
        
        if (!containerRef.current) {
          console.log('컨테이너 없음');
          return;
        }

        // 이미 초기화되었다면 재초기화하지 않음
        if (fsrwRef.current) {
          console.log('ℹ️ 이미 초기화된 VTK 컨텍스트가 있어 재사용합니다');
          setIsReady(true);
          return;
        }

        console.log('1️⃣ VTK.js 모듈 로드 시작');
        // 렌더링 프로파일을 반드시 등록해야 WebGL 매퍼/패스가 붙습니다
        const dynamicImport: (m: string) => Promise<any> = (m) => (Function('return import(arguments[0])') as any)(m);
        await dynamicImport('@kitware/vtk.js/Rendering/Profiles/Geometry').catch(() => {
          console.log('⚠️ Rendering Profiles(Geometry) 로드 실패 - 계속 진행');
        });
        // WebGL 백엔드 등록: Rendering Profiles (필수)
        // 타입 선언 이슈로 프로필 로드는 생략 (필수는 아님)
        const [
          vtkRenderWindow,
          vtkRenderer,
          vtkOpenGLRenderWindow,
          vtkRenderWindowInteractor,
          vtkInteractorStyleTrackballCamera,
          vtkSphereSource,
          vtkMapper,
          vtkActor,
          vtkCellPicker,
        ] = await Promise.all([
          import('@kitware/vtk.js/Rendering/Core/RenderWindow'),
          import('@kitware/vtk.js/Rendering/Core/Renderer'),
          import('@kitware/vtk.js/Rendering/OpenGL/RenderWindow'),
          import('@kitware/vtk.js/Rendering/Core/RenderWindowInteractor'),
          import('@kitware/vtk.js/Interaction/Style/InteractorStyleTrackballCamera'),
          import('@kitware/vtk.js/Filters/Sources/SphereSource'),
          import('@kitware/vtk.js/Rendering/Core/Mapper'),
          import('@kitware/vtk.js/Rendering/Core/Actor'),
          import('@kitware/vtk.js/Rendering/Core/CellPicker'),
        ]);
        console.log('✅ 저수준 모듈 로드 완료');

        console.log('2️⃣ 컨테이너 준비 완료');
        const container = containerRef.current;

        console.log('3️⃣ RenderWindow / OpenGLRenderWindow 구성');
        const renderWindow = vtkRenderWindow.default.newInstance();
        const renderer = vtkRenderer.default.newInstance();
        renderWindow.addRenderer(renderer);
        const openGLRenderWindow = vtkOpenGLRenderWindow.default.newInstance();
        openGLRenderWindow.setContainer(container);
        renderWindow.addView(openGLRenderWindow);
        // 크기 설정
        const rect = container.getBoundingClientRect();
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        openGLRenderWindow.setSize(
          Math.max(1, Math.floor(rect.width * dpr)),
          Math.max(1, Math.floor(rect.height * dpr))
        );
        // 배경색 설정
        renderer.setBackground(0.9, 0.9, 0.9);
        
        console.log('4️⃣ 모든 포인트에 대해 구체 생성');
        const actors: Array<{ actor: any; idx: number }> = [];

        // 직경 정규화(상대 스케일)
        const ds = points.map((p) => p.d);
        const dMin = Math.min(...ds);
        const dMax = Math.max(...ds);
        const dRange = Math.max(1e-6, dMax - dMin);
        const minRadius = 0.8; // world unit
        const maxRadius = 6.0; // world unit

        for (let i = 0; i < points.length; i += 1) {
          const p0 = points[i];
          // 좌표계 변환
          const p = coordinateSystem === 'medical'
            ? { ...p0, x: p0.x, y: -p0.z, z: p0.y }
            : p0;
          const t = (p.d - dMin) / dRange;
          const radius = scaleByDiameter ? (minRadius + t * (maxRadius - minRadius)) : 3.0;

          const sphereSource = vtkSphereSource.default.newInstance({
            center: [p.x, p.y, p.z],
            radius,
            phiResolution: 12,
            thetaResolution: 12,
          });
          const mapper = vtkMapper.default.newInstance();
          mapper.setInputConnection(sphereSource.getOutputPort());
          const actor = vtkActor.default.newInstance();
          actor.setMapper(mapper);
          // 기본 매트 빨간색
          const prop = actor.getProperty();
          prop.setColor(0.8, 0.1, 0.1);
          prop.setSpecular(0.0);
          prop.setDiffuse(0.8);
          prop.setAmbient(0.2);
          renderer.addActor(actor);
          actors.push({ actor, idx: p.idx });
          actorMapRef.current.set(actor, { idx: p.idx, x: p.x, y: p.y, z: p.z, d: p.d });
        }
        
        console.log('8️⃣ 카메라 리셋');
        renderer.resetCamera();
        
        console.log('9️⃣ 인터랙터 설정 및 렌더링 시도');
        const interactor = vtkRenderWindowInteractor.default.newInstance();
        interactor.setView(openGLRenderWindow);
        interactor.initialize();
        interactor.bindEvents(container);
        interactor.setInteractorStyle(
          vtkInteractorStyleTrackballCamera.default.newInstance()
        );
        renderWindow.render();
        
        console.log('🎉 VTK.js 렌더링 성공!');
        
        // 참조 저장
        vtkObjectsRef.current = { renderer, renderWindow, openGLRenderWindow, interactor, actors };

        // 피커 설정 및 이벤트 바인딩
        const cellPicker = vtkCellPicker.default.newInstance();

        const handleWheel = (e: WheelEvent) => {
          e.preventDefault();
          e.stopPropagation();
        };

        const getPickedActor = () => {
          // vtkCellPicker: 일부 버전은 getActor(), 일부는 getActors() 제공
          const actors = (cellPicker as any).getActors?.() as any[] | undefined;
          if (actors && actors.length) return actors[0];
          const actor = (cellPicker as any).getActor?.();
          return actor || null;
        };

        const updateTooltipPositions = () => {
          setTooltips(prevTooltips => {
            const updatedTooltips = { ...prevTooltips };
            let hasUpdates = false;

            Object.keys(updatedTooltips).forEach(key => {
              const tooltipIdx = parseInt(key);
              const tooltip = updatedTooltips[tooltipIdx];
              
              if (tooltip.pinned) {
                // 3D 월드 좌표를 화면 좌표로 변환
                const worldPos = tooltip.worldPos;
                const coordinate = vtkObjectsRef.current.renderer.worldToDisplay(...worldPos);
                
                // 화면 좌표 계산
                const rect = container.getBoundingClientRect();
                const screenX = rect.left + coordinate[0] * (rect.width / openGLRenderWindow.getSize()[0]);
                const screenY = rect.top + rect.height - coordinate[1] * (rect.height / openGLRenderWindow.getSize()[1]);
                
                if (Math.abs(tooltip.x - screenX) > 1 || Math.abs(tooltip.y - screenY) > 1) {
                  updatedTooltips[tooltipIdx] = {
                    ...tooltip,
                    x: screenX,
                    y: screenY
                  };
                  hasUpdates = true;
                }
              }
            });

            return hasUpdates ? updatedTooltips : prevTooltips;
          });
        };

        const handleMouseMove = (e: MouseEvent) => {
          const rect = container.getBoundingClientRect();
          const [gw, gh] = openGLRenderWindow.getSize();
          const x = (e.clientX - rect.left) * (gw / Math.max(1, rect.width));
          const y = gh - (e.clientY - rect.top) * (gh / Math.max(1, rect.height));
          const picked = cellPicker.pick([x, y, 0], renderer);
          if (picked) {
            const viewProp = getPickedActor();
            if (viewProp && actorMapRef.current.has(viewProp)) {
              const info = actorMapRef.current.get(viewProp)!;
              // 이전 hover 해제(선택이 아니면 빨강 복귀)
              if (hoveredActorRef.current && hoveredActorRef.current !== viewProp) {
                const prevInfo = actorMapRef.current.get(hoveredActorRef.current);
                if (prevInfo && !selectedSetRef.current.has(prevInfo.idx)) {
                  hoveredActorRef.current.getProperty().setColor(0.8, 0.1, 0.1);
                }
              }
              // 현재 hover 파랑
              viewProp.getProperty().setColor(0, 0.4, 1);
              hoveredActorRef.current = viewProp;
              
              // 호버 툴팁 표시 (선택된 것이 아닌 경우에만)
              if (!selectedSetRef.current.has(info.idx)) {
                setHoverTooltip({
                  x: e.clientX,
                  y: e.clientY,
                  idx: info.idx,
                  coord: [info.x, info.y, info.z],
                  d: info.d,
                  pinned: false,
                });
              }
              
              // 콜백 호출 (2D 뷰와 연동)
              onPointHover(info.idx);
              renderWindow.render();
              return;
            }
          }
          // 아무것도 없으면 hover 해제(선택 유지)
          if (hoveredActorRef.current) {
            const prevInfo = actorMapRef.current.get(hoveredActorRef.current);
            if (prevInfo && !selectedSetRef.current.has(prevInfo.idx)) {
              hoveredActorRef.current.getProperty().setColor(0.8, 0.1, 0.1);
            }
            hoveredActorRef.current = null;
            setHoverTooltip(null);
            onPointHover(null);
            renderWindow.render();
          }
        };

        const handleClick = (e: MouseEvent) => {
          const rect = container.getBoundingClientRect();
          const [gw, gh] = openGLRenderWindow.getSize();
          const x = (e.clientX - rect.left) * (gw / Math.max(1, rect.width));
          const y = gh - (e.clientY - rect.top) * (gh / Math.max(1, rect.height));
          const picked = cellPicker.pick([x, y, 0], renderer);
          if (picked) {
            const viewProp = getPickedActor();
            if (viewProp && actorMapRef.current.has(viewProp)) {
              const info = actorMapRef.current.get(viewProp)!;
              const set = selectedSetRef.current;
              const wasSelected = set.has(info.idx);
              
              if (wasSelected) {
                // 선택 해제
                set.delete(info.idx);
                const color = hoveredActorRef.current === viewProp ? [0, 0.4, 1] : [0.8, 0.1, 0.1];
                viewProp.getProperty().setColor(color[0], color[1], color[2]);
                
                // 고정 툴팁 제거
                setTooltips(prev => {
                  const newTooltips = { ...prev };
                  delete newTooltips[info.idx];
                  return newTooltips;
                });
                setHoverTooltip(null);
              } else {
                // 선택 추가
                set.add(info.idx);
                viewProp.getProperty().setColor(0, 0.4, 1);
                
                // 월드 좌표 계산을 위해 구체의 중심점 가져오기
                const worldPos: [number, number, number] = [info.x, info.y, info.z];
                
                // 고정 툴팁 추가
                setTooltips(prev => ({
                  ...prev,
                  [info.idx]: {
                    x: e.clientX,
                    y: e.clientY,
                    idx: info.idx,
                    coord: [info.x, info.y, info.z],
                    d: info.d,
                    pinned: true,
                    worldPos
                  }
                }));
                setHoverTooltip(null);
              }
              
              // 콜백 호출 (2D 뷰와 연동)
              onPointClick(info.idx);
              renderWindow.render();
            }
          }
        };

        const handleMouseLeave = () => {
          if (hoveredActorRef.current) {
            const prevInfo = actorMapRef.current.get(hoveredActorRef.current);
            if (prevInfo && !selectedSetRef.current.has(prevInfo.idx)) {
              hoveredActorRef.current.getProperty().setColor(0.8, 0.1, 0.1);
            }
            hoveredActorRef.current = null;
            setHoverTooltip(null);
            onPointHover(null);
            renderWindow.render();
          }
        };

        container.addEventListener('wheel', handleWheel, { passive: false });
        container.addEventListener('mousemove', handleMouseMove, { passive: true });
        container.addEventListener('click', handleClick, { passive: true });
        container.addEventListener('mouseleave', handleMouseLeave, { passive: true });

        // 스타일로 스크롤/터치 제스처 차단
        container.style.touchAction = 'none';
        (container.style as any).overscrollBehavior = 'contain';

        // 카메라 이동에 따른 툴팁 위치 업데이트
        const startCameraTracking = () => {
          const animate = () => {
            if (fsrwRef.current) {
              updateTooltipPositions();
              requestAnimationFrame(animate);
            }
          };
          requestAnimationFrame(animate);
        };

        // 정리 핸들러 저장
        vtkObjectsRef.current._cleanup = () => {
          container.removeEventListener('wheel', handleWheel as any);
          container.removeEventListener('mousemove', handleMouseMove as any);
          container.removeEventListener('click', handleClick as any);
          container.removeEventListener('mouseleave', handleMouseLeave as any);
        };
        fsrwRef.current = renderWindow;
        
        // 카메라 추적 시작
        startCameraTracking();
        
        setIsReady(true);

      } catch (error) {
        console.error('❌ VTK.js 에러:', error);
        
        // 에러 상세 정보
        if (error instanceof Error) {
          console.error('에러 이름:', error.name);
          console.error('에러 메시지:', error.message);
          console.error('에러 스택:', error.stack);
        }
        
        // 에러 표시
        if (containerRef.current) {
          containerRef.current.innerHTML = `
            <div style="
              height: 100%;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              background: #fee2e2;
              color: #dc2626;
              padding: 20px;
              text-align: center;
            ">
              <div style="font-size: 24px; margin-bottom: 10px;">❌</div>
              <div style="font-weight: bold; margin-bottom: 10px;">VTK.js 에러 발생</div>
              <div style="font-size: 14px; opacity: 0.8;">${error instanceof Error ? error.message : String(error)}</div>
            </div>
          `;
        }
      }
    };

    // DOM이 완전히 준비된 후 실행
    const timer = setTimeout(() => {
      initVTK();
    }, 100);

    return () => {
      clearTimeout(timer);
      
      // 정리: FSRW를 안전하게 삭제
      if (fsrwRef.current) {
        try {
          fsrwRef.current.delete();
          fsrwRef.current = null;
        } catch (e) {
          console.log('VTK 정리 중 에러:', e);
        }
      }
    };
  }, [points, coordinateSystem, scaleByDiameter]);

  return (
    <div className="w-full bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <div className="mb-4">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          🔍 VTK.js 혈관 3D 뷰어 ({points.length}개 점)
        </h3>
        <div className="flex gap-4 text-sm text-gray-600">
          <span>마우스 오버: 색상 변경 + 툴팁</span>
          <span className="font-bold text-blue-600">클릭: 다중 선택</span>
          <span className={`font-bold ${isReady ? 'text-green-600' : 'text-orange-600'}`}>
            상태: {isReady ? '성공' : '초기화 중'}
          </span>
        </div>
      </div>
      
      <div 
        ref={containerRef}
        className="relative border border-gray-300 rounded-lg overflow-hidden"
        style={{ height, minHeight: '400px' }}
      >
        {!isReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">VTK.js 3D 렌더링 초기화 중...</p>
              <p className="text-sm text-gray-500 mt-1">혈관 구조 로딩</p>
            </div>
          </div>
        )}

        {/* 호버 툴팁 */}
        {hoverTooltip && (
          <div
            className="fixed z-[9999] pointer-events-none bg-black/90 text-white p-2 rounded-lg text-sm shadow-xl border border-gray-500"
            style={{
              left: `${hoverTooltip.x + 10}px`,
              top: `${hoverTooltip.y - 40}px`,
            }}
          >
            <div className="font-semibold">구체 #{hoverTooltip.idx}</div>
            <div className="text-xs">
              좌표: ({hoverTooltip.coord[0].toFixed(1)}, {hoverTooltip.coord[1].toFixed(1)}, {hoverTooltip.coord[2].toFixed(1)})
            </div>
            <div className="text-xs">직경: Ø{hoverTooltip.d.toFixed(1)}</div>
          </div>
        )}

        {/* 고정 툴팁들 (선택된 구체들) */}
        {Object.values(tooltips).map((tooltip) => (
          <div
            key={`tooltip-${tooltip.idx}`}
            className="fixed z-[9998] pointer-events-none bg-blue-600/95 text-white p-2 rounded-lg text-sm shadow-xl border border-blue-400"
            style={{
              left: `${tooltip.x + 10}px`,
              top: `${tooltip.y - 40}px`,
            }}
          >
            <div className="font-semibold">🔹 선택됨 #{tooltip.idx}</div>
            <div className="text-xs">
              좌표: ({tooltip.coord[0].toFixed(1)}, {tooltip.coord[1].toFixed(1)}, {tooltip.coord[2].toFixed(1)})
            </div>
            <div className="text-xs">직경: Ø{tooltip.d.toFixed(1)}</div>
          </div>
        ))}
      </div>
      
      {isReady && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="text-green-800 font-bold">✅ VTK.js 3D 혈관 뷰어 실행 중!</div>
          <div className="text-sm text-green-600 mt-1">
            • 마우스 오버: 파란색 하이라이트 + 툴팁 • 클릭: 다중 선택 + 고정 툴팁 • 드래그: 회전 • 휠: 줌
          </div>
          {Object.keys(tooltips).length > 0 && (
            <div className="text-sm text-blue-700 mt-2 font-medium">
              현재 {Object.keys(tooltips).length}개 구체가 선택되어 있습니다.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VesselVisualizationVTK;