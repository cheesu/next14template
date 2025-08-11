"use client";
import React, { useEffect, useRef, useState, memo } from "react";
import * as cornerstone from "@cornerstonejs/core";
import dicomParser from "dicom-parser";
import {
  RenderingEngine,
  Types,
  Enums,
  getRenderingEngine,
  init as csInit,
  volumeLoader,
  utilities,
} from "@cornerstonejs/core";
import cornerstoneDICOMImageLoader from "@cornerstonejs/dicom-image-loader";
import initCornerstoneDICOMImageLoader from "@/helpers/initCornerstoneDICOMImageLoader";
import * as cornerstoneTools from "@cornerstonejs/tools";
import { set } from "react-hook-form";

const {
  ProbeTool,
  DragProbeTool,
  ToolGroupManager,
  PlanarFreehandROITool,
  EraserTool,
  Enums: csToolsEnums,
  init: csToolsInit,
} = cornerstoneTools;
const { MouseBindings } = csToolsEnums;

// Global 변수로 Mouse 도구 초기화 상태 추적
let isMouseToolsInitialized = false;

// This is for debugging purposes
console.warn(
  "Click on index.ts to open source code for this example --------->"
);

const { ViewportType, Events } = Enums;
const renderingEngineId = "myRenderingEngine2";
const viewportId = "CT_STACK_MOUSE";
const toolGroupId = "STACK_TOOL_GROUP_ID_MOUSE";

