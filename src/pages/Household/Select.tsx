import { HouseholdList } from "@/components/household/HouseholdList";
import { JoinHouseholdForm } from "@/components/household/JoinHouseholdForm";
import PageTransition from "@/components/layout/PageTransition";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useHousehold } from "@/contexts/HouseholdContext";
import { Plus } from "lucide-react";
import React from "react";
import { useNavigate } from "react-router-dom";

const SelectHousehold: React.FC = () => {
  const navigate = useNavigate();
  const { loading } = useHousehold();

  if (loading) {
    return (
      <PageTransition>
        <div className="flex justify-center items-center min-h-screen">
          <LoadingSpinner size="lg" />
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="container max-w-4xl py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Select Household</h1>
            <p className="text-muted-foreground">Choose a household to manage or join a new one</p>
          </div>
          <Button onClick={() => navigate("/household/create")} className="gap-2">
            <Plus className="h-4 w-4" />
            Create New
          </Button>
        </div>

        <Tabs defaultValue="households" className="space-y-4">
          <TabsList>
            <TabsTrigger value="households">Your Households</TabsTrigger>
            <TabsTrigger value="join">Join Household</TabsTrigger>
          </TabsList>

          <TabsContent value="households">
            <Card>
              <CardHeader>
                <CardTitle>Your Households</CardTitle>
                <CardDescription>Select a household to manage</CardDescription>
              </CardHeader>
              <CardContent>
                <HouseholdList />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="join">
            <JoinHouseholdForm />
          </TabsContent>
        </Tabs>
      </div>
    </PageTransition>
  );
};

export default SelectHousehold;
