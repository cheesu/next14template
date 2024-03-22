"use client";
import React, { useState, useCallback } from "react";
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

  const clickMenuHandler = useCallback((id: number) => {
    dispatch(setMenuId(id));
    setSelectedMenuId(id);
  }, []);

  return (
    <>
      {MENU_LIST?.map((item: MenuItem) => {
        let underLine = <span></span>;
        let menuStyle =
          "relative block px-3 py-2 transition hover:text-teal-500 dark:hover:text-teal-400";
        if (item.id === selectedMenuId) {
          underLine = (
            <span className="absolute inset-x-1 -bottom-px h-px bg-gradient-to-r from-teal-500/0 via-teal-500/40 to-teal-500/0 dark:from-teal-400/0 dark:via-teal-400/40 dark:to-teal-400/0"></span>
          );
          menuStyle =
            "relative block px-3 py-2 transition text-teal-500 dark:text-teal-400";
        }
        return (
          <li key={item.id}>
            <Link
              className={menuStyle}
              href={item.url}
              onClick={() => clickMenuHandler(item.id)}
            >
              {item.title}
              {underLine}
            </Link>
          </li>
        );
      })}
    </>
  );
};

export default Menu;
