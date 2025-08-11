import React, { useRef, useState, useEffect } from "react";
import * as cornerstone from "cornerstone-core";
import * as cornerstoneWADOImageLoader from "cornerstone-wado-image-loader";
import * as dicomParser from "dicom-parser";

const DicomViewer2: React.FC = () => {
  const elementRef = useRef<HTMLDivElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [huValue, setHuValue] = useState(null);

  useEffect(() => {
    cornerstoneWADOImageLoader.external.cornerstone = cornerstone;
    cornerstoneWADOImageLoader.external.dicomParser = dicomParser;

    if (elementRef.current) {
      cornerstone.enable(elementRef.current);
    }
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const fileReader = new FileReader();
      fileReader.onload = (e) => {
        console.log("e.target?.result", e.target?.result);
        // ArrayBuffer로부터 DICOM 데이터 파싱
        const byteArray = new Uint8Array(e.target?.result as ArrayBuffer);
        const dataSet = dicomParser.parseDicom(byteArray);

        const arrayBuffer = e.target?.result as ArrayBuffer;
        const imageId =
          cornerstoneWADOImageLoader.wadouri.fileManager.add(arrayBuffer);
        console.log("imageId:", imageId);
        cornerstone
          .loadImage("wadouri:http://localhost:3000/dicom.dcm")
          .then((image) => {
            cornerstone.displayImage(elementRef.current!, image);
          })
          .catch((err) => console.error("testsetst", err));
      };
      if (file instanceof Blob) {
        fileReader.readAsArrayBuffer(file);
      } else {
        console.error("The provided file is not a Blob:", file);
      }
    }
  };

  return (
    <div>
      <input type="file" accept=".dcm" onChange={handleFileChange} />
      <div ref={elementRef} style={{ width: "512px", height: "512px" }}>
        <canvas className="cornerstone-canvas" />
      </div>
    </div>
  );
};

export default DicomViewer2;
