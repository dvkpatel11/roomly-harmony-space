import { CreateHouseholdRequest, Household } from "@/types/household";
import { useCallback, useEffect, useState } from "react";
import { useServiceFactory } from "./use-service-factory";

export function useHouseholds() {
  const { getHouseholdService } = useServiceFactory();
  const [households, setHouseholds] = useState<Household[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeHouseholdId, setActiveHouseholdId] = useState<string | null>(null);

  const loadHouseholds = useCallback(async () => {
    try {
      console.log("[useHouseholds] Loading households...");
      setLoading(true);
      const response = await getHouseholdService().getHouseholds();
      console.log("[useHouseholds] Households loaded:", response);
      setHouseholds(response);
      setError(null);
    } catch (err) {
      console.error("[useHouseholds] Failed to load households:", err);
      setError("Failed to load households");
    } finally {
      setLoading(false);
    }
  }, [getHouseholdService]);

  const loadActiveHousehold = useCallback(async () => {
    try {
      const response = await getHouseholdService().getActiveHousehold();
      if (response) {
        setActiveHouseholdId(response.id);
      } else {
        setActiveHouseholdId(null);
      }
    } catch (err) {
      console.error("Failed to load active household:", err);
      setActiveHouseholdId(null);
    }
  }, [getHouseholdService]);

  useEffect(() => {
    loadHouseholds();
    loadActiveHousehold();
  }, [loadHouseholds, loadActiveHousehold]);

  const createHousehold = useCallback(
    async (request: CreateHouseholdRequest) => {
      try {
        console.log("[useHouseholds] Creating household:", request);
        const response = await getHouseholdService().createHousehold(request);
        console.log("[useHouseholds] Household created:", response);
        console.log("[useHouseholds] Refreshing households list...");
        await loadHouseholds();
        return response;
      } catch (err) {
        console.error("[useHouseholds] Failed to create household:", err);
        throw err;
      }
    },
    [getHouseholdService, loadHouseholds]
  );

  const joinHousehold = useCallback(
    async (inviteCode: string) => {
      try {
        const response = await getHouseholdService().joinHousehold(inviteCode);
        await loadHouseholds();
        return response;
      } catch (err) {
        console.error("Failed to join household:", err);
        throw err;
      }
    },
    [getHouseholdService, loadHouseholds]
  );

  const setActiveHousehold = useCallback(
    async (householdId: string) => {
      try {
        await getHouseholdService().setActiveHousehold(householdId);
        setActiveHouseholdId(householdId);
      } catch (err) {
        console.error("Failed to set active household:", err);
        throw err;
      }
    },
    [getHouseholdService]
  );

  const leaveHousehold = useCallback(
    async (householdId: string) => {
      try {
        await getHouseholdService().leaveHousehold(householdId);
        if (activeHouseholdId === householdId) {
          setActiveHouseholdId(null);
        }
        await loadHouseholds();
      } catch (err) {
        console.error("Failed to leave household:", err);
        throw err;
      }
    },
    [getHouseholdService, activeHouseholdId, loadHouseholds]
  );

  return {
    households,
    loading,
    error,
    activeHouseholdId,
    refresh: loadHouseholds,
    createHousehold,
    joinHousehold,
    setActiveHousehold,
    leaveHousehold,
  };
}
