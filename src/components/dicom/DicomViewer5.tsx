import React, { useEffect, useRef } from "react";
import * as cornerstone from "@cornerstonejs/core";
import {
  RenderingEngine,
  Types,
  Enums,
  setUseCPURendering,
  setPreferSizeOverAccuracy,
} from "@cornerstonejs/core";
import cornerstoneDICOMImageLoader from "@cornerstonejs/dicom-image-loader";
import * as dicomParser from "dicom-parser";

const DicomViewer5: React.FC = () => {
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.log("ddddd111");
    async function init() {
      const { preferSizeOverAccuracy, useNorm16Texture } =
        cornerstone.getConfiguration().rendering;

      console.log("preferSizeOverAccuracy:", preferSizeOverAccuracy);
      console.log("useNorm16Texture:", useNorm16Texture);

      // Initialize cornerstone
      await cornerstone.init();
      setUseCPURendering(false);
      setPreferSizeOverAccuracy(false);

      cornerstoneDICOMImageLoader.external.cornerstone = cornerstone;
      cornerstoneDICOMImageLoader.external.dicomParser = dicomParser;

      cornerstoneDICOMImageLoader.configure({
        useWebWorkers: true,
        decodeConfig: {
          convertFloatPixelDataToInt: false,
        },
      });

      // Create a rendering engine
      const renderingEngineId = "myRenderingEngine";
      const renderingEngine = new RenderingEngine(renderingEngineId);

      if (!elementRef.current) return;

      // Create a stack viewport
      const viewportId = "CT_STACK";
      const viewportInput = {
        viewportId,
        element: elementRef.current,
        type: Enums.ViewportType.STACK,
      };

      renderingEngine.enableElement(viewportInput);
      const viewport = renderingEngine.getViewport(viewportInput.viewportId) as Types.IStackViewport;
      await viewport.setStack(["wadouri:http://localhost:3000/dicom.dcm"], 0);

      viewport.render();
    }
    init();
  }, []);

  return (
    <div ref={elementRef} style={{ width: "512px", height: "512px" }}>
      {/* DICOM Image will be rendered inside this div */}
    </div>
  );
};

export default DicomViewer5;
