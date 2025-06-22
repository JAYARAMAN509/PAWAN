import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Users, Package, ShoppingCart, BarChart3, Settings } from "lucide-react";

const roleConfigs = {
  Admin: {
    icon: Settings,
    title: "Administrator",
    description: "Full system access with user management and reporting",
    color: "from-blue-500 to-blue-600",
    defaultRoute: "/dashboard"
  },
  Sales: {
    icon: Users,
    title: "Sales Representative",
    description: "CRM access with lead and customer management",
    color: "from-green-500 to-green-600",
    defaultRoute: "/crm"
  },
  Inventory: {
    icon: Package,
    title: "Inventory Manager",
    description: "Product and stock management capabilities",
    color: "from-orange-500 to-orange-600",
    defaultRoute: "/inventory"
  },
  Cashier: {
    icon: ShoppingCart,
    title: "Cashier",
    description: "Point of sale and transaction processing",
    color: "from-purple-500 to-purple-600",
    defaultRoute: "/pos"
  }
};

export default function RoleSelection() {
  const { appUser } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    // If user has only one role or is accessing from a specific route, redirect
    if (appUser) {
      const userRoles = [appUser.role];
      if (userRoles.length === 1) {
        const config = roleConfigs[appUser.role as keyof typeof roleConfigs];
        if (config) {
          setLocation(config.defaultRoute);
        } else {
          setLocation("/dashboard");
        }
      }
    }
  }, [appUser, setLocation]);

  if (!appUser) {
    return null;
  }

  const handleRoleSelect = (route: string) => {
    setLocation(route);
  };

  const config = roleConfigs[appUser.role as keyof typeof roleConfigs];

  if (!config) {
    setLocation("/dashboard");
    return null;
  }

  const Icon = config.icon;

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-light px-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 w-20 h-20 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center">
            <span className="text-white font-inter font-bold text-3xl">P</span>
          </div>
          <h1 className="text-3xl font-inter font-bold text-neutral-dark mb-2">
            Welcome to PAVAN
          </h1>
          <p className="text-gray-600">
            Hello {appUser.name}, select your workspace to continue
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-105">
            <CardHeader className="text-center pb-4">
              <div className={`mx-auto mb-4 w-16 h-16 bg-gradient-to-br ${config.color} rounded-xl flex items-center justify-center`}>
                <Icon className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-xl font-inter">{config.title}</CardTitle>
              <CardDescription className="text-sm">
                {config.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full bg-primary hover:bg-blue-700"
                onClick={() => handleRoleSelect(config.defaultRoute)}
              >
                Enter {config.title}
              </Button>
            </CardContent>
          </Card>

          {/* Always show dashboard option */}
          <Card className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-105">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <LayoutDashboard className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-xl font-inter">Dashboard</CardTitle>
              <CardDescription className="text-sm">
                Overview and analytics dashboard
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                variant="outline"
                className="w-full"
                onClick={() => handleRoleSelect("/dashboard")}
              >
                Go to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            Your role: <span className="font-medium text-neutral-dark">{appUser.role}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