const ToolsMouse: React.FC = ({}) => {
  const elementRef = useRef<HTMLDivElement>(null);
  const [canvasPos, setCanvasPos] = useState<String | null>(null);
  const [worldPos, setWorldPos] = useState<String | null>(null);

  function getTextLinesProbe(data: any, targetId: string): string[] | null {
    console.log("data---", data);
    const cachedVolumeStats = data.cachedStats[targetId];
    const { index, value, modalityUnit } = cachedVolumeStats;

    if (value === undefined) {
      return null;
    }

    const textLines = [];

    textLines.push(`(${index[0]}, ${index[1]}, ${index[2]})`);

    if (value instanceof Array && modalityUnit instanceof Array) {
      for (let i = 0; i < value.length; i++) {
        textLines.push(`${utilities.roundNumber(value[i])} ${modalityUnit[i]}`);
      }
    } else {
      textLines.push(`${utilities.roundNumber(value)} ${modalityUnit}`);
    }
    console.log("textLines", textLines);

    return textLines;
  }

  useEffect(() => {
    if (!elementRef.current) return;

    // 오른쪽 클릭 비활성화
    elementRef.current.oncontextmenu = (e) => e.preventDefault();
    console.log("useEffect ToolsMouse22");
    
    async function run() {
      try {
        // 이미 Mouse 도구가 초기화되었다면 건너뛰기
        if (!isMouseToolsInitialized) {
          // Init Cornerstone and related libraries
          initCornerstoneDICOMImageLoader();
          await csInit();
          await csToolsInit();

          // Add tools to Cornerstone3D (중복 확인)
          const mouseToolsToAdd = [ProbeTool, DragProbeTool, PlanarFreehandROITool, EraserTool];

          mouseToolsToAdd.forEach((tool) => {
            try {
              cornerstoneTools.addTool(tool);
            } catch (error) {
              // 이미 추가된 도구는 무시
              console.warn(`Mouse tool ${tool.toolName} already exists, skipping...`);
            }
          });
          
          isMouseToolsInitialized = true;
        }

        // 기존 도구 그룹 제거
        try {
          const existingToolGroup = ToolGroupManager.getToolGroup(toolGroupId);
          if (existingToolGroup) {
            console.warn(`'${toolGroupId}' already exists, destroying...`);
            ToolGroupManager.destroyToolGroup(toolGroupId);
          }
        } catch (error) {
          // 도구 그룹이 없으면 무시
        }

        // Define a tool group
        const toolGroup = ToolGroupManager.createToolGroup(toolGroupId);

        if (!toolGroup) {
          throw new Error("Failed to create tool group");
        }

        // Add the tools to the tool group and set them to be passive
        toolGroup.addTool(ProbeTool.toolName);
        toolGroup.addTool(DragProbeTool.toolName);
        toolGroup.addTool(PlanarFreehandROITool.toolName);
        toolGroup.addTool(EraserTool.toolName);

        toolGroup.setToolPassive(ProbeTool.toolName);
        toolGroup.setToolPassive(DragProbeTool.toolName);
        toolGroup.setToolPassive(PlanarFreehandROITool.toolName);
        toolGroup.setToolPassive(EraserTool.toolName);

        // Set the ProbeTool to be active on left click
        toolGroup.setToolActive(ProbeTool.toolName, {
          bindings: [
            {
              mouseButton: MouseBindings.Primary, // Left Click
            },
          ],
        });

        // ProbeConfiguration을 설정하여 텍스트 표시 함수 지정
        toolGroup.setToolConfiguration(ProbeTool.toolName, {
          getTextLines: getTextLinesProbe,
        });

        // Get Cornerstone imageIds and fetch metadata into RAM
        const imageId = "wadouri:http://localhost:3000/dicom.dcm";

        // 기존 렌더링 엔진 제거
        try {
          const existingRenderingEngine = getRenderingEngine(renderingEngineId);
          if (existingRenderingEngine) {
            existingRenderingEngine.destroy();
          }
        } catch (error) {
          // 렌더링 엔진이 없으면 무시
        }

        // Instantiate a rendering engine
        const renderingEngine = new RenderingEngine(renderingEngineId);

        if (!elementRef.current) return;

        // Create a stack viewport
        const viewportInput = {
          viewportId,
          type: ViewportType.STACK,
          element: elementRef.current,
          defaultOptions: {
            background: [0.2, 0, 0.2] as Types.Point3,
          },
        };

        renderingEngine.enableElement(viewportInput);

        // Get the stack viewport that was created
        const viewport = renderingEngine.getViewport(
          viewportId
        ) as Types.IStackViewport;

        // Define a stack containing a single image
        const stack = [imageId];

        // Set the stack on the viewport
        await viewport.setStack(stack);

        // Set the tool group on the viewport
        toolGroup.addViewport(viewportId, renderingEngineId);

        // Render the image
        viewport.render();

        // Add event listeners
        const mouseEventHandler = (evt: MouseEvent) => {
          if (!elementRef.current) return;
          const rect = elementRef.current.getBoundingClientRect();

          const canvasPos: Types.Point2 = [
            Math.floor(evt.clientX - rect.left),
            Math.floor(evt.clientY - rect.top),
          ];
          
          // Convert canvas coordinates to world coordinates
          const worldPos = viewport.canvasToWorld(canvasPos);

          setCanvasPos(`(${canvasPos[0]}, ${canvasPos[1]})`);
          setWorldPos(`(${worldPos[0].toFixed(2)}, ${worldPos[1].toFixed(2)}, ${worldPos[2].toFixed(2)})`);
        };

        const element = viewport.element;
        element.addEventListener("mousemove", mouseEventHandler);

        // Cleanup을 위해 반환
        return { element, mouseEventHandler, toolGroup, renderingEngine };
        
      } catch (error) {
        console.error("Error initializing mouse tools:", error);
        return null;
      }
    }

    let cleanupData: any = null;
    
    run().then((data) => {
      cleanupData = data;
    });

    // Cleanup function
    return () => {
      if (cleanupData) {
        const { element, mouseEventHandler, toolGroup, renderingEngine } = cleanupData;
        
        if (element && mouseEventHandler) {
          element.removeEventListener("mousemove", mouseEventHandler);
        }
        
        try {
          // 도구 그룹 정리
          if (toolGroup) {
            ToolGroupManager.destroyToolGroup(toolGroupId);
          }
        } catch (error) {
          console.warn("Error cleaning up mouse tool group:", error);
        }
        
        try {
          // 렌더링 엔진 정리
          if (renderingEngine) {
            renderingEngine.destroy();
          }
        } catch (error) {
          console.warn("Error cleaning up mouse rendering engine:", error);
        }
      }
    };
  }, []);

  return (
    <div>
      <h2>Tools Mouse</h2>
      <p>canvas: {canvasPos}</p>
      <p>world: {worldPos}</p>
      <div ref={elementRef} style={{ width: "512px", height: "512px" }}>
        {/* DICOM Image will be rendered inside this div */}
      </div>
    </div>
  );
};

export default memo(ToolsMouse);
