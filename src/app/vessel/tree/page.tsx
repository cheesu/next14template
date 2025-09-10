"use client";
import React, { useState, useRef, useEffect, useCallback } from "react";

interface VesselData {
  id: number;
  parent: number;
  x: number; // 루트 혈관만 사용 (Canvas 중앙 기준)
  y: number; // 루트 혈관만 사용 (Canvas 중앙 기준)
  branchPoint?: number; // 자식 혈관용: 부모 혈관의 어느 길이 지점에서 분기할지 (0~부모length)
  length: number;
  angle: number; // 도(degree) 단위로 입력 (0=오른쪽, 90=아래, 180=왼쪽, 270=위)
  radius: number;
  cut: number[];
}

const VesselTreePage: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const defaultVessels: VesselData[] = [
    {
      id: 1,
      parent: 0,
      x: -350,
      y: -150,
      length: 300,
      angle: 90,
      radius: 40,
      cut: [],
    },
    {
      id: 2,
      parent: 1,
      x: 0,
      y: 0,
      branchPoint: 150,
      length: 200,
      angle: 0,
      radius: 30,
      cut: [160],
    },
    {
      id: 3,
      parent: 2,
      x: 0,
      y: 0,
      branchPoint: 100,
      length: 150,
      angle: -45,
      radius: 20,
      cut: [100, 40],
    },
    {
      id: 4,
      parent: 2,
      x: 0,
      y: 0,
      branchPoint: 200,
      length: 200,
      angle: 45,
      radius: 20,
      cut: [100],
    },
    {
      id: 4,
      parent: 2,
      x: 0,
      y: 0,
      branchPoint: 200,
      length: 200,
      angle: -45,
      radius: 20,
      cut: [100],
    },
  ];

  const [vessels, setVessels] = useState<VesselData[]>(defaultVessels);
  const [jsonInput, setJsonInput] = useState<string>(
    JSON.stringify(defaultVessels, null, 2)
  );
  const [error, setError] = useState<string>("");

  // 절단면과 번호를 그리는 함수
  const drawCutMarkers = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      vessel: VesselData,
      startX: number,
      startY: number
    ) => {
      const angleInRadians = (vessel.angle * Math.PI) / 180;

      // 절단 표시
      if (vessel.cut) {
        vessel.cut.forEach((d, idx) => {
          const cutX = startX + Math.cos(angleInRadians) * d;
          const cutY = startY + Math.sin(angleInRadians) * d;

          ctx.save();
          ctx.translate(cutX, cutY);
          ctx.rotate(angleInRadians + Math.PI / 2); // 혈관에 수직으로
          ctx.fillStyle = "red";
          ctx.beginPath();
          ctx.ellipse(
            0,
            0,
            vessel.radius * 0.8,
            vessel.radius * 0.1,
            0,
            0,
            Math.PI * 2
          );
          ctx.fill();
          ctx.restore();

          // 절단 번호 (배경이 있는 텍스트로 가독성 향상)
          const text = (idx + 1).toString();
          const textX = cutX + 5;
          const textY = cutY - 5;

          // 흰색 배경 원형
          ctx.fillStyle = "white";
          ctx.beginPath();
          ctx.arc(textX + 8, textY - 4, 12, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "#333";
          ctx.lineWidth = 1;
          ctx.stroke();

          // 검은색 텍스트
          ctx.fillStyle = "#333";
          ctx.font = "bold 12px Arial";
          ctx.textAlign = "center";
          ctx.fillText(text, textX + 8, textY + 1);
          ctx.textAlign = "start"; // 기본값으로 복구
        });
      }
    },
    []
  );

  // 혈관 내부 영역을 하얀색으로 다시 그리는 함수 (테두리 제외)
  const drawWhiteOverlay = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      vessel: VesselData,
      startX: number,
      startY: number
    ) => {
      const angleInRadians = (vessel.angle * Math.PI) / 180;
      const endX = startX + Math.cos(angleInRadians) * vessel.length;
      const endY = startY + Math.sin(angleInRadians) * vessel.length;

      const perpAngle = angleInRadians + Math.PI / 2;
      const halfRadius = vessel.radius / 2;

      // 테두리 두께만큼 안쪽으로 들어간 내부 영역 계산
      const borderWidth = 2; // 테두리 두께
      const innerHalfRadius = Math.max(0, halfRadius - borderWidth);

      if (innerHalfRadius > 0) {
        // 내부 영역 좌표 계산
        const innerTopStartX = startX + Math.cos(perpAngle) * innerHalfRadius;
        const innerTopStartY = startY + Math.sin(perpAngle) * innerHalfRadius;
        const innerTopEndX = endX + Math.cos(perpAngle) * innerHalfRadius;
        const innerTopEndY = endY + Math.sin(perpAngle) * innerHalfRadius;
        const innerBottomStartX =
          startX - Math.cos(perpAngle) * innerHalfRadius;
        const innerBottomStartY =
          startY - Math.sin(perpAngle) * innerHalfRadius;
        const innerBottomEndX = endX - Math.cos(perpAngle) * innerHalfRadius;
        const innerBottomEndY = endY - Math.sin(perpAngle) * innerHalfRadius;

        // 내부 영역을 하얀색으로 채우기
        ctx.fillStyle = "white";
        ctx.beginPath();
        ctx.moveTo(innerTopStartX, innerTopStartY);
        ctx.lineTo(innerTopEndX, innerTopEndY);
        ctx.lineTo(innerBottomEndX, innerBottomEndY);
        ctx.lineTo(innerBottomStartX, innerBottomStartY);
        ctx.closePath();
        ctx.fill();
      }
    },
    []
  );

  // 혈관 그리기 함수
  const drawVessel = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      vessel: VesselData,
      startX: number,
      startY: number,
      vessels: VesselData[]
    ) => {
      // 도(degree)를 라디안으로 변환
      const angleInRadians = (vessel.angle * Math.PI) / 180;
      const endX = startX + Math.cos(angleInRadians) * vessel.length;
      const endY = startY + Math.sin(angleInRadians) * vessel.length;

      // 간단한 두 평행선으로 혈관 그리기
      ctx.strokeStyle = "black";
      ctx.lineWidth = 2;
      ctx.lineCap = "round";

      const perpAngle = angleInRadians + Math.PI / 2;
      const halfRadius = vessel.radius / 2;

      // 혈관 좌표 계산
      const topStartX = startX + Math.cos(perpAngle) * halfRadius;
      const topStartY = startY + Math.sin(perpAngle) * halfRadius;
      const topEndX = endX + Math.cos(perpAngle) * halfRadius;
      const topEndY = endY + Math.sin(perpAngle) * halfRadius;
      const bottomStartX = startX - Math.cos(perpAngle) * halfRadius;
      const bottomStartY = startY - Math.sin(perpAngle) * halfRadius;
      const bottomEndX = endX - Math.cos(perpAngle) * halfRadius;
      const bottomEndY = endY - Math.sin(perpAngle) * halfRadius;

      // 1단계: 혈관 내부를 하얀색으로 채우기 (직사각형)
      ctx.fillStyle = "white";
      ctx.beginPath();
      ctx.moveTo(topStartX, topStartY);
      ctx.lineTo(topEndX, topEndY);
      ctx.lineTo(bottomEndX, bottomEndY);
      ctx.lineTo(bottomStartX, bottomStartY);
      ctx.closePath();
      ctx.fill();

      // 2단계: 테두리 그리기
      // 위쪽 테두리 선
      ctx.beginPath();
      ctx.moveTo(topStartX, topStartY);
      ctx.lineTo(topEndX, topEndY);
      ctx.stroke();

      // 아래쪽 테두리 선
      ctx.beginPath();
      ctx.moveTo(bottomStartX, bottomStartY);
      ctx.lineTo(bottomEndX, bottomEndY);
      ctx.stroke();

      // 끝부분과 시작점 처리 제거 - 모든 혈관을 완전히 뚫린 파이프로 만들기

      // 절단 표시는 나중에 별도로 그리기 위해 제거

      // 자식 혈관 그리기
      const children = vessels.filter((v) => v.parent === vessel.id);
      children.forEach((child) => {
        // branchPoint가 있으면 부모 혈관의 특정 지점에서 분기, 없으면 끝점에서 분기
        const branchDistance = child.branchPoint || vessel.length;
        const branchPointX = startX + Math.cos(angleInRadians) * branchDistance;
        const branchPointY = startY + Math.sin(angleInRadians) * branchDistance;

        // 자식 혈관이 부모 혈관의 중심에서 시작
        drawVessel(ctx, child, branchPointX, branchPointY, vessels);
      });
    },
    []
  );

  // Canvas 그리기
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Canvas 초기화
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 배경 설정
    ctx.fillStyle = "#f8f9fa";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 루트 혈관 찾기 (parent가 0인 것)
    const rootVessel = vessels.find((v) => v.parent === 0);
    if (rootVessel) {
      // 루트 혈관의 x, y 값을 Canvas 중앙 기준으로 적용
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      drawVessel(
        ctx,
        rootVessel,
        centerX + rootVessel.x,
        centerY + rootVessel.y,
        vessels
      );

      // 모든 혈관이 그려진 후 내부 영역을 하얀색으로 다시 그리기
      const drawAllWhiteOverlays = (
        vessel: VesselData,
        startX: number,
        startY: number
      ) => {
        // 현재 혈관의 하얀색 오버레이 그리기
        drawWhiteOverlay(ctx, vessel, startX, startY);

        // 자식 혈관들도 재귀적으로 처리
        const children = vessels.filter((v) => v.parent === vessel.id);
        children.forEach((child) => {
          const branchDistance = child.branchPoint || vessel.length;
          const vesselAngle = (vessel.angle * Math.PI) / 180;
          const childStartX = startX + Math.cos(vesselAngle) * branchDistance;
          const childStartY = startY + Math.sin(vesselAngle) * branchDistance;
          drawAllWhiteOverlays(child, childStartX, childStartY);
        });
      };

      // 루트 혈관부터 시작해서 모든 혈관의 하얀색 오버레이 그리기
      drawAllWhiteOverlays(
        rootVessel,
        centerX + rootVessel.x,
        centerY + rootVessel.y
      );

      // 마지막에 절단면과 번호 그리기 (최상위 레이어)
      const drawAllCutMarkers = (
        vessel: VesselData,
        startX: number,
        startY: number
      ) => {
        // 현재 혈관의 절단면과 번호 그리기
        drawCutMarkers(ctx, vessel, startX, startY);

        // 자식 혈관들도 재귀적으로 처리
        const children = vessels.filter((v) => v.parent === vessel.id);
        children.forEach((child) => {
          const branchDistance = child.branchPoint || vessel.length;
          const vesselAngle = (vessel.angle * Math.PI) / 180;
          const childStartX = startX + Math.cos(vesselAngle) * branchDistance;
          const childStartY = startY + Math.sin(vesselAngle) * branchDistance;
          drawAllCutMarkers(child, childStartX, childStartY);
        });
      };

      // 루트 혈관부터 시작해서 모든 혈관의 절단면과 번호 그리기
      drawAllCutMarkers(
        rootVessel,
        centerX + rootVessel.x,
        centerY + rootVessel.y
      );
    }
  }, [vessels, drawVessel, drawWhiteOverlay, drawCutMarkers]);

  // JSON 입력 처리
  const handleJsonSubmit = () => {
    try {
      const parsedVessels = JSON.parse(jsonInput);

      // 데이터 유효성 검사
      if (!Array.isArray(parsedVessels)) {
        throw new Error("데이터는 배열 형태여야 합니다.");
      }

      // 각 혈관 데이터 유효성 검사
      parsedVessels.forEach((vessel, index) => {
        const required = [
          "id",
          "parent",
          "x",
          "y",
          "length",
          "angle",
          "radius",
        ];
        required.forEach((field) => {
          if (typeof vessel[field] !== "number") {
            throw new Error(
              `${index + 1}번째 혈관의 ${field} 필드가 올바르지 않습니다.`
            );
          }
        });

        // branchPoint는 자식 혈관에서만 선택적으로 사용
        if (
          vessel.parent !== 0 &&
          vessel.branchPoint !== undefined &&
          typeof vessel.branchPoint !== "number"
        ) {
          throw new Error(
            `${index + 1}번째 혈관의 branchPoint 필드는 숫자여야 합니다.`
          );
        }

        if (!Array.isArray(vessel.cut)) {
          throw new Error(
            `${index + 1}번째 혈관의 cut 필드는 배열이어야 합니다.`
          );
        }
      });

      setVessels(parsedVessels);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "JSON 파싱 오류");
    }
  };

  // 기본값 복원
  const resetToDefault = () => {
    setVessels(defaultVessels);
    setJsonInput(JSON.stringify(defaultVessels, null, 2));
    setError("");
  };

  // Canvas 다시 그리기
  useEffect(() => {
    drawCanvas();
  }, [vessels, drawCanvas]);

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-xl p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          🩸 혈관 모형도
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          혈관의 구조와 절단 위치를 시각적으로 표현하고 분석할 수 있는
          모형도입니다.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 시각화 영역 */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              혈관 모형도 시각화
            </h2>
            <div className="flex justify-center bg-gray-50 rounded-lg p-4">
              <canvas
                ref={canvasRef}
                width={800}
                height={400}
                className="border border-gray-300 rounded max-w-full h-auto"
                style={{ backgroundColor: "#f8f9fa" }}
              />
            </div>
            <div className="mt-4 text-sm text-gray-600">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-2 bg-white border border-black rounded"></div>
                  <span>혈관</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-1 bg-red-500 rounded-full"></div>
                  <span>절단 위치</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-white border border-gray-600 text-gray-800 text-xs flex items-center justify-center rounded-full font-bold">
                    1
                  </div>
                  <span>절단 번호</span>
                </div>
              </div>
            </div>
          </div>

          {/* 데이터 입력 영역 */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              혈관 데이터 입력
            </h2>

            {/* JSON 입력 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                혈관 데이터 (JSON)
                <span className="text-blue-600 text-xs ml-2">
                  * 기본 예시 데이터가 입력되어 있습니다
                </span>
              </label>
              <textarea
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                className="w-full h-64 p-3 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-blue-50 text-gray-900"
                placeholder="혈관 데이터를 JSON 형태로 입력하세요..."
              />
              <p className="text-xs text-gray-500 mt-2">
                💡 위 입력창에 기본 예시 데이터가 표시되어 있습니다. 이 형태를
                참고해서 자유롭게 수정하세요!
              </p>
            </div>

            {/* 에러 표시 */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* 버튼들 */}
            <div className="flex space-x-3">
              <button
                onClick={handleJsonSubmit}
                className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors duration-200 font-medium"
              >
                적용하기
              </button>
              <button
                onClick={resetToDefault}
                className="flex-1 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors duration-200 font-medium"
              >
                기본값 복원
              </button>
            </div>

            {/* 데이터 형식 설명 */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">
                데이터 형식 설명
              </h3>
              <div className="text-xs text-blue-800 space-y-1">
                <p>
                  <strong>id:</strong> 혈관 고유 번호
                </p>
                <p>
                  <strong>parent:</strong> 부모 혈관 번호 (루트는 0)
                </p>
                <p>
                  <strong>x, y:</strong> 시작 좌표 (루트 혈관만 사용, Canvas
                  중앙 기준)
                </p>
                <p>
                  <strong>branchPoint:</strong> 자식 혈관용 - 부모 혈관의 몇 px
                  지점에서 분기할지 (선택사항, 없으면 끝점)
                </p>
                <p>
                  <strong>length:</strong> 혈관 길이
                </p>
                <p>
                  <strong>angle:</strong> 각도 (도 단위, 0=오른쪽, 90=아래,
                  180=왼쪽, 270=위)
                </p>
                <p>
                  <strong>radius:</strong> 혈관 두께
                </p>
                <p>
                  <strong>cut:</strong> 절단 위치 배열
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VesselTreePage;
