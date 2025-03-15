
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, Save, CheckCircle, X, User, Bell, Shield, Lock } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import PageTransition from '@/components/layout/PageTransition';
import { useToast } from '@/components/ui/use-toast';

const Profile: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('account');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: 'Jane Doe',
    email: 'jane@example.com',
    phone: '(555) 123-4567',
    bio: 'I enjoy keeping our apartment tidy and organized!',
  });
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSave = () => {
    setIsEditing(false);
    toast({
      title: "Profile updated",
      description: "Your profile information has been saved.",
    });
  };

  return (
    <PageTransition>
      <div className="p-6 md:p-8 pb-20 md:pb-8 max-w-4xl mx-auto">
        {/* Profile Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Your Profile</h1>
          <p className="text-muted-foreground mt-1">Manage your account settings and preferences</p>
        </div>
        
        {/* Profile Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-3 w-full sm:w-auto">
            <TabsTrigger value="account" className="flex items-center gap-2">
              <User size={16} />
              <span className="hidden sm:inline">Account</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell size={16} />
              <span className="hidden sm:inline">Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield size={16} />
              <span className="hidden sm:inline">Security</span>
            </TabsTrigger>
          </TabsList>
          
          {/* Account Tab */}
          <TabsContent value="account" className="space-y-6">
            {/* Profile Card */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>Profile Information</CardTitle>
                    <CardDescription>Manage your personal information</CardDescription>
                  </div>
                  {!isEditing ? (
                    <Button onClick={() => setIsEditing(true)} variant="outline">Edit Profile</Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button onClick={() => setIsEditing(false)} variant="ghost" size="icon">
                        <X size={16} />
                      </Button>
                      <Button onClick={handleSave} variant="default" size="icon">
                        <Save size={16} />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Profile Photo */}
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                  <div className="relative">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src="/placeholder.svg" />
                      <AvatarFallback>JD</AvatarFallback>
                    </Avatar>
                    <Button 
                      variant="secondary" 
                      size="icon" 
                      className="absolute bottom-0 right-0 h-8 w-8 rounded-full"
                    >
                      <Camera size={14} />
                    </Button>
                  </div>
                  <div className="text-center sm:text-left">
                    <h3 className="text-xl font-semibold">{formData.name}</h3>
                    <p className="text-muted-foreground">Member since October 2023</p>
                  </div>
                </div>
                
                {/* Form Fields */}
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input 
                        id="name" 
                        name="name"
                        value={formData.name} 
                        onChange={handleInputChange}
                        disabled={!isEditing} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input 
                        id="email" 
                        name="email"
                        type="email" 
                        value={formData.email} 
                        onChange={handleInputChange}
                        disabled={!isEditing} 
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input 
                        id="phone" 
                        name="phone"
                        value={formData.phone} 
                        onChange={handleInputChange}
                        disabled={!isEditing} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bio">Short Bio</Label>
                      <Input 
                        id="bio" 
                        name="bio"
                        value={formData.bio} 
                        onChange={handleInputChange}
                        disabled={!isEditing} 
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <CardDescription>Last updated: July 26, 2023</CardDescription>
              </CardFooter>
            </Card>
            
            {/* Household Memberships */}
            <Card>
              <CardHeader>
                <CardTitle>Household Memberships</CardTitle>
                <CardDescription>Households you are a member of</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { name: 'Main Apartment', role: 'Admin', members: 3, active: true },
                    { name: 'Beach House', role: 'Member', members: 5, active: false },
                  ].map((household, i) => (
                    <div 
                      key={i} 
                      className="flex items-center justify-between p-4 rounded-lg border border-border"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{household.name}</h4>
                          {household.active && (
                            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full flex items-center gap-1">
                              <CheckCircle size={12} />
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {household.role} • {household.members} members
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        {household.active ? 'View' : 'Switch to'}
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">
                  Create New Household
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Manage how you receive notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {[
                  { title: 'Task Reminders', description: 'Get notified about upcoming and overdue tasks' },
                  { title: 'Task Assignments', description: 'Be notified when you are assigned to a task' },
                  { title: 'Household Updates', description: 'Receive updates about your household' },
                  { title: 'Calendar Events', description: 'Get reminders about upcoming events' },
                  { title: 'Poll Notifications', description: 'Be notified about new polls and votes' },
                ].map((notification, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="font-medium">{notification.title}</div>
                      <div className="text-sm text-muted-foreground">{notification.description}</div>
                    </div>
                    <Switch defaultChecked={i < 3} />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Password</CardTitle>
                <CardDescription>Change your password</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <Input type="password" id="current-password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input type="password" id="new-password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input type="password" id="confirm-password" />
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full">
                  <Lock size={16} className="mr-2" />
                  Update Password
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Two-Factor Authentication</CardTitle>
                <CardDescription>Add an extra layer of security to your account</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="font-medium">Enable Two-Factor Authentication</div>
                    <div className="text-sm text-muted-foreground">
                      Protect your account with an additional security layer
                    </div>
                  </div>
                  <Switch />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PageTransition>
  );
};

export default Profile;
