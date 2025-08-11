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
  const hoveredPidRef = useRef<number | null>(null);
  const pidFromIdxRef = useRef<Map<number, number>>(new Map());
  const onHoverRef = useRef<typeof onPointHover>(onPointHover);
  const onClickRef = useRef<typeof onPointClick>(onPointClick);
  const dragStateRef = useRef<{ isDown: boolean; startX: number; startY: number; startTs: number; dragging: boolean }>({ isDown: false, startX: 0, startY: 0, startTs: 0, dragging: false });

  useEffect(() => { onHoverRef.current = onPointHover; }, [onPointHover]);
  useEffect(() => { onClickRef.current = onPointClick; }, [onPointClick]);
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
          vtkActor,
          vtkGlyph3DMapper,
          vtkPolyData,
          vtkPoints,
          vtkDataArray,
          vtkPointPicker,
          DataSetConstants,
        ] = await Promise.all([
          import('@kitware/vtk.js/Rendering/Core/RenderWindow'),
          import('@kitware/vtk.js/Rendering/Core/Renderer'),
          import('@kitware/vtk.js/Rendering/OpenGL/RenderWindow'),
          import('@kitware/vtk.js/Rendering/Core/RenderWindowInteractor'),
          import('@kitware/vtk.js/Interaction/Style/InteractorStyleTrackballCamera'),
          import('@kitware/vtk.js/Filters/Sources/SphereSource'),
          import('@kitware/vtk.js/Rendering/Core/Actor'),
          import('@kitware/vtk.js/Rendering/Core/Glyph3DMapper'),
          import('@kitware/vtk.js/Common/DataModel/PolyData'),
          import('@kitware/vtk.js/Common/Core/Points'),
          import('@kitware/vtk.js/Common/Core/DataArray'),
          import('@kitware/vtk.js/Rendering/Core/PointPicker'),
          import('@kitware/vtk.js/Common/DataModel/DataSet/Constants'),
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
        // 크기 설정: 렌더 내부 픽셀 = CSS * DPR (인터랙터 디스플레이 좌표와 일치)
        const rect = container.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        openGLRenderWindow.setSize(
          Math.max(1, Math.floor(rect.width * dpr)),
          Math.max(1, Math.floor(rect.height * dpr))
        );
        // 배경색 설정
        renderer.setBackground(0.9, 0.9, 0.9);
        
        console.log('4️⃣ Glyph3DMapper로 모든 포인트 구체 생성');
        const numPts = points.length;
        const polyData = vtkPolyData.default.newInstance();
        const vtkPts = vtkPoints.default.newInstance();
        const diameters = new Float32Array(numPts);
        const colors = new Uint8Array(numPts * 3);

        // 직경 정규화(상대 스케일)
        const ds = points.map((p) => p.d);
        const dMin = Math.min(...ds);
        const dMax = Math.max(...ds);
        const dRange = Math.max(1e-6, dMax - dMin);

        for (let i = 0; i < numPts; i += 1) {
          const p0 = points[i];
          const p = coordinateSystem === 'medical' ? { ...p0, x: p0.x, y: -p0.z, z: p0.y } : p0;
          vtkPts.insertNextPoint(p.x, p.y, p.z);
          const t = (p.d - dMin) / dRange;
          const radius = scaleByDiameter ? (0.8 + t * (6.0 - 0.8)) : 3.0;
          diameters[i] = radius;
          // 기본 빨간색
          colors[i * 3 + 0] = 204;
          colors[i * 3 + 1] = 26;
          colors[i * 3 + 2] = 26;
          // 포인트 인덱스→idx 매핑 저장
          actorMapRef.current.set(i, { idx: p.idx, x: p.x, y: p.y, z: p.z, d: p.d });
          pidFromIdxRef.current.set(p.idx, i);
        }

        polyData.setPoints(vtkPts);
        // diameter array
        const diameterArray = vtkDataArray.default.newInstance({
          name: 'Diameter',
          values: diameters,
          numberOfComponents: 1,
          dataType: 'Float32Array',
        });
        // color array
        const colorArray = vtkDataArray.default.newInstance({
          name: 'Colors',
          values: colors,
          numberOfComponents: 3,
          dataType: 'Uint8Array',
        });
        const pointData = polyData.getPointData();
        pointData.addArray(diameterArray);
        pointData.setScalars(colorArray);

        const sphereSource = vtkSphereSource.default.newInstance({
          radius: 1.0,
          phiResolution: 12,
          thetaResolution: 12,
        });

        const glyphMapper = vtkGlyph3DMapper.default.newInstance();
        glyphMapper.setInputData(polyData);
        glyphMapper.setSourceConnection(sphereSource.getOutputPort());
        glyphMapper.setScaleArray('Diameter');
        // 색상 스칼라 사용(직접 RGB)
        glyphMapper.setScalarVisibility(true);
        glyphMapper.setScalarModeToUsePointFieldData();
        glyphMapper.setColorModeToDirectScalars();
        if ((glyphMapper as any).setColorByArrayName) (glyphMapper as any).setColorByArrayName('Colors');

        const actor = vtkActor.default.newInstance();
        actor.setMapper(glyphMapper);
        const prop = actor.getProperty();
        prop.setSpecular(0.0);
        prop.setDiffuse(0.9);
        prop.setAmbient(0.2);
        if ((prop as any).setInterpolationToFlat) (prop as any).setInterpolationToFlat();
        renderer.addActor(actor);
        
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
        vtkObjectsRef.current = { renderer, renderWindow, openGLRenderWindow, interactor, actor, glyphMapper, polyData, vtkDataArrayFactory: vtkDataArray };

        // 선택/호버 상태로 Colors 재계산 함수
        const rebuildColors = (hoverPid: number | null) => {
          const sel = selectedSetRef.current;
          for (let i = 0; i < numPts; i += 1) {
            const info = actorMapRef.current.get(i);
            const isSelected = info ? sel.has(info.idx) : false;
            if (isSelected || (hoverPid !== null && i === hoverPid)) {
              colors[i * 3 + 0] = 0;
              colors[i * 3 + 1] = 102;
              colors[i * 3 + 2] = 255;
            } else {
              colors[i * 3 + 0] = 204;
              colors[i * 3 + 1] = 26;
              colors[i * 3 + 2] = 26;
            }
          }
          polyData.getPointData().setScalars(vtkDataArray.default.newInstance({ name: 'Colors', values: colors, numberOfComponents: 3, dataType: 'Uint8Array' }));
          polyData.modified();
          renderWindow.render();
        };

        // 포인트 픽커: 포인트 인덱스 안정 추출
        const picker = vtkPointPicker.default.newInstance();
        if ((picker as any).setTolerance) (picker as any).setTolerance(0.025); // 비율 기반

        const handleWheel = (e: WheelEvent) => {
          e.preventDefault();
          e.stopPropagation();
        };

        const getPickedProp = () => {
          const vp = (picker as any).getViewProp?.();
          if (vp) return vp;
          const a = (picker as any).getActor?.();
          if (a) return a;
          const list = (picker as any).getActors?.();
          if (list && list.length) return list[0];
          return null;
        };

        // VTK 인터랙터 이벤트 사용 (정확한 디스플레이 좌표 제공)
        const handleMouseMove = (e: MouseEvent) => {
          const canvas = (openGLRenderWindow as any).getCanvas?.() as HTMLCanvasElement | undefined;
          const rect = (canvas ? canvas.getBoundingClientRect() : container.getBoundingClientRect());
          const [gw, gh] = openGLRenderWindow.getSize();
          // 1) 캔버스 CSS 좌표 (top-left 원점 가정)
          const xCss = e.clientX - rect.left;
          const yCssTop = e.clientY - rect.top;
          // 2) OpenGL 픽셀 좌표 (top-left 원점 가정)
          const xScaledTop = xCss * (gw / Math.max(1, rect.width));
          const yScaledTop = yCssTop * (gh / Math.max(1, rect.height));
          // 3) OpenGL 픽셀 좌표 (bottom-left 원점 가정)
          const yScaledBottom = gh - yScaledTop;

          // 시도 1: CSS 좌표(top-left)
          picker.pick([xCss, yCssTop, 0], renderer);
          let viewProp = getPickedProp();
          if (!viewProp) {
            // 시도 2: OpenGL 픽셀(top-left)
            picker.pick([xScaledTop, yScaledTop, 0], renderer);
            viewProp = getPickedProp();
          }
          if (!viewProp) {
            // 시도 3: OpenGL 픽셀(bottom-left)
            picker.pick([xScaledTop, yScaledBottom, 0], renderer);
            viewProp = getPickedProp();
          }
          const picked = !!viewProp;
          // 디버그 로그
          // eslint-disable-next-line no-console
          console.log('mousemove pick', { rect: { w: rect.width, h: rect.height }, gl: { size: openGLRenderWindow.getSize() }, xCss, yCssTop, xScaledTop, yScaledTop, yScaledBottom, picked });
          if (viewProp) {
            // eslint-disable-next-line no-console
            console.log('mousemove viewProp', true);
            if (actorMapRef.current.has(viewProp)) {
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
          const canvas = (openGLRenderWindow as any).getCanvas?.() as HTMLCanvasElement | undefined;
          const rect = (canvas ? canvas.getBoundingClientRect() : container.getBoundingClientRect());
          const [gw, gh] = openGLRenderWindow.getSize();
          const xCss = e.clientX - rect.left;
          const yCssTop = e.clientY - rect.top;
          const xScaledTop = xCss * (gw / Math.max(1, rect.width));
          const yScaledTop = yCssTop * (gh / Math.max(1, rect.height));
          const yScaledBottom = gh - yScaledTop;
          picker.pick([xCss, yCssTop, 0], renderer);
          let viewProp = getPickedProp();
          if (!viewProp) {
            picker.pick([xScaledTop, yScaledTop, 0], renderer);
            viewProp = getPickedProp();
          }
          if (!viewProp) {
            picker.pick([xScaledTop, yScaledBottom, 0], renderer);
            viewProp = getPickedProp();
          }
          const picked = !!viewProp;
          // eslint-disable-next-line no-console
          console.log('click pick', { rect: { w: rect.width, h: rect.height }, gl: { size: openGLRenderWindow.getSize() }, xCss, yCssTop, xScaledTop, yScaledTop, yScaledBottom, picked });
          if (viewProp) {
            // eslint-disable-next-line no-console
            console.log('click viewProp', true);
            if (actorMapRef.current.has(viewProp)) {
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
        // 네이티브 대신 VTK 인터랙터 이벤트도 병행 등록
        // 네이티브 이벤트는 좌표 불일치 야기 가능 → 인터랙터 이벤트만 사용
        const offMove = (interactor as any).onMouseMove?.((callData: any) => {
          const pos = callData?.position;
          let xDisplay = 0;
          let yDisplay = 0;
          if (Array.isArray(pos)) {
            xDisplay = pos[0] ?? 0;
            yDisplay = pos[1] ?? 0;
          } else if (pos && typeof pos.x === 'number' && typeof pos.y === 'number') {
            xDisplay = pos.x;
            yDisplay = pos.y;
          }
          picker.pick([xDisplay, yDisplay, 0], renderer);
          // eslint-disable-next-line no-console
          console.log('vtk onMouseMove pick', { xDisplay, yDisplay });
          const pid = (picker as any).getPointId?.() ?? -1;
          // eslint-disable-next-line no-console
          console.log('pointId (hover)', pid);
          if (pid >= 0 && pid < numPts) {
            const canvas = (openGLRenderWindow as any).getCanvas?.() as HTMLCanvasElement | undefined;
            const rect = (canvas ? canvas.getBoundingClientRect() : container.getBoundingClientRect());
            const [glW, glH] = openGLRenderWindow.getSize();
            const domX = rect.left + (xDisplay / Math.max(1, glW)) * rect.width;
            const domY = rect.top + ((glH - yDisplay) / Math.max(1, glH)) * rect.height;
            hoveredPidRef.current = pid;
            const info = actorMapRef.current.get(pid)!;
            setTooltip({ x: domX, y: domY, idx: info.idx, coord: [info.x, info.y, info.z], d: info.d, pinned: false });
            rebuildColors(pid);
            // 외부 콜백
            try { onHoverRef.current?.(info.idx); } catch {}
          }
        });
        const offPress = (interactor as any).onLeftButtonPress?.((callData: any) => {
          const pos = callData?.position;
          let xDisplay = 0;
          let yDisplay = 0;
          if (Array.isArray(pos)) {
            xDisplay = pos[0] ?? 0;
            yDisplay = pos[1] ?? 0;
          } else if (pos && typeof pos.x === 'number' && typeof pos.y === 'number') {
            xDisplay = pos.x;
            yDisplay = pos.y;
          }
          dragStateRef.current = { isDown: true, startX: xDisplay, startY: yDisplay, startTs: Date.now(), dragging: false };
        });
        const offRelease = (interactor as any).onLeftButtonRelease?.((callData: any) => {
          const ds = dragStateRef.current;
          ds.isDown = false;
          const now = Date.now();
          const dt = now - ds.startTs;
          if (ds.dragging || dt > 500) return; // 드래그 또는 오래 누름은 클릭 처리 안 함
          const pos = callData?.position;
          let xDisplay = 0;
          let yDisplay = 0;
          if (Array.isArray(pos)) { xDisplay = pos[0] ?? 0; yDisplay = pos[1] ?? 0; }
          else if (pos && typeof pos.x === 'number' && typeof pos.y === 'number') { xDisplay = pos.x; yDisplay = pos.y; }
          picker.pick([xDisplay, yDisplay, 0], renderer);
          const pid = (picker as any).getPointId?.() ?? -1;
          if (pid >= 0 && pid < numPts) {
            const info = actorMapRef.current.get(pid)!;
            const idx = info.idx;
            const isSelected = selectedSetRef.current.has(idx);
            if (isSelected) {
              selectedSetRef.current.delete(idx);
              setTooltip(null);
            } else {
              selectedSetRef.current.add(idx);
              const canvas = (openGLRenderWindow as any).getCanvas?.() as HTMLCanvasElement | undefined;
              const rect = (canvas ? canvas.getBoundingClientRect() : container.getBoundingClientRect());
              const [glW, glH] = openGLRenderWindow.getSize();
              const domX = rect.left + (xDisplay / Math.max(1, glW)) * rect.width;
              const domY = rect.top + ((glH - yDisplay) / Math.max(1, glH)) * rect.height;
              setTooltip({ x: domX, y: domY, idx, coord: [info.x, info.y, info.z], d: Number(info.d), pinned: true });
            }
            rebuildColors(hoveredPidRef.current);
            try { onClickRef.current?.(idx); } catch {}
          }
        });
        container.addEventListener('mouseleave', handleMouseLeave, { passive: true });

        // 스타일로 스크롤/터치 제스처 차단
        container.style.touchAction = 'none';
        (container.style as any).overscrollBehavior = 'contain';
        container.style.userSelect = 'none';

        // 정리 핸들러 저장
        vtkObjectsRef.current._cleanup = () => {
          container.removeEventListener('wheel', handleWheel as any);
          container.removeEventListener('mousemove', handleMouseMove as any);
          container.removeEventListener('click', handleClick as any);
          container.removeEventListener('mouseleave', handleMouseLeave as any);
          // VTK 인터랙터 해제
          if (offMove && typeof offMove.unsubscribe === 'function') offMove.unsubscribe();
          if (offPress && typeof offPress.unsubscribe === 'function') offPress.unsubscribe();
          if (offRelease && typeof offRelease.unsubscribe === 'function') offRelease.unsubscribe();
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

  // 외부 선택/호버(2D↔3D) 동기화: props→VTK 반영
  useEffect(() => {
    const ctx = vtkObjectsRef.current;
    if (!ctx || !ctx.polyData) return;
    // 외부 선택 반영
    selectedSetRef.current = new Set(Array.from(selectedPoints || []));
    // 외부 호버 반영: hoveredPoint가 idx 기준이면 pid로 역매핑
    if (typeof hoveredPoint === 'number' && pidFromIdxRef.current.has(hoveredPoint)) {
      hoveredPidRef.current = pidFromIdxRef.current.get(hoveredPoint)!;
    } else {
      hoveredPidRef.current = null;
    }
    // Colors 재구성
    const polyData = ctx.polyData;
    const mapperActor = ctx.actor;
    // 안전 체크
    if (!polyData || !mapperActor) return;
    // 기존 colors 추출 실패 시 새로 구성하지 않고 종료
    const numPts = polyData.getPoints()?.getNumberOfPoints?.() || 0;
    if (!numPts) return;
    // 기존 colors 길이 확인 후 없으면 스킵
    // 여기서는 rebuild 함수 없이 직접 단순 재계산
    const colorsArr = new Uint8Array(numPts * 3);
    for (let i = 0; i < numPts; i += 1) {
      const info = actorMapRef.current.get(i);
      const isSel = info ? selectedSetRef.current.has(info.idx) : false;
      const isHover = hoveredPidRef.current !== null && hoveredPidRef.current === i;
      if (isSel || isHover) {
        colorsArr[i * 3 + 0] = 0; colorsArr[i * 3 + 1] = 102; colorsArr[i * 3 + 2] = 255;
      } else {
        colorsArr[i * 3 + 0] = 204; colorsArr[i * 3 + 1] = 26; colorsArr[i * 3 + 2] = 26;
      }
    }
    polyData.getPointData().setScalars((window as any).vtkColorsArray || ctx.vtkColorsArray || null);
    const vtkColors = (ctx.vtkColorsArray = (window as any).vtkDataArray?.default?.newInstance
      ? (window as any).vtkDataArray.default.newInstance({ name: 'Colors', values: colorsArr, numberOfComponents: 3, dataType: 'Uint8Array' })
      : require('@kitware/vtk.js/Common/Core/DataArray').default.newInstance({ name: 'Colors', values: colorsArr, numberOfComponents: 3, dataType: 'Uint8Array' }));
    polyData.getPointData().setScalars(vtkColors);
    polyData.modified();
    ctx.renderWindow?.render?.();
  }, [selectedPoints, hoveredPoint]);

  // 컨테이너 리사이즈/DPR 변경 대응
  useEffect(() => {
    const ctx = vtkObjectsRef.current;
    if (!ctx || !ctx.openGLRenderWindow) return;
    const container = containerRef.current;
    if (!container) return;
    const RZ = (window as any).ResizeObserver;
    const ro = RZ ? new RZ((entries: any) => {
      for (const entry of entries) {
        const rect = entry.contentRect || container.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        ctx.openGLRenderWindow.setSize(Math.max(1, Math.floor(rect.width * dpr)), Math.max(1, Math.floor(rect.height * dpr)));
        ctx.renderWindow?.render?.();
      }
    }) : null;
    ro && ro.observe && ro.observe(container);
    const onWinResize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      ctx.openGLRenderWindow.setSize(Math.max(1, Math.floor(rect.width * dpr)), Math.max(1, Math.floor(rect.height * dpr)));
      ctx.renderWindow?.render?.();
    };
    window.addEventListener('resize', onWinResize);
    return () => {
      try { ro && ro.disconnect && ro.disconnect(); } catch {}
      window.removeEventListener('resize', onWinResize);
    };
  }, [height]);
  
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

        {tooltip && (
          <div
            className="pointer-events-none fixed z-[9999]"
            style={{ left: tooltip.x + 12, top: tooltip.y + 12 }}
          >
            <div className="rounded bg-black/70 text-white text-xs p-2 shadow-lg">
              <div className="font-semibold mb-1">Point #{tooltip.idx}</div>
              <div>coord: [{tooltip.coord[0].toFixed(2)}, {tooltip.coord[1].toFixed(2)}, {tooltip.coord[2].toFixed(2)}]</div>
              <div>d: {tooltip.d}</div>
              {tooltip.pinned && <div className="text-amber-300 mt-1">pinned</div>}
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