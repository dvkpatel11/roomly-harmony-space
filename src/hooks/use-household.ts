import { Household, UpdateRoleRequest } from "@/types/household";
import { useCallback, useEffect, useState } from "react";
import { useServiceFactory } from "./use-service-factory";

interface UpdateHouseholdRequest {
  name: string;
  description?: string;
}

export function useHousehold(householdId: string) {
  const { getHouseholdService } = useServiceFactory();
  const [household, setHousehold] = useState<Household | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadHousehold = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getHouseholdService().getHouseholdDetails(householdId);
      setHousehold({
        id: response.id,
        name: response.name,
        admin_id: response.admin_id,
        createdAt: response.createdAt,
      });
      setError(null);
    } catch (err) {
      console.error("Failed to load household:", err);
      setError("Failed to load household");
    } finally {
      setLoading(false);
    }
  }, [householdId, getHouseholdService]);

  useEffect(() => {
    loadHousehold();
  }, [loadHousehold]);

  const updateHousehold = useCallback(
    async (updates: UpdateHouseholdRequest) => {
      try {
        await getHouseholdService().updateHousehold(householdId, updates);
        await loadHousehold();
      } catch (err) {
        console.error("Failed to update household:", err);
        throw err;
      }
    },
    [householdId, getHouseholdService, loadHousehold]
  );

  const updateMemberRole = useCallback(
    async (memberId: string, request: UpdateRoleRequest) => {
      try {
        await getHouseholdService().updateMemberRole(householdId, memberId, request);
        await loadHousehold();
      } catch (err) {
        console.error("Failed to update member role:", err);
        throw err;
      }
    },
    [householdId, getHouseholdService, loadHousehold]
  );

  const removeMember = useCallback(
    async (memberId: string) => {
      try {
        await getHouseholdService().removeMember(householdId, memberId);
        await loadHousehold();
      } catch (err) {
        console.error("Failed to remove member:", err);
        throw err;
      }
    },
    [householdId, getHouseholdService, loadHousehold]
  );

  const generateInvitationCode = useCallback(async () => {
    try {
      return await getHouseholdService().generateInvitationCode(householdId);
    } catch (err) {
      console.error("Failed to generate invitation code:", err);
      throw err;
    }
  }, [householdId, getHouseholdService]);

  const deleteHousehold = useCallback(async () => {
    try {
      await getHouseholdService().deleteHousehold(householdId);
    } catch (err) {
      console.error("Failed to delete household:", err);
      throw err;
    }
  }, [householdId, getHouseholdService]);

  return {
    household,
    loading,
    error,
    refresh: loadHousehold,
    updateHousehold,
    updateMemberRole,
    removeMember,
    generateInvitationCode,
    deleteHousehold,
  };
}
