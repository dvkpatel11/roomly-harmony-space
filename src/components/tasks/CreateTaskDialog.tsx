import { useTasks } from "@/hooks/use-tasks";
import { CreateTaskRequest } from "@/types/task";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Switch } from "../ui/switch";
import { Textarea } from "../ui/textarea";

interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTaskCreated: () => void;
  householdId: string;
}

const createTaskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  frequency: z.enum(["once", "daily", "weekly", "monthly"] as const),
  due_date: z.string().optional(),
  is_recurring: z.boolean().default(false),
  interval_days: z.number().optional(),
  end_date: z.string().optional(),
});

type CreateTaskFormData = z.infer<typeof createTaskSchema>;

export function CreateTaskDialog({ open, onOpenChange, onTaskCreated, householdId }: CreateTaskDialogProps) {
  const { createTask } = useTasks(householdId);
  const form = useForm<CreateTaskFormData>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      title: "",
      description: "",
      frequency: "once",
      is_recurring: false,
      interval_days: 7,
    },
  });

  const frequency = form.watch("frequency");
  const isRecurring = form.watch("is_recurring");

  const onSubmit = async (data: CreateTaskFormData) => {
    try {
      const request: CreateTaskRequest = {
        title: data.title,
        description: data.description || "",
        frequency: data.frequency,
        due_date: data.due_date,
        is_recurring: data.is_recurring,
        interval_days: data.interval_days,
        end_date: data.end_date,
      };

      await createTask(request);
      form.reset();
      onTaskCreated();
      onOpenChange(false);
    } catch (err) {
      console.error("Failed to create task:", err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="frequency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Frequency</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="once">One-time</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="due_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Due Date</FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input type="datetime-local" {...field} value={field.value || ""} className="pr-10" />
                    </FormControl>
                    <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            {frequency === "once" && (
              <>
                <FormField
                  control={form.control}
                  name="is_recurring"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Make Recurring</FormLabel>
                        <FormDescription>Set a custom interval for this task to repeat</FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                {isRecurring && (
                  <>
                    <FormField
                      control={form.control}
                      name="interval_days"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Repeat Every (Days)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={1}
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormDescription>Enter the number of days between repetitions</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}
              </>
            )}
            <FormField
              control={form.control}
              name="end_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>End Date (Optional)</FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input type="date" {...field} value={field.value || ""} className="pr-10" />
                    </FormControl>
                    <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  </div>
                  <FormDescription>Leave empty for no end date</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit">Create Task</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
