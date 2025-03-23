import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DataProvider } from "@/contexts/DataContext";
import { HouseholdProvider } from "@/contexts/HouseholdContext";
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
        {isMobile && <MobileNav />}
      </div>
    </div>
  );
};

// Auth wrapper for all routes
const AuthWrapper = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const isAuthRoute = location.pathname === "/login" || location.pathname === "/register";
  const isAuthenticated = getAuth().isAuthenticated();

  if (isAuthenticated && isAuthRoute) {
    return <Navigate to="/dashboard" replace />;
  }

  if (!isAuthenticated && !isAuthRoute && location.pathname !== "/") {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Animated routes component
const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/dashboard"
          element={
            <AppLayout>
              <Dashboard />
            </AppLayout>
          }
        />

        <Route
          path="/household/:householdId"
          element={
            <AppLayout>
              <Household />
            </AppLayout>
          }
        />

        <Route
          path="/household/:householdId/chat"
          element={
            <AppLayout>
              <Chat />
            </AppLayout>
          }
        />
        
        <Route
          path="/chat"
          element={
            <AppLayout>
              <Chat />
            </AppLayout>
          }
        />

        <Route
          path="/chat/:householdId"
          element={
            <AppLayout>
              <Chat />
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

        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
};

// API URL from environment
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const App = () => (
  <BrowserRouter>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <HouseholdProvider>  {/* Move this up, before DataProvider */}
          <AuthProvider apiUrl={API_URL}>
            <ChatProvider apiUrl={API_URL}>
              <DataProvider>  {/* This needs HouseholdProvider to be a parent */}
                <TooltipProvider>
                  <AuthWrapper>
                    <AnimatedRoutes />
                  </AuthWrapper>
                  <Toaster />
                  <Sonner />
                </TooltipProvider>
              </DataProvider>
            </ChatProvider>
          </AuthProvider>
        </HouseholdProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </BrowserRouter>
);

export default App;
