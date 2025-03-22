import AnimatedLogo from "@/components/ui/AnimatedLogo";
import {
  BarChart3Icon,
  BellIcon,
  CalendarClockIcon,
  CheckSquareIcon,
  HomeIcon,
  SettingsIcon,
  UsersIcon,
} from "lucide-react";
import { NavLink } from "react-router-dom";

const navItems = [
  { href: "/dashboard", icon: HomeIcon, label: "Dashboard" },
  { href: "/tasks", icon: CheckSquareIcon, label: "Tasks" },
  { href: "/household", icon: UsersIcon, label: "Household" },
  { href: "/calendar", icon: CalendarClockIcon, label: "Calendar" },
  { href: "/analytics", icon: BarChart3Icon, label: "Analytics" },
  { href: "/notifications", icon: BellIcon, label: "Notifications" },
  { href: "/settings", icon: SettingsIcon, label: "Settings" },
];

const Sidebar = () => {
  return (
    <div className="hidden border-r lg:block lg:w-60 xl:w-72">
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-14 items-center border-b px-4">
          <NavLink to="/" className="flex items-center gap-2 font-semibold">
            <AnimatedLogo className="h-6 w-6" />
            <span>Roomies</span>
          </NavLink>
        </div>
        <div className="flex-1 overflow-auto py-2">
          <nav className="grid items-start px-2 text-sm font-medium">
            {navItems.map((item, index) => (
              <NavLink
                key={item.href}
                to={item.href}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${
                    isActive ? "bg-accent text-accent-foreground" : "hover:bg-accent/50 hover:text-accent-foreground"
                  }`
                }
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="mt-auto border-t p-4">
          <div className="flex h-5 items-center text-xs">
            <span className="text-muted-foreground">v0.1.0</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
