
import React, { useState } from 'react';
import { Bell, ChevronDown, House, Moon, Settings, Sun, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { mockAuth } from '@/mock';
import { mockHouseholds } from '@/mock';
import { mockNotifications } from '@/mock';

const Header: React.FC = () => {
  const { toast } = useToast();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [unreadCount, setUnreadCount] = useState<number>(3);
  const user = mockAuth.currentUser;
  const households = mockHouseholds.householdsList;
  const currentHousehold = mockHouseholds.currentHousehold;

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', newTheme);
    toast({
      title: `${newTheme.charAt(0).toUpperCase() + newTheme.slice(1)} mode activated`,
      duration: 1500,
    });
  };

  const showNotifications = () => {
    // Get unread notifications
    mockNotifications.getNotifications({ isRead: false }).then(response => {
      toast({
        title: 'Notifications',
        description: `You have ${response.data.length} unread notifications`,
      });
    });
  };

  return (
    <header className="sticky top-0 z-10 flex h-16 w-full items-center border-b border-border bg-background px-4 md:px-6">
      {/* Left side - Household Selector */}
      <div className="mr-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <House size={18} />
              <span className="hidden md:inline">{currentHousehold.name}</span>
              <ChevronDown size={16} className="opacity-70" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel>Your Households</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {households.map(household => (
              <DropdownMenuItem key={household.id} className="cursor-pointer">
                <div className="flex items-center gap-2">
                  <House size={16} />
                  <span>{household.name}</span>
                  {household.id === currentHousehold.id && (
                    <Badge variant="outline" className="ml-auto">Current</Badge>
                  )}
                </div>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer">
              <span className="text-primary">+ Create Household</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Spacer */}
      <div className="flex-1"></div>

      {/* Right side - Actions */}
      <div className="flex items-center gap-2">
        {/* Theme Toggle */}
        <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full">
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </Button>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative rounded-full" onClick={showNotifications}>
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive text-xs font-medium text-white">
              {unreadCount}
            </span>
          )}
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src="/placeholder.svg" alt={user.email} />
                <AvatarFallback>{user.email.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="cursor-pointer">
              <Link to="/profile" className="flex w-full items-center gap-2">
                <User size={16} />
                <span>Profile</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="cursor-pointer">
              <Link to="/settings" className="flex w-full items-center gap-2">
                <Settings size={16} />
                <span>Settings</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer text-destructive">
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default Header;
