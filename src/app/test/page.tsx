// src/pages/index.tsx
import React from "react";

const TestPage = () => {
  return (
    <div className="space-y-8">
      <div className="bg-white rounded-xl p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">🧪 테스트 페이지</h1>
        <p className="text-lg text-gray-600 mb-8">
          다양한 컴포넌트와 기능들을 테스트할 수 있는 페이지입니다.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">차트 테스트 1</h2>
            <div className="bg-gray-50 rounded-lg p-8 text-center text-gray-500">
              차트 컴포넌트 영역
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">차트 테스트 2</h2>
            <div className="bg-gray-50 rounded-lg p-8 text-center text-gray-500">
              차트 컴포넌트 영역
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">차트 테스트 3</h2>
            <div className="bg-gray-50 rounded-lg p-8 text-center text-gray-500">
              차트 컴포넌트 영역
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestPage;
