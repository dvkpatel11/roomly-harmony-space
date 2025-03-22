import PageTransition from "@/components/layout/PageTransition";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useHousehold } from "@/contexts/HouseholdContext";
import { useToast } from "@/hooks/use-toast";
import { getHouseholds } from "@/services/service-factory";
import { Copy, Mail, RefreshCw } from "lucide-react";
import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";

const HouseholdInvites: React.FC = () => {
  const [searchParams] = useSearchParams();
  const householdId = searchParams.get("id");
  const { households } = useHousehold();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [inviteCode, setInviteCode] = useState<string>("");
  const household = households.find((h) => h.id === householdId);

  const handleGenerateInvite = async () => {
    if (!householdId) return;
    setIsLoading(true);
    try {
      const response = await getHouseholds().generateInvitationCode(householdId);
      setInviteCode(response.invitation_code);
      toast({
        title: "Invite code generated",
        description: "New invitation code has been generated successfully.",
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

  const handleCopyInvite = async () => {
    if (!inviteCode) return;
    try {
      await navigator.clipboard.writeText(inviteCode);
      toast({
        title: "Copied to clipboard",
        description: "Invitation code has been copied to your clipboard.",
      });
    } catch (error) {
      toast({
        title: "Error copying code",
        description: "Failed to copy invitation code to clipboard.",
        variant: "destructive",
      });
    }
  };

  const handleEmailInvite = () => {
    if (!inviteCode || !household) return;
    const subject = encodeURIComponent(`Join ${household.name} on Roomly`);
    const body = encodeURIComponent(
      `You've been invited to join ${household.name} on Roomly!\n\nUse this invitation code to join: ${inviteCode}\n\nJoin now at: ${window.location.origin}/household/select`
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
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
          <Mail className="h-8 w-8" />
          <div>
            <h1 className="text-2xl font-bold">Household Invites</h1>
            <p className="text-muted-foreground">Generate and manage invitation codes for {household.name}</p>
          </div>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Generate Invite Code</CardTitle>
              <CardDescription>Create a new invitation code to add members to your household</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <Button onClick={handleGenerateInvite} className="gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Generate New Code
                </Button>
              </div>

              {inviteCode && (
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Input value={inviteCode} readOnly className="font-mono" />
                    <Button onClick={handleCopyInvite} variant="outline" className="gap-2">
                      <Copy className="h-4 w-4" />
                      Copy
                    </Button>
                  </div>
                  <Button onClick={handleEmailInvite} variant="secondary" className="w-full gap-2">
                    <Mail className="h-4 w-4" />
                    Send via Email
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Invitation Guidelines</CardTitle>
              <CardDescription>Important information about inviting members</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Each invitation code can only be used once</li>
                <li>Codes expire after 24 hours for security</li>
                <li>New members will join with basic member permissions</li>
                <li>You can manage member roles after they join</li>
                <li>Only household admins can generate invitation codes</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageTransition>
  );
};

export default HouseholdInvites;
