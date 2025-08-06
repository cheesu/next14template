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

// This is for debugging purposes
console.warn(
  "Click on index.ts to open source code for this example --------->"
);

const { ViewportType, Events } = Enums;
//const { MouseBindings } = csToolsEnums;
const renderingEngineId = "myRenderingEngine2";
const viewportId = "CT_STACK_MOUSE";
const toolGroupId = "STACK_TOOL_GROUP_ID_MOUSE";

const StackView: React.FC = ({}) => {
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
    // textLines.push(`(your custom text)`);

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

    // 구조분해 할당을 사용하여 모듈에서 필요한 부분을 추출

    // 오른쪽 클릭 비활성화
    elementRef.current.oncontextmenu = (e) => e.preventDefault();
    console.log("useEffect ToolsMouse22");
    async function run() {
      // Define a tool group, which defines how mouse events map to tool commands for
      // Any viewport using the group
      const toolGroup = ToolGroupManager.createToolGroup(toolGroupId);
      if (!toolGroup) return;

      // Init Cornerstone and related libraries
      initCornerstoneDICOMImageLoader();
      await csInit();
      await csToolsInit();

      // Add tools to Cornerstone3D
      cornerstoneTools.addTool(ProbeTool);
      cornerstoneTools.addTool(DragProbeTool);

      // Add the tools to the tool group
      toolGroup.addTool(ProbeTool.toolName);
      toolGroup.addTool(DragProbeTool.toolName);

      // Set the initial state of the tools, here we set one tool active on left click.

      toolGroup.setToolActive(DragProbeTool.toolName, {
        bindings: [
          {
            mouseButton: MouseBindings.Primary, // Left Click
          },
        ],
      });
      // We set all the other tools passive here, this means that any state is rendered, and editable
      // But aren't actively being drawn (see the toolModes example for information)
      //  toolGroup.setToolPassive(ProbeTool.toolName);

      toolGroup.setToolConfiguration(PlanarFreehandROITool.toolName, {
        calculateStats: true,
      });

      toolGroup.setToolConfiguration(DragProbeTool.toolName, {
        getTextLines: getTextLinesProbe,
      });

      // Get Cornerstone imageIds and fetch metadata into RAM
      const imageId = "wadouri:http://localhost:4000/dicom/004.dcm";
      const imageIds = [
        "wadouri:http://localhost:4000/dicom/001.dcm",
        "wadouri:http://localhost:4000/dicom/002.dcm",
        "wadouri:http://localhost:4000/dicom/003.dcm",
        "wadouri:http://localhost:4000/dicom/004.dcm",
        "wadouri:http://localhost:4000/dicom/005.dcm",
        "wadouri:http://localhost:4000/dicom/006.dcm",
        "wadouri:http://localhost:4000/dicom/007.dcm",
        "wadouri:http://localhost:4000/dicom/008.dcm",
      ];

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
      //const stack = [imageId];
      const stack = imageIds;

      // Set the stack on the viewport
      await viewport.setStack(stack);

      // Render the image
      await viewport.render();
      console.log("viewport", viewport);
      console.log("viewport.getImageData()", viewport.getImageData());
      const imageData2 = viewport.getImageData();
      console.log("imageData2", imageData2.dimensions);
      const {
        dimensions,
        direction,
        spacing,
        origin,
        scalarData,
        imageData,
        metadata,
      } = viewport.getImageData();
      const samplesPerPixel =
        scalarData.length / dimensions[2] / dimensions[1] / dimensions[0];

      console.log("scalarData", scalarData);

      elementRef.current.addEventListener("mousemove", (evt) => {
        if (!cornerstoneTools || !elementRef.current) return;
        const rect = elementRef.current.getBoundingClientRect();

        const canvasPos: Types.Point2 = [
          Math.floor(evt.clientX - rect.left),
          Math.floor(evt.clientY - rect.top),
        ];
        // Convert canvas coordiantes to world coordinates
        const worldPos = viewport.canvasToWorld(canvasPos);

        setCanvasPos(`canvas: (${canvasPos[0]}, ${canvasPos[1]})`);
        setWorldPos(
          `world: (${worldPos[0].toFixed(2)}, ${worldPos[1].toFixed(
            2
          )}, ${worldPos[2].toFixed(2)})`
        );
      });
    }

    run();
  }, []);

  if (!cornerstoneTools) return <div>Loading...</div>; // 모듈 로딩 대기

  return (
    <div>
      <h2>STACK</h2>
      <div ref={elementRef} style={{ width: "512px", height: "512px" }}>
        {/* DICOM Image will be rendered inside this div */}
      </div>
      <p>{canvasPos} </p>
      <p>{worldPos} </p>
    </div>
  );
};

export default memo(StackView);
