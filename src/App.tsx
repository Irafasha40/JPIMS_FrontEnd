import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppLayout from "./components/AppLayout";
import DashboardPage from "./pages/DashboardPage";
import RawMaterialsPage from "./pages/RawMaterialsPage";
import ProductionPage from "./pages/ProductionPage";
import QualityControlPage from "./pages/QualityControlPage";
import FinishedProductsPage from "./pages/FinishedProductsPage";
import SalesPage from "./pages/SalesPage";
import PlaceholderPage from "./pages/PlaceholderPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/raw-materials" element={<RawMaterialsPage />} />
            <Route path="/production" element={<ProductionPage />} />
            <Route path="/quality-control" element={<QualityControlPage />} />
            <Route path="/finished-products" element={<FinishedProductsPage />} />
            <Route path="/sales" element={<SalesPage />} />
            <Route path="/recipes" element={<PlaceholderPage title="Recipes & Formulations" />} />
            <Route path="/suppliers" element={<PlaceholderPage title="Supplier Management" />} />
            <Route path="/reports" element={<PlaceholderPage title="Reports & Analytics" />} />
            <Route path="/notifications" element={<PlaceholderPage title="Notifications & Alerts" />} />
            <Route path="/users" element={<PlaceholderPage title="User Management" />} />
            <Route path="/security" element={<PlaceholderPage title="Security & Audit" />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
