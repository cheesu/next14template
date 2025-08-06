"use client";

import React from "react";

import dynamic from "next/dynamic";
//import Tools from "@/components/dicom/Tools";
const Tools = dynamic(() => import("@/components/dicom/Tools"), {
  ssr: false, // 서버 사이드 렌더링 비활성화
});

const DicomReader: React.FC = () => {
  console.log("first DicomReader");
  return (
    <div>
      <h1>Tools test</h1>
      <Tools />
    </div>
  );
};

export default DicomReader;
