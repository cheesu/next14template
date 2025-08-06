"use client";

import React from "react";
import dynamic from "next/dynamic";

const StackView = dynamic(() => import("@/components/dicom/Stack"), {
  ssr: false, // 서버 사이드 렌더링 비활성화
});

const StackPage: React.FC = () => {
  return (
    <div>
      <StackView />
    </div>
  );
};

export default StackPage;
