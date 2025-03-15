
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, CheckSquare, Users, Calendar, Settings, ChevronLeft, ChevronRight, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import AnimatedLogo from '../ui/AnimatedLogo';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const navItems = [
  { name: 'Dashboard', path: '/dashboard', icon: Home },
  { name: 'Tasks', path: '/tasks', icon: CheckSquare },
  { name: 'Household', path: '/household', icon: Users },
  { name: 'Calendar', path: '/calendar', icon: Calendar },
  { name: 'Settings', path: '/settings', icon: Settings },
];

interface SidebarProps {
  className?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ className }) => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  
  const toggleCollapsed = () => {
    setCollapsed(!collapsed);
  };

  return (
    <div
      className={cn(
        'h-screen flex flex-col border-r border-border bg-sidebar transition-all duration-300 ease-in-out',
        collapsed ? 'w-[70px]' : 'w-[240px]',
        className
      )}
    >
      {/* Logo */}
      <div className="p-4 flex items-center justify-between border-b border-border">
        <AnimatedLogo showText={!collapsed} size="md" />
        
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleCollapsed}
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </Button>
      </div>
      
      {/* Navigation Links */}
      <div className="flex-1 py-4 overflow-y-auto">
        <TooltipProvider delayDuration={100}>
          <nav className="space-y-1 px-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              
              return (
                <Tooltip key={item.name}>
                  <TooltipTrigger asChild>
                    <Link
                      to={item.path}
                      className={cn(
                        'flex items-center px-3 py-2 rounded-md text-sm font-medium transition-all duration-200',
                        isActive
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                      )}
                    >
                      <item.icon size={18} className={cn('flex-shrink-0', collapsed ? 'mx-auto' : 'mr-3')} />
                      {!collapsed && <span>{item.name}</span>}
                    </Link>
                  </TooltipTrigger>
                  {collapsed && (
                    <TooltipContent side="right">
                      {item.name}
                    </TooltipContent>
                  )}
                </Tooltip>
              );
            })}
          </nav>
        </TooltipProvider>
      </div>
      
      {/* User Profile */}
      <div className="p-4 border-t border-border">
        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                to="/profile"
                className="flex items-center gap-3 p-2 rounded-md hover:bg-secondary transition-colors"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/placeholder.svg" />
                  <AvatarFallback>JD</AvatarFallback>
                </Avatar>
                
                {!collapsed && (
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">Jane Doe</p>
                    <p className="text-xs text-muted-foreground truncate">jane@example.com</p>
                  </div>
                )}
              </Link>
            </TooltipTrigger>
            {collapsed && (
              <TooltipContent side="right">Profile</TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
        
        {!collapsed && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="mt-2 w-full text-muted-foreground justify-start"
          >
            <LogOut size={16} className="mr-2" />
            Log out
          </Button>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
