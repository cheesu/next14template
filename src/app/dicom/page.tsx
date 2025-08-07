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
    <div className="space-y-8">
      <div className="bg-white rounded-xl p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">🩻 DICOM 뷰어</h1>
        <p className="text-lg text-gray-600 mb-8">
          의료 영상 파일을 보고 분석할 수 있는 전문 DICOM 뷰어입니다.
        </p>
        
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <DicomViewer6 />
        </div>
      </div>
    </div>
  );
};

export default DicomReader;
