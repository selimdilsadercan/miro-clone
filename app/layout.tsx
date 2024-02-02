import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
const font = Inter({ subsets: ["latin"] });

import ConvexProvider from "@/providers/convex-provider";

export const metadata: Metadata = {
  title: "Miro Clone"
};

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={font.className}>
        <ConvexProvider>{children}</ConvexProvider>
      </body>
    </html>
  );
}

export default Layout;