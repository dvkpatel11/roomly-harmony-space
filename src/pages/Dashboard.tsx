
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CheckCheck, Calendar, Clock, Bell, PlusCircle, ArrowRight } from 'lucide-react';
import PageTransition from '@/components/layout/PageTransition';

const users = [
  { id: 1, name: 'Jane Doe', avatar: '/placeholder.svg', initials: 'JD' },
  { id: 2, name: 'John Smith', avatar: '/placeholder.svg', initials: 'JS' },
  { id: 3, name: 'Emma Wilson', avatar: '/placeholder.svg', initials: 'EW' },
];

const tasks = [
  { id: 1, title: 'Take out trash', assigned: 'Jane Doe', due: '7:00 PM', completed: false },
  { id: 2, title: 'Clean bathroom', assigned: 'John Smith', due: 'Tomorrow', completed: false },
  { id: 3, title: 'Buy groceries', assigned: 'Emma Wilson', due: 'Friday', completed: true },
  { id: 4, title: 'Vacuum living room', assigned: 'Jane Doe', due: 'Saturday', completed: false },
];

const events = [
  { id: 1, title: 'House Meeting', date: 'Today, 8:00 PM' },
  { id: 2, title: 'Rent Due', date: 'Aug 1, 2023' },
  { id: 3, title: 'Game Night', date: 'Tomorrow, 7:00 PM' },
];

const Dashboard: React.FC = () => {
  const [currentHousehold, setCurrentHousehold] = useState('Main Apartment');

  return (
    <PageTransition>
      <div className="p-6 md:p-8 pb-20 md:pb-8 max-w-7xl mx-auto">
        {/* Dashboard Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Welcome back, Jane</h1>
            <p className="text-muted-foreground mt-1">Here's what's happening in your household</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="text-sm font-medium text-foreground flex items-center bg-secondary rounded-lg px-3 py-1.5">
              <span className="mr-2">{currentHousehold}</span>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <ArrowRight size={14} />
              </Button>
            </div>
            
            <Button>
              <PlusCircle size={16} className="mr-2" />
              New Task
            </Button>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Cards Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tasks Overview */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="space-y-1">
                  <CardTitle className="text-xl flex items-center">
                    <CheckCheck size={18} className="mr-2 text-primary" />
                    Tasks
                  </CardTitle>
                  <CardDescription>Manage your household tasks</CardDescription>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/tasks">View all</Link>
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tasks.map((task) => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        task.completed ? 'bg-secondary/50 border-border/50' : 'bg-background border-border'
                      }`}
                    >
                      <div className="flex items-center">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mr-3 ${
                          task.completed 
                            ? 'border-primary bg-primary/10 text-primary' 
                            : 'border-muted-foreground'
                        }`}>
                          {task.completed && <CheckCheck size={12} />}
                        </div>
                        <div>
                          <p className={`font-medium ${task.completed ? 'text-muted-foreground line-through' : ''}`}>
                            {task.title}
                          </p>
                          <p className="text-xs text-muted-foreground">{task.assigned}</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <span className="text-xs bg-secondary rounded-full px-2 py-1 flex items-center">
                          <Clock size={12} className="mr-1" />
                          {task.due}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Activity Feed */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="space-y-1">
                  <CardTitle className="text-xl">Recent Activity</CardTitle>
                  <CardDescription>Latest actions in your household</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { user: 'John', action: 'completed the task', object: 'Clean kitchen', time: '2 hours ago' },
                    { user: 'Emma', action: 'added a new event', object: 'Game night', time: '5 hours ago' },
                    { user: 'Jane', action: 'assigned', object: 'Buy groceries', user2: 'Emma', time: 'Yesterday' },
                  ].map((activity, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.1 }}
                      className="flex gap-3"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src="/placeholder.svg" />
                        <AvatarFallback>{activity.user.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm">
                          <span className="font-medium">{activity.user}</span>{' '}
                          <span className="text-muted-foreground">{activity.action}</span>{' '}
                          <span className="font-medium">{activity.object}</span>
                          {activity.user2 && (
                            <>
                              {' '}to <span className="font-medium">{activity.user2}</span>
                            </>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">{activity.time}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Cards */}
          <div className="space-y-6">
            {/* Household Members */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xl">Household Members</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {users.map((user, i) => (
                    <motion.div
                      key={user.id}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.1 }}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary transition-colors"
                    >
                      <Avatar>
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback>{user.initials}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium">{user.name}</p>
                      </div>
                    </motion.div>
                  ))}
                  <Button variant="outline" size="sm" className="w-full mt-2">
                    <PlusCircle size={16} className="mr-2" />
                    Invite Member
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Events */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="space-y-1">
                  <CardTitle className="text-xl flex items-center">
                    <Calendar size={18} className="mr-2 text-primary" />
                    Upcoming Events
                  </CardTitle>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/calendar">View all</Link>
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {events.map((event, i) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.1 }}
                      className="p-3 rounded-lg border border-border bg-background"
                    >
                      <p className="font-medium">{event.title}</p>
                      <p className="text-xs text-muted-foreground flex items-center mt-1">
                        <Clock size={12} className="mr-1" />
                        {event.date}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Notifications */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="space-y-1">
                  <CardTitle className="text-xl flex items-center">
                    <Bell size={18} className="mr-2 text-primary" />
                    Notifications
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { title: 'Your task is due today', description: 'Take out trash - 7:00 PM', isNew: true },
                    { title: 'Emma completed a task', description: 'Buy groceries was completed', isNew: false },
                    { title: 'New message from John', description: 'Are we still on for dinner?', isNew: false },
                  ].map((notification, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.1 }}
                      className={`p-3 rounded-lg border ${
                        notification.isNew 
                          ? 'border-primary/20 bg-primary/5' 
                          : 'border-border bg-background'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <p className="font-medium">{notification.title}</p>
                        {notification.isNew && (
                          <span className="bg-primary text-primary-foreground text-xs rounded-full px-2 py-0.5">New</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{notification.description}</p>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default Dashboard;
