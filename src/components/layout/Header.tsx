import AnimatedLogo from "@/components/ui/AnimatedLogo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useHousehold } from "@/contexts/HouseholdContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { getAuth, getBadges, getNotifications } from "@/services/service-factory";
import { User as UserType } from "@/types/auth";
import { Badge as BadgeType } from "@/types/badge";
import { Award, Bell, ChevronDown, House, Moon, Plus, Settings, Sun, User } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

interface HeaderProps {
  className?: string;
}

const Header: React.FC<HeaderProps> = ({ className }) => {
  const { toast } = useToast();
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [userBadges, setUserBadges] = useState<BadgeType[]>([]);
  const auth = getAuth();
  const isAuthenticated = auth.isAuthenticated();
  const [user, setUser] = useState<UserType | null>(null);
  const { households, currentHousehold, setCurrentHousehold, requiresHousehold } = useHousehold();

  // Load user data - this doesn't depend on household
  useEffect(() => {
    if (!isAuthenticated) return;

    auth
      .getCurrentUser()
      .then((user) => {
        if (user) setUser(user);
      })
      .catch(console.error);
  }, [isAuthenticated]);

  // Load household-dependent data
  useEffect(() => {
    // Only fetch if we have a household and we're on a route that requires it
    if (!isAuthenticated || !currentHousehold || !requiresHousehold) {
      setUnreadCount(0);
      setUserBadges([]);
      return;
    }

    // Load notifications
    const fetchNotifications = async () => {
      try {
        const response = await getNotifications().getNotifications({ is_read: false });
        setUnreadCount(response.notifications.length);
      } catch (error) {
        // Only show error if it's not the "No household selected" error
        if (error instanceof Error && !error.message.includes("No household selected")) {
          console.error("Failed to fetch notifications:", error);
        }
      }
    };

    // Load badges
    const fetchBadges = async () => {
      try {
        const badges = await getBadges().getUserBadges();
        setUserBadges(badges);
      } catch (error) {
        // Only show error if it's not the "No household selected" error
        if (error instanceof Error && !error.message.includes("No household selected")) {
          console.error("Failed to fetch badges:", error);
        }
      }
    };

    fetchNotifications();
    fetchBadges();
  }, [isAuthenticated, currentHousehold, requiresHousehold]);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    document.documentElement.classList.toggle("dark");
    localStorage.setItem("theme", newTheme);
    toast({
      title: `${newTheme.charAt(0).toUpperCase() + newTheme.slice(1)} mode activated`,
      duration: 1500,
    });
  };

  const showNotifications = async () => {
    if (!currentHousehold) {
      toast({
        title: "No Household Selected",
        description: "Please select or create a household to view notifications.",
        variant: "default",
      });
      return;
    }

    try {
      const response = await getNotifications().getNotifications({ is_read: false });
      toast({
        title: "Notifications",
        description: `You have ${response.notifications.length} unread notifications`,
      });
    } catch (error) {
      if (error instanceof Error && !error.message.includes("No household selected")) {
        toast({
          title: "Error",
          description: "Failed to fetch notifications. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const handleHouseholdSelect = async (household) => {
    try {
      await setCurrentHousehold(household);
      toast({
        title: "Household Selected",
        description: `Switched to ${household.name}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to switch household",
        variant: "destructive",
      });
    }
  };

  const handleSignOut = async () => {
    try {
      await auth.logout();
      window.location.href = "/login";
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (!isAuthenticated) {
    return (
      <header
        className={cn("flex h-16 w-full items-center border-b border-border bg-background px-6 md:px-6", className)}
      >
        <div className="flex items-center gap-2">
          <AnimatedLogo className="h-6 w-6" showText={true} />
        </div>
        <div className="flex-1"></div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full">
            {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
          </Button>
        </div>
      </header>
    );
  }

  return (
    <header
      className={cn("flex h-16 w-full items-center border-b border-border bg-background px-6 md:px-6", className)}
    >
      {/* Logo - Only visible on mobile and tablet */}
      <div className="flex items-center gap-2 md:hidden mr-4">
        <AnimatedLogo className="h-6 w-6" showText={true} />
      </div>

      {/* Household Selector */}
      <div className={cn("flex items-center gap-4", !currentHousehold && "flex-1")}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="flex items-center gap-2 min-w-[160px] md:min-w-[200px] hover:bg-primary/10"
            >
              <House size={18} />
              <span className="flex-1 text-left truncate">
                {currentHousehold ? currentHousehold.name : "Select Household"}
              </span>
              <ChevronDown size={16} className="opacity-70 flex-shrink-0" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[280px]">
            <DropdownMenuLabel>Your Households</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {households.length > 0 ? (
              <>
                {households.map((household) => (
                  <DropdownMenuItem
                    key={household.id}
                    className="cursor-pointer hover:bg-primary/10"
                    onClick={() => handleHouseholdSelect(household)}
                  >
                    <div className="flex items-center gap-2 w-full">
                      <House size={16} className={household.role === "admin" ? "text-primary" : ""} />
                      <div className="flex-1 min-w-0">
                        <span className="block truncate">{household.name}</span>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {household.role === "admin" && (
                          <Badge variant="outline" className="ml-2">
                            Admin
                          </Badge>
                        )}
                        {currentHousehold && household.id === currentHousehold.id && (
                          <Badge variant="secondary">Current</Badge>
                        )}
                      </div>
                    </div>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
              </>
            ) : (
              <DropdownMenuItem disabled>No households yet</DropdownMenuItem>
            )}
            <Link to="/household/create" className="w-full">
              <DropdownMenuItem className="cursor-pointer text-primary hover:bg-primary/10">
                <div className="flex items-center gap-2 w-full">
                  <Plus size={16} />
                  Create New Household
                </div>
              </DropdownMenuItem>
            </Link>
            {currentHousehold && (
              <>
                <DropdownMenuSeparator />
                <Link to="/household" className="w-full">
                  <DropdownMenuItem className="cursor-pointer hover:bg-primary/10">
                    <div className="flex items-center gap-2 w-full">
                      <Settings size={16} />
                      Manage Household
                    </div>
                  </DropdownMenuItem>
                </Link>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Spacer */}
      <div className="flex-1"></div>

      {/* Right side - Actions */}
      <div className="flex items-center gap-2">
        {/* Theme Toggle */}
        <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full hover:bg-primary/10">
          {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
        </Button>

        {/* Badges - Only show if we have a household */}
        {currentHousehold && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative rounded-full hover:bg-primary/10">
                <Award size={20} />
                {userBadges.length > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                    {userBadges.length}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Your Badges</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {userBadges.length > 0 ? (
                userBadges.map((badge) => (
                  <DropdownMenuItem key={badge.id} className="flex items-center gap-2">
                    <Award size={16} className="text-primary" />
                    <div className="flex flex-col">
                      <span className="font-medium">{badge.name}</span>
                      <span className="text-xs text-muted-foreground">{badge.description}</span>
                    </div>
                  </DropdownMenuItem>
                ))
              ) : (
                <DropdownMenuItem disabled>No badges earned yet</DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/badges" className="flex w-full items-center">
                  View All Badges
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Notifications - Only show if we have a household */}
        {currentHousehold && (
          <Button
            variant="ghost"
            size="icon"
            className="relative rounded-full hover:bg-primary/10"
            onClick={showNotifications}
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive text-xs font-medium text-white">
                {unreadCount}
              </span>
            )}
          </Button>
        )}

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full hover:bg-primary/10">
              <Avatar className="h-8 w-8">
                <AvatarImage src="/placeholder.svg" alt={user?.email} />
                <AvatarFallback>{user?.email?.substring(0, 2).toUpperCase()}</AvatarFallback>
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
            <DropdownMenuItem className="cursor-pointer text-destructive" onClick={handleSignOut}>
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default Header;
