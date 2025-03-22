import PageTransition from "@/components/layout/PageTransition";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useHousehold } from "@/contexts/HouseholdContext";
import { Calendar, ListTodo, MessageSquare, Settings, Shield, User } from "lucide-react";
import React from "react";
import { useSearchParams } from "react-router-dom";

interface RolePermission {
  title: string;
  admin: string;
  member: string;
  icon: React.ReactNode;
}

const rolePermissions: RolePermission[] = [
  {
    title: "Household Management",
    admin: "Full control over household settings, including deletion",
    member: "View household details",
    icon: <Settings className="h-5 w-5" />,
  },
  {
    title: "Member Management",
    admin: "Invite members, manage roles, and remove members",
    member: "View member list",
    icon: <User className="h-5 w-5" />,
  },
  {
    title: "Task Management",
    admin: "Create, assign, and manage all tasks",
    member: "Create tasks, manage assigned tasks",
    icon: <ListTodo className="h-5 w-5" />,
  },
  {
    title: "Calendar",
    admin: "Create and manage all events",
    member: "Create events, manage own events",
    icon: <Calendar className="h-5 w-5" />,
  },
  {
    title: "Chat",
    admin: "Manage chat settings and moderate messages",
    member: "Send messages and participate in chats",
    icon: <MessageSquare className="h-5 w-5" />,
  },
];

const HouseholdRoles: React.FC = () => {
  const [searchParams] = useSearchParams();
  const householdId = searchParams.get("id");
  const { households } = useHousehold();
  const household = households.find((h) => h.id === householdId);

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
          <Shield className="h-8 w-8" />
          <div>
            <h1 className="text-2xl font-bold">Household Roles</h1>
            <p className="text-muted-foreground">Role permissions and capabilities in {household.name}</p>
          </div>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Role Overview</CardTitle>
              <CardDescription>Understanding the different roles and their capabilities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                {rolePermissions.map((permission, index) => (
                  <div key={index} className="grid gap-4">
                    <div className="flex items-center gap-2 font-medium">
                      {permission.icon}
                      {permission.title}
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Shield className="h-4 w-4" />
                            Admin
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground">{permission.admin}</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Member
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground">{permission.member}</p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Role Guidelines</CardTitle>
              <CardDescription>Important information about roles and permissions</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>The household creator is automatically assigned the Admin role</li>
                <li>New members join with the Member role by default</li>
                <li>Only Admins can change member roles</li>
                <li>At least one Admin must remain in the household</li>
                <li>Role changes take effect immediately</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageTransition>
  );
};

export default HouseholdRoles;
