import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useApp } from "@/contexts/AppContext";
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  ShoppingCart, 
  BarChart3, 
  Settings,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";

const navigationItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard", roles: ["Admin", "Sales", "Inventory", "Cashier"] },
  { href: "/crm", icon: Users, label: "CRM", roles: ["Admin", "Sales"] },
  { href: "/inventory", icon: Package, label: "Inventory", roles: ["Admin", "Inventory"] },
  { href: "/pos", icon: ShoppingCart, label: "POS", roles: ["Admin", "Cashier"] },
  { href: "/reports", icon: BarChart3, label: "Reports", roles: ["Admin"] },
  { href: "/settings", icon: Settings, label: "Settings", roles: ["Admin"] },
];

export default function Sidebar() {
  const [location] = useLocation();
  const { appUser } = useAuth();
  const { sidebarCollapsed, setSidebarCollapsed } = useApp();

  if (!appUser) return null;

  const filteredNavigation = navigationItems.filter(item => 
    item.roles.includes(appUser.role)
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className={`fixed left-0 top-0 h-full bg-white shadow-lg transition-all duration-300 z-40 hidden lg:block ${sidebarCollapsed ? 'w-16' : 'w-64'}`}>
        <div className="p-6">
          {/* Logo */}
          <div className={`flex items-center mb-8 ${sidebarCollapsed ? 'justify-center' : 'space-x-3'}`}>
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center">
              <span className="text-white font-inter font-bold text-lg">P</span>
            </div>
            {!sidebarCollapsed && (
              <span className="font-inter font-bold text-xl text-neutral-dark">PAVAN</span>
            )}
          </div>

          {/* Navigation */}
          <nav className="space-y-2">
            {filteredNavigation.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href;
              
              return (
                <Link key={item.href} href={item.href}>
                  <div className={`flex items-center px-4 py-3 rounded-xl transition-colors cursor-pointer ${
                    isActive 
                      ? 'bg-primary text-white' 
                      : 'text-neutral-dark hover:bg-neutral-light'
                  } ${sidebarCollapsed ? 'justify-center' : 'space-x-3'}`}>
                    <Icon className="w-5 h-5" />
                    {!sidebarCollapsed && (
                      <span className="font-medium">{item.label}</span>
                    )}
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* Collapse Button */}
          <div className="mt-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className={`w-full ${sidebarCollapsed ? 'px-2' : ''}`}
            >
              {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              {!sidebarCollapsed && <span className="ml-2">Collapse</span>}
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      <div className="lg:hidden">
        {/* Mobile menu button and overlay would go here */}
      </div>
    </>
  );
}
