import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useHousehold } from "@/hooks/use-household";
import { useHouseholdMembers } from "@/hooks/use-household-members";
import { useToast } from "@/hooks/use-toast";
import { UserRole } from "@/types/auth";
import { Shield, User } from "lucide-react";

interface HouseholdMembersProps {
  householdId: string;
}

export function HouseholdMembers({ householdId }: HouseholdMembersProps) {
  const { household, updateMemberRole } = useHousehold(householdId);
  const { members, loading, error, refresh } = useHouseholdMembers(householdId);
  const { toast } = useToast();

  const handleUpdateRole = async (memberId: string, role: UserRole) => {
    try {
      await updateMemberRole(memberId, { role });
      await refresh();
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
    }
  };

  if (error) {
    return (
      <div className="p-4 text-red-500">
        <p>{error}</p>
        <Button onClick={refresh} variant="outline" className="mt-2">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-4">
          <User className="h-8 w-8 text-primary" />
          <div>
            <CardTitle>Members</CardTitle>
            <CardDescription>Manage household members and their roles</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-20 animate-pulse bg-muted rounded-lg" />
              ))}
            </div>
          ) : (
            members.map((member) => (
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
                {household?.admin_id === member.id && member.id !== household.admin_id && (
                  <Select
                    defaultValue={member.role}
                    onValueChange={(value) => handleUpdateRole(member.id, value as UserRole)}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          Admin
                        </div>
                      </SelectItem>
                      <SelectItem value="member">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Member
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            ))
          )}
          {!loading && members.length === 0 && (
            <p className="text-center text-muted-foreground py-8">No members found</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
