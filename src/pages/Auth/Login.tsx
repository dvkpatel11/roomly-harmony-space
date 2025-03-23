import PageTransition from "@/components/layout/PageTransition";
import AnimatedLogo from "@/components/ui/AnimatedLogo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { getAuth } from "@/services/service-factory";
import { LoginRequest } from "@/types/auth";
import { motion } from "framer-motion";
import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes in milliseconds

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);
  const [validationErrors, setValidationErrors] = useState<{ email?: string; password?: string }>({});
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  // Check for redirect message (e.g., "Please log in to continue")
  useEffect(() => {
    const message = new URLSearchParams(location.search).get("message");
    if (message) {
      toast({
        title: "Authentication Required",
        description: message,
      });
    }
  }, [location]);

  // Load saved email if it exists
  useEffect(() => {
    const savedEmail = localStorage.getItem("rememberedEmail");
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  // Check if user is locked out
  useEffect(() => {
    const storedLockout = localStorage.getItem("loginLockout");
    if (storedLockout) {
      const lockoutTime = parseInt(storedLockout, 10);
      if (lockoutTime > Date.now()) {
        setLockoutUntil(lockoutTime);
      } else {
        localStorage.removeItem("loginLockout");
        localStorage.removeItem("loginAttempts");
      }
    }

    const storedAttempts = localStorage.getItem("loginAttempts");
    if (storedAttempts) {
      setLoginAttempts(parseInt(storedAttempts, 10));
    }
  }, []);

  const validateForm = (): boolean => {
    const errors: { email?: string; password?: string } = {};

    if (!email) {
      errors.email = "Email is required";
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email)) {
      errors.email = "Invalid email address";
    }

    if (!password) {
      errors.password = "Password is required";
    } else if (password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLoginFailure = () => {
    const newAttempts = loginAttempts + 1;
    setLoginAttempts(newAttempts);
    localStorage.setItem("loginAttempts", newAttempts.toString());

    if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
      const lockoutTime = Date.now() + LOCKOUT_DURATION;
      setLockoutUntil(lockoutTime);
      localStorage.setItem("loginLockout", lockoutTime.toString());
      toast({
        title: "Account Locked",
        description: "Too many failed attempts. Please try again in 15 minutes.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if user is locked out
    if (lockoutUntil && lockoutUntil > Date.now()) {
      const minutesLeft = Math.ceil((lockoutUntil - Date.now()) / (60 * 1000));
      toast({
        title: "Account Locked",
        description: `Please try again in ${minutesLeft} minutes.`,
        variant: "destructive",
      });
      return;
    }

    // Validate form
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const loginData: LoginRequest = {
        email: email.trim().toLowerCase(),
        password,
      };

      const response = await getAuth().login(loginData);

      // Reset login attempts on success
      setLoginAttempts(0);
      localStorage.removeItem("loginAttempts");
      localStorage.removeItem("loginLockout");

      // Handle remember me
      if (rememberMe) {
        localStorage.setItem("rememberedEmail", email);
      } else {
        localStorage.removeItem("rememberedEmail");
      }

      // If we get here, login was successful
      toast({
        title: "Logged in successfully",
        description: `Welcome back, ${response.user.first_name}!`,
      });

      // Redirect to the intended page or dashboard
      const redirectTo = new URLSearchParams(location.search).get("redirectTo");
      navigate(redirectTo || "/dashboard");
    } catch (error) {
      handleLoginFailure();
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Please check your credentials and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen flex flex-col items-center justify-center bg-background mx-auto">
        <div className="absolute top-6 left-6">
          <Link to="/">
            <AnimatedLogo size="md" />
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Card className="border-border/40 shadow-lg">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold text-center">Welcome back</CardTitle>
              <CardDescription className="text-center">Enter your credentials to access your account</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setValidationErrors({ ...validationErrors, email: undefined });
                    }}
                    required
                    className={`h-11 ${validationErrors.email ? "border-destructive" : ""}`}
                    aria-invalid={!!validationErrors.email}
                    aria-describedby={validationErrors.email ? "email-error" : undefined}
                  />
                  {validationErrors.email && (
                    <p id="email-error" className="text-sm text-destructive">
                      {validationErrors.email}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                      Forgot password?
                    </Link>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setValidationErrors({ ...validationErrors, password: undefined });
                    }}
                    required
                    className={`h-11 ${validationErrors.password ? "border-destructive" : ""}`}
                    aria-invalid={!!validationErrors.password}
                    aria-describedby={validationErrors.password ? "password-error" : undefined}
                  />
                  {validationErrors.password && (
                    <p id="password-error" className="text-sm text-destructive">
                      {validationErrors.password}
                    </p>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                  />
                  <Label htmlFor="remember" className="text-sm font-normal">
                    Remember me
                  </Label>
                </div>
                <Button
                  type="submit"
                  className="w-full h-11"
                  disabled={isLoading || (lockoutUntil !== null && lockoutUntil > Date.now())}
                >
                  {isLoading ? "Logging in..." : "Log in"}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <div className="text-sm text-muted-foreground text-center">
                Don't have an account?{" "}
                <Link to="/register" className="text-primary hover:underline">
                  Sign up
                </Link>
              </div>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    </PageTransition>
  );
};

export default Login;
