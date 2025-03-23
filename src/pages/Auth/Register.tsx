import PageTransition from "@/components/layout/PageTransition";
import AnimatedLogo from "@/components/ui/AnimatedLogo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { getAuth } from "@/services/service-factory";
import { RegisterRequest } from "@/types/auth";
import { motion } from "framer-motion";
import { Check, X } from "lucide-react";
import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

const PASSWORD_REQUIREMENTS = [
  { id: "length", label: "At least 8 characters long", regex: /.{8,}/ },
  { id: "uppercase", label: "Contains uppercase letter", regex: /[A-Z]/ },
  { id: "lowercase", label: "Contains lowercase letter", regex: /[a-z]/ },
  { id: "number", label: "Contains number", regex: /[0-9]/ },
  { id: "special", label: "Contains special character", regex: /[!@#$%^&*(),.?":{}|<>]/ },
];

const Register: React.FC = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{
    firstName?: string;
    lastName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const validateForm = (): boolean => {
    const errors: typeof validationErrors = {};

    // Validate first name
    if (!firstName.trim()) {
      errors.firstName = "First name is required";
    } else if (firstName.length > 50) {
      errors.firstName = "First name is too long";
    } else if (!/^[a-zA-Z\s-']+$/.test(firstName)) {
      errors.firstName = "First name contains invalid characters";
    }

    // Validate last name
    if (!lastName.trim()) {
      errors.lastName = "Last name is required";
    } else if (lastName.length > 50) {
      errors.lastName = "Last name is too long";
    } else if (!/^[a-zA-Z\s-']+$/.test(lastName)) {
      errors.lastName = "Last name contains invalid characters";
    }

    // Validate email
    if (!email) {
      errors.email = "Email is required";
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email)) {
      errors.email = "Invalid email address";
    }

    // Validate password
    if (!password) {
      errors.password = "Password is required";
    } else {
      const missingRequirements = PASSWORD_REQUIREMENTS.filter((requirement) => !requirement.regex.test(password));
      if (missingRequirements.length > 0) {
        errors.password = "Password does not meet all requirements";
      }
    }

    // Validate confirm password
    if (!confirmPassword) {
      errors.confirmPassword = "Please confirm your password";
    } else if (password !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const registerData: RegisterRequest = {
        email: email.trim().toLowerCase(),
        password,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        preferences: {
          theme: "system",
          notifications: true,
        },
      };

      await getAuth().register(registerData);

      // Log in automatically after registration
      await getAuth().login({
        email: email.trim().toLowerCase(),
        password,
      });

      toast({
        title: "Account created successfully",
        description: "Welcome to Roomly! Let's set up your first household.",
      });

      // Navigate to welcome page to create first household
      navigate("/household/welcome");
    } catch (error) {
      toast({
        title: "Registration failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const checkPasswordRequirement = (requirement: (typeof PASSWORD_REQUIREMENTS)[0]) => {
    return requirement.regex.test(password);
  };

  return (
    <PageTransition>
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
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
              <CardTitle className="text-2xl font-bold text-center">Create an account</CardTitle>
              <CardDescription className="text-center">Enter your details to get started with Roomly</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      placeholder="John"
                      value={firstName}
                      onChange={(e) => {
                        setFirstName(e.target.value);
                        setValidationErrors({ ...validationErrors, firstName: undefined });
                      }}
                      required
                      className={`h-11 ${validationErrors.firstName ? "border-destructive" : ""}`}
                      aria-invalid={!!validationErrors.firstName}
                      aria-describedby={validationErrors.firstName ? "firstName-error" : undefined}
                    />
                    {validationErrors.firstName && (
                      <p id="firstName-error" className="text-sm text-destructive">
                        {validationErrors.firstName}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      placeholder="Doe"
                      value={lastName}
                      onChange={(e) => {
                        setLastName(e.target.value);
                        setValidationErrors({ ...validationErrors, lastName: undefined });
                      }}
                      required
                      className={`h-11 ${validationErrors.lastName ? "border-destructive" : ""}`}
                      aria-invalid={!!validationErrors.lastName}
                      aria-describedby={validationErrors.lastName ? "lastName-error" : undefined}
                    />
                    {validationErrors.lastName && (
                      <p id="lastName-error" className="text-sm text-destructive">
                        {validationErrors.lastName}
                      </p>
                    )}
                  </div>
                </div>
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
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setValidationErrors({ ...validationErrors, password: undefined });
                    }}
                    onFocus={() => setShowPasswordRequirements(true)}
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
                  {showPasswordRequirements && (
                    <div className="mt-2 space-y-2 text-sm">
                      {PASSWORD_REQUIREMENTS.map((requirement) => (
                        <div key={requirement.id} className="flex items-center space-x-2">
                          {checkPasswordRequirement(requirement) ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <X className="h-4 w-4 text-destructive" />
                          )}
                          <span>{requirement.label}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setValidationErrors({ ...validationErrors, confirmPassword: undefined });
                    }}
                    required
                    className={`h-11 ${validationErrors.confirmPassword ? "border-destructive" : ""}`}
                    aria-invalid={!!validationErrors.confirmPassword}
                    aria-describedby={validationErrors.confirmPassword ? "confirmPassword-error" : undefined}
                  />
                  {validationErrors.confirmPassword && (
                    <p id="confirmPassword-error" className="text-sm text-destructive">
                      {validationErrors.confirmPassword}
                    </p>
                  )}
                </div>
                <div className="pt-2">
                  <Button type="submit" className="w-full h-11" disabled={isLoading}>
                    {isLoading ? "Creating account..." : "Create account"}
                  </Button>
                </div>
              </form>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <div className="text-sm text-muted-foreground text-center">
                Already have an account?{" "}
                <Link to="/login" className="text-primary hover:underline">
                  Log in
                </Link>
              </div>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    </PageTransition>
  );
};

export default Register;
