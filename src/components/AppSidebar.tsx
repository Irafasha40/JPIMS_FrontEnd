import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Package, Factory, FlaskConical, Box, ShoppingCart,
  BookOpen, Truck, BarChart3, Bell, Users, Shield, ChevronLeft, ChevronRight,
} from "lucide-react";
import { useState } from "react";
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

  return (
    <aside
      className={`flex flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-300 ${
        collapsed ? "w-16" : "w-60"
      }`}
    >
      <div className="flex items-center gap-2 px-4 py-5 border-b border-sidebar-border">
        <img src={whizuppLogo} alt="Whiz Upp" className="w-8 h-8 shrink-0 object-contain" />
        {!collapsed && (
          <span className="font-heading font-bold text-sm text-sidebar-primary-foreground truncate">
            Whiz Upp
          </span>
        )}
      </div>

      <nav className="flex-1 py-3 space-y-0.5 overflow-y-auto">
        {modules.map((m) => {
          const isActive = location.pathname === m.path;
          return (
            <NavLink
              key={m.path}
              to={m.path}
              className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                isActive
                  ? "bg-sidebar-accent text-sidebar-primary-foreground border-r-2 border-sidebar-primary"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              } ${collapsed ? "justify-center px-2" : ""}`}
              title={collapsed ? m.name : undefined}
            >
              <m.icon className="w-4.5 h-4.5 shrink-0" />
              {!collapsed && <span className="truncate">{m.name}</span>}
            </NavLink>
          );
        })}
      </nav>

      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-center py-3 border-t border-sidebar-border text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors"
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </aside>
  );
}
