import React from "react";

import { MenuItem } from "@/const/interface";
import { MENU_LIST } from "@/const/const";

const Footer = () => {
  return (
    <footer className="mt-auto border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
      <div className="mx-auto max-w-[95%] px-6 py-4">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          {/* Quick Links */}
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs">
            {MENU_LIST?.slice(0, 4).map((item: MenuItem) => {
              // 1뎁스 메뉴만 표시 (url이 있는 경우)
              if (item.url) {
                return (
                  <a
                    key={item.id}
                    className="text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors duration-200 px-2 py-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                    href={item.url}
                  >
                    {item.title}
                  </a>
                );
              }
              // 2뎁스 메뉴가 있는 경우 첫 번째 하위 메뉴만 표시
              return item.children?.slice(0, 1).map((child) => (
                <a
                  key={child.id}
                  className="text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors duration-200 px-2 py-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                  href={child.url || "#"}
                >
                  {child.title}
                </a>
              ));
            })}
          </div>
          
          {/* Copyright and Status */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-gray-500 dark:text-gray-400">시스템 정상</span>
            </div>
            <div className="h-4 w-px bg-gray-300 dark:bg-gray-600"></div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              ©2024 의료영상분석시스템. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
