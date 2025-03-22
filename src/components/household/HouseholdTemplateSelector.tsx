import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useToast } from "@/hooks/use-toast";
import { getHouseholds } from "@/services/service-factory";
import { useHousehold } from "@/contexts/HouseholdContext";
import { Home, Users, GraduationCap } from "lucide-react";

interface HouseholdTemplate {
  id: string;
  name: string;
  description: string;
  features: string[];
  icon: React.ReactNode;
}

const templates: HouseholdTemplate[] = [
  {
    id: "family",
    name: "Family Home",
    description: "Perfect for families managing their household together",
    features: [
      "Shared grocery lists",
      "Family calendar",
      "Chore assignments",
      "Expense tracking",
      "Family announcements",
    ],
    icon: <Home className="h-6 w-6" />,
  },
  {
    id: "roommates",
    name: "Shared Living",
    description: "Ideal for roommates sharing an apartment or house",
    features: [
      "Bill splitting",
      "Cleaning schedules",
      "House rules",
      "Shared supplies tracking",
      "Common area booking",
    ],
    icon: <Users className="h-6 w-6" />,
  },
  {
    id: "student",
    name: "Student Housing",
    description: "Designed for student accommodations and dorm living",
    features: [
      "Study room booking",
      "Quiet hours schedule",
      "Laundry management",
      "Event planning",
      "Resource sharing",
    ],
    icon: <GraduationCap className="h-6 w-6" />,
  },
];

export const HouseholdTemplateSelector: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { refreshHouseholds } = useHousehold();
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleSelectTemplate = async (template: HouseholdTemplate) => {
    setIsLoading(template.id);
    try {
      const response = await getHouseholds().createHousehold({
        name: `${template.name} Household`,
        description: template.description,
        template_id: template.id,
      });

      await refreshHouseholds();
      
      toast({
        title: "Household Created",
        description: "Your new household has been created from the template.",
      });

      navigate(`/household/settings?id=${response.household.id}`);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create household from template.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Choose a Template</CardTitle>
        <CardDescription>Start with a pre-configured household setup</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          {templates.map((template) => (
            <Card key={template.id} className="overflow-hidden">
              <CardHeader>
                <div className="flex items-center gap-2">
                  {template.icon}
                  <div>
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <CardDescription>{template.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground mb-4">
                  {template.features.map((feature, index) => (
                    <li key={index}>{feature}</li>
                  ))}
                </ul>
                <Button
                  onClick={() => handleSelectTemplate(template)}
                  disabled={isLoading !== null}
                  className="w-full"
                >
                  {isLoading === template.id ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Creating...
                    </>
                  ) : (
                    "Use Template"
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default HouseholdTemplateSelector;
