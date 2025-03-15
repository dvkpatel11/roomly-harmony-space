
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, CheckSquare, Users, Calendar, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { name: 'Home', path: '/dashboard', icon: Home },
  { name: 'Tasks', path: '/tasks', icon: CheckSquare },
  { name: 'Household', path: '/household', icon: Users },
  { name: 'Calendar', path: '/calendar', icon: Calendar },
  { name: 'Profile', path: '/profile', icon: User },
];

const MobileNav: React.FC = () => {
  const location = useLocation();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50">
      <div className="grid grid-cols-5 h-16">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.name}
              to={item.path}
              className={cn(
                'flex flex-col items-center justify-center space-y-1 transition-all',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <item.icon size={isActive ? 20 : 18} className="transition-all" />
              <span className="text-xs font-medium">{item.name}</span>
              
              {/* Active indicator dot */}
              {isActive && (
                <div className="absolute top-3 w-1 h-1 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default MobileNav;
