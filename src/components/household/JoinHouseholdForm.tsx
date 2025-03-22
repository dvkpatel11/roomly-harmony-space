import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormGroup, FormInput, FormLabel } from "@/components/ui/form-components";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useHousehold } from "@/contexts/HouseholdContext";
import { useToast } from "@/hooks/use-toast";
import { getHouseholds } from "@/services/service-factory";
import { User, Users } from "lucide-react";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export const JoinHouseholdForm: React.FC = () => {
  const [inviteCode, setInviteCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { refreshHouseholds } = useHousehold();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await getHouseholds().joinHousehold(inviteCode.trim());
      await refreshHouseholds();

      toast({
        title: "Successfully Joined Household",
        description: (
          <div className="flex flex-col gap-2">
            <p>Welcome to {response.household.name}!</p>
            <div className="flex items-center gap-2 text-primary">
              <User className="h-4 w-4" />
              <span>You've joined as a household member</span>
            </div>
          </div>
        ),
      });

      navigate(`/dashboard`);
    } catch (error) {
      toast({
        title: "Failed to join household",
        description: error instanceof Error ? error.message : "Invalid invitation code. Please try again.",
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
          <Users className="h-5 w-5 text-primary" />
          <div>
            <CardTitle>Join a Household</CardTitle>
            <CardDescription>Use an invitation code to join an existing household as a member</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormGroup>
            <FormLabel htmlFor="inviteCode">Invitation Code</FormLabel>
            <FormInput
              id="inviteCode"
              placeholder="Enter your invitation code"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              required
              pattern="^[A-Za-z0-9-]+$"
              title="Invitation code can only contain letters, numbers, and hyphens"
              icon={<Users className="h-4 w-4" />}
            />
          </FormGroup>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Joining...
              </>
            ) : (
              "Join Household"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
