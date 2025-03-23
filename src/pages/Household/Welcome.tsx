import PageTransition from "@/components/layout/PageTransition";
import AnimatedLogo from "@/components/ui/AnimatedLogo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormGroup, FormInput, FormLabel } from "@/components/ui/form-components";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useHousehold } from "@/contexts/HouseholdContext";
import { useToast } from "@/hooks/use-toast";
import { getHouseholds } from "@/services/service-factory";
import { Home } from "lucide-react";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const WelcomePage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { refreshHouseholds, setCurrentHousehold } = useHousehold();
  const [isLoading, setIsLoading] = useState(false);
  const [householdName, setHouseholdName] = useState("");
  const [error, setError] = useState("");

  const validateHouseholdName = (name: string) => {
    if (!name.trim()) {
      return "Household name is required";
    }
    if (!/^[a-zA-Z0-9\s]+$/.test(name)) {
      return "Household name can only contain letters, numbers, and spaces";
    }
    if (!/^[a-zA-Z0-9].*[a-zA-Z0-9]$/.test(name)) {
      return "Household name must start and end with a letter or number";
    }
    if (/\s{2,}/.test(name)) {
      return "Household name cannot contain multiple consecutive spaces";
    }
    return "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateHouseholdName(householdName);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    try {
      const response = await getHouseholds().createHousehold({
        name: householdName.trim(),
      });

      // Refresh households and find the newly created one
      const households = await refreshHouseholds();
      const newHousehold = households.find((h) => h.id === response.household.id);

      if (!newHousehold) {
        throw new Error("Failed to find newly created household");
      }

      // Set the newly created household as current
      await setCurrentHousehold(newHousehold);

      toast({
        title: "Welcome to Roomly!",
        description: "Your household has been created. Let's get started!",
      });

      navigate("/dashboard");
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
    <PageTransition>
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <div className="absolute top-6 left-4">
          <AnimatedLogo size="md" />
        </div>

        <div className="w-full max-w-md">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <Home className="h-6 w-6 text-primary" />
                <CardTitle className="text-2xl">Welcome to Roomly</CardTitle>
              </div>
              <CardDescription>Let's create your first household to get started</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <FormGroup>
                  <FormLabel htmlFor="householdName">Household Name</FormLabel>
                  <FormInput
                    id="householdName"
                    value={householdName}
                    onChange={(e) => {
                      setHouseholdName(e.target.value);
                      setError("");
                    }}
                    placeholder="Enter your household name"
                    className={error ? "border-destructive" : ""}
                  />
                  {error && <p className="text-sm text-destructive">{error}</p>}
                  <p className="text-sm text-muted-foreground">Use letters and numbers, separated by single spaces</p>
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
        </div>
      </div>
    </PageTransition>
  );
};

export default WelcomePage;
