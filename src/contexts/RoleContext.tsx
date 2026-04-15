import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { UserRole, roleLabels } from "@/lib/mockData";
import { authApi } from "@/lib/api";

interface RoleContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  roleLabel: string;
  isLoggedIn: boolean;
  setIsLoggedIn: (v: boolean) => void;
  logout: () => void;
}

const RoleContext = createContext<RoleContextType>({
  role: "administrator",
  setRole: () => {},
  roleLabel: "Administrator",
  isLoggedIn: false,
  setIsLoggedIn: () => {},
  logout: () => {},
});

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<UserRole>("administrator");
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!localStorage.getItem("access_token"));

  const logout = () => {
    authApi.logout();
    setIsLoggedIn(false);
  };

  // On mount, validate token
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      authApi.me().then((res) => {
        setIsLoggedIn(true);
        // Map backend role to frontend role if available
        if (res.data?.role && roleLabels[res.data.role as UserRole]) {
          setRole(res.data.role as UserRole);
        }
      }).catch(() => {
        authApi.logout();
        setIsLoggedIn(false);
      });
    }
  }, []);

  return (
    <RoleContext.Provider value={{ role, setRole, roleLabel: roleLabels[role], isLoggedIn, setIsLoggedIn, logout }}>
      {children}
    </RoleContext.Provider>
  );
}

export const useRole = () => useContext(RoleContext);
