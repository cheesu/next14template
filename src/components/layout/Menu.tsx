"use client";
import React, { useState, useCallback, useRef, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { AppDispatch, RootState } from "@/store/store";
import { MenuItem } from "@/const/interface";
import { MENU_LIST } from "@/const/const";
import { setMenuId } from "@/features/menu/menuSlice";
import Link from "next/link";

const Menu = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { menuId } = useSelector((state: RootState) => state.menu);
  const [selectedMenuId, setSelectedMenuId] = useState(menuId);
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const clickMenuHandler = useCallback(
    (id: number) => {
      dispatch(setMenuId(id));
      setSelectedMenuId(id);
    },
    [dispatch]
  );

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
    const isSelected = item.id === selectedMenuId || 
      (item.children && item.children.some(child => child.id === selectedMenuId));

    if (hasChildren) {
      return (
        <li 
          key={item.id} 
          className="relative"
          onMouseEnter={() => handleMouseEnter(item.id)}
          onMouseLeave={handleMouseLeave}
        >
          <button
            className={`relative flex items-center px-3 py-2 transition ${
              isSelected
                ? "text-teal-500 dark:text-teal-400"
                : "hover:text-teal-500 dark:hover:text-teal-400"
            }`}
            onClick={() => {
              if (item.url) {
                clickMenuHandler(item.id);
              }
            }}
          >
            {item.title}
            <svg
              className="ml-1 h-3 w-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            {isSelected && (
              <span className="absolute inset-x-1 -bottom-px h-px bg-gradient-to-r from-teal-500/0 via-teal-500/40 to-teal-500/0 dark:from-teal-400/0 dark:via-teal-400/40 dark:to-teal-400/0"></span>
            )}
          </button>
          
          {/* Dropdown Menu */}
          {openDropdown === item.id && (
            <div className="absolute top-full left-0 mt-1 w-48 rounded-md bg-white/95 shadow-lg ring-1 ring-zinc-900/5 backdrop-blur dark:bg-zinc-800/95 dark:ring-white/10 z-50">
              <div className="py-1">
                {item.children?.map((child) => (
                  <Link
                    key={child.id}
                    href={child.url || "#"}
                    className={`block px-4 py-2 text-sm transition ${
                      child.id === selectedMenuId
                        ? "bg-teal-50 text-teal-600 dark:bg-teal-900/20 dark:text-teal-400"
                        : "text-zinc-700 hover:bg-zinc-50 hover:text-teal-600 dark:text-zinc-300 dark:hover:bg-zinc-700/50 dark:hover:text-teal-400"
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
        </li>
      );
    }

    return (
      <li key={item.id}>
        <Link
          className={`relative block px-3 py-2 transition ${
            item.id === selectedMenuId
              ? "text-teal-500 dark:text-teal-400"
              : "hover:text-teal-500 dark:hover:text-teal-400"
          }`}
          href={item.url || "#"}
          onClick={() => {
            if (item.url) {
              clickMenuHandler(item.id);
            }
          }}
        >
          {item.title}
          {item.id === selectedMenuId && (
            <span className="absolute inset-x-1 -bottom-px h-px bg-gradient-to-r from-teal-500/0 via-teal-500/40 to-teal-500/0 dark:from-teal-400/0 dark:via-teal-400/40 dark:to-teal-400/0"></span>
          )}
        </Link>
      </li>
    );
  };

  return (
    <>
      {MENU_LIST?.map((item: MenuItem) => renderMenuItem(item))}
    </>
  );
};

export default Menu;
