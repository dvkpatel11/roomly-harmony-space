import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useHousehold } from "@/contexts/HouseholdContext";
import { Home, Users } from "lucide-react";
import React from "react";

export const HouseholdOverview: React.FC = () => {
  const { currentHousehold } = useHousehold();

  if (!currentHousehold) return null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-4">
          <Home className="h-8 w-8 text-primary" />
          <div>
            <CardTitle className="text-2xl">{currentHousehold.name}</CardTitle>
            <CardDescription>Created {new Date(currentHousehold.createdAt).toLocaleDateString()}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Users className="h-4 w-4" />
          <span>{currentHousehold.memberCount || 0} members</span>
        </div>
      </CardContent>
    </Card>
  );
};
