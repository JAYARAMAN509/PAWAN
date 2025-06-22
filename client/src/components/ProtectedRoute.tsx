import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { useEffect } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
}

export default function ProtectedRoute({ children, requiredRoles }: ProtectedRouteProps) {
  const { firebaseUser, appUser, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && !firebaseUser) {
      setLocation("/auth/login");
      return;
    }

    if (!loading && firebaseUser && !appUser) {
      // User is authenticated with Firebase but not in our system
      setLocation("/auth/login");
      return;
    }

    if (!loading && appUser && requiredRoles && !requiredRoles.includes(appUser.role)) {
      // User doesn't have required role
      setLocation("/dashboard");
      return;
    }
  }, [firebaseUser, appUser, loading, requiredRoles, setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-light">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-white font-inter font-bold text-2xl">P</span>
          </div>
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!firebaseUser || !appUser) {
    return null;
  }

  if (requiredRoles && !requiredRoles.includes(appUser.role)) {
    return null;
  }

  return <>{children}</>;
}
