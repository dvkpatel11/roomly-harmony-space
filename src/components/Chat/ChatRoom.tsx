import React, { useState, useRef, useEffect, useCallback } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Send, Edit, Trash2, X, MessageSquare, AlertTriangle, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useChatContext, Message as MessageType } from '@/contexts/ChatContext';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import MessageItem from './MessageItem';
import PollCard from './PollCard';
import CreatePollDialog from './CreatePollDialog';
import { Link } from 'react-router-dom';

interface ChatRoomProps {
  householdId: string;
  householdName: string;
}

const ChatRoom: React.FC<ChatRoomProps> = ({ householdId, householdName }) => {
  const {
    messages,
    polls,
    typingUsers,
    sendMessage,
    joinHousehold,
    leaveHousehold,
    startTyping,
    stopTyping,
    connected,
    loading: contextLoading,
    error: contextError,
  } = useChatContext();
  const { user, token: authToken } = useAuth();
  
  const [messageInput, setMessageInput] = useState('');
  const [isAnnouncement, setIsAnnouncement] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Track component mount state to prevent operations after unmounting
  const isMounted = useRef(true);
  // Track household join state to prevent redundant operations
  const isJoined = useRef(false);
  // Track connection attempts to prevent infinite loops
  const connectionAttemptsRef = useRef(0);
  // Track previous household ID to detect changes
  const prevHouseholdIdRef = useRef<string | null>(null);
  // Track API request debounce
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  // Track whether a reload is pending to avoid duplicate reload prompts
  const reloadPendingRef = useRef(false);
  
  const [localToken] = useState(localStorage.getItem('access_token'));
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Get effective token (either from auth context or localStorage)
  const token = authToken || localToken;
  
  // Debounced function to join household with retry limit
  const debouncedJoinHousehold = useCallback((id: string) => {
    // Clear any existing debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    // Set a new debounce timer
    debounceTimerRef.current = setTimeout(() => {
      if (!isMounted.current) return;
      if (isJoined.current) return;
      
      console.log(`Attempting to join household ${id} (debounced)`);
      joinHousehold(id);
    }, 300); // 300ms debounce
  }, [joinHousehold]);
  
  // Set up unmount detection
  useEffect(() => {
    isMounted.current = true;
    console.log('ChatRoom mounting');
    
    return () => {
      console.log('ChatRoom unmounting');
      isMounted.current = false;
      
      // Clear any pending timers
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      
      // Perform final cleanup only if we've joined
      if (isJoined.current && householdId) {
        console.log('Leaving household chat (final cleanup):', householdId);
        leaveHousehold(householdId);
        isJoined.current = false;
      }
    };
  }, [leaveHousehold]);
  
  // Handle household changes - clean up previous and set up new
  useEffect(() => {
    // Skip if component not mounted
    if (!isMounted.current) return;
    
    // If household ID changed and we were in a previous household, leave it
    if (prevHouseholdIdRef.current && 
        prevHouseholdIdRef.current !== householdId && 
        isJoined.current) {
      console.log(`Household changed from ${prevHouseholdIdRef.current} to ${householdId}, leaving previous`);
      leaveHousehold(prevHouseholdIdRef.current);
      isJoined.current = false;
    }
    
    // Update the previous household ref
    prevHouseholdIdRef.current = householdId;
    
    // Reset error state and connection attempts on household change
    setError(null);
    connectionAttemptsRef.current = 0;
    reloadPendingRef.current = false;
    
  }, [householdId, leaveHousehold]);
  
  // Validate input parameters
  useEffect(() => {
    if (!isMounted.current) return;
    
    if (!householdId || householdId.trim() === '') {
      console.error('Invalid household ID provided to ChatRoom:', householdId);
      setError('Invalid household ID. Please reload the page or select a different household.');
      return;
    }
    
    if (!token) {
      console.error('No auth token available. User might not be logged in.', 
        { contextToken: !!authToken, localToken: !!localToken });
      setError('You need to be logged in to access chat.');
    }
  }, [householdId, token, authToken, localToken]);
  
  // Handle socket connection and joining household
  useEffect(() => {
    if (!isMounted.current) return;
    if (!householdId || !token) return;
    if (isJoined.current) return; // Skip if already joined
    
    // Track loading state
    setLoading(!connected);
    
    // If socket is connected, join the household
    if (connected) {
      // Limit connection attempts
      if (connectionAttemptsRef.current >= 5) {
        if (!reloadPendingRef.current) {
          setError('Unable to connect to chat server after multiple attempts. Please try refreshing the page.');
          reloadPendingRef.current = true;
        }
        return;
      }
      
      // Join household with debounce to prevent hammering the server
      connectionAttemptsRef.current += 1;
      console.log(`Connection attempt ${connectionAttemptsRef.current} for household ${householdId}`);
      debouncedJoinHousehold(householdId);
    } else if (connectionAttemptsRef.current < 5) {
      // Just count connection attempts while waiting for socket to connect
      connectionAttemptsRef.current += 1;
      console.log(`Waiting for socket connection... attempt ${connectionAttemptsRef.current}`);
    }
  }, [connected, householdId, token, debouncedJoinHousehold]);
  
  // Track state updates from context
  useEffect(() => {
    if (!isMounted.current) return;
    
    // Update our join status when messages are loaded successfully
    if (messages.length > 0 && householdId) {
      isJoined.current = true;
      setLoading(false);
    }
    
    // Propagate context errors to local state
    if (contextError) {
      setError(contextError);
    }
  }, [messages, contextError, householdId]);
  
  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (isMounted.current && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // Handle context errors and ERR_INSUFFICIENT_RESOURCES specifically
  useEffect(() => {
    const handleResourceError = (event: ErrorEvent) => {
      if (event.message.includes('ERR_INSUFFICIENT_RESOURCES') && isMounted.current) {
        console.error('Resource exhaustion error detected');
        if (!reloadPendingRef.current) {
          setError('The browser has run out of resources. Please refresh the page to continue.');
          reloadPendingRef.current = true;
        }
      }
    };

    window.addEventListener('error', handleResourceError);
    
    return () => {
      window.removeEventListener('error', handleResourceError);
    };
  }, []);
  
  // Handle typing events with debounce
  const handleTyping = () => {
    if (!householdId || householdId.trim() === '') {
      return;
    }
    
    startTyping();
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 2000); // Stop typing indicator after 2 seconds of inactivity
  };
  
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!householdId || householdId.trim() === '') {
      setError('Cannot send message: Invalid household ID');
      return;
    }
    
    if (messageInput.trim()) {
      sendMessage(messageInput, isAnnouncement);
      setMessageInput('');
      setIsAnnouncement(false);
      stopTyping(); // Stop typing indicator when message is sent
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }
  };
  
  // Show loading state
  if (loading || contextLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary mb-4" />
        <p className="text-sm text-muted-foreground">
          Connecting to chat server...
        </p>
        {connectionAttemptsRef.current > 2 && (
          <p className="text-xs text-muted-foreground mt-2">
            Taking longer than expected... ({connectionAttemptsRef.current} attempts)
          </p>
        )}
        <p className="text-xs text-muted-foreground mt-4">
          Socket connected: {connected ? 'Yes' : 'No'} 
        </p>
      </div>
    );
  }
  
  // Show error state
  if (error || contextError) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-destructive">
        <AlertTriangle className="h-10 w-10 mb-2" />
        <p className="text-center mb-4">Error: {error || contextError}</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link to="/dashboard">
              <Home className="mr-2 h-4 w-4" />
              Dashboard
            </Link>
          </Button>
          <Button variant="default" size="sm" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
        {!token && (
          <p className="mt-4 text-sm">Authentication issue detected. Try logging in again.</p>
        )}
        <p className="mt-4 text-xs text-muted-foreground">
          Debug: Connected={String(connected)}, HouseholdID={householdId}, 
          Token Present={!!token}, Token Source={authToken ? 'Context' : localToken ? 'LocalStorage' : 'None'}
        </p>
      </div>
    );
  }
  
  // Generate initials for avatar fallbacks
  const getInitials = (email: string) => {
    return email.split('@')[0].substring(0, 2).toUpperCase();
  };
  
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          <h2 className="text-lg font-medium">{householdName} Chat</h2>
        </div>
        <CreatePollDialog householdId={householdId} />
      </div>
      
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {polls.length > 0 && (
            <div className="space-y-4 mb-6">
              <h3 className="font-medium">Active Polls</h3>
              {polls.map((poll) => (
                <PollCard key={poll.id} poll={poll} />
              ))}
            </div>
          )}
          
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground p-6">
              <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((message) => (
              <MessageItem 
                key={message.id} 
                message={message} 
                isCurrentUser={user && message.sender_id === user.id}
              />
            ))
          )}
          
          {typingUsers.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="flex space-x-1">
                <span className="animate-bounce">•</span>
                <span className="animate-bounce delay-75">•</span>
                <span className="animate-bounce delay-150">•</span>
              </div>
              <span>
                {typingUsers.length === 1
                  ? `${typingUsers[0].user_name} is typing...`
                  : `${typingUsers.length} people are typing...`}
              </span>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
      
      <div className="p-4 border-t">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant={isAnnouncement ? "default" : "outline"}
                  size="icon"
                  onClick={() => setIsAnnouncement(!isAnnouncement)}
                >
                  <AlertTriangle className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isAnnouncement ? "Cancel announcement" : "Mark as announcement"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <Input
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyDown={handleTyping}
            placeholder="Type a message..."
            className="flex-1"
          />
          
          <Button type="submit" size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ChatRoom; 