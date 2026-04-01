import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";

const nameMap: Record<string, string> = {
  "": "Dashboard",
  "raw-materials": "Raw Materials",
  "production": "Production Batches",
  "quality-control": "Quality Control",
  "finished-products": "Finished Products",
  "sales": "Sales & Orders",
  "recipes": "Recipes & Formulations",
  "suppliers": "Supplier Management",
  "reports": "Reports & Analytics",
  "notifications": "Notifications & Alerts",
  "users": "User Management",
  "security": "Security & Audit",
  "profile": "Profile",
  "login": "Login",
  "register": "Register",
};

export default function Breadcrumb() {
  const location = useLocation();
  const segments = location.pathname.split("/").filter(Boolean);

  if (segments.length === 0) return null;

  return (
    <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4">
      <Link to="/" className="hover:text-foreground transition-colors">
        <Home className="w-3.5 h-3.5" />
      </Link>
      {segments.map((seg, i) => (
        <span key={seg} className="flex items-center gap-1.5">
          <ChevronRight className="w-3 h-3" />
          {i === segments.length - 1 ? (
            <span className="text-foreground font-medium">{nameMap[seg] ?? seg}</span>
          ) : (
            <Link to={`/${segments.slice(0, i + 1).join("/")}`} className="hover:text-foreground transition-colors">
              {nameMap[seg] ?? seg}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
