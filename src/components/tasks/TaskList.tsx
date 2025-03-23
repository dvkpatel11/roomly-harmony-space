import { Task, UpdateTaskRequest } from "@/types/task";
import { TaskItem } from "./TaskItem";

interface TaskListProps {
  tasks: Task[];
  onTaskComplete: (taskId: string) => Promise<void>;
  onTaskDelete: (taskId: string) => Promise<void>;
  onTaskUpdate: (taskId: string, updates: UpdateTaskRequest) => Promise<void>;
  onTaskSwap: (taskId: string, newAssigneeId: string) => Promise<void>;
  className?: string;
}

export function TaskList({ tasks, onTaskComplete, onTaskDelete, onTaskUpdate, onTaskSwap, className }: TaskListProps) {
  return (
    <div className={`space-y-4 ${className || ""}`}>
      {tasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          onComplete={onTaskComplete}
          onDelete={onTaskDelete}
          onUpdate={() => onTaskUpdate(task.id, {})}
          onSwap={onTaskSwap}
        />
      ))}
    </div>
  );
}
