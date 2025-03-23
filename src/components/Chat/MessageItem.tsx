import React, { useState, useEffect, useCallback, useRef } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Edit2, Trash2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useChatContext, Message } from '@/contexts/ChatContext';
import { cn } from '@/lib/utils';
import { ColorPreset } from '@/contexts/ChatThemeContext';
import { ImageMessage } from './ImageMessage';
import { getImage, diagnoseImage, refreshImage, deleteImage } from '@/utils/imageStorage';

interface MessageItemProps {
  message: Message;
  isCurrentUser: boolean;
  compact?: boolean;
  colorPreset?: ColorPreset;
}

const MessageItem: React.FC<MessageItemProps> = ({ message, isCurrentUser, compact = false, colorPreset }) => {
  const { editMessage, deleteMessage } = useChatContext();
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(message.content);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [diagnosisReport, setDiagnosisReport] = useState<any>(null);
  const MAX_RETRIES = 3;
  const imageRef = useRef<HTMLImageElement>(null);
  
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editedContent.trim() && editedContent !== message.content) {
      editMessage(message.id, editedContent);
    }
    setIsEditing(false);
  };
  
  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (error) {
      return 'Unknown time';
    }
  };
  
  // Generate initials for avatar fallbacks with null/undefined check
  const getInitials = (email: string | undefined) => {
    if (!email) return 'NA'; // Return default if email is undefined/null
    return email.split('@')[0].substring(0, 2).toUpperCase();
  };
  
  // Load image if message contains image_url
  useEffect(() => {
    let isMounted = true;
    const loadImage = async () => {
      if (!message.image_url) return;
      
      if (isMounted) {
        setImageLoading(true);
        setImageError(false);
      }

      try {
        console.log(`Loading image for message ${message.id}: ${message.image_url} (attempt ${retryCount + 1}/${MAX_RETRIES})`);
        
        const objectUrl = await getImage(message.image_url);
        
        if (!objectUrl && isMounted) {
          console.warn(`No image data found for key ${message.image_url}`);
          setImageError(true);
          setImageLoading(false);
          return;
        }
        
        if (isMounted) {
          setImageUrl(objectUrl);
          setImageLoading(false);
          setImageError(false);
          console.log(`Successfully loaded image for message ${message.id}`);
        }
      } catch (err) {
        if (isMounted) {
          console.error(`Error loading image for message ${message.id}:`, err);
          setImageError(true);
          setImageLoading(false);
          
          // Try to diagnose the issue
          try {
            const report = await diagnoseImage(message.image_url);
            console.log('Image diagnosis report:', report);
            setDiagnosisReport(report);
            
            // If image exists in DB but not in memory, try to refresh it
            if (!report.inMemory && report.inDatabase) {
              console.log('Image exists in database but not in memory, will auto-refresh');
              handleForceImageRefresh();
            }
          } catch (diagErr) {
            console.error('Error diagnosing image:', diagErr);
          }
        }
      }
    };

    if (message.image_url && !imageUrl && retryCount < MAX_RETRIES) {
      loadImage();
    }

    return () => {
      isMounted = false;
    };
  }, [message.image_url, message.id, retryCount]);

  // Clean up URL when component unmounts or message changes
  useEffect(() => {
    return () => {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
        console.log(`Revoked object URL for message ${message.id}`);
      }
    };
  }, [imageUrl, message.id]);

  // Add an event listener to try reloading images when app regains focus
  useEffect(() => {
    const handleFocus = () => {
      if (imageError && message.image_url && retryCount < MAX_RETRIES) {
        console.log(`App regained focus. Attempting to reload failed image for message ${message.id}`);
        setRetryCount(prev => prev + 1);
      }
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [imageError, message.image_url, message.id, retryCount]);

  // Handle manual refresh of image
  const handleForceImageRefresh = async () => {
    if (!message.image_url) return;
    
    setImageLoading(true);
    setImageError(false);
    
    try {
      console.log(`Manually refreshing image for message ${message.id}: ${message.image_url}`);
      
      const objectUrl = await refreshImage(message.image_url);
      
      if (objectUrl) {
        // If we had a previous object URL, revoke it
        if (imageUrl) {
          URL.revokeObjectURL(imageUrl);
        }
        
        setImageUrl(objectUrl);
        setImageLoading(false);
        setImageError(false);
        console.log(`Successfully refreshed image for message ${message.id}`);
      } else {
        throw new Error('Refresh failed to return a valid URL');
      }
    } catch (err) {
      console.error(`Error refreshing image for message ${message.id}:`, err);
      setImageError(true);
      setImageLoading(false);
    }
  };
  
  const hasImage = !!message.image_url;
  
  const renderImage = () => {
    if (!message.image_url) return null;
    
    if (imageLoading) {
      return (
        <div className="mt-2 rounded-md bg-gray-200 animate-pulse w-64 h-64 flex items-center justify-center">
          <span className="text-sm text-gray-500">Loading image...</span>
        </div>
      );
    }
    
    if (imageError) {
      return (
        <div className="mt-2 rounded-md bg-gray-100 border border-gray-300 w-64 h-auto flex flex-col items-center justify-center p-4">
          <span className="text-sm text-gray-500 mb-2">Failed to load image</span>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleForceImageRefresh}
            disabled={imageLoading}
          >
            Retry loading image
          </Button>
          {diagnosisReport && (
            <div className="mt-2 text-xs text-gray-400 max-w-full overflow-hidden">
              <p>Image key: {diagnosisReport.key}</p>
              <p>In memory: {diagnosisReport.inMemory ? 'Yes' : 'No'}</p>
              <p>In database: {diagnosisReport.inDatabase ? 'Yes' : 'No'}</p>
            </div>
          )}
        </div>
      );
    }
    
    if (imageUrl) {
      return (
        <div className="mt-2 max-w-sm overflow-hidden">
          <img 
            ref={imageRef}
            src={imageUrl} 
            alt={`Image shared by ${message.sender_email?.split('@')[0]}`}
            className="rounded-md max-h-96 max-w-full object-contain"
            onError={(e) => {
              console.error(`Image load error for ${message.id}: ${message.image_url}`);
              setImageError(true);
              
              // Auto-retry if we haven't exceeded the max retries
              if (retryCount < MAX_RETRIES - 1) {
                console.log(`Auto-retrying image load for message ${message.id}`);
                setRetryCount(prev => prev + 1);
              }
            }}
          />
        </div>
      );
    }
    
    return null;
  };
  
  return (
    <div className={cn(
      "flex items-start gap-3 group",
      isCurrentUser ? "flex-row-reverse" : "flex-row",
      compact && "gap-2"
    )}>
      <Avatar className={cn(
        "h-8 w-8",
        compact && "h-6 w-6"
      )}>
        {message.sender_email ? (
          <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${message.sender_email}`} />
        ) : (
          <AvatarImage src="https://api.dicebear.com/7.x/initials/svg?seed=NA" />
        )}
        <AvatarFallback>{getInitials(message.sender_email)}</AvatarFallback>
      </Avatar>
      
      <div className={cn(
        "max-w-[75%]",
        isCurrentUser ? "text-right" : "text-left"
      )}>
        <div className={cn(
          "flex items-center gap-2 mb-1",
          compact && "mb-0.5 gap-1"
        )}>
          <span className={cn(
            "text-sm font-medium",
            isCurrentUser ? "ml-auto" : "mr-auto",
            compact && "text-xs"
          )}>
            {message.sender_email ? message.sender_email.split('@')[0] : 'Unknown User'}
          </span>
          <span className={cn(
            "text-xs text-muted-foreground",
            compact && "text-[10px]"
          )}>
            {formatTime(message.created_at)}
          </span>
          
          {message.edited_at && (
            <span className={cn(
              "text-xs text-muted-foreground",
              compact && "text-[10px]"
            )}>(edited)</span>
          )}
        </div>
        
        <div className="relative">
          <Card className={cn(
            "p-3 inline-block break-words",
            message.is_announcement && "bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800 text-amber-900 dark:text-amber-100",
            !message.is_announcement && isCurrentUser && (colorPreset?.userMessageBg || "bg-primary text-primary-foreground"),
            !message.is_announcement && !isCurrentUser && (colorPreset?.messageCard || ""),
            !message.is_announcement && (colorPreset?.border || ""),
            hasImage && "p-2", // Less padding for image messages
            compact && "p-2 text-sm"
          )}>
            {message.is_announcement && (
              <Badge className={cn(
                "mb-2 bg-amber-200 text-amber-900 hover:bg-amber-300 border-amber-300",
                compact && "mb-1 text-xs py-0"
              )}>Announcement</Badge>
            )}
            
            {isEditing ? (
              <form onSubmit={handleEditSubmit} className="flex flex-col gap-2">
                <Input
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  autoFocus
                  className="min-w-[200px]"
                />
                <div className="flex justify-end gap-2">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      setIsEditing(false);
                      setEditedContent(message.content);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" size="sm">Save</Button>
                </div>
              </form>
            ) : (
              <div className="space-y-2">
                {/* Message content */}
                {message.content && (
                  <p className={hasImage ? "mb-2" : ""}>{message.content}</p>
                )}
                
                {/* Image content */}
                {renderImage()}
              </div>
            )}
          </Card>
          
          {isCurrentUser && !isEditing && (
            <div className={cn(
              "absolute top-1 opacity-0 group-hover:opacity-100 transition-opacity",
              isCurrentUser ? "left-0 transform -translate-x-full pl-2" : "right-0 transform translate-x-full pr-2"
            )}>
              <div className="flex gap-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7"
                  onClick={() => {
                    setIsEditing(true);
                    setEditedContent(message.content);
                  }}
                >
                  <Edit2 className="h-3 w-3" />
                </Button>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete message?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. The message will be permanently deleted.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => {
                          // If this is an image message, clean up the image from storage
                          if (message.image_url?.startsWith('img_')) {
                            try {
                              deleteImage(message.image_url);
                            } catch (error) {
                              console.error('Error deleting image:', error);
                            }
                          }
                          deleteMessage(message.id);
                        }}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageItem;