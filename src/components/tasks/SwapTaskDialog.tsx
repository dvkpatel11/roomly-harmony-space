import { useHouseholdMembers } from "@/hooks/use-household-members";
import { Task } from "@/types/task";
import { useState } from "react";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

interface SwapTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task;
  onSwapComplete: (newAssigneeId: string) => void;
}

export function SwapTaskDialog({ open, onOpenChange, task, onSwapComplete }: SwapTaskDialogProps) {
  const { members, loading, error } = useHouseholdMembers(task.household_id);
  const [selectedMemberId, setSelectedMemberId] = useState<string>("");

  const handleSwap = async () => {
    if (!selectedMemberId) return;

    try {
      await onSwapComplete(selectedMemberId);
      onOpenChange(false);
      setSelectedMemberId("");
    } catch (err) {
      console.error("Failed to swap task:", err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Swap Task Assignee</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Select a new assignee for the task "{task.title}"</p>
          {error ? (
            <p className="text-sm text-red-500">{error}</p>
          ) : (
            <Select value={selectedMemberId} onValueChange={setSelectedMemberId} disabled={loading}>
              <SelectTrigger>
                <SelectValue placeholder={loading ? "Loading members..." : "Select member"} />
              </SelectTrigger>
              <SelectContent>
                {members
                  .filter((member) => member.id !== task.assigned_to)
                  .map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name || member.email}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          )}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSwap} disabled={!selectedMemberId || loading}>
            Swap Task
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
