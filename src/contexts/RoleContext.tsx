import { createContext, useContext, useState, ReactNode } from "react";
import { UserRole, roleLabels } from "@/lib/mockData";

interface RoleContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  roleLabel: string;
  isLoggedIn: boolean;
  setIsLoggedIn: (v: boolean) => void;
}

const RoleContext = createContext<RoleContextType>({
  role: "administrator",
  setRole: () => {},
  roleLabel: "Administrator",
  isLoggedIn: true,
  setIsLoggedIn: () => {},
});

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<UserRole>("administrator");
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  return (
    <RoleContext.Provider value={{ role, setRole, roleLabel: roleLabels[role], isLoggedIn, setIsLoggedIn }}>
      {children}
    </RoleContext.Provider>
  );
}

export const useRole = () => useContext(RoleContext);
