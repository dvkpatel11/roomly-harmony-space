import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FormGroup, FormInput, FormLabel } from "@/components/ui/form-components";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useHousehold } from "@/contexts/HouseholdContext";
import { useToast } from "@/hooks/use-toast";
import { getHouseholds } from "@/services/service-factory";
import { HouseholdMember } from "@/types/household";
import { Copy, Plus, Settings, UserPlus, Users } from "lucide-react";
import React, { useState } from "react";

const Household: React.FC = () => {
  const { currentHousehold, loading, error, refreshHouseholds } = useHousehold();
  const [members, setMembers] = useState<HouseholdMember[]>([]);
  const [inviteCode, setInviteCode] = useState<string>("");
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [newHouseholdName, setNewHouseholdName] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const { toast } = useToast();

  // Fetch household details including members when currentHousehold changes
  React.useEffect(() => {
    const fetchMembers = async () => {
      if (!currentHousehold) return;

      try {
        const details = await getHouseholds().getHouseholdDetails(currentHousehold.id);
        setMembers(details.members);
      } catch (err) {
        console.error("Failed to fetch household details", err);
        toast({
          title: "Error",
          description: "Failed to load household members",
          variant: "destructive",
        });
      }
    };

    fetchMembers();
  }, [currentHousehold, toast]);

  const generateInviteCode = async () => {
    if (!currentHousehold) return;

    try {
      const response = await getHouseholds().generateInvitationCode(currentHousehold.id);
      setInviteCode(response.code);
      setShowInviteDialog(true);
    } catch (err) {
      console.error("Failed to generate invite code", err);
      toast({
        title: "Error",
        description: "Failed to generate invitation code",
        variant: "destructive",
      });
    }
  };

  const copyInviteCode = () => {
    navigator.clipboard.writeText(inviteCode);
    toast({
      title: "Copied!",
      description: "Invitation code copied to clipboard",
    });
  };

  const createHousehold = async () => {
    if (!newHouseholdName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a household name",
        variant: "destructive",
      });
      return;
    }

    try {
      await getHouseholds().createHousehold({ name: newHouseholdName });
      toast({
        title: "Success",
        description: "Household created successfully",
      });
      setNewHouseholdName("");
      setShowCreateDialog(false);
      refreshHouseholds();
    } catch (err) {
      console.error("Failed to create household", err);
      toast({
        title: "Error",
        description: "Failed to create household",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <h2 className="text-xl font-semibold mb-2">Failed to load households</h2>
        <p className="text-muted-foreground mb-4">{error.message}</p>
        <Button onClick={refreshHouseholds}>Try Again</Button>
      </div>
    );
  }

  if (!currentHousehold) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <h2 className="text-xl font-semibold mb-2">No Household Selected</h2>
        <p className="text-muted-foreground mb-4">You need to select or create a household.</p>
        <Button onClick={() => setShowCreateDialog(true)}>Create Household</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{currentHousehold.name}</h1>
          <p className="text-muted-foreground">Manage your household members and settings</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" /> New Household
          </Button>
          <Button onClick={generateInviteCode}>
            <UserPlus className="h-4 w-4 mr-2" /> Invite Member
          </Button>
        </div>
      </div>

      <Tabs defaultValue="members" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Members ({members.length})
              </CardTitle>
              <CardDescription>People in your household</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-2 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={member.avatar || ""} />
                        <AvatarFallback>{member.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{member.name}</p>
                        <p className="text-sm text-muted-foreground">{member.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={member.role === "admin" ? "default" : "outline"}>
                        {member.role === "admin" ? "Admin" : "Member"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={generateInviteCode} className="w-full">
                <UserPlus className="h-4 w-4 mr-2" />
                Invite New Member
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                Household Settings
              </CardTitle>
              <CardDescription>Configure your household preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormGroup>
                <FormLabel htmlFor="household-name">Household Name</FormLabel>
                <FormInput
                  id="household-name"
                  defaultValue={currentHousehold.name}
                  placeholder="Enter household name"
                />
              </FormGroup>
              {currentHousehold.role === "admin" && (
                <div className="grid gap-2">
                  <Button variant="destructive" className="w-full">
                    Delete Household
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Invite Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invitation Code</DialogTitle>
            <DialogDescription>Share this code with others to invite them to your household</DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-between p-3 border rounded-md bg-muted/50">
            <code className="font-mono text-sm">{inviteCode}</code>
            <Button size="icon" variant="ghost" onClick={copyInviteCode}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowInviteDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Household Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Household</DialogTitle>
            <DialogDescription>Create a new household to manage tasks and chores with others</DialogDescription>
          </DialogHeader>
          <FormGroup>
            <FormLabel htmlFor="new-household-name" required>
              Household Name
            </FormLabel>
            <FormInput
              id="new-household-name"
              value={newHouseholdName}
              onChange={(e) => setNewHouseholdName(e.target.value)}
              placeholder="Enter household name"
            />
          </FormGroup>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={createHousehold}>Create Household</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Household;
