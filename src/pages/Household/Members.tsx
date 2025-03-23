import PageTransition from "@/components/layout/PageTransition";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useHousehold } from "@/contexts/HouseholdContext";
import { useToast } from "@/hooks/use-toast";
import { getHouseholds } from "@/services/service-factory";
import { UserRole } from "@/types/auth";
import { HouseholdMember } from "@/types/household";
import { Shield, User, UserMinus } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

const HouseholdMembers: React.FC = () => {
  const [searchParams] = useSearchParams();
  const householdId = searchParams.get("id");
  const { households, refreshHouseholds } = useHousehold();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [members, setMembers] = useState<HouseholdMember[]>([]);
  const household = households.find((h) => h.id === householdId);

  useEffect(() => {
    if (householdId) {
      loadMembers();
    }
  }, [householdId]);

  const loadMembers = async () => {
    if (!householdId) return;
    setIsLoading(true);
    try {
      const response = await getHouseholds().getHouseholdDetails(householdId);
      setMembers(response.members);
    } catch (error) {
      toast({
        title: "Error loading members",
        description: error instanceof Error ? error.message : "Failed to load household members.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateRole = async (memberId: string, role: UserRole) => {
    if (!householdId) return;
    setIsLoading(true);
    try {
      await getHouseholds().updateMemberRole(householdId, memberId, { role });
      await loadMembers();
      toast({
        title: "Role updated",
        description: "Member role has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error updating role",
        description: error instanceof Error ? error.message : "Failed to update member role.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!householdId) return;
    setIsLoading(true);
    try {
      await getHouseholds().removeMember(householdId, memberId);
      await loadMembers();
      toast({
        title: "Member removed",
        description: "Member has been removed from the household.",
      });
    } catch (error) {
      toast({
        title: "Error removing member",
        description: error instanceof Error ? error.message : "Failed to remove member.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!household || isLoading) {
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
          <User className="h-8 w-8" />
          <div>
            <h1 className="text-2xl font-bold">Household Members</h1>
            <p className="text-muted-foreground">Manage members and their roles in {household.name}</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Members</CardTitle>
            <CardDescription>Manage household members and their permissions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {members.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <Avatar>
                      <AvatarImage src={member.avatar} />
                      <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{member.name}</p>
                      <p className="text-sm text-muted-foreground">{member.email}</p>
                    </div>
                    <Badge variant="outline" className="ml-2">
                      {member.role}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select
                      defaultValue={member.role}
                      onValueChange={(value) => handleUpdateRole(member.id, value as UserRole)}
                      disabled={member.id === household.admin_id}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ADMIN">
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4" />
                            Admin
                          </div>
                        </SelectItem>
                        <SelectItem value="MEMBER">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Member
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>

                    {member.id !== household.admin_id && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="icon">
                            <UserMinus className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remove member?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will remove {member.name} from the household. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleRemoveMember(member.id)} className="bg-destructive">
                              Remove Member
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
};

export default HouseholdMembers;
