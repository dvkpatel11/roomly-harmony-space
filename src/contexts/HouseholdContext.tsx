import { useToast } from "@/hooks/use-toast";
import { getHouseholds } from "@/services/service-factory";
import { Household, HouseholdResponse } from "@/types/household";
import React, { createContext, useContext, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

interface HouseholdContextType {
  households: Household[];
  currentHousehold: Household | null;
  setCurrentHousehold: (household: Household) => Promise<void>;
  loading: boolean;
  isHouseholdSwitching: boolean;
  requiresHousehold: boolean;
  isNewUser: boolean;
  refreshHouseholds: () => Promise<HouseholdResponse[]>;
  leaveHousehold: (householdId: string) => Promise<void>;
  deleteHousehold: (householdId: string) => Promise<void>;
}

const HouseholdContext = createContext<HouseholdContextType | undefined>(undefined);

// Routes that require a household to be selected
const HOUSEHOLD_REQUIRED_ROUTES = ["/dashboard", "/tasks", "/calendar", "/chat"];

export const HouseholdProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [households, setHouseholds] = useState<Household[]>([]);
  const [currentHousehold, setCurrentHouseholdState] = useState<Household | null>(null);
  const [loading, setLoading] = useState(true);
  const [isHouseholdSwitching, setIsHouseholdSwitching] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const location = useLocation();
  const { toast } = useToast();

  const requiresHousehold = HOUSEHOLD_REQUIRED_ROUTES.some((route) => location.pathname.startsWith(route));

  const refreshHouseholds = async () => {
    try {
      const response = await getHouseholds().getHouseholds();
      setHouseholds(response);

      // If this is a new user (no households), set isNewUser flag
      if (response.length === 0) {
        setIsNewUser(true);
      }

      // If current household is not in the list anymore, clear it
      if (currentHousehold && !response.find((h) => h.id === currentHousehold.id)) {
        setCurrentHouseholdState(null);
      }

      return response;
    } catch (error) {
      console.error("Failed to refresh households:", error);
      toast({
        title: "Error refreshing households",
        description: error instanceof Error ? error.message : "Failed to refresh households",
        variant: "destructive",
      });
      return [];
    }
  };

  const setCurrentHousehold = async (household: Household) => {
    setIsHouseholdSwitching(true);
    try {
      await getHouseholds().setActiveHousehold(household.id);
      setCurrentHouseholdState(household);

      // Show role-specific message
      toast({
        title: "Household Selected",
        description: `Switched to ${household.name}. You are a ${household.role.toLowerCase()}.`,
      });
    } catch (error) {
      toast({
        title: "Error switching household",
        description: error instanceof Error ? error.message : "Failed to switch household",
        variant: "destructive",
      });
    } finally {
      setIsHouseholdSwitching(false);
    }
  };

  const leaveHousehold = async (householdId: string) => {
    try {
      await getHouseholds().leaveHousehold(householdId);

      // If we're leaving the current household, clear it
      if (currentHousehold?.id === householdId) {
        setCurrentHouseholdState(null);
      }

      await refreshHouseholds();

      toast({
        title: "Left Household",
        description: "You have successfully left the household.",
      });
    } catch (error) {
      toast({
        title: "Error leaving household",
        description: error instanceof Error ? error.message : "Failed to leave household",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteHousehold = async (householdId: string) => {
    try {
      await getHouseholds().deleteHousehold(householdId);

      // If we're deleting the current household, clear it
      if (currentHousehold?.id === householdId) {
        setCurrentHouseholdState(null);
      }

      await refreshHouseholds();

      toast({
        title: "Household Deleted",
        description: "The household has been permanently deleted.",
      });
    } catch (error) {
      toast({
        title: "Error deleting household",
        description: error instanceof Error ? error.message : "Failed to delete household",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Initial load of households
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      try {
        // First try to get the active household from the API
        const activeHousehold = await getHouseholds().getActiveHousehold();

        // Then get all households
        const householdList = await refreshHouseholds();

        if (activeHousehold) {
          // If we have an active household from the API, use it
          const household = householdList.find((h) => h.id === activeHousehold.id);
          if (household) {
            await setCurrentHousehold(household);
          }
        } else {
          // Try to get current household from local storage
          const savedHouseholdId = localStorage.getItem("currentHouseholdId");
          if (savedHouseholdId) {
            const savedHousehold = householdList.find((h) => h.id === savedHouseholdId);
            if (savedHousehold) {
              await setCurrentHousehold(savedHousehold);
            } else if (householdList.length > 0) {
              // If saved household not found but we have households, select the first one
              await setCurrentHousehold(householdList[0]);
            }
          } else if (householdList.length > 0 && !currentHousehold) {
            // If no saved household but we have households and none selected, select the first one
            await setCurrentHousehold(householdList[0]);
          }
        }
      } catch (error) {
        console.error("Failed to load initial household data:", error);
        toast({
          title: "Error",
          description: "Failed to load household data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // Save current household ID to local storage
  useEffect(() => {
    if (currentHousehold) {
      localStorage.setItem("currentHouseholdId", currentHousehold.id);
    } else {
      localStorage.removeItem("currentHouseholdId");
    }
  }, [currentHousehold]);

  return (
    <HouseholdContext.Provider
      value={{
        households,
        currentHousehold,
        setCurrentHousehold,
        loading,
        isHouseholdSwitching,
        requiresHousehold,
        isNewUser,
        refreshHouseholds,
        leaveHousehold,
        deleteHousehold,
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
