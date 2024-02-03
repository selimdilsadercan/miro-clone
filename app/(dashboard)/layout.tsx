import Navbar from "@/components/nav/Navbar";
import OrgSidebar from "@/components/nav/OrgSidebar";
import Sidebar from "@/components/nav/Sidebar";
import { Suspense } from "react";

interface Props {
  children: React.ReactNode;
}

function Layout({ children }: Props) {
  return (
    <main className="h-full">
      <Sidebar />

      <div className="pl-[60px] h-full">
        <div className="flex gap-x-3 h-full">
          <Suspense fallback={<div></div>}>
            <OrgSidebar />
          </Suspense>

          <div className="h-full flex-1">
            <Navbar />
            {children}
          </div>
        </div>
      </div>
    </main>
  );
}

export default Layout;
