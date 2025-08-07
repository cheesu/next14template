"use client";
import React, { useState, useEffect } from "react";
import ChartTest1 from "@/components/chart/ChartTest1";

const ChartPage: React.FC = () => {
  const [events, setEvents] = useState<string[]>([]);
  useEffect(() => {
    // SSE 연결 생성
    const eventSource = new EventSource("http://192.168.2.137:3000/sse");

    // 서버로부터 메시지 수신
    eventSource.onmessage = (event) => {
      console.log("Message from server:", event.data);
      setEvents((prevEvents) => [...prevEvents, event.data]);
    };

    // 오류 발생 시 처리
    eventSource.onerror = (error) => {
      console.error("Connection lost:", error);
      eventSource.close(); // 연결 종료
    };

    // 컴포넌트 언마운트 시 연결 종료
    return () => {
      eventSource.close();
      console.log("SSE connection closed");
    };
  }, []); // 빈 배열로 설정하여 컴포넌트 마운트 시 한 번만 실행

  useEffect(() => {
    // SSE 연결 생성
    const eventSource = new EventSource("http://192.168.2.137:3000/ssecnt");

    // 서버로부터 메시지 수신
    eventSource.onmessage = (event) => {
      console.log("Message CNT from server:", event.data);
      setEvents((prevEvents) => [...prevEvents, event.data]);
    };

    // 오류 발생 시 처리
    eventSource.onerror = (error) => {
      console.error("Connection  CNT lost:", error);
      eventSource.close(); // 연결 종료
    };

    // 컴포넌트 언마운트 시 연결 종료
    return () => {
      eventSource.close();
      console.log("SSE CNT connection closed");
    };
  }, []); // 빈 배열로 설정하여 컴포넌트 마운트 시 한 번만 실행

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-xl p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">📊 데이터 시각화 및 차트</h1>
        
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">실시간 차트</h2>
          <ChartTest1 />
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">서버-센트 이벤트 로그</h3>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 h-48 overflow-y-auto">
            {events.length > 0 ? (
              <ul className="space-y-1">
                {events.map((event, index) => (
                  <li key={index + "_ev"} className="text-sm text-gray-700 py-1 border-b border-gray-200 last:border-b-0">
                    Message: {event}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-center py-8">연결을 기다리는 중...</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChartPage;
