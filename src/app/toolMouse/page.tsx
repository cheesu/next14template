"use client";

import React from "react";
import dynamic from "next/dynamic";

const ToolsMouse = dynamic(() => import("@/components/dicom/ToolsMouse"), {
  ssr: false, // 서버 사이드 렌더링 비활성화
});

const ToolMousePage: React.FC = () => {
  console.log("first ToolMousePage");
  return (
    <div className="space-y-8">
      <div className="bg-white rounded-xl p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">🖱️ 마우스 기반 분석 도구</h1>
        <p className="text-lg text-gray-600 mb-8">
          마우스 인터렉션을 활용한 직관적인 의료 영상 분석 도구입니다.
        </p>
        
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <ToolsMouse />
        </div>
      </div>
    </div>
  );
};

export default ToolMousePage;
