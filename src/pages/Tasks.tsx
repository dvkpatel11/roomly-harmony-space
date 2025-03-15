
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CheckCheck, Calendar, Clock, Filter, Plus, Search, MoreHorizontal } from 'lucide-react';
import PageTransition from '@/components/layout/PageTransition';

const initialTasks = [
  { id: 1, title: 'Take out trash', assigned: 'Jane Doe', assignedId: 1, due: 'Today, 7:00 PM', completed: false, recurring: 'Daily', priority: 'High' },
  { id: 2, title: 'Clean bathroom', assigned: 'John Smith', assignedId: 2, due: 'Tomorrow', completed: false, recurring: 'Weekly', priority: 'Medium' },
  { id: 3, title: 'Buy groceries', assigned: 'Emma Wilson', assignedId: 3, due: 'Friday', completed: true, recurring: 'As needed', priority: 'Medium' },
  { id: 4, title: 'Vacuum living room', assigned: 'Jane Doe', assignedId: 1, due: 'Saturday', completed: false, recurring: 'Weekly', priority: 'Low' },
  { id: 5, title: 'Water plants', assigned: 'John Smith', assignedId: 2, due: 'Today', completed: false, recurring: 'Every 3 days', priority: 'Medium' },
  { id: 6, title: 'Pay electricity bill', assigned: 'Emma Wilson', assignedId: 3, due: 'Aug 15', completed: false, recurring: 'Monthly', priority: 'High' },
  { id: 7, title: 'Fix kitchen cabinet', assigned: 'Jane Doe', assignedId: 1, due: 'Next week', completed: false, recurring: 'One-time', priority: 'Low' },
];

const users = [
  { id: 1, name: 'Jane Doe', avatar: '/placeholder.svg', initials: 'JD' },
  { id: 2, name: 'John Smith', avatar: '/placeholder.svg', initials: 'JS' },
  { id: 3, name: 'Emma Wilson', avatar: '/placeholder.svg', initials: 'EW' },
];

const Tasks: React.FC = () => {
  const [tasks, setTasks] = useState(initialTasks);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState('all');
  
  const filteredTasks = tasks.filter(task => {
    // Apply search filter
    if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    // Apply tab filter
    if (selectedTab === 'completed' && !task.completed) return false;
    if (selectedTab === 'active' && task.completed) return false;
    
    return true;
  });
  
  const toggleTaskCompletion = (taskId: number) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, completed: !task.completed } : task
    ));
  };

  return (
    <PageTransition>
      <div className="p-6 md:p-8 pb-20 md:pb-8 max-w-7xl mx-auto">
        {/* Tasks Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
            <p className="text-muted-foreground mt-1">Manage your household tasks</p>
          </div>
          
          <Button>
            <Plus size={16} className="mr-2" />
            New Task
          </Button>
        </div>
        
        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2 ml-auto">
            <Button variant="outline" size="icon">
              <Filter size={16} />
            </Button>
          </div>
        </div>
        
        {/* Task Tabs */}
        <Tabs defaultValue="all" className="mb-6" onValueChange={setSelectedTab}>
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
              {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''} {selectedTab !== 'all' ? `(${selectedTab})` : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredTasks.length > 0 ? (
                filteredTasks.map((task, index) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className={`flex items-center justify-between p-4 rounded-lg border ${
                      task.completed ? 'bg-secondary/50 border-border/50' : 'bg-background border-border'
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <button
                        onClick={() => toggleTaskCompletion(task.id)}
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          task.completed 
                            ? 'border-primary bg-primary/10 text-primary' 
                            : 'border-muted-foreground'
                        }`}
                      >
                        {task.completed && <CheckCheck size={12} />}
                      </button>
                      
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium truncate ${task.completed ? 'text-muted-foreground line-through' : ''}`}>
                          {task.title}
                        </p>
                        
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            task.priority === 'High' 
                              ? 'bg-red-100 text-red-800' 
                              : task.priority === 'Medium'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-green-100 text-green-800'
                          }`}>
                            {task.priority}
                          </span>
                          
                          <span className="text-xs text-muted-foreground">
                            {task.recurring}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-sm text-muted-foreground hidden sm:flex items-center gap-1">
                        <Clock size={14} />
                        <span>{task.due}</span>
                      </div>
                      
                      <Avatar className="h-8 w-8">
                        <AvatarImage src="/placeholder.svg" />
                        <AvatarFallback>
                          {users.find(u => u.id === task.assignedId)?.initials || '??'}
                        </AvatarFallback>
                      </Avatar>
                      
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal size={16} />
                      </Button>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="py-8 text-center">
                  <CheckCheck size={40} className="mx-auto text-muted-foreground mb-3" />
                  <p className="text-lg font-medium">No tasks found</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    {searchQuery ? 'Try a different search term' : 'Create your first task to get started'}
                  </p>
                  <Button>
                    <Plus size={16} className="mr-2" />
                    Add a task
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
};

export default Tasks;
