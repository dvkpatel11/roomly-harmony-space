
import * as React from "react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, CheckCircle, Info } from "lucide-react";

// FormGroup
interface FormGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

const FormGroup = React.forwardRef<HTMLDivElement, FormGroupProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("space-y-2 mb-4", className)}
        {...props}
      />
    );
  }
);
FormGroup.displayName = "FormGroup";

// FormLabel
interface FormLabelProps extends React.ComponentProps<typeof Label> {
  required?: boolean;
}

const FormLabel = React.forwardRef<HTMLLabelElement, FormLabelProps>(
  ({ required, className, children, ...props }, ref) => {
    return (
      <Label
        ref={ref}
        className={cn("block", className)}
        {...props}
      >
        {children}
        {required && <span className="ml-1 text-destructive">*</span>}
      </Label>
    );
  }
);
FormLabel.displayName = "FormLabel";

// FormInput
interface FormInputProps extends React.ComponentProps<typeof Input> {
  error?: string;
  success?: boolean;
  helpText?: string;
}

const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
  ({ error, success, helpText, className, ...props }, ref) => {
    return (
      <div className="space-y-1">
        <Input
          ref={ref}
          className={cn(
            error && "border-destructive focus-visible:ring-destructive",
            success && "border-accent focus-visible:ring-accent",
            className
          )}
          {...props}
        />
        {error && (
          <div className="flex items-center gap-1 text-xs text-destructive mt-1">
            <AlertTriangle className="h-3 w-3" />
            <span>{error}</span>
          </div>
        )}
        {success && !error && (
          <div className="flex items-center gap-1 text-xs text-accent mt-1">
            <CheckCircle className="h-3 w-3" />
            <span>Input is valid</span>
          </div>
        )}
        {helpText && !error && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
            <Info className="h-3 w-3" />
            <span>{helpText}</span>
          </div>
        )}
      </div>
    );
  }
);
FormInput.displayName = "FormInput";

// FormTextarea
interface FormTextareaProps extends React.ComponentProps<typeof Textarea> {
  error?: string;
  success?: boolean;
  helpText?: string;
}

const FormTextarea = React.forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  ({ error, success, helpText, className, ...props }, ref) => {
    return (
      <div className="space-y-1">
        <Textarea
          ref={ref}
          className={cn(
            error && "border-destructive focus-visible:ring-destructive",
            success && "border-accent focus-visible:ring-accent",
            className
          )}
          {...props}
        />
        {error && (
          <div className="flex items-center gap-1 text-xs text-destructive mt-1">
            <AlertTriangle className="h-3 w-3" />
            <span>{error}</span>
          </div>
        )}
        {success && !error && (
          <div className="flex items-center gap-1 text-xs text-accent mt-1">
            <CheckCircle className="h-3 w-3" />
            <span>Input is valid</span>
          </div>
        )}
        {helpText && !error && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
            <Info className="h-3 w-3" />
            <span>{helpText}</span>
          </div>
        )}
      </div>
    );
  }
);
FormTextarea.displayName = "FormTextarea";

// FormCheckbox
interface FormCheckboxProps extends React.ComponentProps<typeof Checkbox> {
  label: string;
  error?: string;
}

const FormCheckbox = React.forwardRef<HTMLButtonElement, FormCheckboxProps>(
  ({ label, error, className, ...props }, ref) => {
    return (
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Checkbox
            ref={ref}
            className={cn(
              error && "border-destructive",
              className
            )}
            {...props}
          />
          <label
            htmlFor={props.id}
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            {label}
          </label>
        </div>
        {error && (
          <div className="flex items-center gap-1 text-xs text-destructive mt-1">
            <AlertTriangle className="h-3 w-3" />
            <span>{error}</span>
          </div>
        )}
      </div>
    );
  }
);
FormCheckbox.displayName = "FormCheckbox";

export {
  FormGroup,
  FormLabel,
  FormInput,
  FormTextarea,
  FormCheckbox,
};
