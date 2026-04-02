import { Outlet, Link } from "react-router-dom";
import AppSidebar from "./AppSidebar";
import { Bell, Search, User, ChevronDown } from "lucide-react";
import { useRole } from "@/contexts/RoleContext";
import { roleLabels, UserRole } from "@/lib/mockData";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const roles: UserRole[] = ["administrator", "production_manager", "inventory_manager", "qc_officer", "sales_staff"];

export default function AppLayout() {
  const { role, setRole, roleLabel } = useRole();

  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 border-b flex items-center justify-between px-6 bg-card shrink-0">
          <div className="flex items-center gap-3 bg-muted rounded-lg px-3 py-1.5 w-72">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search batches, materials, orders..."
              className="bg-transparent text-sm outline-none w-full placeholder:text-muted-foreground"
            />
          </div>
          <div className="flex items-center gap-4">
            {/* Role Switcher */}
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1 text-xs bg-muted rounded-md px-2.5 py-1.5 hover:bg-muted/80 transition-colors">
                <span className="text-muted-foreground">Role:</span>
                <span className="font-medium">{roleLabel}</span>
                <ChevronDown className="w-3 h-3 text-muted-foreground" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Switch Role</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {roles.map(r => (
                  <DropdownMenuItem key={r} onClick={() => setRole(r)} className={role === r ? "bg-accent" : ""}>
                    {roleLabels[r]}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Link to="/notifications" className="relative text-muted-foreground hover:text-foreground transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-secondary text-secondary-foreground text-[10px] flex items-center justify-center font-medium">
                3
              </span>
            </Link>
            <Link to="/profile" className="flex items-center gap-2 pl-4 border-l">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <User className="w-4 h-4 text-primary-foreground" />
              </div>
              <div className="text-sm">
                <p className="font-medium leading-none">Admin User</p>
                <p className="text-muted-foreground text-xs">{roleLabel}</p>
              </div>
            </Link>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6 bg-background">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
