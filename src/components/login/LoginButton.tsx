"use client";
import React, { useState } from "react";
import LoginModal from "./LoginModal";

const LoginButton = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleLoginClick = () => {
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };
  return (
    <>
      <button
        onClick={handleLoginClick}
        type="button"
        aria-label="Switch to dark theme"
        className="group rounded-full bg-white/90 px-3 py-2 shadow-lg shadow-zinc-800/5 ring-1 ring-zinc-900/5 backdrop-blur transition dark:bg-zinc-800/90 dark:ring-white/10 dark:hover:ring-white/20"
      >
        login
      </button>
      {isModalOpen && <LoginModal onClose={handleModalClose} />}
    </>
  );
};

export default LoginButton;
