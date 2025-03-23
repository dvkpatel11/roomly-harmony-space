import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormGroup, FormInput, FormLabel } from "@/components/ui/form-components";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useHousehold } from "@/contexts/HouseholdContext";
import { useToast } from "@/hooks/use-toast";
import { getHouseholds } from "@/services/service-factory";
import { Shield } from "lucide-react";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export function CreateHouseholdForm() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { refreshHouseholds, setCurrentHousehold } = useHousehold();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    console.log("[CreateHouseholdForm] Starting household creation...");
    setLoading(true);
    try {
      console.log("[CreateHouseholdForm] Creating household with data:", {
        name: formData.name.trim(),
        description: formData.description.trim(),
      });

      const response = await getHouseholds().createHousehold({
        name: formData.name.trim(),
        description: formData.description.trim(),
      });

      console.log("[CreateHouseholdForm] Household created successfully:", response);

      // Refresh households in the context and get the updated list
      const households = await refreshHouseholds();
      console.log("[CreateHouseholdForm] Households refreshed in context");

      // Find and set the newly created household as current
      const newHousehold = households.find((h) => h.id === response.household.id);
      if (!newHousehold) {
        throw new Error("Failed to find newly created household");
      }

      console.log("[CreateHouseholdForm] Setting new household as current:", newHousehold.id);
      await setCurrentHousehold(newHousehold);
      console.log("[CreateHouseholdForm] Current household set successfully");

      // Wait for a small delay to ensure all state updates are processed
      await new Promise((resolve) => setTimeout(resolve, 100));

      toast({
        title: "Household Created Successfully",
        description: (
          <div className="flex flex-col gap-2">
            <p>Your new household has been created!</p>
            <div className="flex items-center gap-2 text-primary">
              <Shield className="h-4 w-4" />
              <span>You are now the administrator of this household</span>
            </div>
          </div>
        ),
      });

      console.log("[CreateHouseholdForm] Attempting navigation to /dashboard");
      navigate("/dashboard", { replace: true });
      console.log("[CreateHouseholdForm] Navigation called");
    } catch (error) {
      console.error("[CreateHouseholdForm] Error creating household:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create household.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      console.log("[CreateHouseholdForm] Form submission completed");
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <div>
            <CardTitle>Create New Household</CardTitle>
            <CardDescription>You'll be the administrator of this household</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormGroup>
            <FormLabel htmlFor="name" required>
              Household Name
            </FormLabel>
            <FormInput
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter household name"
              required
            />
          </FormGroup>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Creating...
              </>
            ) : (
              "Create Household"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
