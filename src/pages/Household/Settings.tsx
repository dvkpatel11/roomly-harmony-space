import PageTransition from "@/components/layout/PageTransition";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useHousehold } from "@/contexts/HouseholdContext";
import { useToast } from "@/hooks/use-toast";
import { getHouseholds } from "@/services/service-factory";
import { Household } from "@/types/household";
import { Copy, DoorOpen, Home, Trash } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const HouseholdSettings: React.FC = () => {
  const [searchParams] = useSearchParams();
  const householdId = searchParams.get("id");
  const { households, refreshHouseholds, leaveHousehold, deleteHousehold } = useHousehold();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [household, setHousehold] = useState<Household | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  useEffect(() => {
    const currentHousehold = households.find((h) => h.id === householdId);
    if (currentHousehold) {
      setHousehold(currentHousehold);
      setFormData({
        name: currentHousehold.name,
        description: currentHousehold.description || "",
      });
    }
  }, [householdId, households]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!household) return;

    setIsLoading(true);
    try {
      await getHouseholds().updateHousehold(household.id, {
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

  const handleGenerateInvite = async () => {
    if (!household) return;

    setIsLoading(true);
    try {
      const response = await getHouseholds().generateInvitationCode(household.id);
      await navigator.clipboard.writeText(response.invitation_code);
      toast({
        title: "Invite code copied",
        description: "The invite code has been copied to your clipboard.",
      });
    } catch (error) {
      toast({
        title: "Error generating invite",
        description: error instanceof Error ? error.message : "Failed to generate invite code.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLeaveHousehold = async () => {
    if (!household) return;
    setIsLoading(true);
    try {
      await leaveHousehold(household.id);
      navigate("/household");
    } catch (error) {
      // Error is already handled in context
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteHousehold = async () => {
    if (!household) return;
    setIsLoading(true);
    try {
      await deleteHousehold(household.id);
      navigate("/household");
    } catch (error) {
      // Error is already handled in context
    } finally {
      setIsLoading(false);
    }
  };

  if (!household) {
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
        <div className="flex items-center gap-4 mb-8">
          <Home className="h-8 w-8" />
          <div>
            <h1 className="text-2xl font-bold">{household.name} Settings</h1>
            <p className="text-muted-foreground">Manage your household preferences and configuration</p>
          </div>
        </div>

        <Tabs defaultValue="general" className="space-y-4">
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="invites">Invites</TabsTrigger>
            <TabsTrigger value="danger">Danger Zone</TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>Update your household's basic information</CardDescription>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="invites">
            <Card>
              <CardHeader>
                <CardTitle>Invite Members</CardTitle>
                <CardDescription>Generate invitation codes to add new members to your household</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button onClick={handleGenerateInvite} disabled={isLoading} className="gap-2">
                  <Copy className="h-4 w-4" />
                  {isLoading ? "Generating..." : "Generate Invite Code"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="danger">
            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="text-destructive">Danger Zone</CardTitle>
                <CardDescription>Irreversible and destructive actions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
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

                {household.role === "admin" && (
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
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PageTransition>
  );
};

export default HouseholdSettings;
