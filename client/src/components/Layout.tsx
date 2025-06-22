import { useAuth } from "@/contexts/AuthContext";
import { useApp } from "@/contexts/AppContext";
import Sidebar from "./Sidebar";
import TopNav from "./TopNav";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { appUser } = useAuth();
  const { sidebarCollapsed } = useApp();

  if (!appUser) {
    return <div>{children}</div>;
  }

  return (
    <div className="min-h-screen flex bg-neutral-light">
      <Sidebar />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'} lg:ml-0`}>
        <TopNav />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
