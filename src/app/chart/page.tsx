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
    <div className="text-black">
      <div>
        <h1>Server-Sent Events with React</h1>
        <div id="events">
          {events.map((event, index) => (
            <p key={index + "_ev"}>Message: {event}</p>
          ))}
        </div>
      </div>
      <h1>chart test</h1>
      <ChartTest1 />
    </div>
  );
};

export default ChartPage;
