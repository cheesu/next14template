import type { Metadata } from "next";
import { Inter } from "next/font/google";
import ReduxProvider from "./ReduxProvider";
import "@/app/globals.scss";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Main from "@/components/layout/Main";
import Breadcrumb from "@/components/layout/Breadcrumb";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Next App",
  description: "test next app",
};

type LayoutProps = {
  children: React.ReactNode; // 여기서도 children에 대한 타입을 명시
};

export default function RootLayout({ children }: LayoutProps) {
  return (
    <ReduxProvider>
      <html lang="ko">
        <body className={inter.className + " min-h-screen bg-white dark:bg-slate-900"}>
          {/* Main content area */}
          <div className="flex min-h-screen flex-col">
            {/* Top Header with Navigation */}
            <Header />
            
            {/* Main content */}
            <main className="flex-1 p-6">
              <div className="mx-auto max-w-[95%]">
                <Breadcrumb />
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-8 min-h-[calc(100vh-10rem)]">
                  {children}
                </div>
              </div>
            </main>
            
            {/* Footer */}
            <Footer />
          </div>
        </body>
      </html>
    </ReduxProvider>
  );
}
