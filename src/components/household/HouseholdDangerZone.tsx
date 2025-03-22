import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useHousehold } from "@/contexts/HouseholdContext";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, LogOut, Trash2 } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const HouseholdDangerZone = () => {
  const { currentHousehold, leaveHousehold, deleteHousehold } = useHousehold();
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();

  if (!currentHousehold) return null;

  const handleLeaveHousehold = async () => {
    try {
      await leaveHousehold();
      toast({
        title: "Left Household",
        description: `You have successfully left ${currentHousehold.name}`,
      });
      navigate("/dashboard");
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to leave household",
        variant: "destructive",
      });
    }
    setIsLeaveDialogOpen(false);
  };

  const handleDeleteHousehold = async () => {
    if (confirmText.toLowerCase() !== currentHousehold.name.toLowerCase()) {
      toast({
        title: "Confirmation Failed",
        description: "Please type the household name exactly to confirm deletion",
        variant: "destructive",
      });
      return;
    }

    try {
      await deleteHousehold();
      toast({
        title: "Household Deleted",
        description: `${currentHousehold.name} has been permanently deleted`,
        variant: "destructive",
      });
      navigate("/dashboard");
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete household",
        variant: "destructive",
      });
    }
    setIsDeleteDialogOpen(false);
  };

  return (
    <Card className="border-destructive/20">
      <CardHeader>
        <CardTitle className="text-destructive flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Danger Zone
        </CardTitle>
        <CardDescription>These actions are irreversible and should be used with caution</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Leave Household */}
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="space-y-1">
            <h4 className="text-sm font-medium">Leave Household</h4>
            <p className="text-sm text-muted-foreground">
              Remove yourself from this household. You will lose access to all resources.
            </p>
          </div>
          <Dialog open={isLeaveDialogOpen} onOpenChange={setIsLeaveDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-destructive/50 hover:bg-destructive/10">
                <LogOut className="mr-2 h-4 w-4" />
                Leave
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Leave Household</DialogTitle>
                <DialogDescription>
                  Are you sure you want to leave {currentHousehold.name}? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsLeaveDialogOpen(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleLeaveHousehold}>
                  Leave Household
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Delete Household - Only shown to admins */}
        {currentHousehold.role === "admin" && (
          <div className="flex items-center justify-between rounded-lg border border-destructive/50 p-4">
            <div className="space-y-1">
              <h4 className="text-sm font-medium">Delete Household</h4>
              <p className="text-sm text-muted-foreground">
                Permanently delete this household and all its data. This action cannot be undone.
              </p>
            </div>
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete Household</DialogTitle>
                  <DialogDescription>
                    This action cannot be undone. This will permanently delete the household{" "}
                    <strong>{currentHousehold.name}</strong> and remove all associated data.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="confirm">
                      Please type <strong>{currentHousehold.name}</strong> to confirm
                    </Label>
                    <Input
                      id="confirm"
                      value={confirmText}
                      onChange={(e) => setConfirmText(e.target.value)}
                      placeholder="Enter household name"
                      className="border-destructive/50"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button variant="destructive" onClick={handleDeleteHousehold}>
                    Delete Household
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default HouseholdDangerZone;
