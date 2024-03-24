// src/pages/index.tsx
import React from "react";

const TestPage = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div className="p-4 border rounded-md">
        <h2 className="text-lg font-bold mb-2">Chart 1</h2>
        {/* Chart 1 goes here */}
      </div>
      <div className="p-4 border rounded-md">
        <h2 className="text-lg font-bold mb-2">Chart 2</h2>
        {/* Chart 2 goes here */}
      </div>
      <div className="p-4 border rounded-md">
        <h2 className="text-lg font-bold mb-2">Chart 3</h2>
        {/* Chart 3 goes here */}
      </div>
    </div>
  );
};

export default TestPage;
