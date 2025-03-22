import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useHousehold } from "@/contexts/HouseholdContext";
import { useToast } from "@/hooks/use-toast";
import { getHouseholds } from "@/services/service-factory";
import { UserRole } from "@/types/auth";
import { HouseholdMember } from "@/types/household";
import { Shield, User } from "lucide-react";
import React, { useEffect, useState } from "react";

export const HouseholdMembers: React.FC = () => {
  const { currentHousehold, refreshHouseholds } = useHousehold();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [members, setMembers] = useState<HouseholdMember[]>([]);

  useEffect(() => {
    if (currentHousehold) {
      loadMembers();
    }
  }, [currentHousehold?.id]);

  const loadMembers = async () => {
    if (!currentHousehold) return;
    setIsLoading(true);
    try {
      const response = await getHouseholds().getHouseholdDetails(currentHousehold.id);
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
    if (!currentHousehold) return;
    setIsLoading(true);
    try {
      await getHouseholds().updateMemberRole(currentHousehold.id, memberId, { role });
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

  if (!currentHousehold) return null;

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
              {currentHousehold.role === "admin" && member.id !== currentHousehold.admin_id && (
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
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
