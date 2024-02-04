import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
const font = Inter({ subsets: ["latin"] });

import ConvexProvider from "@/providers/convex-provider";
import ToastProvider from "@/providers/toast-provider";
import ModalProvider from "@/providers/modal-provider";
import { Suspense } from "react";
import Loading from "@/components/Loading";

export const metadata: Metadata = {
  title: "Miro Clone"
};

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={font.className}>
        <Suspense fallback={<Loading />}>
          <ConvexProvider>
            {children}
            <ToastProvider />
            <ModalProvider />
          </ConvexProvider>
        </Suspense>
      </body>
    </html>
  );
}

export default Layout;
