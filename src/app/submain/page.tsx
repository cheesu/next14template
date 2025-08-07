// src/pages/index.tsx
import React from "react";

const SubMainPage = () => {
  return (
    <div className="space-y-8">
      <div className="bg-white rounded-xl p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">📋 서브메인 페이지</h1>
        <p className="text-lg text-gray-600 mb-8">
          보조 기능들과 추가 도구들을 제공하는 서브메인 페이지입니다.
        </p>
        
        <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm text-center">
          <div className="mb-6">
            <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">준비 중인 기능</h2>
          <p className="text-gray-600">추가 기능들이 곧 업데이트될 예정입니다.</p>
        </div>
      </div>
    </div>
  );
};

export default SubMainPage;
