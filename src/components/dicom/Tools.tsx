"use client";
import React, { useEffect, useRef, useState } from "react";
import * as cornerstone from "@cornerstonejs/core";
import dicomParser from "dicom-parser";
import {
  RenderingEngine,
  Types,
  Enums,
  getRenderingEngine,
  init as csInit,
} from "@cornerstonejs/core";
import cornerstoneDICOMImageLoader from "@cornerstonejs/dicom-image-loader";
import initCornerstoneDICOMImageLoader from "@/helpers/initCornerstoneDICOMImageLoader";

// Global 변수로 초기화 상태 추적
let isInitialized = false;

// This is for debugging purposes
console.warn(
  "Click on index.ts to open source code for this example --------->"
);

const { ViewportType, Events } = Enums;
const renderingEngineId = "myRenderingEngine";
const viewportId = "CT_STACK";
const toolGroupId = "STACK_TOOL_GROUP_ID";

const Tools: React.FC = () => {
  console.log("TOOLS");
  const elementRef = useRef<HTMLDivElement>(null);
  const [cornerstoneTools, setCornerstoneTools] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      // 클라이언트 사이드 확인
      import("@cornerstonejs/tools").then((module) => {
        setCornerstoneTools(module);
      });
    }
  }, []);

  useEffect(() => {
    console.log("TOOL useEffect", cornerstoneTools, elementRef.current);
    if (!cornerstoneTools || !elementRef.current) return;
    
    console.log("TOOL useEffect22");
    
    // 구조분해 할당을 사용하여 모듈에서 필요한 부분을 추출
    const {
      LengthTool,
      ProbeTool,
      RectangleROITool,
      EllipticalROITool,
      CircleROITool,
      BidirectionalTool,
      AngleTool,
      CobbAngleTool,
      ToolGroupManager,
      ArrowAnnotateTool,
      PlanarFreehandROITool,
      EraserTool,
      KeyImageTool,
      Enums: csToolsEnums,
      init: csToolsInit,
    } = cornerstoneTools;
    const { MouseBindings } = csToolsEnums;

    // 오른쪽 클릭 비활성화
    elementRef.current.oncontextmenu = (e) => e.preventDefault();

    const cameraModifiedHandler = (_: any) => {
      // Get the rendering engine
      const renderingEngine = getRenderingEngine(renderingEngineId);

      // Get the stack viewport
      if (!renderingEngine) return;

      const viewport = renderingEngine.getViewport(
        viewportId
      ) as Types.IStackViewport;

      if (!viewport) {
        return;
      }

      const { flipHorizontal, flipVertical } = viewport.getCamera();
      const { rotation } = viewport.getProperties();
    };

    elementRef.current.addEventListener(Events.CAMERA_MODIFIED, cameraModifiedHandler);

    async function run() {
      try {
        console.log("TOOL RUNS");
        
        // 이미 초기화되었다면 건너뛰기
        if (!isInitialized) {
          // Init Cornerstone and related libraries
          initCornerstoneDICOMImageLoader();
          await csInit();
          await csToolsInit();
          
          // Add tools to Cornerstone3D (중복 확인)
          const toolsToAdd = [
            LengthTool,
            ProbeTool,
            RectangleROITool,
            EllipticalROITool,
            CircleROITool,
            BidirectionalTool,
            AngleTool,
            CobbAngleTool,
            ArrowAnnotateTool,
            PlanarFreehandROITool,
            EraserTool,
            KeyImageTool,
          ];

          toolsToAdd.forEach((tool) => {
            try {
              cornerstoneTools.addTool(tool);
            } catch (error) {
              // 이미 추가된 도구는 무시
              console.warn(`Tool ${tool.toolName} already exists, skipping...`);
            }
          });
          
          isInitialized = true;
        }

        // 기존 도구 그룹 제거
        try {
          const existingToolGroup = ToolGroupManager.getToolGroup(toolGroupId);
          if (existingToolGroup) {
            ToolGroupManager.destroyToolGroup(toolGroupId);
          }
        } catch (error) {
          // 도구 그룹이 없으면 무시
        }

        // Define a tool group
        const toolGroup = ToolGroupManager.createToolGroup(toolGroupId);

        // Add the tools to the tool group
        const toolNames = [
          LengthTool.toolName,
          ProbeTool.toolName,
          RectangleROITool.toolName,
          EllipticalROITool.toolName,
          CircleROITool.toolName,
          BidirectionalTool.toolName,
          AngleTool.toolName,
          CobbAngleTool.toolName,
          ArrowAnnotateTool.toolName,
          PlanarFreehandROITool.toolName,
          EraserTool.toolName,
          KeyImageTool.toolName,
        ];

        toolNames.forEach((toolName) => {
          toolGroup.addTool(toolName);
        });

        // Set the initial state of the tools
        console.log("ProbeTool.toolName", ProbeTool.toolName);
        
        toolGroup.setToolActive(LengthTool.toolName, {
          bindings: [
            {
              mouseButton: MouseBindings.Primary, // Left Click
            },
          ],
        });
        
        // Set other tools passive
        [
          ProbeTool.toolName,
          RectangleROITool.toolName,
          EllipticalROITool.toolName,
          CircleROITool.toolName,
          BidirectionalTool.toolName,
          AngleTool.toolName,
          ArrowAnnotateTool.toolName,
          PlanarFreehandROITool.toolName,
          EraserTool.toolName,
        ].forEach((toolName) => {
          toolGroup.setToolPassive(toolName);
        });

        toolGroup.setToolConfiguration(PlanarFreehandROITool.toolName, {
          calculateStats: true,
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

        // Set the tool group on the viewport
        toolGroup.addViewport(viewportId, renderingEngineId);

        // Get the stack viewport that was created
        const viewport = renderingEngine.getViewport(
          viewportId
        ) as Types.IStackViewport;
        
        // Define a stack containing a single image
        const stack = [imageId];

        // Set the stack on the viewport
        viewport.setStack(stack);

        // Render the image
        viewport.render();

        toolGroup.setToolActive(ProbeTool.toolName, {
          bindings: [
            {
              mouseButton: MouseBindings.Primary, // Left Click
            },
          ],
        });
        // Set the old tool passive
        toolGroup.setToolPassive(LengthTool.toolName);
        
      } catch (error) {
        console.error("Error initializing tools:", error);
      }
    }

    run();

    // Cleanup function
    return () => {
      if (elementRef.current) {
        elementRef.current.removeEventListener(Events.CAMERA_MODIFIED, cameraModifiedHandler);
      }
      
      try {
        // 도구 그룹 정리
        const toolGroup = ToolGroupManager.getToolGroup(toolGroupId);
        if (toolGroup) {
          ToolGroupManager.destroyToolGroup(toolGroupId);
        }
      } catch (error) {
        console.warn("Error cleaning up tool group:", error);
      }
      
      try {
        // 렌더링 엔진 정리
        const renderingEngine = getRenderingEngine(renderingEngineId);
        if (renderingEngine) {
          renderingEngine.destroy();
        }
      } catch (error) {
        console.warn("Error cleaning up rendering engine:", error);
      }
    };
  }, [cornerstoneTools]);

  if (!cornerstoneTools) return <div>Loading...</div>;

  return (
    <div>
      <h2>Tools Mouse</h2>
      <div ref={elementRef} style={{ width: "512px", height: "512px" }}>
        {/* DICOM Image will be rendered inside this div */}
      </div>
    </div>
  );
};

export default Tools;
