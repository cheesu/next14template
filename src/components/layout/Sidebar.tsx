"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useSelector, useDispatch } from "react-redux";
import { AppDispatch, RootState } from "@/store/store";
import { MenuItem } from "@/const/interface";
import { MENU_LIST } from "@/const/const";
import { setMenuId } from "@/features/menu/menuSlice";

// 아이콘 컴포넌트들
const icons = {
  home: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  chart: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  dicom: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  tools: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  vessel: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  other: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  ),
};

const getMenuIcon = (title: string) => {
  if (title === "홈") return icons.home;
  if (title === "차트") return icons.chart;
  if (title === "DICOM") return icons.dicom;
  if (title === "도구") return icons.tools;
  if (title === "혈관") return icons.vessel;
  return icons.other;
};

const Sidebar = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { menuId } = useSelector((state: RootState) => state.menu);
  const [expandedMenus, setExpandedMenus] = useState<number[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const clickMenuHandler = (id: number) => {
    dispatch(setMenuId(id));
  };

  const toggleExpanded = (id: number) => {
    setExpandedMenus(prev => 
      prev.includes(id) 
        ? prev.filter(menuId => menuId !== id)
        : [...prev, id]
    );
  };

  const renderMenuItem = (item: MenuItem, level = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedMenus.includes(item.id);
    const isSelected = item.id === menuId || 
      (item.children && item.children.some(child => child.id === menuId));
    const icon = getMenuIcon(item.title);

    return (
      <div key={item.id} className="mb-1">
        {hasChildren ? (
          <button
            onClick={() => toggleExpanded(item.id)}
            className={`group w-full flex items-center justify-between px-4 py-3 text-left rounded-xl mx-2 transition-all duration-300 hover:scale-105 ${
              isSelected
                ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/25"
                : "text-slate-700 hover:bg-gradient-to-r hover:from-slate-100 hover:to-slate-50 dark:text-slate-300 dark:hover:from-slate-700 dark:hover:to-slate-600"
            } ${level > 0 ? 'ml-4' : ''}`}
          >
            <div className="flex items-center space-x-3">
              <div className={`p-1 rounded-lg transition-colors ${isSelected ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-700'}`}>
                {icon}
              </div>
              <span className={`${isCollapsed ? 'hidden' : ''} truncate font-medium`}>
                {item.title}
              </span>
            </div>
            <svg
              className={`w-4 h-4 transform transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''} ${isCollapsed ? 'hidden' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        ) : (
          <Link
            href={item.url || "#"}
            onClick={() => {
              if (item.url) {
                clickMenuHandler(item.id);
              }
            }}
            className={`group flex items-center space-x-3 px-4 py-3 mx-2 rounded-xl transition-all duration-300 hover:scale-105 ${
              item.id === menuId
                ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/25"
                : "text-slate-700 hover:bg-gradient-to-r hover:from-slate-100 hover:to-slate-50 dark:text-slate-300 dark:hover:from-slate-700 dark:hover:to-slate-600"
            } ${level > 0 ? 'ml-8' : ''}`}
          >
            <div className={`p-1 rounded-lg transition-colors ${item.id === menuId ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-700'}`}>
              {level === 0 ? icon : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              )}
            </div>
            <span className={`${isCollapsed ? 'hidden' : ''} truncate font-medium`}>
              {item.title}
            </span>
          </Link>
        )}
        
        {hasChildren && isExpanded && !isCollapsed && (
          <div className="mt-2 ml-2 space-y-1 border-l-2 border-slate-200 dark:border-slate-600 pl-4">
            {item.children?.map((child) => renderMenuItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`fixed left-0 top-0 h-full bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-r border-slate-200 dark:border-slate-700 transition-all duration-300 z-40 shadow-xl ${
      isCollapsed ? 'w-20' : 'w-72'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div className={`${isCollapsed ? 'hidden' : ''}`}>
            <h1 className="font-bold text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Medical
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Image Viewer</p>
          </div>
        </div>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 rounded-xl bg-white dark:bg-slate-700 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-110"
        >
          <svg className="w-4 h-4 text-slate-600 dark:text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d={isCollapsed ? "M9 5l7 7-7 7" : "M15 19l-7-7 7-7"} />
          </svg>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-4">
        <div className="space-y-2">
          {MENU_LIST?.map((item) => renderMenuItem(item))}
        </div>
      </nav>

      {/* Footer */}
      <div className={`p-4 border-t border-slate-200 dark:border-slate-700 bg-white/30 dark:bg-slate-800/30 ${isCollapsed ? 'hidden' : ''}`}>
        <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl">
          <div className="w-8 h-8 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-bold">U</span>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">사용자</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">의료진</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;