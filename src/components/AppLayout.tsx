import { Outlet, Link } from "react-router-dom";
import AppSidebar from "./AppSidebar";
import { Bell, Search, User, ChevronDown, LogOut } from "lucide-react";
import { useRole } from "@/contexts/RoleContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function AppLayout() {
  const { roleLabel, logout, sessionUser, sessionLoading } = useRole();

  const handleLogout = () => {
    void logout();
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 border-b border-border/50 flex items-center justify-between px-6 bg-card/85 backdrop-blur-md shrink-0 relative z-10">
          {/* Subtle top header gradient accent bar */}
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-primary-to-secondary opacity-70" />
          
          <div className="flex items-center gap-3 bg-muted/50 border border-transparent focus-within:border-primary/45 focus-within:ring-2 focus-within:ring-primary/20 rounded-lg px-3 py-1.5 w-72 transition-all duration-300">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search batches, materials, orders..."
              className="bg-transparent text-sm outline-none w-full placeholder:text-muted-foreground text-foreground"
            />
          </div>
          
          <div className="flex items-center gap-4">
            <Link to="/notifications" className="relative text-muted-foreground hover:text-primary transition-colors p-1.5 hover:bg-muted/50 rounded-full duration-200">
              <Bell className="w-5 h-5" />
              <span className="absolute top-0 right-0 w-4.5 h-4.5 rounded-full bg-gradient-primary-to-secondary text-secondary-foreground text-[10px] flex items-center justify-center font-bold shadow-md shadow-secondary/30 animate-pulse">
                3
              </span>
            </Link>
            
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 pl-4 border-l border-border/60 outline-none rounded-lg hover:bg-muted/50 py-1 pr-2 transition-all duration-200">
                <div className="w-8 h-8 rounded-full bg-gradient-primary-to-secondary flex items-center justify-center shadow-md shadow-primary/20 hover:scale-105 transition-transform duration-200">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="text-left text-sm min-w-0 hidden sm:block">
                  <p className="font-semibold leading-none truncate text-foreground/90">
                    {sessionLoading ? "…" : sessionUser?.fullName || "Account"}
                  </p>
                  <p className="text-muted-foreground text-[10px] mt-0.5 tracking-wider uppercase font-bold truncate">{roleLabel}</p>
                </div>
                <ChevronDown className="w-3 h-3 text-muted-foreground shrink-0" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive cursor-pointer"
                  onSelect={(e) => {
                    e.preventDefault();
                    handleLogout();
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6 bg-background">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
