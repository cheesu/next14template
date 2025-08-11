import React, { useRef, useState, useEffect } from "react";
import * as cornerstone from "cornerstone-core";

const DicomViewer4: React.FC = () => {
  const elementRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (elementRef.current) {
      cornerstone.enable(elementRef.current);
      cornerstone
        .loadImage("wadouri:http://localhost:3000/dicom.dcm")
        .then((image) => {
          cornerstone.displayImage(elementRef.current!, image);
        })
        .catch((err) => console.error("testsetst", err));
    }
  }, []);

  return (
    <div>
      <div ref={elementRef} style={{ width: "512px", height: "512px" }}>
        <canvas className="cornerstone-canvas" />
      </div>
    </div>
  );
};

export default DicomViewer4;
