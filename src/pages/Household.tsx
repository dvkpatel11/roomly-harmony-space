import { HouseholdMembers } from "@/components/household/HouseholdMembers";
import { HouseholdOverview } from "@/components/household/HouseholdOverview";
import { HouseholdSettings } from "@/components/household/HouseholdSettings";
import PageTransition from "@/components/layout/PageTransition";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useHousehold } from "@/contexts/HouseholdContext";
import { Home, Plus } from "lucide-react";
import React from "react";
import { useNavigate } from "react-router-dom";

const Household: React.FC = () => {
  const navigate = useNavigate();
  const { currentHousehold, loading } = useHousehold();

  if (loading) {
    return (
      <PageTransition>
        <div className="flex justify-center items-center min-h-screen">
          <LoadingSpinner size="lg" />
        </div>
      </PageTransition>
    );
  }

  if (!currentHousehold) {
    return (
      <PageTransition>
        <div className="container max-w-4xl py-8">
          <div className="flex items-center gap-4 mb-8">
            <Home className="h-8 w-8" />
            <div>
              <h1 className="text-2xl font-bold">Welcome to Household Management</h1>
              <p className="text-muted-foreground">Get started by creating or joining a household</p>
            </div>
          </div>

          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Create New Household</CardTitle>
                <CardDescription>Start managing your shared living space</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => navigate("/household/create")} className="w-full gap-2">
                  <Plus className="h-4 w-4" />
                  Create Household
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="container max-w-4xl py-8">
        <div className="flex items-center gap-4 mb-8">
          <Home className="h-8 w-8" />
          <div>
            <h1 className="text-2xl font-bold">Manage {currentHousehold.name}</h1>
            <p className="text-muted-foreground">Configure and manage your household</p>
          </div>
        </div>

        <div className="grid gap-6">
          <HouseholdOverview />
          <HouseholdMembers />
          <HouseholdSettings />
        </div>
      </div>
    </PageTransition>
  );
};

export default Household;
