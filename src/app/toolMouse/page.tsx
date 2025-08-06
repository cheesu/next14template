"use client";

import React from "react";
import dynamic from "next/dynamic";

const ToolsMouse = dynamic(() => import("@/components/dicom/ToolsMouse"), {
  ssr: false, // 서버 사이드 렌더링 비활성화
});

const ToolMousePage: React.FC = () => {
  console.log("first DicomReader");
  return (
    <div>
      <ToolsMouse />
    </div>
  );
};

export default ToolMousePage;
