import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { RoleProvider } from "@/contexts/RoleContext";
import AppLayout from "./components/AppLayout";
import DashboardPage from "./pages/DashboardPage";
import RawMaterialsPage from "./pages/RawMaterialsPage";
import ProductionPage from "./pages/ProductionPage";
import QualityControlPage from "./pages/QualityControlPage";
import FinishedProductsPage from "./pages/FinishedProductsPage";
import SalesPage from "./pages/SalesPage";
import RecipesPage from "./pages/RecipesPage";
import SuppliersPage from "./pages/SuppliersPage";
import ReportsPage from "./pages/ReportsPage";
import NotificationsPage from "./pages/NotificationsPage";
import UserManagementPage from "./pages/UserManagementPage";
import SecurityAuditPage from "./pages/SecurityAuditPage";
import LoginPage from "./pages/LoginPage";
import FirstLoginPasswordPage from "./pages/FirstLoginPasswordPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ProfilePage from "./pages/ProfilePage";
import ProductCatalogPage from "./pages/ProductCatalogPage";
import { useRole } from "@/contexts/RoleContext";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { isLoggedIn } = useRole();
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  return children;
}

function PublicOnlyRoute({ children }: { children: JSX.Element }) {
  const { isLoggedIn } = useRole();
  if (isLoggedIn) return <Navigate to="/" replace />;
  return children;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <RoleProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <Routes>
            <Route
              path="/first-login-password"
              element={<PublicOnlyRoute><FirstLoginPasswordPage /></PublicOnlyRoute>}
            />
            <Route
              path="/login"
              element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>}
            />
            <Route
              path="/register"
              element={<PublicOnlyRoute><RegisterPage /></PublicOnlyRoute>}
            />
            <Route
              path="/forgot-password"
              element={<PublicOnlyRoute><ForgotPasswordPage /></PublicOnlyRoute>}
            />
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<DashboardPage />} />
              <Route path="/raw-materials" element={<RawMaterialsPage />} />
              <Route path="/production" element={<ProductionPage />} />
              <Route path="/quality-control" element={<QualityControlPage />} />
              <Route path="/finished-products" element={<FinishedProductsPage />} />
              <Route path="/sales" element={<SalesPage />} />
              <Route path="/recipes" element={<RecipesPage />} />
              <Route path="/suppliers" element={<SuppliersPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/users" element={<UserManagementPage />} />
              <Route path="/security" element={<SecurityAuditPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/product-catalog" element={<ProductCatalogPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </RoleProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
