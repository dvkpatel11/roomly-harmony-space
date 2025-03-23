import React, { useState } from 'react';
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

interface MessageItemProps {
  message: Message;
  isCurrentUser: boolean;
}

const MessageItem: React.FC<MessageItemProps> = ({ message, isCurrentUser }) => {
  const { editMessage, deleteMessage } = useChatContext();
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(message.content);
  
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
  
  // Generate initials for avatar fallbacks
  const getInitials = (email: string) => {
    return email.split('@')[0].substring(0, 2).toUpperCase();
  };
  
  return (
    <div className={cn(
      "flex items-start gap-3 group",
      isCurrentUser ? "flex-row-reverse" : "flex-row"
    )}>
      <Avatar className="h-8 w-8">
        <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${message.sender_email}`} />
        <AvatarFallback>{getInitials(message.sender_email)}</AvatarFallback>
      </Avatar>
      
      <div className={cn(
        "max-w-[75%]",
        isCurrentUser ? "text-right" : "text-left"
      )}>
        <div className="flex items-center gap-2 mb-1">
          <span className={cn(
            "text-sm font-medium",
            isCurrentUser ? "ml-auto" : "mr-auto"
          )}>
            {message.sender_email.split('@')[0]}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatTime(message.created_at)}
          </span>
          
          {message.edited_at && (
            <span className="text-xs text-muted-foreground">(edited)</span>
          )}
        </div>
        
        <div className="relative">
          <Card className={cn(
            "p-3 inline-block break-words",
            message.is_announcement && "bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800",
            isCurrentUser ? "bg-primary text-primary-foreground" : ""
          )}>
            {message.is_announcement && (
              <Badge className="mb-2" variant="outline">Announcement</Badge>
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
              <p>{message.content}</p>
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
                        onClick={() => deleteMessage(message.id)}
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