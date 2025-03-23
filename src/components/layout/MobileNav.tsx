import { cn } from "@/lib/utils";
import { NavLink } from "react-router-dom";
import { navItems } from "./Sidebar";

interface MobileNavProps {
  className?: string;
}

const MobileNav: React.FC<MobileNavProps> = ({ className }) => {
  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t bg-background px-4 md:hidden",
        className
      )}
    >
      {navItems.map((item) => (
        <NavLink
          key={item.href}
          to={item.href}
          className={({ isActive }) =>
            cn(
              "flex flex-col items-center gap-1 rounded-lg p-1.5 transition-all hover:bg-accent/50",
              isActive ? "text-accent-foreground" : "text-muted-foreground hover:text-foreground"
            )
          }
        >
          <item.icon className="h-5 w-5" />
          <span className="text-[10px] font-medium">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
};

export default MobileNav;
