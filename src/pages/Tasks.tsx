import PageTransition from "@/components/layout/PageTransition";
import { CreateTaskDialog } from "@/components/tasks/CreateTaskDialog";
import { TaskList } from "@/components/tasks/TaskList";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useHousehold } from "@/contexts/HouseholdContext";
import { useTasks } from "@/hooks/use-tasks";
import { TaskFrequency, TaskStatus } from "@/types/task";
import { CheckCheck, Plus, Search } from "lucide-react";
import React, { useCallback, useMemo, useState } from "react";

const Tasks: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState<"all" | "active" | "completed">("all");
  const [frequency, setFrequency] = useState<TaskFrequency | "all">("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { currentHousehold } = useHousehold();

  // Convert UI status to API status
  const getApiStatus = useCallback((uiStatus: "all" | "active" | "completed"): TaskStatus | undefined => {
    switch (uiStatus) {
      case "completed":
        return "completed";
      case "active":
        return "pending";
      default:
        return undefined;
    }
  }, []);

  // Memoize task options to prevent unnecessary re-renders
  const taskOptions = useMemo(
    () => ({
      status: getApiStatus(selectedTab),
      frequency: frequency === "all" ? undefined : frequency,
      includeCompleted: selectedTab === "all",
    }),
    [selectedTab, frequency, getApiStatus]
  );

  const { tasks, loading, error, refresh, completeTask, deleteTask, updateTask, swapTask } = useTasks(
    currentHousehold?.id || "",
    taskOptions
  );

  // Handle task creation
  const handleCreateTask = async () => {
    setIsCreateDialogOpen(true);
  };

  // Handle task creation success
  const handleTaskCreated = async () => {
    setIsCreateDialogOpen(false);
    await refresh();
  };

  // Handle search input with debounce
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    // TODO: Add debounced API call for search
  };

  // Handle frequency change
  const handleFrequencyChange = (value: TaskFrequency | "all") => {
    setFrequency(value);
  };

  // Memoize task handlers to prevent unnecessary re-renders
  const taskHandlers = useMemo(
    () => ({
      onTaskComplete: completeTask,
      onTaskDelete: deleteTask,
      onTaskUpdate: updateTask,
      onTaskSwap: swapTask,
    }),
    [completeTask, deleteTask, updateTask, swapTask]
  );

  return (
    <PageTransition>
      <div className="max-w-7xl space-y-6">
        {/* Tasks Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Tasks</h1>
            <p className="text-muted-foreground mt-1">Manage your household tasks</p>
          </div>

          <Button onClick={handleCreateTask}>
            <Plus size={16} className="mr-2" />
            New Task
          </Button>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search tasks..." className="pl-9" value={searchQuery} onChange={handleSearchChange} />
          </div>

          <div className="flex gap-2 ml-auto">
            <Select value={frequency} onValueChange={handleFrequencyChange}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="once">One-time</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Task Tabs */}
        <Tabs defaultValue="all" onValueChange={(value) => setSelectedTab(value as "all" | "active" | "completed")}>
          <TabsList>
            <TabsTrigger value="all">All Tasks</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Task List */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Task List</CardTitle>
            <CardDescription>
              {tasks.length} task{tasks.length !== 1 ? "s" : ""} {selectedTab !== "all" ? `(${selectedTab})` : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <LoadingSpinner size="lg" />
              </div>
            ) : error ? (
              <div className="py-8 text-center text-destructive">
                <p>Error loading tasks: {error}</p>
                <Button variant="outline" onClick={refresh} className="mt-2">
                  Retry
                </Button>
              </div>
            ) : tasks.length > 0 ? (
              <TaskList tasks={tasks} {...taskHandlers} />
            ) : (
              <div className="py-8 text-center">
                <CheckCheck size={40} className="mx-auto text-muted-foreground mb-3" />
                <p className="text-lg font-medium">No tasks found</p>
                <p className="text-sm text-muted-foreground mb-4">
                  {searchQuery ? "Try a different search term" : "Create your first task to get started"}
                </p>
                <Button onClick={handleCreateTask}>
                  <Plus size={16} className="mr-2" />
                  Add a task
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create Task Dialog */}
        <CreateTaskDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          onTaskCreated={handleTaskCreated}
          householdId={currentHousehold?.id || ""}
        />
      </div>
    </PageTransition>
  );
};

export default Tasks;
