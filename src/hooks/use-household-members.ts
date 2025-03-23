import { HouseholdMember } from "@/types/household";
import { useCallback, useEffect, useState } from "react";
import { useServiceFactory } from "./use-service-factory";

export function useHouseholdMembers(householdId: string) {
  const { getHouseholdService } = useServiceFactory();
  const [members, setMembers] = useState<HouseholdMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMembers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getHouseholdService().getHouseholdDetails(householdId);
      setMembers(response.members);
      setError(null);
    } catch (err) {
      console.error("Failed to load household members:", err);
      setError("Failed to load household members");
    } finally {
      setLoading(false);
    }
  }, [householdId, getHouseholdService]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  return {
    members,
    loading,
    error,
    refresh: loadMembers,
  };
}
