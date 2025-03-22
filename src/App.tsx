import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DataProvider } from "@/contexts/DataContext";
import { HouseholdProvider } from "@/contexts/HouseholdContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { getAuth } from "@/services/service-factory";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AnimatePresence } from "framer-motion";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";

// Pages
import Login from "./pages/Auth/Login";
import Register from "./pages/Auth/Register";
import Dashboard from "./pages/Dashboard";
import Household from "./pages/Household";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Profile from "./pages/Profile";
import Tasks from "./pages/Tasks";

// Layouts
import Header from "./components/layout/Header";
import MobileNav from "./components/layout/MobileNav";
import Sidebar from "./components/layout/Sidebar";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Layout wrapper for authenticated routes
const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const isMobile = useIsMobile();
  const isAuthenticated = getAuth().isAuthenticated();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex w-full min-h-screen">
      {!isMobile && <Sidebar />}
      <div className="flex-1 flex flex-col max-w-full overflow-x-hidden">
        <Header />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
      {isMobile && <MobileNav />}
    </div>
  );
};

// AuthWrapper to handle auth-dependent providers
const AuthWrapper = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = getAuth().isAuthenticated();
  const location = useLocation();
  const isPublicPath = ["/", "/login", "/register"].includes(location.pathname);

  // If trying to access protected route without auth, redirect to login
  if (!isAuthenticated && !isPublicPath) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If trying to access auth pages while authenticated, let the route handle it
  if (isAuthenticated && isPublicPath) {
    return children;
  }

  // For public routes when not authenticated
  if (!isAuthenticated) {
    return children;
  }

  // For authenticated routes, wrap with providers
  return (
    <HouseholdProvider>
      <DataProvider>{children}</DataProvider>
    </HouseholdProvider>
  );
};

// Animation wrapper for route transitions
const AnimatedRoutes = () => {
  const location = useLocation();
  const isAuthenticated = getAuth().isAuthenticated();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public routes */}
        <Route path="/" element={<Index />} />
        <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />} />
        <Route path="/register" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Register />} />

        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={
            <AppLayout>
              <Dashboard />
            </AppLayout>
          }
        />
        <Route
          path="/tasks"
          element={
            <AppLayout>
              <Tasks />
            </AppLayout>
          }
        />
        <Route
          path="/profile"
          element={
            <AppLayout>
              <Profile />
            </AppLayout>
          }
        />
        <Route
          path="/household"
          element={
            <AppLayout>
              <Household />
            </AppLayout>
          }
        />

        {/* Catch all route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <BrowserRouter>
          <AuthWrapper>
            <Toaster />
            <Sonner />
            <AnimatedRoutes />
          </AuthWrapper>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
