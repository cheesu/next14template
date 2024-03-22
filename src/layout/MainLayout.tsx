import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../app/globals.scss";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Main from "@/components/layout/Main";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Next TEST App",
  description: "test next app",
};

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className + " flex h-full bg-zinc-50 "}>
        <div className="flex w-full">
          <div className="fixed inset-0 flex justify-center sm:px-8">
            <div className="flex w-full max-w-7xl lg:px-8">
              <div className="w-full bg-white ring-1 ring-zinc-100 bg-zinc-900 ring-zinc-300/20"></div>
            </div>
          </div>

          <div className="relative flex w-full flex-col">
            <Header />
            <Main>{children}</Main>
            <Footer />
          </div>
        </div>
      </body>
    </html>
  );
}
