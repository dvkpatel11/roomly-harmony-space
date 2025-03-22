import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormGroup, FormInput, FormLabel } from "@/components/ui/form-components";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useHousehold } from "@/contexts/HouseholdContext";
import { useToast } from "@/hooks/use-toast";
import { getHouseholds } from "@/services/service-factory";
import { DoorOpen, Settings, Trash } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export const HouseholdSettings: React.FC = () => {
  const { currentHousehold, refreshHouseholds, leaveHousehold, deleteHousehold } = useHousehold();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  useEffect(() => {
    if (currentHousehold) {
      setFormData({
        name: currentHousehold.name,
        description: currentHousehold.description || "",
      });
    }
  }, [currentHousehold]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentHousehold) return;

    setIsLoading(true);
    try {
      await getHouseholds().updateHousehold(currentHousehold.id, {
        name: formData.name,
        description: formData.description,
      });
      await refreshHouseholds();
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
    } finally {
      setIsLoading(false);
    }
  };

  const handleLeaveHousehold = async () => {
    if (!currentHousehold) return;
    setIsLoading(true);
    try {
      await leaveHousehold(currentHousehold.id);
      navigate("/household");
    } catch (error) {
      toast({
        title: "Error leaving household",
        description: error instanceof Error ? error.message : "Failed to leave household.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteHousehold = async () => {
    if (!currentHousehold) return;
    setIsLoading(true);
    try {
      await deleteHousehold(currentHousehold.id);
      navigate("/household");
    } catch (error) {
      toast({
        title: "Error deleting household",
        description: error instanceof Error ? error.message : "Failed to delete household.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!currentHousehold) return null;

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
      <CardContent className="space-y-6">
        <form onSubmit={handleSaveSettings} className="space-y-4">
          <FormGroup>
            <FormLabel htmlFor="name">Household Name</FormLabel>
            <FormInput
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </FormGroup>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </form>

        <div className="pt-4 border-t space-y-4">
          <h1 className="font-medium text-destructive">Danger Zone</h1>
          <div className="space-y-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="w-full gap-2">
                  <DoorOpen className="h-4 w-4" />
                  Leave Household
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Leave Household?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to leave this household? You'll need a new invitation code to rejoin.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleLeaveHousehold} className="bg-destructive">
                    {isLoading ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        Leaving...
                      </>
                    ) : (
                      "Leave Household"
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {currentHousehold.role === "admin" && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full gap-2">
                    <Trash className="h-4 w-4" />
                    Delete Household
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Household?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete your household and remove all
                      associated data.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteHousehold} className="bg-destructive">
                      {isLoading ? (
                        <>
                          <LoadingSpinner size="sm" className="mr-2" />
                          Deleting...
                        </>
                      ) : (
                        "Delete Household"
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
