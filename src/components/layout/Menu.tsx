"use client";
import React, { useState, useCallback } from "react";
import { MenuItem } from "@/const/interface";
import { MENU_LIST } from "@/const/const";

const Menu = () => {
  const [selectedMenuId, setSelectedMenuId] = useState(0);

  const clickMenuHandler = useCallback((id: number) => {
    setSelectedMenuId(id);
  }, []);

  return (
    <>
      {MENU_LIST?.map((item: MenuItem) => {
        let underLine = <span></span>;
        if (item.id === selectedMenuId) {
          underLine = (
            <span className="absolute inset-x-1 -bottom-px h-px bg-gradient-to-r from-teal-500/0 via-teal-500/40 to-teal-500/0 dark:from-teal-400/0 dark:via-teal-400/40 dark:to-teal-400/0"></span>
          );
        }
        return (
          <li key={item.id}>
            <a
              className="relative block px-3 py-2 transition hover:text-teal-500 dark:hover:text-teal-400"
              href={item.url}
              onClick={() => clickMenuHandler(item.id)}
            >
              {item.title}
              {underLine}
            </a>
          </li>
        );
      })}
    </>
  );
};

export default Menu;
