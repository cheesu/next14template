"use client";
import React, { useEffect, useRef } from "react";
import * as cornerstone from "@cornerstonejs/core";
import dicomParser from "dicom-parser";
import {
  RenderingEngine,
  Types,
  Enums,
  setUseCPURendering,
  setPreferSizeOverAccuracy,
} from "@cornerstonejs/core";
import cornerstoneDICOMImageLoader from "@cornerstonejs/dicom-image-loader";
import * as cornerstoneTools from "@cornerstonejs/tools";
import { ProbeTool, init as csToolsInit, addTool } from "@cornerstonejs/tools";
const { ViewportType } = Enums;

const DicomViewer6: React.FC = () => {
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.log("ddddd111");
    async function init() {
      const { preferSizeOverAccuracy, useNorm16Texture } =
        cornerstone.getConfiguration().rendering;
      cornerstoneDICOMImageLoader.external.cornerstone = cornerstone;
      cornerstoneDICOMImageLoader.external.dicomParser = dicomParser;
      cornerstoneDICOMImageLoader.configure({
        useWebWorkers: true,
        decodeConfig: {
          convertFloatPixelDataToInt: false,
          use16BitDataType: preferSizeOverAccuracy || useNorm16Texture,
        },
      });
      let maxWebWorkers = 1;
      if (navigator.hardwareConcurrency) {
        maxWebWorkers = Math.min(navigator.hardwareConcurrency, 7);
      }
      var config = {
        maxWebWorkers,
        startWebWorkersOnDemand: false,
        taskConfiguration: {
          decodeTask: {
            initializeCodecsOnStartup: false,
            strict: false,
          },
        },
      };
      cornerstoneDICOMImageLoader.webWorkerManager.initialize(config);

      if (!elementRef.current) return;

      const renderingEngineId = "myRenderingEngine";
      const viewportId = "CT_STACK";

      // cornerstone 초기화
      await cornerstone.init();
      await csToolsInit();

      // cornerstoneTools에 ProbeTool 추가
      //addTool(ProbeTool);

      // ProbeTool 활성화
      //cornerstoneTools.setToolActive("Probe", { mouseButtonMask: 1 });
      //addTool(ProbeTool);
      //cornerstoneTools.setToolActive("Probe", { mouseButtonMask: 1 });

      // RenderingEngine 인스턴스 생성
      const renderingEngine = new RenderingEngine(renderingEngineId);

      const viewportInput = {
        viewportId,
        element: elementRef.current,
        type: ViewportType.STACK,
      };

      renderingEngine.enableElement(viewportInput);
      const viewport = renderingEngine.getViewport(
        viewportId
      ) as Types.IStackViewport;

      const testurl =
        "wadouri:https://raw.githubusercontent.com/cornerstonejs/cornerstone3D/main/packages/dicomImageLoader/testImages/CTImage.dcm_JPEGLSLosslessTransferSyntax_1.2.840.10008.1.2.4.80.dcm";

      const imageId = "wadouri:http://localhost:4000/dicom.dcm";

      viewport.setStack([imageId]).then(
        () => {
          // Set the VOI of the stack
          // viewport.setProperties({ voiRange: ctVoiRange });
          // Render the image
          viewport.render();
        },
        function (err: any) {
          throw err;
        }
      );

      // viewport.render();
    }
    init();
  }, []);

  return (
    <div ref={elementRef} style={{ width: "512px", height: "512px" }}>
      {/* DICOM Image will be rendered inside this div */}
    </div>
  );
};

export default DicomViewer6;
