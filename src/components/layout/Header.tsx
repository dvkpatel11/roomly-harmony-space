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
import { getAuth, getBadges, getNotifications } from "@/services/service-factory";
import { User as UserType } from "@/types/auth";
import { Badge as BadgeType } from "@/types/badge";
import { Award, Bell, ChevronDown, House, Moon, Settings, Sun, User } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const Header: React.FC = () => {
  const { toast } = useToast();
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [userBadges, setUserBadges] = useState<BadgeType[]>([]);
  const auth = getAuth();
  const isAuthenticated = auth.isAuthenticated();
  const [user, setUser] = useState<UserType | null>(null);
  const { households, currentHousehold, setCurrentHousehold } = useHousehold();

  useEffect(() => {
    if (!isAuthenticated) return;

    // Load user data
    auth
      .getCurrentUser()
      .then((user) => {
        if (user) setUser(user);
      })
      .catch(console.error);

    // Only fetch notifications and badges if a household is selected
    if (currentHousehold) {
      // Load initial unread notifications count
      getNotifications()
        .getNotifications({ is_read: false })
        .then((response) => {
          setUnreadCount(response.notifications.length);
        })
        .catch((error) => {
          // Don't show error in console to avoid cluttering
          if (error.message !== "No household selected") {
            console.error("Failed to fetch notifications:", error);
          }
        });

      // Load user badges
      getBadges()
        .getUserBadges()
        .then((badges) => {
          setUserBadges(badges);
        })
        .catch((error) => {
          // Don't show error in console to avoid cluttering
          if (error.message !== "No household selected") {
            console.error("Failed to fetch badges:", error);
          }
        });
    } else {
      // Reset counts if no household is selected
      setUnreadCount(0);
      setUserBadges([]);
    }
  }, [isAuthenticated, currentHousehold]);

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

  const showNotifications = () => {
    if (!currentHousehold) {
      toast({
        title: "No Household Selected",
        description: "Please select a household to view notifications",
        variant: "destructive",
      });
      return;
    }
    
    getNotifications()
      .getNotifications({ is_read: false })
      .then((response) => {
        toast({
          title: "Notifications",
          description: `You have ${response.notifications.length} unread notifications`,
        });
      })
      .catch((error) => {
        toast({
          title: "Error",
          description: error.message || "Failed to load notifications",
          variant: "destructive",
        });
      });
  };

  const handleHouseholdSelect = (household) => {
    setCurrentHousehold(household);
    toast({
      title: "Household Changed",
      description: `Switched to ${household.name}`,
      duration: 1500,
    });
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
      <header className="sticky top-0 z-10 flex h-16 w-full items-center border-b border-border bg-background px-4 md:px-6">
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
    <header className="sticky top-0 z-10 flex h-16 w-full items-center border-b border-border bg-background px-4 md:px-6">
      {/* Left side - Household Selector */}
      <div className="mr-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <House size={18} />
              <span className="hidden md:inline">{currentHousehold ? currentHousehold.name : "Select Household"}</span>
              <ChevronDown size={16} className="opacity-70" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel>Your Households</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {households.length > 0 ? (
              households.map((household) => (
                <DropdownMenuItem
                  key={household.id}
                  className="cursor-pointer"
                  onClick={() => handleHouseholdSelect(household)}
                >
                  <div className="flex items-center gap-2">
                    <House size={16} />
                    <span>{household.name}</span>
                    {currentHousehold && household.id === currentHousehold.id && (
                      <Badge variant="outline" className="ml-auto">
                        Current
                      </Badge>
                    )}
                  </div>
                </DropdownMenuItem>
              ))
            ) : (
              <DropdownMenuItem disabled>No households found</DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="cursor-pointer">
              <Link to="/household" className="text-primary">
                <span className="flex items-center w-full">+ Manage Households</span>
              </Link>
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
          {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
        </Button>

        {/* Badges - Only show if household is selected */}
        {currentHousehold && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative rounded-full">
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

        {/* Notifications - Only show if household is selected */}
        {currentHousehold && (
          <Button variant="ghost" size="icon" className="relative rounded-full" onClick={showNotifications}>
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
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src="/placeholder.svg" alt={user?.email} />
                <AvatarFallback>{user?.email ? user.email.substring(0, 2).toUpperCase() : "U"}</AvatarFallback>
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
