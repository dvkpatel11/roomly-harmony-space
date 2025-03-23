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

interface ImageUploadButtonProps {
  onImageSelected: (imageUrl: string, file: File) => void;
  maxSizeMB?: number;
}

const ImageUploadButton: React.FC<ImageUploadButtonProps> = ({
  onImageSelected,
  maxSizeMB = 5,
}) => {
  const [open, setOpen] = React.useState(false);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [previewImage, setPreviewImage] = React.useState<string | null>(null);

  const handleFileChange = (file: File | null) => {
    setSelectedFile(file);
    
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      setPreviewImage(objectUrl);
    } else {
      setPreviewImage(null);
    }
  };

  const handleUpload = () => {
    if (selectedFile && previewImage) {
      onImageSelected(previewImage, selectedFile);
      setOpen(false);
      // Reset after selection
      setSelectedFile(null);
      setPreviewImage(null);
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
            disabled={!selectedFile}
          >
            Send image
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export { ImageUploadButton }; 