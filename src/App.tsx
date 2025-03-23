import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DataProvider } from "@/contexts/DataContext";
import { HouseholdProvider, useHousehold } from "@/contexts/HouseholdContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ChatProvider } from "@/contexts/ChatContext";
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
import Chat from "./pages/Chat";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Profile from "./pages/Profile";
import Tasks from "./pages/Tasks";

// Household Pages
import CreateHouseholdPage from "./pages/Household/Create";
import HouseholdInvites from "./pages/Household/Invites";
import HouseholdMembers from "./pages/Household/Members";
import HouseholdRoles from "./pages/Household/Roles";
import HouseholdSettings from "./pages/Household/Settings";
import WelcomePage from "./pages/Household/Welcome";

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
  const { currentHousehold, loading, requiresHousehold } = useHousehold();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Show loading state while checking household status
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // If we're on a route that requires household but none is selected,
  // redirect to household management
  if (requiresHousehold && !currentHousehold) {
    return <Navigate to="/household" replace />;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {!isMobile && <Sidebar className="flex-shrink-0" />}
      <div className="flex flex-col flex-1 min-w-0">
        <Header className="flex-shrink-0" />
        <main className="px-6 py-4 flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
};

// AuthenticatedApp handles all routes that require authentication
const AuthenticatedApp = () => {
  const { isNewUser, households, loading } = useHousehold();
  const location = useLocation();

  console.log("[AuthenticatedApp] Current state:", {
    isNewUser,
    householdsCount: households.length,
    loading,
    currentPath: location.pathname,
  });

  // Show loading state while checking household status
  if (loading) {
    console.log("[AuthenticatedApp] Loading state, showing spinner");
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // If authenticated and new user, redirect to welcome page
  if (isNewUser && location.pathname !== "/household/welcome") {
    console.log("[AuthenticatedApp] New user detected, redirecting to welcome page");
    return <Navigate to="/household/welcome" replace />;
  }

  // If user has no households and not on create page, redirect to create
  if (
    households.length === 0 &&
    !location.pathname.startsWith("/household/create") &&
    !location.pathname.startsWith("/household/welcome")
  ) {
    console.log("[AuthenticatedApp] No households found, redirecting to create page");
    return <Navigate to="/household/create" replace />;
  }

  // If user has households but is on welcome/create, redirect to dashboard
  if (
    households.length > 0 &&
    (location.pathname === "/household/welcome" || location.pathname === "/household/create")
  ) {
    console.log("[AuthenticatedApp] Has households but on welcome/create, redirecting to dashboard");
    return <Navigate to="/dashboard" replace />;
  }

  console.log("[AuthenticatedApp] Proceeding with normal render");
  return (
    <DataProvider>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
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

          {/* Household Management Routes */}
          <Route path="/household/welcome" element={<WelcomePage />} />
          <Route
            path="/household"
            element={
              <AppLayout>
                <Household />
              </AppLayout>
            }
          />
          <Route path="/household/create" element={<CreateHouseholdPage />} />
          <Route
            path="/household/settings"
            element={
              <AppLayout>
                <HouseholdSettings />
              </AppLayout>
            }
          />
          <Route
            path="/household/members"
            element={
              <AppLayout>
                <HouseholdMembers />
              </AppLayout>
            }
          />
          <Route
            path="/household/invites"
            element={
              <AppLayout>
                <HouseholdInvites />
              </AppLayout>
            }
          />
          <Route
            path="/household/roles"
            element={
              <AppLayout>
                <HouseholdRoles />
              </AppLayout>
            }
          />

          {/* Redirect to dashboard if accessing root while authenticated */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<Navigate to="/dashboard" replace />} />
          <Route path="/register" element={<Navigate to="/household/welcome" replace />} />

          {/* Catch all route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AnimatePresence>
    </DataProvider>
  );
};

// PublicApp handles all public routes
const PublicApp = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </AnimatePresence>
  );
};

// Root component that handles authentication state
const Root = () => {
  const isAuthenticated = getAuth().isAuthenticated();
  const location = useLocation();

  // If not authenticated, show public routes
  if (!isAuthenticated) {
    return <PublicApp />;
  }

  // If authenticated, wrap with HouseholdProvider
  return (
    <HouseholdProvider>
      <AuthenticatedApp />
    </HouseholdProvider>
  );
};

// API URL from environment
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <BrowserRouter>
          <Toaster />
          <Sonner />
          <Root />
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
