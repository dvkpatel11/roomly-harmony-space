import * as React from "react";
import { Button } from "@/components/ui/button";
import { Image, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FileUpload } from "@/components/ui/file-upload";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/use-toast";

interface ImageUploadButtonProps {
  onImageSelected: (imageKey: string, file: File) => void;
  maxSizeMB?: number;
  householdId: string;
}

const ImageUploadButton: React.FC<ImageUploadButtonProps> = ({
  onImageSelected,
  maxSizeMB = 5,
  householdId,
}) => {
  const [open, setOpen] = React.useState(false);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [previewImage, setPreviewImage] = React.useState<string | null>(null);
  const [isUploading, setIsUploading] = React.useState(false);
  const { toast } = useToast();

  const handleFileChange = (file: File | null) => {
    setSelectedFile(file);
    
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      setPreviewImage(objectUrl);
    } else {
      setPreviewImage(null);
    }
  };

  const handleUpload = async () => {
    if (selectedFile && previewImage) {
      try {
        setIsUploading(true);
        // We'll now pass the file directly to the parent component
        // which will use the imageStorage utility to process and store it
        onImageSelected(previewImage, selectedFile);
        setOpen(false);
        
        // Show success toast
        toast({
          title: "Image ready",
          description: "Image prepared for sending",
        });
      } catch (error) {
        console.error("Error processing image:", error);
        toast({
          variant: "destructive",
          title: "Upload failed",
          description: "There was an error preparing your image. Please try again.",
        });
      } finally {
        setIsUploading(false);
        // Reset after attempt regardless of outcome
        setSelectedFile(null);
        setPreviewImage(null);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className={cn(
                  "h-10 w-10",
                  selectedFile && "bg-primary/10"
                )}
              >
                <Image className="h-4 w-4" />
              </Button>
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>Add image</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload image</DialogTitle>
          <DialogDescription>
            Share an image in the chat. The file should be less than {maxSizeMB}MB.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <FileUpload
            value={selectedFile}
            onChange={handleFileChange}
            accept="image/*"
            maxSizeMB={maxSizeMB}
            uploadText="Upload image"
            showPreview={true}
          />
        </div>

        <DialogFooter className="flex items-center justify-between sm:justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setSelectedFile(null);
              setPreviewImage(null);
              setOpen(false);
            }}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
          >
            {isUploading ? (
              <>
                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent"></span>
                Processing...
              </>
            ) : (
              "Send image"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export { ImageUploadButton }; 