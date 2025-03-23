import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useHousehold } from "@/contexts/HouseholdContext";
import { formatDistanceToNow } from "date-fns";
import { Calendar, Home, Settings, Users } from "lucide-react";
import React from "react";
import { Link } from "react-router-dom";

export const HouseholdList: React.FC = () => {
  const { households, currentHousehold, setCurrentHousehold, loading, isHouseholdSwitching } = useHousehold();

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (households.length === 0) {
    return (
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle>No Households Found</CardTitle>
          <CardDescription>
            You haven't created or joined any households yet. Create your first household to get started!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link to="/household/create">
            <Button className="w-full gap-2">
              <Home className="h-4 w-4" />
              Create Household
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const getHouseholdIcon = (templateId?: string) => {
    switch (templateId) {
      case "family":
        return <Home className="h-6 w-6 text-primary" />;
      case "roommates":
        return <Users className="h-6 w-6 text-primary" />;
      case "student":
        return <Calendar className="h-6 w-6 text-primary" />;
      default:
        return <Home className="h-6 w-6 text-primary" />;
    }
  };

  return (
    <div className="grid gap-4">
      {households.map((household) => (
        <Card
          key={household.id}
          className={`relative overflow-hidden transition-colors hover:bg-muted/50 ${
            currentHousehold?.id === household.id ? "border-primary" : ""
          }`}
        >
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                {getHouseholdIcon(household.template_id)}
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {household.name}
                    {currentHousehold?.id === household.id && (
                      <Badge variant="outline" className="ml-2">
                        Current
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>
                    {household.description || "No description"}
                    <br />
                    Created {formatDistanceToNow(new Date(household.createdAt))} ago
                  </CardDescription>
                </div>
              </div>
              <div className="flex gap-2">
                <Link to={`/household/settings?id=${household.id}`}>
                  <Button variant="ghost" size="icon">
                    <Settings className="h-4 w-4" />
                  </Button>
                </Link>
                <Button
                  variant={currentHousehold?.id === household.id ? "secondary" : "default"}
                  disabled={isHouseholdSwitching || currentHousehold?.id === household.id}
                  onClick={() => setCurrentHousehold(household)}
                >
                  {isHouseholdSwitching ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Switching...
                    </>
                  ) : currentHousehold?.id === household.id ? (
                    "Selected"
                  ) : (
                    "Select"
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              {household.memberCount || 1} member{(household.memberCount || 1) !== 1 ? "s" : ""}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
