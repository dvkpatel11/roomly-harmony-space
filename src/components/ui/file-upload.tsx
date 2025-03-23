import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { useToast } from "./use-toast";

interface FileUploadProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> {
  value?: File | null;
  onChange?: (file: File | null) => void;
  onUploadComplete?: (url: string) => void;
  accept?: string;
  maxSizeMB?: number;
  uploadText?: string;
  showPreview?: boolean;
  className?: string;
  buttonVariant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
  children?: React.ReactNode;
}

const FileUpload = React.forwardRef<HTMLInputElement, FileUploadProps>(
  (
    {
      value,
      onChange,
      onUploadComplete,
      accept = "image/*",
      maxSizeMB = 5,
      uploadText = "Upload file",
      showPreview = true,
      className,
      buttonVariant = "outline",
      children,
      ...props
    },
    ref
  ) => {
    const { toast } = useToast();
    const [preview, setPreview] = React.useState<string | null>(null);
    const [isUploading, setIsUploading] = React.useState(false);
    const [dragActive, setDragActive] = React.useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    React.useEffect(() => {
      if (!value) {
        setPreview(null);
        return;
      }

      const objectUrl = URL.createObjectURL(value);
      setPreview(objectUrl);

      return () => {
        URL.revokeObjectURL(objectUrl);
      };
    }, [value]);

    const handleFileChange = (file: File | null) => {
      if (!file) {
        onChange?.(null);
        return;
      }

      // Check file type
      if (!file.type.match(accept.replace("*", "."))) {
        toast({
          title: "Invalid file type",
          description: `Please upload a file of type: ${accept}`,
          variant: "destructive",
        });
        return;
      }

      // Check file size
      if (file.size > maxSizeMB * 1024 * 1024) {
        toast({
          title: "File too large",
          description: `File size should be less than ${maxSizeMB}MB`,
          variant: "destructive",
        });
        return;
      }

      onChange?.(file);

      // If onUploadComplete is provided, simulate upload to server
      if (onUploadComplete) {
        setIsUploading(true);
        
        // In a real implementation, you would upload to a server here
        // For now, we'll just simulate an upload with a timeout
        setTimeout(() => {
          setIsUploading(false);
          const objectUrl = URL.createObjectURL(file);
          onUploadComplete(objectUrl);
        }, 1000);
      }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] || null;
      handleFileChange(file);
    };

    const handleDrag = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.type === "dragenter" || e.type === "dragover") {
        setDragActive(true);
      } else if (e.type === "dragleave") {
        setDragActive(false);
      }
    };

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFileChange(e.dataTransfer.files[0]);
      }
    };

    const handleRemove = () => {
      onChange?.(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    };

    const triggerFileInput = () => {
      fileInputRef.current?.click();
    };

    const isImage = value?.type.startsWith("image/");

    return (
      <div
        className={cn(
          "relative rounded-md border border-input bg-background p-2",
          dragActive && "border-primary ring-2 ring-primary/20",
          className
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          onChange={handleChange}
          accept={accept}
          {...props}
        />

        {!value && (
          <div className="flex flex-col items-center justify-center gap-2 py-4">
            {children || (
              <>
                <Upload className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">{uploadText}</p>
                <p className="text-xs text-muted-foreground">
                  Drag & drop or{" "}
                  <Button
                    type="button"
                    variant="link"
                    className="h-auto p-0 text-xs"
                    onClick={triggerFileInput}
                  >
                    browse
                  </Button>
                </p>
                <p className="text-xs text-muted-foreground">
                  Max file size: {maxSizeMB}MB
                </p>
              </>
            )}
          </div>
        )}

        {value && showPreview && (
          <div className="relative">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1 h-6 w-6 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background/90"
              onClick={handleRemove}
            >
              <X className="h-3 w-3" />
            </Button>
            {isImage && preview ? (
              <img
                src={preview}
                alt="Preview"
                className="mx-auto max-h-40 w-auto rounded object-contain"
              />
            ) : (
              <div className="flex items-center gap-2 p-2">
                <ImageIcon className="h-6 w-6 text-muted-foreground" />
                <span className="text-sm font-medium">{value.name}</span>
              </div>
            )}
          </div>
        )}

        {value && !showPreview && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium truncate max-w-xs">
                {value.name}
              </span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6 rounded-full"
              onClick={handleRemove}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}

        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        )}
      </div>
    );
  }
);

FileUpload.displayName = "FileUpload";

export { FileUpload }; 