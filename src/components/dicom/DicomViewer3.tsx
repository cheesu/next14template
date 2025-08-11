import { useEffect, useRef } from "react";

import {
  Enums,
  RenderingEngine,
  imageLoader,
  metaData,
  volumeLoader,
  init,
} from "@cornerstonejs/core";

import * as dicomParser from "dicom-parser";

const imageIds = ["http://localhost:3000/dicom.dcm"];
const renderingEngineId = "myRenderingEngine";
const viewportId = "myViewport";
const volumeId = "myVolume";

// 이미지 로더 등록
function setupImageLoader() {
  imageLoader.registerImageLoader("http", (imageId) => {
    const loadPromise = fetch(imageId)
      .then((response) => response.arrayBuffer())
      .then((buffer) => {
        const dataSet = dicomParser.parseDicom(new Uint8Array(buffer));
        const pixelData =
          dataSet.elements.x7fe00010 || dataSet.elements.x7fe00011; // 예시로 Pixel Data Element를 찾습니다.
        const windowCenter = dataSet.uint16("x00281050", 0); // Window Center
        const windowWidth = dataSet.uint16("x00281051", 0); // Window Width
        const image = {
          getPixelData: () =>
            new Uint8Array(buffer, pixelData.dataOffset, pixelData.length),
          width: dataSet.uint16("x00280011"),
          height: dataSet.uint16("x00280010"),
          sizeInBytes: buffer.byteLength,
        };
        console.log("Loaded image data:", image);

        return image;
      });

    return {
      promise: loadPromise, // 이미지 로딩 프로미스
      cancelFn: () => {
        console.log("Loading cancelled");
      },
      decache: () => {
        console.log("Decaching image");
      },
    };
  });
}

async function run(container: HTMLDivElement) {
  try {
    await init();
    setupImageLoader();

    const renderingEngine = new RenderingEngine(renderingEngineId);
    renderingEngine.setViewports([
      {
        element: container,
        type: Enums.ViewportType.STACK,
        viewportId,
      },
    ]);

    const viewport = renderingEngine.getStackViewports()[0];
    //console.log("first viewport:", viewport);
    await viewport.setStack(imageIds);
    await viewport.setImageIdIndex(0);

    // await viewport.render();
  } catch (error) {
    console.error("Failed to initialize rendering engine:", error);
  }
}

const DicomViewer3: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      run(container);
    }
  }, []);

  return (
    <div
      id={viewportId}
      ref={containerRef}
      style={{ height: "500px", width: "500px" }}
    />
  );
};

export default DicomViewer3;
