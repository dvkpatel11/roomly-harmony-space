import { useToast } from "@/hooks/use-toast";
import { getAuth, getHouseholds, setCurrentHouseholdId } from "@/services/service-factory";
import { Household, HouseholdResponse } from "@/types/index";
import React, { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

interface HouseholdContextProps {
  households: Household[];
  currentHousehold: Household | null;
  setCurrentHousehold: (household: Household) => Promise<void>;
  loading: boolean;
  error: Error | null;
  refreshHouseholds: () => Promise<void>;
  isHouseholdSwitching: boolean;
}

const HouseholdContext = createContext<HouseholdContextProps | undefined>(undefined);

// List of paths that don't require household context
const PUBLIC_PATHS = ["/", "/login", "/register"];
const HOUSEHOLD_MANAGEMENT_PATHS = ["/household"];

export const HouseholdProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [households, setHouseholds] = useState<Household[]>([]);
  const [currentHousehold, setCurrentHousehold] = useState<Household | null>(null);
  const [loading, setLoading] = useState(true);
  const [isHouseholdSwitching, setIsHouseholdSwitching] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const auth = getAuth();

  // Update services when household changes
  useEffect(() => {
    setCurrentHouseholdId(currentHousehold?.id || null);
  }, [currentHousehold?.id]);

  const fetchHouseholds = async () => {
    // Skip if not authenticated
    if (!auth.isAuthenticated()) {
      setLoading(false);
      setHouseholds([]);
      setCurrentHousehold(null);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      const response: HouseholdResponse[] = await getHouseholds().getHouseholds();
      setHouseholds(response);

      // Get active household from backend
      const activeHousehold = await getHouseholds().getActiveHousehold();
      if (activeHousehold) {
        const household = {
          id: activeHousehold.id,
          name: activeHousehold.name,
          admin_id: activeHousehold.admin_id,
          createdAt: activeHousehold.createdAt,
        };
        setCurrentHousehold(household);
        setCurrentHouseholdId(household.id);
      } else if (response.length > 0) {
        // If no active household, set first one as active
        setCurrentHousehold(response[0]);
        setCurrentHouseholdId(response[0].id);
        await getHouseholds().setActiveHousehold(response[0].id);
      }

      setError(null);
    } catch (err) {
      console.error("Failed to fetch households", err);
      setError(err instanceof Error ? err : new Error("Failed to fetch households"));
      toast({
        title: "Error",
        description: "Failed to load households. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Refresh households when auth state changes
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async () => {
      setLoading(true);
      if (auth.isAuthenticated()) {
        await fetchHouseholds();
      } else {
        setHouseholds([]);
        setCurrentHousehold(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchHouseholds();
  }, []);

  const changeCurrentHousehold = async (household: Household) => {
    try {
      setIsHouseholdSwitching(true);
      await getHouseholds().setActiveHousehold(household.id);
      const details = await getHouseholds().getHouseholdDetails(household.id);
      const newHousehold = {
        id: details.id,
        name: details.name,
        admin_id: details.admin_id,
        createdAt: details.createdAt,
      };
      setCurrentHousehold(newHousehold);
      setCurrentHouseholdId(newHousehold.id);
      toast({
        title: "Household Changed",
        description: `Switched to ${household.name}`,
      });
    } catch (err) {
      console.error("Failed to set active household", err);
      toast({
        title: "Error",
        description: "Failed to switch household. Please try again.",
        variant: "destructive",
      });
      throw err;
    } finally {
      setIsHouseholdSwitching(false);
    }
  };

  // Handle routing based on auth and household state
  useEffect(() => {
    if (loading) return;

    const isPublicPath = PUBLIC_PATHS.includes(location.pathname);
    const isHouseholdManagementPath = HOUSEHOLD_MANAGEMENT_PATHS.includes(location.pathname);

    if (!auth.isAuthenticated()) {
      if (!isPublicPath) {
        navigate("/login", { state: { from: location.pathname } });
      }
      return;
    }

    // Handle authenticated users
    if (isPublicPath && location.pathname !== "/") {
      navigate("/dashboard");
      return;
    }

    if (!isHouseholdManagementPath && !isPublicPath) {
      if (households.length === 0) {
        navigate("/household/create");
      } else if (!currentHousehold) {
        navigate("/household/select");
      }
    }
  }, [location.pathname, households, currentHousehold, loading, auth.isAuthenticated()]);

  return (
    <HouseholdContext.Provider
      value={{
        households,
        currentHousehold,
        setCurrentHousehold: changeCurrentHousehold,
        loading,
        error,
        refreshHouseholds: fetchHouseholds,
        isHouseholdSwitching,
      }}
    >
      {children}
    </HouseholdContext.Provider>
  );
};

export const useHousehold = () => {
  const context = useContext(HouseholdContext);
  if (context === undefined) {
    throw new Error("useHousehold must be used within a HouseholdProvider");
  }
  return context;
};
