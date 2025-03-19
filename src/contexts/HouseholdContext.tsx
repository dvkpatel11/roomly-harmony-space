
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getHouseholds } from '@/services/service-provider';
import { Household } from '@/types/index';
import { useToast } from '@/hooks/use-toast';

interface HouseholdContextProps {
  households: Household[];
  currentHousehold: Household | null;
  setCurrentHousehold: (household: Household) => void;
  loading: boolean;
  error: Error | null;
  refreshHouseholds: () => Promise<void>;
}

const HouseholdContext = createContext<HouseholdContextProps | undefined>(undefined);

export const HouseholdProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [households, setHouseholds] = useState<Household[]>([]);
  const [currentHousehold, setCurrentHousehold] = useState<Household | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  const fetchHouseholds = async () => {
    try {
      setLoading(true);
      const response = await getHouseholds().getHouseholds();
      setHouseholds(response.households);
      
      // Set active household if one is specified
      if (response.active_household_id && response.households.length > 0) {
        const active = response.households.find(h => h.id === response.active_household_id);
        if (active) {
          setCurrentHousehold(active);
        } else {
          setCurrentHousehold(response.households[0]);
        }
      } else if (response.households.length > 0) {
        setCurrentHousehold(response.households[0]);
      }
      
      setError(null);
    } catch (err) {
      console.error('Failed to fetch households', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch households'));
      toast({
        title: 'Error',
        description: 'Failed to load households. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHouseholds();
  }, []);

  const changeCurrentHousehold = async (household: Household) => {
    setCurrentHousehold(household);
    try {
      await getHouseholds().setActiveHousehold(household.id);
    } catch (err) {
      console.error('Failed to set active household', err);
      toast({
        title: 'Warning',
        description: 'Failed to save your household preference.',
        variant: 'destructive',
      });
    }
  };

  return (
    <HouseholdContext.Provider
      value={{
        households,
        currentHousehold,
        setCurrentHousehold: changeCurrentHousehold,
        loading,
        error,
        refreshHouseholds: fetchHouseholds,
      }}
    >
      {children}
    </HouseholdContext.Provider>
  );
};

export const useHousehold = () => {
  const context = useContext(HouseholdContext);
  if (context === undefined) {
    throw new Error('useHousehold must be used within a HouseholdProvider');
  }
  return context;
};
