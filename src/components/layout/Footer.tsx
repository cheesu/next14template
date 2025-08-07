import React from "react";

import { MenuItem } from "@/const/interface";
import { MENU_LIST } from "@/const/const";

const Footer = () => {
  return (
    <footer className="mt-auto border-t border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-6 py-6">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          {/* Quick Links */}
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
            {MENU_LIST?.slice(0, 4).map((item: MenuItem) => {
              // 1뎁스 메뉴만 표시 (url이 있는 경우)
              if (item.url) {
                return (
                  <a
                    key={item.id}
                    className="text-gray-600 hover:text-blue-600 transition-colors duration-200"
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
                  className="text-gray-600 hover:text-blue-600 transition-colors duration-200"
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
              <span className="text-sm text-gray-600">시스템 정상</span>
            </div>
            <div className="h-4 w-px bg-gray-300"></div>
            <p className="text-sm text-gray-600">
              ©2024 MedicalView. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
