import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DataProvider } from "@/contexts/DataContext";
import { HouseholdProvider, useHousehold } from "@/contexts/HouseholdContext";
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

// AuthenticatedApp handles all routes that require authentication
const AuthenticatedApp = () => {
  const { isNewUser } = useHousehold();
  const location = useLocation();

  // If authenticated and new user, redirect to welcome page
  if (isNewUser && location.pathname !== "/household/welcome") {
    return <Navigate to="/household/welcome" replace />;
  }

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
