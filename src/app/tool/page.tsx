"use client";

import React from "react";

import dynamic from "next/dynamic";
//import Tools from "@/components/dicom/Tools";
const Tools = dynamic(() => import("@/components/dicom/Tools"), {
  ssr: false, // 서버 사이드 렌더링 비활성화
});

const ToolsPage: React.FC = () => {
  console.log("first ToolsPage");
  return (
    <div className="space-y-8">
      <div className="bg-white rounded-xl p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">🔧 측정 및 분석 도구</h1>
        <p className="text-lg text-gray-600 mb-8">
          다양한 측정 및 분석 도구를 사용하여 의료 영상을 자세히 분석할 수 있습니다.
        </p>
        
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <Tools />
        </div>
      </div>
    </div>
  );
};

export default ToolsPage;
