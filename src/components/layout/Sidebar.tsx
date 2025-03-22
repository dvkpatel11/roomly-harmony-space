import AnimatedLogo from "@/components/ui/AnimatedLogo";
import { cn } from "@/lib/utils";
import {
  CalendarClockIcon,
  CheckSquareIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  HomeIcon,
  MessageCircleIcon,
  UsersIcon,
} from "lucide-react";
import { useState } from "react";
import { NavLink } from "react-router-dom";

export const navItems = [
  { href: "/dashboard", icon: HomeIcon, label: "Home" },
  { href: "/tasks", icon: CheckSquareIcon, label: "Tasks" },
  { href: "/household", icon: UsersIcon, label: "Household" },
  { href: "/calendar", icon: CalendarClockIcon, label: "Calendar" },
  { href: "/chat", icon: MessageCircleIcon, label: "Chat" },
];

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div
      className={cn(
        "hidden md:flex flex-col border-r transition-all duration-300",
        isCollapsed ? "md:w-[68px]" : "md:w-60 xl:w-72"
      )}
    >
      <div className="flex h-full max-h-screen flex-col">
        <div className="flex h-16 items-center border-b px-4">
          <NavLink
            to="/dashboard"
            className={cn("flex items-center gap-2 font-semibold", isCollapsed ? "justify-center w-full" : "flex-1")}
          >
            <AnimatedLogo className="h-6 w-6" showText={!isCollapsed} />
          </NavLink>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden md:block p-2 rounded-lg hover:bg-primary/10 transition-colors"
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? <ChevronRightIcon className="h-4 w-4" /> : <ChevronLeftIcon className="h-4 w-4" />}
          </button>
        </div>
        <div className="flex-1 overflow-auto py-2">
          <nav className="grid items-start px-2 text-sm font-medium">
            {navItems.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:bg-primary/10",
                    isActive ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground",
                    isCollapsed && "justify-center px-2"
                  )
                }
                title={isCollapsed ? item.label : undefined}
              >
                <item.icon className="h-5 w-5" />
                {!isCollapsed && <span>{item.label}</span>}
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="border-t p-4">
          <div className={cn("flex h-5 items-center text-xs text-muted-foreground", isCollapsed && "justify-center")}>
            <span>v0.1.0</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
