
import React, { useState } from 'react';
import PageTransition from '@/components/layout/PageTransition';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState, LoadingOverlay, ShimmerCard } from '@/components/ui/loading-states';
import { CheckCircle, Home, LayoutDashboard, ListChecks, Plus, Users } from 'lucide-react';
import { mockTasks, mockHouseholds } from '@/mock';
import { useToast } from '@/hooks/use-toast';

const Dashboard = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [tasksLoading, setTasksLoading] = useState(false);
  const currentHousehold = mockHouseholds.currentHousehold;
  const householdMembers = mockHouseholds.members;
  const [tasks, setTasks] = useState<any[]>([]);

  // Load tasks when component mounts
  React.useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    setTasksLoading(true);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      const response = await mockTasks.getTasks(currentHousehold.id, { status: 'incomplete' });
      setTasks(response.data);
    } catch (error) {
      console.error('Error loading tasks:', error);
      toast({
        title: 'Error',
        description: 'Failed to load tasks',
        variant: 'destructive',
      });
    } finally {
      setTasksLoading(false);
    }
  };

  const completeTask = async (taskId: string) => {
    setLoading(true);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 800));
      await mockTasks.completeTask(taskId);
      
      // Update local state
      setTasks(tasks.filter(task => task.id !== taskId));
      
      toast({
        title: 'Task completed',
        description: 'Your streak is growing!',
        variant: 'default',
      });
    } catch (error) {
      console.error('Error completing task:', error);
      toast({
        title: 'Error',
        description: 'Failed to complete task',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome to {currentHousehold.name}. Here's what's happening today.
            </p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Task
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
              <ListChecks className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tasks.length}</div>
              <p className="text-xs text-muted-foreground">
                +2 since yesterday
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Members</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{householdMembers.length}</div>
              <p className="text-xs text-muted-foreground">
                +1 since last week
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs text-muted-foreground">
                Great progress!
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Households</CardTitle>
              <Home className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockHouseholds.householdsList.length}</div>
              <p className="text-xs text-muted-foreground">
                Across {mockHouseholds.householdsList.length} locations
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Task List */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Your Tasks</CardTitle>
              <CardDescription>
                Tasks assigned to you in this household.
              </CardDescription>
            </CardHeader>
            <LoadingOverlay loading={tasksLoading}>
              <CardContent className="px-2">
                {tasks.length > 0 ? (
                  <div className="space-y-2">
                    {tasks.map((task) => (
                      <div
                        key={task.id}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">{task.title}</span>
                          <span className="text-sm text-muted-foreground">
                            Due {new Date(task.dueDate).toLocaleDateString()}
                          </span>
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => completeTask(task.id)}
                          disabled={loading}
                        >
                          Complete
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    title="No tasks"
                    description="You don't have any tasks assigned to you right now."
                    icon={<ListChecks className="h-8 w-8" />}
                    action={
                      <Button size="sm">
                        <Plus className="mr-2 h-4 w-4" />
                        Create Task
                      </Button>
                    }
                  />
                )}
              </CardContent>
            </LoadingOverlay>
            <CardFooter className="border-t px-6 py-4">
              <Button variant="outline" className="w-full">
                View All Tasks
              </Button>
            </CardFooter>
          </Card>

          {/* Activity Feed */}
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest updates in your household</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <ShimmerCard className="h-24" />
                <ShimmerCard className="h-24" />
                <ShimmerCard className="h-24" />
              </div>
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
              <Button variant="outline" className="w-full">
                View All Activity
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </PageTransition>
  );
};

export default Dashboard;
