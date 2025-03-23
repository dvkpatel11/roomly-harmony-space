import React, { useState, useEffect } from "react";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DataProvider } from "@/contexts/DataContext";
import { HouseholdProvider, useHousehold } from "@/contexts/HouseholdContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ChatThemeProvider } from "@/contexts/ChatThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ChatProvider } from "@/contexts/ChatContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AnimatePresence } from "framer-motion";
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import ChatRoom from './components/Chat/ChatRoom';
import { getAuth } from "@/services/service-factory";

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

// AppLayout provides the consistent layout (sidebar, etc) for authenticated pages
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

// Loading screen component
const LoadingScreen = () => (
  <div className="flex items-center justify-center min-h-screen">
    <LoadingSpinner size="lg" />
  </div>
);

// AuthenticatedApp handles all routes that require authentication
const AuthenticatedApp = () => {
  const { households, loading: householdLoading } = useHousehold();
  const location = useLocation();

  // Get the first household for the chat or handle accordingly
  const currentHousehold = households[0]; 

  console.log("[AuthenticatedApp] Current state:", {
    householdsCount: households.length,
    loading: householdLoading,
    currentPath: location.pathname,
  });

  // Show loading state while checking household status
  if (householdLoading) {
    return <LoadingScreen />;
  }

  if (households.length === 0 && !householdLoading) {
    // Redirect to the welcome screen to create a household
    return <Navigate to="/household/welcome" replace />;
  }

  console.log('[AuthenticatedApp] Proceeding with normal render');
  console.log('[AuthenticatedApp] Current household:', currentHousehold);
  console.log('[AuthenticatedApp] Loading state:', householdLoading);

  return (
    <DataProvider>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route
            path="/dashboard"
            element={
              <AppLayout>
                <Dashboard />
              </AppLayout>
            }
          />
          <Route path="/tasks" element={<AppLayout><Tasks /></AppLayout>} />
          <Route path="/profile" element={<AppLayout><Profile /></AppLayout>} />
          <Route path="/household" element={<AppLayout><Household /></AppLayout>} />
          <Route path="/household/welcome" element={<WelcomePage />} />
          <Route path="/household/create" element={<CreateHouseholdPage />} />
          <Route path="/household/settings" element={<AppLayout><HouseholdSettings /></AppLayout>} />
          <Route path="/household/members" element={<AppLayout><HouseholdMembers /></AppLayout>} />
          <Route path="/household/invites" element={<AppLayout><HouseholdInvites /></AppLayout>} />
          <Route path="/household/roles" element={<AppLayout><HouseholdRoles /></AppLayout>} />
          
          {/* Chat routes */}
          <Route path="/chat/:householdId" element={<Chat />} />
          <Route path="/chat" element={
            <AppLayout>
              {currentHousehold && (
                <ChatRoom 
                  householdId={currentHousehold.id} 
                  householdName={currentHousehold.name} 
                />
              )}
            </AppLayout>
          } />
          
          {/* Default routes */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<Navigate to="/dashboard" replace />} />
          <Route path="/register" element={<Navigate to="/household/welcome" replace />} />
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
    <AuthProvider apiUrl={API_URL}>
      <HouseholdProvider>
        <ChatThemeProvider>
          <ChatProvider>
            <AuthenticatedApp />
          </ChatProvider>
        </ChatThemeProvider>
      </HouseholdProvider>
    </AuthProvider>
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
