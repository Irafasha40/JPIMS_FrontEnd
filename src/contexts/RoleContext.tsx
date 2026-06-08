import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";
import { UserRole, roleLabels } from "@/lib/roleConfig";
import { backendRoleToUserRole } from "@/lib/roleUtils";
import { authApi } from "@/lib/api";

export interface SessionUser {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  employeeId: string;
  department: string;
}

interface RoleContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  roleLabel: string;
  sessionUser: SessionUser | null;
  sessionLoading: boolean;
  isLoggedIn: boolean;
  setIsLoggedIn: (v: boolean) => void;
  refreshSession: () => Promise<void>;
  logout: () => Promise<void>;
}

function roleFieldToString(raw: unknown): string {
  if (typeof raw === "string") return raw;
  if (raw && typeof raw === "object" && "name" in raw) return String((raw as { name: string }).name);
  return "";
}

const RoleContext = createContext<RoleContextType>({
  role: "administrator",
  setRole: () => {},
  roleLabel: "Administrator",
  sessionUser: null,
  sessionLoading: false,
  isLoggedIn: false,
  setIsLoggedIn: () => {},
  refreshSession: async () => {},
  logout: async () => {},
});

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<UserRole>("administrator");
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!localStorage.getItem("access_token"));

  const refreshSession = useCallback(async () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setSessionUser(null);
      setIsLoggedIn(false);
      setRole("administrator");
      return;
    }
    setSessionLoading(true);
    try {
      const { data } = await authApi.me();
      const roleStr = roleFieldToString(data.role);
      const mapped = backendRoleToUserRole(roleStr);
      if (mapped) setRole(mapped);
      setSessionUser({
        id: String(data.id ?? ""),
        fullName: String(data.fullName ?? ""),
        email: String(data.email ?? ""),
        phone: String(data.phone ?? ""),
        employeeId: String(data.employeeId ?? ""),
        department: String(data.department ?? ""),
      });
      setIsLoggedIn(true);
    } catch {
      await authApi.logout();
      setSessionUser(null);
      setIsLoggedIn(false);
      setRole("administrator");
    } finally {
      setSessionLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoggedIn) {
      setSessionUser(null);
      setRole("administrator");
      return;
    }
    void refreshSession();
  }, [isLoggedIn, refreshSession]);

  const logout = async () => {
    await authApi.logout();
    setSessionUser(null);
    setRole("administrator");
    setIsLoggedIn(false);
  };

  return (
    <RoleContext.Provider
      value={{
        role,
        setRole,
        roleLabel: roleLabels[role],
        sessionUser,
        sessionLoading,
        isLoggedIn,
        setIsLoggedIn,
        refreshSession,
        logout,
      }}
    >
      {children}
    </RoleContext.Provider>
  );
}

export const useRole = () => useContext(RoleContext);
