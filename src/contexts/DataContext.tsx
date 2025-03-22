import { useToast } from "@/hooks/use-toast";
import { getBadges, getCalendar, getChat, getNotifications, getTasks } from "@/services/service-factory";
import React, { createContext, useContext, useEffect, useState } from "react";
import { useHousehold } from "./HouseholdContext";

interface DataContextProps {
  isLoading: boolean;
  refreshAllData: () => Promise<void>;
  clearAllData: () => void;
}

const DataContext = createContext<DataContextProps | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { currentHousehold } = useHousehold();
  const { toast } = useToast();

  const clearAllData = () => {
    // Clear all service caches
    getBadges().clearCache();
    getNotifications().clearCache();
    getTasks().clearCache();
    getCalendar().clearCache();
    getChat().clearCache();
  };

  const refreshAllData = async () => {
    if (!currentHousehold) return;

    setIsLoading(true);
    try {
      await Promise.all([
        getBadges().getUserBadges(),
        getNotifications().getNotifications(),
        getTasks().getTasks(currentHousehold.id),
        getCalendar().getEvents(currentHousehold.id),
        getChat().getMessages(currentHousehold.id),
      ]);
    } catch (error) {
      console.error("Failed to refresh data:", error);
      toast({
        title: "Error",
        description: "Failed to refresh some data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh data when household changes
  useEffect(() => {
    if (currentHousehold) {
      clearAllData();
      refreshAllData();
    }
  }, [currentHousehold?.id]);

  return (
    <DataContext.Provider
      value={{
        isLoading,
        refreshAllData,
        clearAllData,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
};
