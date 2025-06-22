import { createContext, useContext, useState } from "react";

interface AppContextType {
  currency: string;
  setCurrency: (currency: string) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrency] = useState("₹");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const value = {
    currency,
    setCurrency,
    sidebarCollapsed,
    setSidebarCollapsed,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
