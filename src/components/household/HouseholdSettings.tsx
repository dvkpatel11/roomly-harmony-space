import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormInput, FormLabel } from "@/components/ui/form-components";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useHousehold } from "@/hooks/use-household";
import { useToast } from "@/hooks/use-toast";
import { Settings } from "lucide-react";
import React, { useEffect, useState } from "react";

interface HouseholdSettingsProps {
  householdId: string;
}

export function HouseholdSettings({ householdId }: HouseholdSettingsProps) {
  const { household, loading, error, updateHousehold } = useHousehold(householdId);
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  useEffect(() => {
    if (household) {
      setFormData({
        name: household.name,
        description: household.description || "",
      });
    }
  }, [household]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateHousehold({
        name: formData.name,
        description: formData.description,
      });
      toast({
        title: "Settings saved",
        description: "Your household settings have been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error saving settings",
        description: error instanceof Error ? error.message : "Failed to save household settings.",
        variant: "destructive",
      });
    }
  };

  if (error) {
    return (
      <div className="p-4 text-red-500">
        <p>{error}</p>
      </div>
    );
  }

  if (!household) return null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-4">
          <Settings className="h-8 w-8 text-primary" />
          <div>
            <CardTitle>Settings</CardTitle>
            <CardDescription>Manage household settings and actions</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSaveSettings} className="space-y-4">
          <div className="space-y-2">
            <FormLabel htmlFor="name">Household Name</FormLabel>
            <FormInput
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter household name"
            />
          </div>
          <div className="space-y-2">
            <FormLabel htmlFor="description">Description</FormLabel>
            <FormInput
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter a brief description of your household"
            />
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={loading} className="flex items-center justify-center">
              {loading && <LoadingSpinner size="sm" className="mr-2" />}
              {loading ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
