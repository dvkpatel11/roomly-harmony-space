import React, { useState, useRef, useEffect, useCallback } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Send, Edit, Trash2, X, MessageSquare, AlertTriangle, Home, ChevronUp, Sun, Moon, Laptop, Palette, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useChatContext, Message as MessageType, Poll } from '@/contexts/ChatContext';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useChatTheme, ChatColorTheme, COLOR_PRESETS } from '@/contexts/ChatThemeContext';
import { cn } from '@/lib/utils';
import MessageItem from './MessageItem';
import PollCard from './PollCard';
import CreatePollDialog from './CreatePollDialog';
import { Link } from 'react-router-dom';
import { useInView } from 'react-intersection-observer';
import useRefreshData from '@/hooks/useRefreshData';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface ChatRoomProps {
  householdId: string;
  householdName: string;
}

// Add type definitions at the top, under interfaces
type TimelineItem = 
  | { type: 'message'; data: MessageType; timestamp: number }
  | { type: 'poll'; data: Poll; timestamp: number };

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
    loadMoreMessages,
    hasMoreMessages,
    markMessagesAsRead,
    debug
  } = useChatContext();
  const { user, token: authToken } = useAuth();
  const { theme, setTheme } = useTheme();
  const { chatTheme, setChatTheme, colorTheme, setColorTheme, getCurrentColorPreset } = useChatTheme();
  
  // Add state for filtered messages
  const [filteredMessages, setFilteredMessages] = useState<MessageType[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [isAnnouncement, setIsAnnouncement] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isScrolledUp, setIsScrolledUp] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasNewMessages, setHasNewMessages] = useState(false);
  const [reloadPending, setReloadPending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  
  // Refs for DOM elements and tracking state
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const loadingMoreRef = useRef<HTMLDivElement>(null);
  const prevHouseholdId = useRef<string | null>(null);
  const isMounted = useRef(true);
  const isJoined = useRef(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reloadPendingRef = useRef(false);
  const connectionAttemptsRef = useRef(0);
  const lastUnmountTimeRef = useRef<number>(Date.now() - 60000);
  const unmountCountRef = useRef<number>(0);
  const mountTimeRef = useRef<number>(Date.now());
  
  // Set up infinite scroll
  const { ref: topRef, inView: isTopVisible } = useInView({
    threshold: 0.1,
    rootMargin: '200px 0px 0px 0px',
  });
  
  const [localToken] = useState(localStorage.getItem('access_token'));
  
  // Use background refresh for new messages when scrolled up
  // This prevents updating the UI and preserves scroll position 
  // while ensuring the user doesn't miss new messages
  const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5004';
  const token = authToken || localToken;
  
  // Background refresh for messages
  const fetchLatestMessagesInBackground = useCallback(async () => {
    if (!householdId || !token || !isScrolledUp) return [];
    
    try {
      const response = await fetch(
        `${apiUrl}/households/${householdId}/messages?limit=10`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch messages: ${response.status}`);
      }
      
      const data = await response.json();
      return data.messages || [];
    } catch (error) {
      console.error('Background refresh error:', error);
      return [];
    }
  }, [householdId, token, apiUrl, isScrolledUp]);
  
  // Set up background refresh with useRefreshData
  const { lastRefreshTime } = useRefreshData({
    fetchFn: fetchLatestMessagesInBackground,
    interval: 10000, // Every 10 seconds
    enabled: connected && isScrolledUp, // Only when connected and scrolled up
    onSuccess: (newMessages) => {
      // Update unread indicator but don't change scroll position
      if (newMessages.length > 0) {
        // We could update a counter here to show the number of new messages
        console.log(`${newMessages.length} new messages available`);
      }
    }
  });
  
  // Filter messages by current household ID
  useEffect(() => {
    if (!householdId) return;

    // We need to filter messages by household ID
    // This is a simple approach that assumes messages from the current household
    // You may need to enhance this with actual household ID filtering if available in the message object
    
    // This approach is based on the fact that we only load messages for the current household
    // and we've already fixed the cache persistence to preserve messages across remounts
    const relevantMessages = Array.isArray(messages) ? [...messages] : [];
    
    console.log(`Filtering ${relevantMessages.length} messages for household ${householdId}`);
    setFilteredMessages(relevantMessages);
    
  }, [messages, householdId]);
  
  // Handle loading more messages when scrolling to top
  useEffect(() => {
    if (isTopVisible && hasMoreMessages && !loadingMore && isMounted.current) {
      const fetchMore = async () => {
        setLoadingMore(true);
        await loadMoreMessages();
        setLoadingMore(false);
      };
      
      fetchMore();
    }
  }, [isTopVisible, hasMoreMessages, loadMoreMessages]);
  
  // Mark messages as read when they're viewed
  useEffect(() => {
    if (messages.length > 0 && !isScrolledUp) {
      markMessagesAsRead();
    }
  }, [messages, isScrolledUp, markMessagesAsRead]);
  
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
      
      // Store in localStorage before joining
      localStorage.setItem('currentHouseholdId', id);
      
      joinHousehold(id);
    }, 300); // 300ms debounce
  }, [joinHousehold]);
  
  // Handle household changes - clean up previous and set up new
  useEffect(() => {
    // Skip if component not mounted
    if (!isMounted.current) return;
    
    // Store current household ID in localStorage as a fallback
    if (householdId) {
      localStorage.setItem('currentHouseholdId', householdId);
    }
    
    // If household ID changed and we were in a previous household, leave it
    if (prevHouseholdId.current && 
        prevHouseholdId.current !== householdId && 
        isJoined.current) {
      console.log(`Household changed from ${prevHouseholdId.current} to ${householdId}, leaving previous`);
      leaveHousehold(prevHouseholdId.current, false);
      isJoined.current = false;
    }
    
    // Update the previous household ref
    prevHouseholdId.current = householdId;
    
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
      // Reset error state when connected
      setError(null);
      
      // Limit connection attempts
      if (connectionAttemptsRef.current >= 5) {
        if (!reloadPendingRef.current) {
          setError('Unable to connect to chat server after multiple attempts. Please try refreshing the page.');
          reloadPendingRef.current = true;
        }
        return;
      }
      
      // Store in localStorage before joining
      localStorage.setItem('currentHouseholdId', householdId);
      
      // Join household with debounce to prevent hammering the server
      connectionAttemptsRef.current += 1;
      console.log(`Connection attempt ${connectionAttemptsRef.current} for household ${householdId}`);
      debouncedJoinHousehold(householdId);
    } else {
      // More aggressive connection attempts timing
      if (connectionAttemptsRef.current === 1) {
        console.log('First connection attempt. Waiting for socket connection...');
      } else if (connectionAttemptsRef.current === 3) {
        console.log('Multiple attempts to connect. Socket might be having issues.');
      } else if (connectionAttemptsRef.current >= 8) {
        // After 8 attempts, show an error
        if (!reloadPendingRef.current) {
          setError('Unable to establish socket connection. Please check your network or refresh the page.');
          reloadPendingRef.current = true;
        }
        return;
      }
      
      // Increment connection attempt counter
      connectionAttemptsRef.current += 1;
      console.log(`Waiting for socket connection... attempt ${connectionAttemptsRef.current}`);
      
      // Force a refresh after 15 seconds if still not connected
      if (connectionAttemptsRef.current === 1) {
        setTimeout(() => {
          if (!connected && isMounted.current && !reloadPendingRef.current) {
            console.log('Connection timeout after 15 seconds. Suggesting refresh.');
            setError('Connection timeout. Please check your network and refresh the page.');
            reloadPendingRef.current = true;
          }
        }, 15000);
      }
    }
  }, [connected, householdId, token, debouncedJoinHousehold]);
  
  // Track state updates from context
  useEffect(() => {
    if (!isMounted.current) return;
    
    // Check if we have any messages
    console.log(`Current message count: ${messages.length}, Filtered for household: ${filteredMessages.length}`);
    console.log(`Current polls count: ${polls.length} for household ${householdId}`);
    
    // Create merged timeline for logging
    if (messages.length > 0 || polls.length > 0) {
      console.log('Created merged timeline:');
      const timeline = [
        ...messages.map(message => ({
          type: 'message',
          id: message.id,
          content: message.content?.substring(0, 20) || 'Empty message',
          timestamp: new Date(message.created_at).getTime(),
          displayTime: new Date(message.created_at).toISOString()
        })),
        ...polls.map(poll => ({
          type: 'poll',
          id: poll.id,
          content: poll.question?.substring(0, 20) || 'Empty poll',
          timestamp: new Date(poll.created_at || Date.now()).getTime(),
          displayTime: new Date(poll.created_at || Date.now()).toISOString()
        }))
      ].sort((a, b) => a.timestamp - b.timestamp);
      
      timeline.forEach((item, i) => {
        console.log(`[${i}] ${item.type.padEnd(8)} | ${item.id} | ${item.content} | ${item.displayTime}`);
      });
    }
    
    if (debug) {
      console.log(`Debug info from context:`, debug);
    }

    // Mark the household as joined once we start seeing messages
    if (messages.length > 0 && householdId) {
      console.log(`Household ${householdId} successfully joined, received ${messages.length} messages`);
      isJoined.current = true;
      setLoading(false);
    }
    
    // Propagate context errors to local state
    if (contextError) {
      setError(contextError);
    }
  }, [messages, filteredMessages, contextError, householdId, polls, debug]);
  
  // Scroll to bottom when new messages arrive, but only if not scrolled up
  useEffect(() => {
    if (isMounted.current && messagesEndRef.current && !isScrolledUp) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [filteredMessages, isScrolledUp]);
  
  // Handle scroll events to detect if user is scrolled up
  const handleScroll = useCallback(() => {
    if (scrollAreaRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollAreaRef.current;
      // Consider "scrolled up" if we're more than 100px from the bottom
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setIsScrolledUp(!isNearBottom);
    }
  }, []);
  
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
  
  // Handle message sending
  const handleSendMessage = async () => {
    console.log('Sending message with household ID:', householdId);
    
    if (!messageInput.trim()) {
      return;
    }
    
    // Clear input field immediately for better UX
    const message = messageInput;
    setMessageInput('');
    
    try {
      // Ensure we have a valid household ID
      if (!householdId) {
        console.error('Cannot send message: Missing household ID');
        setError('Missing household ID');
        return;
      }
      
      // Use a small timeout to avoid state update crashes during React unmount
      setTimeout(() => {
        // Use our message sending function from context
        sendMessage(message, isAnnouncement);
        
        // Reset announcement mode after sending
        if (isAnnouncement) {
          setIsAnnouncement(false);
        }
      }, 0);
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message');
    }
  };
  
  // Handle keyboard event (Enter to send)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
    
    // Start typing indicator when user begins to type
    if (!isTyping && messageInput.trim()) {
      setIsTyping(true);
      startTyping();
    }
  };
  
  // Track typing state with debounce
  useEffect(() => {
    if (!messageInput.trim()) {
      if (isTyping) {
        setIsTyping(false);
        stopTyping();
      }
      return;
    }
    
    // If user is typing, debounce the typing indicator
    if (isTyping) {
      const typingTimeout = setTimeout(() => {
        setIsTyping(false);
        stopTyping();
      }, 2000); // Stop typing indication after 2 seconds of inactivity
      
      return () => clearTimeout(typingTimeout);
    }
  }, [messageInput, isTyping, stopTyping]);
  
  // Scroll to bottom button
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      setIsScrolledUp(false);
    }
  };
  
  // Function to toggle chat layout (compact vs cozy)
  const toggleChatLayout = () => {
    setChatTheme(chatTheme === 'default' ? 'compact' : 'default');
  };

  // Function to cycle through color themes
  const cycleColorTheme = () => {
    const themes: ChatColorTheme[] = ['default', 'subtle', 'vibrant', 'clean'];
    const currentIndex = themes.indexOf(colorTheme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setColorTheme(themes[nextIndex]);
  };
  
  // Show loading state
  if (loading || contextLoading) {
    // Add forced retry function
    const handleRetry = () => {
      // Reset connection attempts
      connectionAttemptsRef.current = 0;
      // Reset error state
      setError(null);
      // Force window reload if connection attempts are high
      if (connectionAttemptsRef.current > 5) {
        window.location.reload();
      } else {
        // Re-join the household
        if (householdId) {
          console.log('Manual retry - rejoining household:', householdId);
          // Reset join status to force a new join attempt
          isJoined.current = false;
          // Attempt to join again
          debouncedJoinHousehold(householdId);
        }
      }
    };
    
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
        
        <div className="text-xs text-muted-foreground mt-6 border border-muted p-3 rounded max-w-md">
          <details>
            <summary className="font-medium cursor-pointer">Connection Debug Info</summary>
            <div className="mt-2 space-y-1 text-left">
              <p>• Household ID: {householdId || 'Not set'}</p>
              <p>• API URL: {apiUrl || 'Not configured'}</p>
              <p>• Auth Token present: {token ? 'Yes' : 'No'}</p>
              <p>• Token Source: {authToken ? 'Context' : localToken ? 'LocalStorage' : 'None'}</p>
              <p>• Socket Connected: {connected ? 'Yes' : 'No'}</p>
              <p>• Connection Attempts: {connectionAttemptsRef.current}</p>
              <p>• Previous Household: {prevHouseholdId.current || 'None'}</p>
              <p>• Time since mount: {Date.now() - lastUnmountTimeRef.current}ms</p>
              {debug && (
                <>
                  <p>• Messages Count: {debug.messageCount}</p>
                  <p>• Polls Count: {debug.pollCount}</p>
                  <p>• Socket ID: {debug.socketId}</p>
                </>
              )}
            </div>
          </details>
        </div>
        
        <div className="mt-6 flex gap-2">
          {connectionAttemptsRef.current > 2 && (
            <Button variant="default" size="sm" onClick={handleRetry}>
              Retry Connection
            </Button>
          )}
          
          {connectionAttemptsRef.current > 5 && (
            <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
              Refresh Page
            </Button>
          )}
        </div>
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
        <div className="mt-4 text-xs text-muted-foreground">
          <details>
            <summary className="cursor-pointer">Debug Info</summary>
            <div className="mt-1 space-y-1 text-left">
              <p>Connected: {String(connected)}</p> 
              <p>Household ID: {householdId}</p>
              <p>Token Present: {!!token}</p>
              <p>Token Source: {authToken ? 'Context' : localToken ? 'LocalStorage' : 'None'}</p>
              {debug && (
                <>
                  <p>Messages: {debug.messageCount}</p>
                  <p>Polls: {debug.pollCount}</p>
                  <p>Socket ID: {debug.socketId}</p>
                  <p>API URL: {debug.apiUrl}</p>
                </>
              )}
            </div>
          </details>
        </div>
      </div>
    );
  }
  
  // Generate initials for avatar fallbacks
  const getInitials = (email: string) => {
    return email.split('@')[0].substring(0, 2).toUpperCase();
  };
  
  // Display new messages indicator
  const renderNewMessagesIndicator = () => {
    if (isScrolledUp && lastRefreshTime) {
      return (
        <Button
          className="absolute bottom-28 right-6 rounded-full shadow-md animate-pulse"
          onClick={scrollToBottom}
          variant="secondary"
          size="sm"
        >
          New messages
        </Button>
      );
    }
    return null;
  };
  
  // Set up initial mount time
  useEffect(() => {
    isMounted.current = true;
    mountTimeRef.current = Date.now();
    
    console.log(`ChatRoom mounted at ${new Date(mountTimeRef.current).toISOString()}`);
    
    return () => {
      isMounted.current = false;
    };
  }, []);
  
  // Add cleanup on unmount
  useEffect(() => {
    return () => {
      // Track unmount time to distinguish real navigation from remounts
      const unmountTime = Date.now();
      const timeElapsed = unmountTime - mountTimeRef.current;
      
      console.log(`ChatRoom unmounting after ${timeElapsed}ms, attempt count: ${unmountCountRef.current}`);
      unmountCountRef.current += 1;
      
      // Stop typing indicator if active
      if (isTyping) {
        stopTyping();
      }
      
      // Only trigger full cleanup if this is likely a navigation away (not a remount)
      // We consider it a remount if unmount happens within 100ms of mount
      // or if we've seen multiple unmounts in quick succession
      const isLikelyRemount = timeElapsed < 100;
      
      if (!isLikelyRemount) {
        console.log('Full cleanup on navigation away');
        
        // Leave the household chat room but preserve data during navigation
        if (householdId) {
          leaveHousehold(householdId, true);
        }
      } else {
        console.log('Quick remount detected, preserving state');
        
        // Store relevant data in localStorage to survive remount
        if (householdId) {
          localStorage.setItem('currentHouseholdId', householdId);
        }
      }
    };
  }, [householdId, leaveHousehold, isTyping, stopTyping]);
  
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          <h2 className="text-lg font-medium">{householdName} Chat</h2>
        </div>
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="rounded-full hover:bg-primary/10"
                  onClick={cycleColorTheme}
                >
                  <Palette className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Change color theme ({getCurrentColorPreset().name})</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="rounded-full hover:bg-primary/10"
                  onClick={toggleChatLayout}
                >
                  {chatTheme === "default" ? (
                    <div className="h-5 w-5 flex flex-col justify-center items-center gap-0.5">
                      <div className="w-3 h-0.5 bg-foreground"></div>
                      <div className="w-3 h-0.5 bg-foreground"></div>
                      <div className="w-3 h-0.5 bg-foreground"></div>
                    </div>
                  ) : (
                    <div className="h-5 w-5 flex flex-col justify-center items-center gap-1">
                      <div className="w-3 h-0.5 bg-foreground"></div>
                      <div className="w-3 h-0.5 bg-foreground"></div>
                    </div>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Toggle {chatTheme === "default" ? "compact" : "default"} view</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="rounded-full hover:bg-primary/10"
                  onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                >
                  {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Switch to {theme === "light" ? "dark" : "light"} mode</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <CreatePollDialog householdId={householdId} />
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Create a new poll</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      
      <ScrollArea 
        className={cn(
          "flex-1 p-4",
          getCurrentColorPreset().background
        )}
        onScroll={handleScroll}
        ref={scrollAreaRef}
      >
        <div className={cn(
          "space-y-4",
          chatTheme === "compact" && "space-y-2",
        )}>
          {/* Loading indicator at the top for infinite scroll */}
          {hasMoreMessages && (
            <div 
              ref={topRef} 
              className="py-2 flex justify-center"
            >
              {loadingMore ? (
                <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-primary" />
              ) : (
                <span className="text-xs text-muted-foreground">Scroll up to load more messages</span>
              )}
            </div>
          )}
          
          {/* Unified timeline for both messages and polls */}
          {filteredMessages.length === 0 && polls.length === 0 ? (
            <div className="text-center text-muted-foreground p-6">
              <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p>No messages or polls yet. Start the conversation!</p>
            </div>
          ) : (
            // Combine messages and polls into a single timeline
            [...filteredMessages.map(message => ({
              type: 'message' as const,
              data: message,
              timestamp: message.created_at ? new Date(message.created_at).getTime() : Date.now()
            })),
            ...polls.map(poll => ({
              type: 'poll' as const,
              data: poll,
              timestamp: poll.created_at ? new Date(poll.created_at).getTime() : Date.now()
            }))]
            // Sort all items by timestamp, oldest first
            .sort((a, b) => a.timestamp - b.timestamp)
            .map((item: TimelineItem, index) => (
              <div 
                key={`${item.type}-${item.data.id}`} 
                className={cn(
                  item.type === 'poll' ? 'bg-muted/20 p-2 rounded shadow-sm' : '',
                  chatTheme === "compact" && "text-sm"
                )}
              >
                {/* Render the appropriate component based on item type */}
                {item.type === 'message' ? (
                  <MessageItem 
                    message={item.data} 
                    isCurrentUser={user && item.data.sender_id === user.id}
                    compact={chatTheme === "compact"}
                    colorPreset={getCurrentColorPreset()}
                  />
                ) : (
                  <div className="rounded shadow-sm overflow-hidden">
                    <div className={cn(
                      "text-xs text-muted-foreground mb-1 px-2",
                      chatTheme === "compact" && "text-[10px]"
                    )}>
                      Poll created {item.data.created_at ? formatDistanceToNow(new Date(item.data.created_at), { addSuffix: true }) : 'recently'}
                    </div>
                    <PollCard 
                      poll={item.data} 
                      colorPreset={getCurrentColorPreset()}
                    />
                  </div>
                )}
              </div>
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
      
      {/* Scroll to bottom button with tooltip */}
      {isScrolledUp && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                className="absolute bottom-20 right-6 rounded-full p-2 shadow-md"
                onClick={scrollToBottom}
                size="icon"
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>Scroll to bottom</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
      
      {/* New messages indicator */}
      {renderNewMessagesIndicator()}
      
      <div className={cn(
        "p-4 border-t",
        getCurrentColorPreset().background ? "bg-white dark:bg-gray-900" : "" // Form always has a solid background
      )}>
        <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant={isAnnouncement ? "default" : "outline"}
                  size="icon"
                  onClick={() => setIsAnnouncement(!isAnnouncement)}
                >
                  <AlertTriangle className={cn(
                    "h-4 w-4",
                    isAnnouncement && "text-amber-600"
                  )} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>{isAnnouncement ? "Cancel announcement" : "Mark as announcement"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <Input
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1"
          />
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button type="submit" size="icon">
                  <Send className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>Send message</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </form>
      </div>
    </div>
  );
};

export default ChatRoom;