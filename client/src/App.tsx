import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppProvider } from "@/contexts/AppContext";
import Layout from "@/components/Layout";
import ProtectedRoute from "@/components/ProtectedRoute";

// Auth pages
import Login from "@/pages/auth/Login";
import Signup from "@/pages/auth/Signup";
import ForgotPassword from "@/pages/auth/ForgotPassword";

// App pages
import Dashboard from "@/pages/Dashboard";
import CRM from "@/pages/CRM";
import Inventory from "@/pages/Inventory";
import POS from "@/pages/POS";
import Reports from "@/pages/Reports";
import Settings from "@/pages/Settings";
import RoleSelection from "@/pages/RoleSelection";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/auth/login" component={Login} />
      <Route path="/auth/signup" component={Signup} />
      <Route path="/auth/forgot-password" component={ForgotPassword} />
      
      {/* Protected routes */}
      <Route path="/">
        <ProtectedRoute>
          <RoleSelection />
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard">
          <Dashboard />
      </Route>
      <Route path="/crm">
          <CRM />
      </Route>
      <Route path="/inventory">
          <Inventory />
      </Route>
      <Route path="/pos">
          <POS />
      </Route>
      <Route path="/reports">
          <Reports />
      </Route>
      <Route path="/settings">
          <Settings />
      </Route>
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppProvider>
          <TooltipProvider>
            <Layout>
              <Router />
            </Layout>
            <Toaster />
          </TooltipProvider>
        </AppProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
