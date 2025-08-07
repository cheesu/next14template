"use client";
import React from "react";
import Link from "next/link";
import { MENU_LIST } from "@/const/const";
import { MenuItem } from "@/const/interface";

const medicalFeatures = [
  {
    id: 1,
    title: "대시보드",
    description: "데이터 시각화 및 차트를 통한 분석 대시보드",
    icon: (
      <svg className="w-12 h-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    url: "/chart"
  },
  {
    id: 2,
    title: "DICOM 뷰어",
    description: "DICOM 이미지 뷰어 및 기본 분석 도구",
    icon: (
      <svg className="w-12 h-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    url: "/dicom"
  },
  {
    id: 3,
    title: "도구",
    description: "다양한 측정 및 분석 도구 모음",
    icon: (
      <svg className="w-12 h-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    url: "/tool"
  },
  {
    id: 4,
    title: "마우스 도구",
    description: "마우스 기반 인터렉티브 분석 도구",
    icon: (
      <svg className="w-12 h-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
      </svg>
    ),
    url: "/toolMouse"
  },
  {
    id: 5,
    title: "스택 뷰",
    description: "다중 슬라이스 이미지 스택 뷰어",
    icon: (
      <svg className="w-12 h-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
    url: "/stack"
  },
  {
    id: 6,
    title: "DICOM 파서",
    description: "DICOM 파일 파싱 및 메타데이터 분석기",
    icon: (
      <svg className="w-12 h-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
    url: "/dicompaser"
  }
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Welcome Section */}
      <div className="text-center py-16 lg:py-24">
        {/* Large M Icon */}
        <div className="flex justify-center mb-8">
          <div className="w-24 h-24 bg-blue-500 rounded-full flex items-center justify-center">
            <span className="text-4xl font-bold text-white">M</span>
          </div>
        </div>
        
        <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
          MedicalView에 오신 것을 환영합니다
        </h1>
        <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
          의료진을 위한 현대적이고 직관적인 DICOM 뷰어 및 분석 도구로 더 나은 진단과 치료를 지원합니다.
        </p>
      </div>

      {/* Feature Cards */}
      <div className="max-w-7xl mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {medicalFeatures.map((feature) => (
            <Link
              key={feature.id}
              href={feature.url}
              className="group"
            >
              <div className="bg-white rounded-2xl p-8 border border-gray-200 hover:shadow-xl transition-all duration-300 group-hover:-translate-y-1 h-full">
                <div className="flex flex-col items-start h-full">
                  <div className="mb-6">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed flex-grow">
                    {feature.description}
                  </p>
                  <div className="mt-6 flex items-center text-blue-500 font-medium">
                    시작하기
                    <svg className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Trust Section */}
      <div className="bg-gray-100 py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            의료진이 신뢰하는 전문 도구
          </h2>
          <p className="text-lg text-gray-600 mb-12 max-w-3xl mx-auto">
            안전하고 정확한 의료 영상 분석을 위해 설계된 MedicalView는 최신 웹 기술을 활용하여 빠르고 직관적인 사용자 경험을 제공합니다.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-5xl font-bold text-blue-500 mb-2">99.9%</div>
              <div className="text-gray-600 font-medium">신뢰성</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-blue-500 mb-2">24/7</div>
              <div className="text-gray-600 font-medium">기술 지원</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-blue-500 mb-2">100+</div>
              <div className="text-gray-600 font-medium">의료기관</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
