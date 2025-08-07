"use client";

import React from "react";
import dynamic from "next/dynamic";

const StackView = dynamic(() => import("@/components/dicom/Stack"), {
  ssr: false, // 서버 사이드 렌더링 비활성화
});

const StackPage: React.FC = () => {
  return (
    <div className="space-y-8">
      <div className="bg-white rounded-xl p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">📚 다중 슬라이스 스택 뷰어</h1>
        <p className="text-lg text-gray-600 mb-8">
          여러 슬라이스로 구성된 의료 영상을 순차적으로 탐색할 수 있습니다.
        </p>
        
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <StackView />
        </div>
      </div>
    </div>
  );
};

export default StackPage;
