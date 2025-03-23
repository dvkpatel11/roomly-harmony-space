import { CreateTaskRequest, Task, TaskFrequency, TaskStatus, UpdateTaskRequest } from "@/types/task";
import { useCallback, useEffect, useRef, useState } from "react";
import { useServiceFactory } from "./use-service-factory";

interface UseTasksOptions {
  status?: TaskStatus;
  frequency?: TaskFrequency;
  assignedTo?: string;
  page?: number;
  perPage?: number;
  includeCompleted?: boolean;
}

export function useTasks(householdId: string, options: UseTasksOptions = {}) {
  const { getTaskService } = useServiceFactory();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const mounted = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const loadTasks = useCallback(async () => {
    if (!mounted.current) return;
    try {
      setLoading(true);
      const response = await getTaskService().getTasks(householdId, {
        status: options.status,
        frequency: options.frequency,
        assignedTo: options.assignedTo,
        page: options.page,
        per_page: options.perPage,
        include_completed: options.includeCompleted,
      });
      if (mounted.current) {
        setTasks(response.tasks);
        setTotalPages(Math.ceil(response.total / response.per_page));
        setError(null);
      }
    } catch (err) {
      console.error("Failed to load tasks:", err);
      if (mounted.current) {
        setError("Failed to load tasks");
      }
    } finally {
      if (mounted.current) {
        setLoading(false);
      }
    }
  }, [
    householdId,
    options.status,
    options.frequency,
    options.assignedTo,
    options.page,
    options.perPage,
    options.includeCompleted,
    getTaskService,
  ]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadTasks();
    }, 0);
    return () => clearTimeout(timeoutId);
  }, [loadTasks]);

  const createTask = useCallback(
    async (request: CreateTaskRequest) => {
      if (!mounted.current) return;
      try {
        await getTaskService().createTask(householdId, request);
        await loadTasks();
      } catch (err) {
        console.error("Failed to create task:", err);
        throw err;
      }
    },
    [getTaskService, householdId, loadTasks]
  );

  const completeTask = useCallback(
    async (taskId: string) => {
      if (!mounted.current) return;
      try {
        await getTaskService().completeTask(taskId);
        await loadTasks();
      } catch (err) {
        console.error("Failed to complete task:", err);
        throw err;
      }
    },
    [getTaskService, loadTasks]
  );

  const deleteTask = useCallback(
    async (taskId: string) => {
      if (!mounted.current) return;
      try {
        await getTaskService().deleteTask(taskId);
        await loadTasks();
      } catch (err) {
        console.error("Failed to delete task:", err);
        throw err;
      }
    },
    [getTaskService, loadTasks]
  );

  const swapTask = useCallback(
    async (taskId: string, newAssigneeId: string) => {
      if (!mounted.current) return;
      try {
        await getTaskService().swapTask(taskId, newAssigneeId);
        await loadTasks();
      } catch (err) {
        console.error("Failed to swap task:", err);
        throw err;
      }
    },
    [getTaskService, loadTasks]
  );

  const updateTask = useCallback(
    async (taskId: string, updates: UpdateTaskRequest) => {
      if (!mounted.current) return;
      try {
        await getTaskService().updateTask(taskId, updates);
        await loadTasks();
      } catch (err) {
        console.error("Failed to update task:", err);
        throw err;
      }
    },
    [getTaskService, loadTasks]
  );

  return {
    tasks,
    loading,
    error,
    totalPages,
    refresh: loadTasks,
    createTask,
    completeTask,
    deleteTask,
    swapTask,
    updateTask,
  };
}
