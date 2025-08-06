import React from "react";

const Main = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  return (
    <main className="flex-1 p-6 bg-white dark:bg-zinc-900">
      <div className="mx-auto max-w-7xl">
        {children}
      </div>
    </main>
  );
};

export default Main;
