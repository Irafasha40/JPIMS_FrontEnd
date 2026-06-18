import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Package, Factory, FlaskConical, Box, ShoppingCart,
  BookOpen, Truck, BarChart3, Bell, Users, Shield, ChevronLeft, ChevronRight,
} from "lucide-react";
import { useState } from "react";
import { useRole } from "@/contexts/RoleContext";
import { roleMenuConfig } from "@/lib/roleConfig";
import whizuppLogo from "@/assets/whizupp-logo.png";

const modules = [
  { name: "Dashboard", path: "/", icon: LayoutDashboard },
  { name: "Raw Materials", path: "/raw-materials", icon: Package },
  { name: "Production Batches", path: "/production", icon: Factory },
  { name: "Quality Control", path: "/quality-control", icon: FlaskConical },
  { name: "Finished Products", path: "/finished-products", icon: Box },
  { name: "Sales & Orders", path: "/sales", icon: ShoppingCart },
  { name: "Recipes", path: "/recipes", icon: BookOpen },
  { name: "Suppliers", path: "/suppliers", icon: Truck },
  { name: "Reports", path: "/reports", icon: BarChart3 },
  { name: "Notifications", path: "/notifications", icon: Bell },
  { name: "User Management", path: "/users", icon: Users },
  { name: "Security & Audit", path: "/security", icon: Shield },
];

export default function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { role } = useRole();

  const allowedPaths = roleMenuConfig[role] || roleMenuConfig.administrator;
  const filteredModules = modules.filter(m => allowedPaths.includes(m.path));

  return (
    <aside
      className={`flex flex-col bg-gradient-to-b from-sidebar via-sidebar/95 to-[#05140d] text-sidebar-foreground border-r border-sidebar-border/30 transition-all duration-300 ${
        collapsed ? "w-16" : "w-60"
      }`}
    >
      <div className="flex items-center gap-3 px-4 py-5 border-b border-sidebar-border/20">
        <div className="p-1.5 bg-white/5 dark:bg-white/10 rounded-xl border border-white/10 shadow-inner shrink-0">
          <img src={whizuppLogo} alt="Whiz Upp" className="w-10 h-10 object-contain" />
        </div>
        {!collapsed && (
          <span className="font-heading font-extrabold text-base tracking-wide text-white truncate">
            Whiz Upp
          </span>
        )}
      </div>

      <nav className="flex-1 py-4 space-y-1 overflow-y-auto px-2">
        {filteredModules.map((m) => {
          const isActive = location.pathname === m.path;
          return (
            <NavLink
              key={m.path}
              to={m.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 group ${
                isActive
                  ? "bg-gradient-to-r from-sidebar-accent to-sidebar-accent/30 text-white font-semibold border-l-4 border-sidebar-primary shadow-md"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-white"
              } ${collapsed ? "justify-center px-0 border-l-0" : ""}`}
              title={collapsed ? m.name : undefined}
            >
              <m.icon className={`w-4.5 h-4.5 shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                isActive ? "text-sidebar-primary" : "text-sidebar-foreground/50 group-hover:text-sidebar-primary"
              }`} />
              {!collapsed && <span className="truncate tracking-wide">{m.name}</span>}
            </NavLink>
          );
        })}
      </nav>

      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-center py-3 border-t border-sidebar-border/20 text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors"
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </aside>
  );
}
