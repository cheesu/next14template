"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MENU_LIST } from "@/const/const";
import { MenuItem } from "@/const/interface";

const Breadcrumb = () => {
  const pathname = usePathname();

  const findMenuPath = (items: MenuItem[], targetPath: string, path: MenuItem[] = []): MenuItem[] | null => {
    for (const item of items) {
      const currentPath = [...path, item];
      
      if (item.url === targetPath) {
        return currentPath;
      }
      
      if (item.children) {
        const found = findMenuPath(item.children, targetPath, currentPath);
        if (found) return found;
      }
    }
    return null;
  };

  const menuPath = findMenuPath(MENU_LIST, pathname);

  if (!menuPath || menuPath.length === 0) return null;

  return (
    <nav className="flex mb-6" aria-label="Breadcrumb">
      <div className="flex items-center space-x-1 bg-gray-50 dark:bg-gray-800 rounded-lg px-4 py-2 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center">
          <Link 
            href="/" 
            className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors duration-200 rounded-md px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            홈
          </Link>
        </div>
        {menuPath.map((item, index) => (
          <div key={item.id} className="flex items-center">
            <svg className="w-4 h-4 text-gray-400 mx-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            {index === menuPath.length - 1 ? (
              <span className="text-sm font-semibold text-blue-600 dark:text-blue-400 px-2 py-1">
                {item.title}
              </span>
            ) : (
              <Link 
                href={item.url || "#"}
                className="text-sm font-medium text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors duration-200 rounded-md px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                {item.title}
              </Link>
            )}
          </div>
        ))}
      </div>
    </nav>
  );
};

export default Breadcrumb;