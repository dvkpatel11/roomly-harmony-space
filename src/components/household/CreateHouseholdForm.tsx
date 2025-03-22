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

export const CreateHouseholdForm: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { refreshHouseholds } = useHousehold();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setIsLoading(true);
    try {
      const response = await getHouseholds().createHousehold({
        name: formData.name.trim(),
        description: formData.description.trim(),
      });

      await refreshHouseholds();

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

      // Navigate to the new household's settings
      navigate(`/household/settings?id=${response.household.id}`);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create household.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
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
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
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
};
