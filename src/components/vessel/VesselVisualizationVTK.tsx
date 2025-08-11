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
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    idx: number;
    coord: [number, number, number];
    d: number;
    pinned: boolean;
  } | null>(null);

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
              setTooltip({
                x: e.clientX,
                y: e.clientY,
                idx: info.idx,
                coord: [info.x, info.y, info.z],
                d: info.d,
                pinned: false,
              });
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
            setTooltip(null);
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
                set.delete(info.idx);
                // 선택 해제 시 hover 여부에 따라 색상 결정
                const color = hoveredActorRef.current === viewProp ? [0, 0.4, 1] : [0.8, 0.1, 0.1];
                viewProp.getProperty().setColor(color[0], color[1], color[2]);
                setTooltip(null);
              } else {
                set.add(info.idx);
                // 선택 색상 유지(파랑) & 툴팁 고정
                viewProp.getProperty().setColor(0, 0.4, 1);
                setTooltip({ x: e.clientX, y: e.clientY, idx: info.idx, coord: [info.x, info.y, info.z], d: info.d, pinned: true });
              }
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
            setTooltip(null);
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

        // 정리 핸들러 저장
        vtkObjectsRef.current._cleanup = () => {
          container.removeEventListener('wheel', handleWheel as any);
          container.removeEventListener('mousemove', handleMouseMove as any);
          container.removeEventListener('click', handleClick as any);
          container.removeEventListener('mouseleave', handleMouseLeave as any);
        };
        fsrwRef.current = renderWindow;
        
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
          🔍 VTK.js 기본 테스트 ({points.length}개 점)
        </h3>
        <div className="flex gap-4 text-sm text-gray-600">
          <span>단계별 디버깅</span>
          <span className="font-bold text-blue-600">하나의 구체만</span>
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
              <p className="text-gray-600">VTK.js 단계별 초기화 중...</p>
              <p className="text-sm text-gray-500 mt-1">traverse 에러 디버깅</p>
            </div>
          </div>
        )}
      </div>
      
      {isReady && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="text-green-800 font-bold">✅ VTK.js 렌더링 성공!</div>
          <div className="text-sm text-green-600 mt-1">
            traverse 에러 없이 구체가 렌더링되었습니다.
          </div>
        </div>
      )}
    </div>
  );
};

export default VesselVisualizationVTK;