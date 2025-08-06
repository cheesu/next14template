"use client";
import React, { useState } from "react";

import dynamic from "next/dynamic";

const DicomViewer6 = dynamic(() => import("@/components/dicom/DicomViewer6"), {
  ssr: false, // 서버 사이드 렌더링 비활성화
});
const DicomViewer5 = dynamic(() => import("@/components/dicom/DicomViewer5"), {
  ssr: false, // 서버 사이드 렌더링 비활성화
});

const DicomReader: React.FC = () => {
  return (
    <div>
      <h1>DicomReader6</h1>
      <DicomViewer6 />
    </div>
  );
};

export default DicomReader;
