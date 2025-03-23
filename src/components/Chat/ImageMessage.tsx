import * as React from "react";
import { cn } from "@/lib/utils";
import { Image as ImageIcon, ExternalLink, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ImageMessageProps {
  src: string;
  alt?: string;
  onClick?: () => void;
  className?: string;
}

export const ImageMessage: React.FC<ImageMessageProps> = ({
  src,
  alt = "Image",
  onClick,
  className,
}) => {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);

  const handleImageLoad = () => {
    setLoading(false);
    setError(false);
  };

  const handleImageError = () => {
    setLoading(false);
    setError(true);
  };
  
  // Function to download the image
  const downloadImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    const link = document.createElement('a');
    link.href = src;
    link.download = alt || 'image';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Function to open the image in a new tab
  const openInNewTab = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(src, '_blank');
  };

  return (
    <Dialog>
      <div className={cn("relative group", className)}>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/30">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        )}
        
        {error ? (
          <div className="flex h-32 w-40 items-center justify-center rounded border border-muted bg-muted/20">
            <div className="flex flex-col items-center text-muted-foreground">
              <ImageIcon className="h-8 w-8 mb-2" />
              <span className="text-xs">Failed to load image</span>
            </div>
          </div>
        ) : (
          <DialogTrigger asChild>
            <div className="cursor-pointer overflow-hidden">
              <img
                src={src}
                alt={alt}
                className="max-h-64 max-w-xs rounded-md object-contain transition-all hover:scale-[1.02]"
                onLoad={handleImageLoad}
                onError={handleImageError}
                onClick={() => setIsExpanded(true)}
              />
              
              <div className="absolute bottom-2 right-2 opacity-0 transition-opacity group-hover:opacity-100">
                <div className="flex gap-1">
                  <Button
                    size="icon"
                    variant="secondary"
                    className="h-7 w-7 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background/90"
                    onClick={downloadImage}
                  >
                    <Download className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="secondary"
                    className="h-7 w-7 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background/90"
                    onClick={openInNewTab}
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          </DialogTrigger>
        )}
      </div>
      
      <DialogContent className="sm:max-w-3xl max-h-screen flex items-center justify-center p-1">
        <img
          src={src}
          alt={alt}
          className="max-h-[80vh] max-w-full object-contain"
        />
      </DialogContent>
    </Dialog>
  );
}; 