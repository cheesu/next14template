"use client";
import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useSelector, useDispatch } from "react-redux";
import { AppDispatch, RootState } from "@/store/store";
import { MenuItem } from "@/const/interface";
import { MENU_LIST } from "@/const/const";
import { setMenuId } from "@/features/menu/menuSlice";
import LoginButton from "../login/LoginButton";

const Header = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { menuId } = useSelector((state: RootState) => state.menu);
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const clickMenuHandler = (id: number) => {
    dispatch(setMenuId(id));
  };

  const handleMouseEnter = (id: number) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setOpenDropdown(id);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setOpenDropdown(null);
    }, 150);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const renderMenuItem = (item: MenuItem) => {
    const hasChildren = item.children && item.children.length > 0;
    const isSelected = item.id === menuId || 
      (item.children && item.children.some(child => child.id === menuId));

    if (hasChildren) {
      return (
        <div 
          key={item.id} 
          className="relative"
          onMouseEnter={() => handleMouseEnter(item.id)}
          onMouseLeave={handleMouseLeave}
        >
          <button
            className={`flex items-center px-3 py-2 text-sm font-medium transition-colors duration-200 ${
              isSelected
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600 hover:text-blue-600"
            }`}
          >
            {item.title}
            <svg
              className="ml-1 h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {/* Dropdown Menu */}
          {openDropdown === item.id && (
            <div className="absolute top-full left-0 mt-2 w-48 rounded-lg bg-white shadow-xl ring-1 ring-gray-200 z-50">
              <div className="py-2">
                {item.children?.map((child) => (
                  <Link
                    key={child.id}
                    href={child.url || "#"}
                    className={`block px-4 py-3 text-sm transition-colors duration-200 hover:bg-blue-50 hover:text-blue-600 ${
                      child.id === menuId
                        ? "bg-blue-50 text-blue-600"
                        : "text-gray-700"
                    }`}
                    onClick={() => {
                      if (child.url) {
                        clickMenuHandler(child.id);
                        setOpenDropdown(null);
                      }
                    }}
                  >
                    {child.title}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    return (
      <Link
        key={item.id}
        href={item.url || "#"}
        onClick={() => {
          if (item.url) {
            clickMenuHandler(item.id);
          }
        }}
        className={`px-3 py-2 text-sm font-medium transition-colors duration-200 ${
          item.id === menuId
            ? "text-blue-600 border-b-2 border-blue-600"
            : "text-gray-600 hover:text-blue-600"
        }`}
      >
        {item.title}
      </Link>
    );
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
      <div className="mx-auto max-w-[95%] px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-3">
              <div className="h-8 w-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-lg font-bold text-white">M</span>
              </div>
              <span className="text-xl font-bold text-gray-900">
                MedicalView
              </span>
            </Link>
          </div>

          {/* Navigation Menu */}
          <nav className="hidden md:flex items-center space-x-6">
            {MENU_LIST?.map((item) => renderMenuItem(item))}
          </nav>

          {/* Right side actions */}
          <div className="flex items-center space-x-6">
            {/* Login Button */}
            <LoginButton />

            {/* Mobile menu button */}
            <button className="md:hidden p-2 text-gray-500 hover:text-gray-700">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;