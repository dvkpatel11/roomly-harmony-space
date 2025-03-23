import { cn } from "@/lib/utils";
import { Task } from "@/types/task";
import { formatDistanceToNow } from "date-fns";
import { CheckCircle2, Clock, MoreVertical, RefreshCcw, UserPlus } from "lucide-react";
import { useState } from "react";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { SwapTaskDialog } from "./SwapTaskDialog";
import { UpdateTaskDialog } from "./UpdateTaskDialog";

interface TaskItemProps {
  task: Task;
  onComplete: (taskId: string) => void;
  onDelete: (taskId: string) => void;
  onUpdate: () => void;
  onSwap: (taskId: string, newAssigneeId: string) => void;
  className?: string;
}

export function TaskItem({ task, onComplete, onDelete, onUpdate, onSwap, className }: TaskItemProps) {
  const [isSwapDialogOpen, setIsSwapDialogOpen] = useState(false);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);

  const handleComplete = async () => {
    await onComplete(task.id);
  };

  const handleDelete = async () => {
    try {
      await onDelete(task.id);
    } catch (err) {
      console.error("Failed to delete task:", err);
    }
  };

  const getStatusColor = () => {
    switch (task.status) {
      case "completed":
        return "text-green-500";
      case "overdue":
        return "text-red-500";
      default:
        return "text-yellow-500";
    }
  };

  const getFrequencyIcon = () => {
    switch (task.frequency) {
      case "daily":
        return <RefreshCcw className="h-4 w-4" />;
      case "weekly":
        return <RefreshCcw className="h-4 w-4" />;
      case "monthly":
        return <RefreshCcw className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <Card className={cn("relative", className)}>
      <CardContent className="flex items-center gap-4 p-4">
        {task.status !== "completed" && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "shrink-0 hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-950 transition-colors",
                    getStatusColor()
                  )}
                  onClick={handleComplete}
                >
                  <CheckCircle2 className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Mark as completed</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        {task.status === "completed" && (
          <div className="w-9 h-9 flex items-center justify-center">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          </div>
        )}
        <div className="flex-grow min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-medium truncate">{task.title}</h3>
            {getFrequencyIcon()}
          </div>
          {task.description && <p className="text-sm text-muted-foreground truncate">{task.description}</p>}
          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>
                {task.due_date ? formatDistanceToNow(new Date(task.due_date), { addSuffix: true }) : "No due date"}
              </span>
            </div>
            {task.assigned_to_name && (
              <div className="flex items-center gap-1">
                <UserPlus className="h-4 w-4" />
                <span>{task.assigned_to_name}</span>
              </div>
            )}
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setIsUpdateDialogOpen(true)}>Edit</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setIsSwapDialogOpen(true)}>Swap Assignee</DropdownMenuItem>
            <DropdownMenuItem onClick={handleDelete} className="text-red-500">
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardContent>

      <SwapTaskDialog
        open={isSwapDialogOpen}
        onOpenChange={setIsSwapDialogOpen}
        task={task}
        onSwapComplete={async (newAssigneeId: string) => {
          await onSwap(task.id, newAssigneeId);
          onUpdate();
        }}
      />

      <UpdateTaskDialog
        open={isUpdateDialogOpen}
        onOpenChange={setIsUpdateDialogOpen}
        task={task}
        onTaskUpdated={async (taskId: string, updates: any) => {
          await onUpdate();
        }}
      />
    </Card>
  );
}
