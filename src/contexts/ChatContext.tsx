import React, { createContext, useContext, useState, useEffect, ReactNode, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext'; // Assuming you have an AuthContext

// Define types for our messages
export interface Message {
  id: number;
  content: string;
  sender_id: number;
  sender_email: string;
  is_announcement: boolean;
  created_at: string;
  edited_at?: string;
  household_id?: string;
  image_url?: string;
}

export interface Poll {
  id: number;
  question: string;
  options: Record<string, number>;
  expires_at: string;
  created_by: string;
  created_at?: string;
  household_id?: string;
  user_vote?: string;
  voters?: Record<string, string>;
  total_votes?: number;
}

export interface TypingUser {
  user_id: number;
  user_email: string;
  user_name: string;
}

// New interface for message cache management
interface MessageCache {
  messages: Message[];
  hasMore: boolean;
  oldestMessageId: number | null;
  newestMessageId: number | null;
}

// New interface for poll cache management
interface PollCache {
  polls: Poll[];
  hasMore: boolean;
  oldestPollId: number | null;
}

export interface ChatContextType {
  socket: Socket | null;
  messages: Message[];
  polls: Poll[];
  typingUsers: TypingUser[];
  connected: boolean;
  joinHousehold: (householdId: string) => Promise<void>;
  leaveHousehold: (householdId: string, preserveData?: boolean) => Promise<void>;
  sendMessage: (content: string, isAnnouncement?: boolean, imageUrl?: string) => void;
  editMessage: (messageId: number, content: string) => void;
  deleteMessage: (messageId: number) => void;
  startTyping: () => void;
  stopTyping: () => void;
  createPoll: (question: string, options: string[], expiryDate: string) => void;
  votePoll: (pollId: number, option: string) => void;
  currentHouseholdId: string | null;
  error: string | null;
  loading: boolean;
  loadMoreMessages: () => Promise<boolean>;
  loadMorePolls: () => Promise<boolean>;
  hasMoreMessages: boolean;
  hasMorePolls: boolean;
  markMessagesAsRead: () => void;
  debug?: {
    messageCount: number;
    messagesByHouseholdCount: Record<string, number>;
    pollCount: number;
    pollsByHouseholdCount: Record<string, number>;
    apiUrl: string;
    socketConnected: boolean;
    socketId: string | null;
  };
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
};

interface ChatProviderProps {
  children: ReactNode;
}

const MAX_CACHE_SIZE = 500; // Maximum number of messages to keep in memory

// Add constants for localStorage keys
const STORAGE_KEYS = {
  MESSAGES: 'messages',
  POLLS: 'polls',
  CURRENT_HOUSEHOLD: 'currentHouseholdId',
  LATEST_MESSAGE_ID: 'latestMessageId',
  HOUSEHOLD_MESSAGES_PREFIX: 'roomly_household_messages_',
  HOUSEHOLD_POLLS_PREFIX: 'roomly_household_polls_'
};

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const { token: authToken, user } = useAuth(); // From AuthContext
  const [socket, setSocket] = useState<Socket | null>(null);
  
  // Initialize message cache from localStorage if available
  const initializeMessageCache = (): MessageCache => {
    try {
      // First try to get the general message cache
      const savedCache = localStorage.getItem(STORAGE_KEYS.MESSAGES);
      let generalCache: MessageCache | null = null;
      
      if (savedCache) {
        try {
          generalCache = JSON.parse(savedCache);
          console.log('Restored general message cache from localStorage with', generalCache.messages.length, 'messages');
        } catch (e) {
          console.error('Failed to parse general message cache from localStorage:', e);
        }
      }
      
      // Then collect all household-specific messages
      const allMessages: Message[] = [];
      let householdMessagesCount = 0;
      
      // Look for any keys that start with STORAGE_KEYS.HOUSEHOLD_MESSAGES_PREFIX
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(STORAGE_KEYS.HOUSEHOLD_MESSAGES_PREFIX)) {
          const householdId = key.replace(STORAGE_KEYS.HOUSEHOLD_MESSAGES_PREFIX, '');
          const savedMessages = localStorage.getItem(key);
          if (savedMessages) {
            try {
              const messages = JSON.parse(savedMessages);
              if (Array.isArray(messages)) {
                // Add all messages to our combined array
                allMessages.push(...messages);
                householdMessagesCount += messages.length;
              }
            } catch (e) {
              console.error(`Failed to parse messages for household ${householdId}:`, e);
            }
          }
        }
      }
      
      // If we found household messages
      if (allMessages.length > 0) {
        console.log(`Found ${allMessages.length} total messages across ${householdMessagesCount} household caches`);
        
        // Sort by creation time
        allMessages.sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        
        // If we have a general cache, combine them (prefer household cache for duplicates)
        if (generalCache) {
          // Identify unique messages by creating a Map using message IDs as keys
          const messageMap = new Map<number, Message>();
          
          // First add all from general cache
          generalCache.messages.forEach(msg => messageMap.set(msg.id, msg));
          
          // Then add from household caches (will override duplicates)
          allMessages.forEach(msg => messageMap.set(msg.id, msg));
          
          // Convert back to array and sort
          const combinedMessages = Array.from(messageMap.values()).sort((a, b) => 
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
          
          console.log(`Combined ${generalCache.messages.length} general and ${allMessages.length} household messages into ${combinedMessages.length} unique messages`);
          
          return {
            messages: combinedMessages,
            hasMore: generalCache.hasMore,
            oldestMessageId: combinedMessages[0]?.id ?? null,
            newestMessageId: combinedMessages[combinedMessages.length - 1]?.id ?? null
          };
        }
        
        // If we don't have a general cache, use just the household messages
        return {
          messages: allMessages,
          hasMore: false,
          oldestMessageId: allMessages[0]?.id ?? null,
          newestMessageId: allMessages[allMessages.length - 1]?.id ?? null
        };
      }
      
      // If we have a general cache but no household messages, use the general cache
      if (generalCache) {
        return generalCache;
      }
    } catch (e) {
      console.error('Failed to initialize message cache from localStorage:', e);
    }
    
    // Default empty cache
    return {
      messages: [],
      hasMore: false,
      oldestMessageId: null,
      newestMessageId: null
    };
  };
  
  // Initialize poll cache from localStorage if available
  const initializePollCache = (): PollCache => {
    try {
      // First try to get the general poll cache
      const savedCache = localStorage.getItem(STORAGE_KEYS.POLLS);
      let generalCache: PollCache | null = null;
      
      if (savedCache) {
        try {
          generalCache = JSON.parse(savedCache);
          console.log('Restored general poll cache from localStorage with', generalCache.polls.length, 'polls');
        } catch (e) {
          console.error('Failed to parse general poll cache from localStorage:', e);
        }
      }
      
      // Then collect all household-specific polls
      const allPolls: Poll[] = [];
      let householdPollsCount = 0;
      
      // Look for any keys that start with STORAGE_KEYS.HOUSEHOLD_POLLS_PREFIX
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(STORAGE_KEYS.HOUSEHOLD_POLLS_PREFIX)) {
          const householdId = key.replace(STORAGE_KEYS.HOUSEHOLD_POLLS_PREFIX, '');
          const savedPolls = localStorage.getItem(key);
          if (savedPolls) {
            try {
              const polls = JSON.parse(savedPolls);
              if (Array.isArray(polls)) {
                // Add all polls to our combined array
                allPolls.push(...polls);
                householdPollsCount += polls.length;
              }
            } catch (e) {
              console.error(`Failed to parse polls for household ${householdId}:`, e);
            }
          }
        }
      }
      
      // If we found household polls
      if (allPolls.length > 0) {
        console.log(`Found ${allPolls.length} total polls across ${householdPollsCount} household caches`);
        
        // If we have a general cache, combine them (prefer household cache for duplicates)
        if (generalCache) {
          // Identify unique polls by creating a Map using poll IDs as keys
          const pollMap = new Map<number, Poll>();
          
          // First add all from general cache
          generalCache.polls.forEach(poll => pollMap.set(poll.id, poll));
          
          // Then add from household caches (will override duplicates)
          allPolls.forEach(poll => pollMap.set(poll.id, poll));
          
          // Convert back to array
          const combinedPolls = Array.from(pollMap.values());
          
          console.log(`Combined ${generalCache.polls.length} general and ${allPolls.length} household polls into ${combinedPolls.length} unique polls`);
          
          return {
            polls: combinedPolls,
            hasMore: generalCache.hasMore,
            oldestPollId: generalCache.oldestPollId
          };
        }
        
        // If we don't have a general cache, use just the household polls
        return {
          polls: allPolls,
          hasMore: false,
          oldestPollId: null
        };
      }
      
      // If we have a general cache but no household polls, use the general cache
      if (generalCache) {
        return generalCache;
      }
    } catch (e) {
      console.error('Failed to initialize poll cache from localStorage:', e);
    }
    
    // Default empty cache
    return {
      polls: [],
      hasMore: false,
      oldestPollId: null
    };
  };
  
  const [messageCache, setMessageCache] = useState<MessageCache>(initializeMessageCache);
  const [pollCache, setPollCache] = useState<PollCache>(initializePollCache);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [connected, setConnected] = useState(false);
  const [currentHouseholdId, setCurrentHouseholdId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Add refs to track socket and connection state more reliably
  const socketRef = useRef<Socket | null>(null);
  const connectedRef = useRef<boolean>(false);
  const currentHouseholdRef = useRef<string | null>(null);
  const joinAttemptInProgressRef = useRef<boolean>(false);
  const loadingMoreMessagesRef = useRef<boolean>(false);
  const loadingMorePollsRef = useRef<boolean>(false);
  
  // Try to get token from localStorage if auth context doesn't have it
  const token = authToken || localStorage.getItem('access_token');

  // Get API URL from Vite environment variables
  const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5004';
  const wsUrl = import.meta.env.VITE_WS_URL || apiUrl.replace('http', 'ws'); // Use API URL as base for WebSocket too
  
  // Add debug logging for API URL
  useEffect(() => {
    console.log('⚙️ Chat context using API URL:', apiUrl);
  }, [apiUrl]);
  
  // Initialize socket connection
  useEffect(() => {
    if (!token) {
      console.error('No authentication token available. Cannot connect to socket.');
      return;
    }
    
    setLoading(true);
    
    // Check if socket already exists
    if (socketRef.current && socketRef.current.connected) {
      console.log('Socket already connected. Reusing existing connection.');
      setSocket(socketRef.current);
      setConnected(true);
      connectedRef.current = true;
      setLoading(false);
      return;
    }
    
    // Only initialize socket if we don't already have one
      console.log('Initializing socket connection to:', apiUrl);
      console.log('Token available (first 10 chars):', token.substring(0, 10) + '...');
      
      try {
        // Create socket connection with auth
      console.log('Creating new socket connection with these options:', {
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 20000
      });
      
        const newSocket = io(apiUrl, {
          autoConnect: true,
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          timeout: 20000, // Increase timeout to 20 seconds
          query: { token }
        });
      
      // Debug connection status
      console.log('Socket initializing. Current state:', 
        newSocket.connected ? 'connected' : 'disconnected', 
        'ID:', newSocket.id || 'not assigned yet');
      
      // Force connection if not auto-connecting
      if (!newSocket.connected) {
        console.log('Socket not immediately connected, calling connect() explicitly');
        newSocket.connect();
      }
      
      // Add timeout for connection
      const connectionTimeout = setTimeout(() => {
        if (!connectedRef.current) {
          console.error('Socket connection timed out after 10 seconds');
          setError('Connection timed out. Please refresh the page and try again.');
          
          // Try to reconnect
          if (newSocket) {
            console.log('Attempting to reconnect...');
            newSocket.disconnect();
            newSocket.connect();
          }
        }
      }, 10000);
        
        // Store socket in state and ref for more reliable access
        setSocket(newSocket);
        socketRef.current = newSocket;
      
      // Check if we had a previous household ID in localStorage
      const savedHouseholdId = localStorage.getItem('currentHouseholdId');
      if (savedHouseholdId && !currentHouseholdRef.current) {
        console.log('Found saved household ID in localStorage:', savedHouseholdId);
        currentHouseholdRef.current = savedHouseholdId;
        setCurrentHouseholdId(savedHouseholdId);
      }
        
        // Set up socket event handlers
        newSocket.on('connect', () => {
        console.log('✅ Socket connected successfully! Socket ID:', newSocket.id);
        
        // Clear timeout since we're connected
        clearTimeout(connectionTimeout);
        
          // Send token for authentication
          if (newSocket && token) {
          console.log('Authenticating socket connection...');
            newSocket.emit('authenticate', { token });
          }
        
          setConnected(true);
          connectedRef.current = true;
          setLoading(false);
          setError(null);
        });
        
        newSocket.on('authenticated', () => {
          console.log('Socket authenticated successfully');
        });
        
        newSocket.on('unauthorized', (err: any) => {
          console.error('Authentication error:', err);
          setError('Authentication failed. Please try logging in again.');
          setLoading(false);
          
          // Clean up socket on auth failure
          if (newSocket) newSocket.disconnect();
        });
        
        // Message and data event handlers
        if (newSocket) {
          // CHANGED FROM 'message' to 'new_message'
          newSocket.on('new_message', (message) => {
          console.log('📩 Received new message from server:', message);
          // Log more details to debug
          console.log('Current household ID:', currentHouseholdId);
          console.log('Connected status:', connected);
          console.log('Socket ID:', newSocket.id);
          
          // Add the message without clearing the cache
            handleNewMessage(message);
          });
          
        newSocket.on('new_poll', (poll) => {
          console.log('📊 Received new poll from server:', poll);
          // Add household ID if not present
          if (!poll.household_id && currentHouseholdRef.current) {
            poll.household_id = currentHouseholdRef.current;
          }
          handleNewPoll(poll);
        });
        
          newSocket.on('poll_updated', handlePollUpdate);
          newSocket.on('user_typing', handleTypingEvent);
          newSocket.on('user_typing_stopped', (data) => {
            console.log('User stopped typing:', data);
            setTypingUsers(prev => prev.filter(user => user.user_id !== data.user_id));
          });
          
          // Add listeners for message updates and deletions
          newSocket.on('message_edited', (data) => {
            console.log('Message edited:', data);
          setMessageCache(prevCache => ({
            ...prevCache,
            messages: prevCache.messages.map(msg => 
                msg.id === data.id 
                  ? { ...msg, content: data.content, edited_at: data.edited_at } 
                  : msg
              )
          }));
          });
          
          newSocket.on('message_deleted', (data) => {
            console.log('Message deleted:', data);
          setMessageCache(prevCache => ({
            ...prevCache,
            messages: prevCache.messages.filter(msg => msg.id !== data.id)
          }));
          });
          
          // Add error handler
          newSocket.on('error', (error) => {
            console.error('Socket error:', error);
            setError(`Socket error: ${error.message || 'Unknown error'}`);
          });
        
        newSocket.on('poll_deleted', (data) => {
          console.log('Poll deleted:', data);
          setPollCache(prevCache => ({
            ...prevCache,
            polls: prevCache.polls.filter(poll => poll.id !== data.poll_id)
          }));
        });

        // Handle joined household with initial data
        newSocket.on('joined_household', (data) => {
          console.log('Joined household with initial data:', data);
          
          if (!currentHouseholdRef.current) {
            console.error('No current household ID set when receiving joined_household event');
            return;
          }
          
          const householdId = currentHouseholdRef.current;
          
          // Check if we already have messages before overriding
          const existingMessageCount = messageCache.messages.length;
          
          if (data.recent_messages && Array.isArray(data.recent_messages) && 
              (existingMessageCount === 0 || data.recent_messages.length > existingMessageCount)) {
            
            console.log(`Got ${data.recent_messages.length} messages from server. Already had ${existingMessageCount} messages locally.`);
            
            // Add household ID to all messages
            const messagesWithHouseholdId = data.recent_messages.map((message: Message) => ({
              ...message,
              household_id: householdId
            }));
            
            // Initialize message cache with received messages
            const sortedMessages = [...messagesWithHouseholdId].sort((a, b) => 
              new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            );
            
            // Merge with existing messages if needed
            if (existingMessageCount > 0) {
              // Compare with existing messages to avoid duplicates
              console.log('Merging with existing messages...');
              
              // Create a Set of existing message IDs for fast lookup
              const existingIds = new Set(messageCache.messages.map(m => m.id));
              
              // Filter out messages that already exist in the cache
              const newMessages = sortedMessages.filter(m => !existingIds.has(m.id));
              
              console.log(`Adding ${newMessages.length} new messages to existing ${existingMessageCount} messages`);
              
              // Combine and sort messages
              const combinedMessages = [...messageCache.messages, ...newMessages].sort((a, b) => 
                new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
              );
              
              // Update both the general message cache and the household-specific cache
              setMessageCache(prev => ({
                messages: combinedMessages,
                hasMore: data.has_more_messages || prev.hasMore,
                oldestMessageId: combinedMessages[0]?.id ?? null,
                newestMessageId: combinedMessages[combinedMessages.length - 1]?.id ?? null
              }));
            } else {
              // No existing messages, just set the new ones
              setMessageCache({
                messages: sortedMessages,
                hasMore: data.has_more_messages || false,
                oldestMessageId: sortedMessages.length > 0 ? sortedMessages[0].id : null,
                newestMessageId: sortedMessages.length > 0 ? sortedMessages[sortedMessages.length - 1].id : null
              });
            }
          } else {
            console.log('Keeping existing messages:', existingMessageCount);
          }

          if (data.active_polls && Array.isArray(data.active_polls)) {
            // Only replace polls if we got new ones or don't have any
            const existingPollsCount = pollsByHousehold[householdId]?.length || 0;
            
            if (existingPollsCount === 0 || data.active_polls.length > 0) {
              console.log(`Received ${data.active_polls.length} active polls from server. Already had ${existingPollsCount} polls locally.`);
              
              // Add household ID and created_at to all polls if missing
              const pollsWithHouseholdId = data.active_polls.map((poll: Poll) => ({
                ...poll,
                household_id: householdId,
                created_at: poll.created_at || new Date().toISOString()
              }));
              
              // If we had existing polls, merge them to avoid duplicates
              if (existingPollsCount > 0) {
                // Get existing polls for this household
                const existingPolls = pollsByHousehold[householdId] || [];
                
                // Create a Set of existing poll IDs for fast lookup
                const existingIds = new Set(existingPolls.map(p => p.id));
                
                // Filter out polls that already exist
                const newPolls = pollsWithHouseholdId.filter(p => !existingIds.has(p.id));
                
                console.log(`Adding ${newPolls.length} new polls to existing ${existingPollsCount} polls`);
                
                // Combine with existing polls, putting new polls at the beginning
                const combinedPolls = [...newPolls, ...existingPolls];
                
                // Sort polls by creation date, newest first
                combinedPolls.sort((a, b) => {
                  const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
                  const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
                  return dateB - dateA;
                });
                
                // Update both general poll cache and household-specific cache
                setPollCache({
                  polls: combinedPolls,
                  hasMore: false,
                  oldestPollId: combinedPolls.length > 0 ? 
                    Math.min(...combinedPolls.map(p => p.id)) : null
                });
                
                // Update household-specific poll cache
                setPollsByHousehold(prev => {
                  const updatedPolls = {...prev};
                  updatedPolls[householdId] = combinedPolls;
                  
                  // Save to localStorage
                  try {
                    localStorage.setItem(`${STORAGE_KEYS.HOUSEHOLD_POLLS_PREFIX}${householdId}`, 
                      JSON.stringify(combinedPolls));
                  } catch (e) {
                    console.error(`Failed to save polls for household ${householdId}:`, e);
                  }
                  
                  return updatedPolls;
                });
              } else {
                // No existing polls, just set the new ones
                console.log(`Setting ${pollsWithHouseholdId.length} active polls for household ${householdId}`);
                
                // Sort polls by creation date, newest first
                pollsWithHouseholdId.sort((a, b) => {
                  const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
                  const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
                  return dateB - dateA;
                });
                
                setPollCache({
                  polls: pollsWithHouseholdId,
                  hasMore: false,
                  oldestPollId: pollsWithHouseholdId.length > 0 ? 
                    Math.min(...pollsWithHouseholdId.map(p => p.id)) : null
                });
                
                // Also update the household-specific poll cache
                setPollsByHousehold(prev => {
                  const updatedPolls = {...prev};
                  updatedPolls[householdId] = pollsWithHouseholdId;
                  
                  // Save to localStorage
                  try {
                    localStorage.setItem(`${STORAGE_KEYS.HOUSEHOLD_POLLS_PREFIX}${householdId}`, 
                      JSON.stringify(pollsWithHouseholdId));
                    console.log(`Saved ${pollsWithHouseholdId.length} polls for household ${householdId}`);
                  } catch (e) {
                    console.error(`Failed to save polls for household ${householdId}:`, e);
                  }
                  
                  return updatedPolls;
                });
              }
            } else {
              console.log(`Keeping existing ${existingPollsCount} polls for household ${householdId}`);
            }
          }
          });
        }
        
        newSocket.on('disconnect', () => {
          console.log('Socket disconnected');
          setConnected(false);
          connectedRef.current = false;
        });
        
        newSocket.on('connect_error', (err) => {
          console.error('Socket connection error:', err);
          setError(`Connection error: ${err.message}`);
          setLoading(false);
          setConnected(false);
          connectedRef.current = false;
        });
        
        // Clean up function
        return () => {
          console.log('Cleaning up socket connection');
          // Clear all event listeners and close socket
          if (newSocket) {
            newSocket.off('connect');
            newSocket.off('authenticated');
            newSocket.off('unauthorized');
            newSocket.off('new_message'); // CHANGED FROM 'message'
          newSocket.off('new_poll');
            newSocket.off('poll_updated');
            newSocket.off('user_typing');
            newSocket.off('user_typing_stopped');
            newSocket.off('message_edited');
            newSocket.off('message_deleted');
            newSocket.off('error');
            newSocket.off('disconnect');
            newSocket.off('connect_error');
          newSocket.off('joined_household');
            
            newSocket.disconnect();
          }
          
        // Reset all state except caches
          setSocket(null);
          socketRef.current = null;
          setConnected(false);
          connectedRef.current = false;
          setCurrentHouseholdId(null);
          currentHouseholdRef.current = null;
          joinAttemptInProgressRef.current = false;
          
        // We no longer clear caches here to ensure data persists across unmounts
          setTypingUsers([]);
        };
      } catch (error) {
        console.error('Error initializing socket:', error);
        setError('Failed to initialize socket connection. Please refresh the page.');
        setLoading(false);
    }
  }, [token, apiUrl]);
  
  // Track messages by household ID
  const [messagesByHousehold, setMessagesByHousehold] = useState<Record<string, Message[]>>({});

  // Initialize messagesByHousehold from localStorage
  useEffect(() => {
    try {
      // Try to restore household-specific message caches
      const householdMessageMap: Record<string, Message[]> = {};
      
      // Look for any keys that start with STORAGE_KEYS.HOUSEHOLD_MESSAGES_PREFIX
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(STORAGE_KEYS.HOUSEHOLD_MESSAGES_PREFIX)) {
          const householdId = key.replace(STORAGE_KEYS.HOUSEHOLD_MESSAGES_PREFIX, '');
          const savedMessages = localStorage.getItem(key);
          if (savedMessages) {
            try {
              const messages = JSON.parse(savedMessages);
              if (Array.isArray(messages)) {
                householdMessageMap[householdId] = messages;
                console.log(`Restored ${messages.length} messages for household ${householdId}`);
              }
            } catch (e) {
              console.error(`Failed to parse messages for household ${householdId}:`, e);
            }
          }
        }
      }
      
      if (Object.keys(householdMessageMap).length > 0) {
        setMessagesByHousehold(householdMessageMap);
      }
    } catch (e) {
      console.error('Error initializing messagesByHousehold:', e);
    }
  }, []);

  // Also track polls by household ID
  const [pollsByHousehold, setPollsByHousehold] = useState<Record<string, Poll[]>>({});

  // Initialize pollsByHousehold from localStorage
  useEffect(() => {
    try {
      // Try to restore household-specific poll caches
      const householdPollMap: Record<string, Poll[]> = {};
      
      // Look for any keys that start with STORAGE_KEYS.HOUSEHOLD_POLLS_PREFIX
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(STORAGE_KEYS.HOUSEHOLD_POLLS_PREFIX)) {
          const householdId = key.replace(STORAGE_KEYS.HOUSEHOLD_POLLS_PREFIX, '');
          const savedPolls = localStorage.getItem(key);
          if (savedPolls) {
            try {
              const polls = JSON.parse(savedPolls);
              if (Array.isArray(polls)) {
                householdPollMap[householdId] = polls;
                console.log(`Restored ${polls.length} polls for household ${householdId}`);
              }
            } catch (e) {
              console.error(`Failed to parse polls for household ${householdId}:`, e);
            }
          }
        }
      }
      
      if (Object.keys(householdPollMap).length > 0) {
        setPollsByHousehold(householdPollMap);
      }
    } catch (e) {
      console.error('Error initializing pollsByHousehold:', e);
    }
  }, []);
  
  // Event handlers
  const handleNewMessage = (message: Message) => {
    console.log('💬 Processing new message in handleNewMessage:', message);
    
    // Ensure the message object has all required fields
    if (!message.id || !message.content) {
      console.error('Received invalid message object:', message);
      return;
    }
    
    // Make sure message has a created_at timestamp
    if (!message.created_at) {
      message.created_at = new Date().toISOString();
    }
    
    // Add household ID to message if missing but we know the current household
    if (!message.household_id && currentHouseholdRef.current) {
      message.household_id = currentHouseholdRef.current;
    }
    
    setMessageCache(prevCache => {
      // Check if message already exists to prevent duplicates
      const exists = prevCache.messages.some(m => m.id === message.id);
      if (exists) {
        console.log('Message already exists, skipping:', message.id);
        return prevCache;
      }
      
      console.log('Adding new message to cache:', message);
      
      // IMPORTANT: Keep all existing messages rather than clearing them
      // This ensures messages persist across unmounts/remounts
      const updatedMessages = [...prevCache.messages, message];
      
      // Ensure cache doesn't exceed MAX_CACHE_SIZE
      const messages = updatedMessages.length > MAX_CACHE_SIZE 
        ? updatedMessages.slice(-MAX_CACHE_SIZE) 
        : updatedMessages;
        
      console.log('Updated messages cache. New count:', messages.length);
      
      // Store the latest message ID in localStorage for recovery after remounts
      if (message.id) {
        try {
          localStorage.setItem('latestMessageId', String(message.id));
          // Also store the number of cached messages
          localStorage.setItem('cachedMessagesCount', String(messages.length));
        } catch (e) {
          console.error('Failed to store message ID in localStorage:', e);
        }
      }
      
      return {
        ...prevCache,
        messages,
        newestMessageId: message.id
      };
    });
    
    // Also store the message in the household-specific cache
    if (message.household_id) {
      setMessagesByHousehold(prev => {
        const householdId = message.household_id as string;
        const currentHouseholdMessages = prev[householdId] || [];
        
        // Skip if message already exists in this household
        if (currentHouseholdMessages.some(m => m.id === message.id)) {
          return prev;
        }
        
        // Add message to this household's cache
        const updatedHouseholdMessages = [...currentHouseholdMessages, message];
        
        // Sort by creation time
        updatedHouseholdMessages.sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        
        try {
          // Save to localStorage using consistent key
          localStorage.setItem(
            `${STORAGE_KEYS.HOUSEHOLD_MESSAGES_PREFIX}${householdId}`, 
            JSON.stringify(updatedHouseholdMessages)
          );
          console.log(`Saved ${updatedHouseholdMessages.length} messages for household ${householdId}`);
        } catch (e) {
          console.error(`Failed to save messages for household ${householdId}:`, e);
        }
        
        return {
          ...prev,
          [householdId]: updatedHouseholdMessages
        };
      });
    }
  };
  
  const handleNewPoll = (poll: Poll) => {
    console.log('Handling new poll:', poll);
    
    // Ensure we have a household_id on the poll
    if (!poll.household_id && currentHouseholdRef.current) {
      poll.household_id = currentHouseholdRef.current;
      console.log('Added missing household_id to poll:', poll.household_id);
    }
    
    // Make sure poll has a created_at timestamp if missing
    if (!poll.created_at) {
      poll.created_at = new Date().toISOString();
      console.log('Added missing created_at timestamp to poll');
    }
    
    // Add to the general poll cache if it doesn't exist
    setPollCache(prev => {
      // Check if the poll already exists
      const exists = prev.polls.some(p => p.id === poll.id);
      if (exists) {
        console.log('Poll already exists in cache, updating:', poll.id);
        // Update existing poll
        return {
          ...prev,
          polls: prev.polls.map(p => p.id === poll.id ? poll : p)
        };
      } else {
        console.log('Adding new poll to cache:', poll.id);
        // Add new poll at the beginning of the array
        return {
          ...prev,
          polls: [poll, ...prev.polls].slice(0, MAX_CACHE_SIZE)
        };
      }
    });
    
    // Add to household-specific poll cache if we have a household ID
    if (poll.household_id) {
      setPollsByHousehold(prev => {
        const householdPolls = prev[poll.household_id || ''] || [];
        
        // Check if poll already exists in this household's cache
        const exists = householdPolls.some(p => p.id === poll.id);
        
        if (exists) {
          console.log(`Updating existing poll ${poll.id} in household ${poll.household_id}`);
          // Update existing poll
          return {
            ...prev,
            [poll.household_id || '']: householdPolls.map(p => p.id === poll.id ? poll : p)
          };
        } else {
          console.log(`Adding new poll ${poll.id} to household ${poll.household_id}`);
          // Add new poll at the beginning of the array
          const updatedHouseholdPolls = [poll, ...householdPolls].slice(0, MAX_CACHE_SIZE);
          
          // Save to localStorage for this household
          try {
            localStorage.setItem(
              `${STORAGE_KEYS.HOUSEHOLD_POLLS_PREFIX}${poll.household_id}`,
              JSON.stringify(updatedHouseholdPolls)
            );
            console.log(`Saved ${updatedHouseholdPolls.length} polls for household ${poll.household_id}`);
          } catch (err) {
            console.error('Error saving polls to localStorage:', err);
          }
          
          return {
            ...prev,
            [poll.household_id || '']: updatedHouseholdPolls
          };
        }
      });
    }
    
    // Save all polls to localStorage
    try {
      console.log('Poll cache will be saved by useEffect when state updates');
    } catch (err) {
      console.error('Error saving polls to localStorage:', err);
    }
  };
  
  const handlePollUpdate = useCallback((data: any) => {
    console.log('Poll update received:', data);
    if (!data || !data.id) return;
    
    // Find and update the poll in our cache
    setPollCache(prev => {
      const updatedPolls = prev.polls.map(poll => {
        if (String(poll.id) === String(data.id)) {
          // Update with new options/votes
          const updatedPoll = {
            ...poll,
            options: data.options || poll.options,
          };
          
          // If this user is the voter, record their vote
          if (data.voter && user && String(data.voter) === String(user.id)) {
            updatedPoll.user_vote = data.option;
          }
          
          // Update voters record if provided
          if (data.voters) {
            updatedPoll.voters = data.voters;
          } else if (data.voter && data.option) {
            // If individual vote data is provided but not full voters record, update it
            const updatedVoters = { ...(updatedPoll.voters || {}) };
            updatedVoters[data.voter] = data.option;
            updatedPoll.voters = updatedVoters;
          }
          
          // Log the updated poll for debugging
          console.log('Poll updated locally:', {
            id: updatedPoll.id,
            user_vote: updatedPoll.user_vote,
            voters: updatedPoll.voters ? Object.keys(updatedPoll.voters).length : 0
          });
          
          return updatedPoll;
        }
        return poll;
      });
      
      // Save the updated polls to localStorage immediately
      try {
        localStorage.setItem(STORAGE_KEYS.POLLS, JSON.stringify({
          ...prev,
          polls: updatedPolls
        }));
      } catch (e) {
        console.error('Failed to save updated polls to localStorage:', e);
      }
      
      return {
        ...prev,
        polls: updatedPolls
      };
    });
    
    // Also update household-specific cache if needed
    const currentHouseholdId = currentHouseholdRef.current;
    if (currentHouseholdId) {
      setPollsByHousehold(prev => {
        const householdPolls = prev[currentHouseholdId] || [];
        const updatedHouseholdPolls = householdPolls.map(poll => {
          if (String(poll.id) === String(data.id)) {
            // Update with new options/votes
            const updatedPoll = {
              ...poll,
              options: data.options || poll.options,
            };
            
            // If this user is the voter, record their vote
            if (data.voter && user && String(data.voter) === String(user.id)) {
              updatedPoll.user_vote = data.option;
            }
            
            // Update voters record if provided
            if (data.voters) {
              updatedPoll.voters = data.voters;
            } else if (data.voter && data.option) {
              // If individual vote data is provided but not full voters record, update it
              const updatedVoters = { ...(updatedPoll.voters || {}) };
              updatedVoters[data.voter] = data.option;
              updatedPoll.voters = updatedVoters;
            }
            
            return updatedPoll;
          }
          return poll;
        });
        
        // Save to localStorage for this household specifically
        try {
          localStorage.setItem(`${STORAGE_KEYS.HOUSEHOLD_POLLS_PREFIX}${currentHouseholdId}`, 
            JSON.stringify(updatedHouseholdPolls));
        } catch (e) {
          console.error(`Failed to save polls for household ${currentHouseholdId}:`, e);
        }
        
        return {
          ...prev,
          [currentHouseholdId]: updatedHouseholdPolls
        };
      });
    }
  }, [user]);
  
  const handleTypingEvent = (user: TypingUser) => {
    console.log('User typing:', user);
    setTypingUsers((prev) => [...prev.filter((u) => u.user_id !== user.user_id), user]);
  };

  // Load more messages function
  const loadMoreMessages = async (): Promise<boolean> => {
    if (!currentHouseholdId || !token || loadingMoreMessagesRef.current || !messageCache.hasMore) {
      return false;
    }
    
    loadingMoreMessagesRef.current = true;
    
    try {
      const oldestMessageId = messageCache.oldestMessageId;
      
      if (!oldestMessageId) {
        loadingMoreMessagesRef.current = false;
        return false;
      }
      
      const response = await fetch(
        `${apiUrl}/households/${currentHouseholdId}/messages?before_id=${oldestMessageId}&limit=100`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch more messages: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.messages || !Array.isArray(data.messages) || data.messages.length === 0) {
        setMessageCache(prevCache => ({
          ...prevCache,
          hasMore: false
        }));
        loadingMoreMessagesRef.current = false;
        return false;
      }
      
      // Sort messages by timestamp
      const sortedNewMessages = [...data.messages].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      
      // Update cache
      setMessageCache(prevCache => {
        // Combine existing and new messages, ensuring no duplicates
        const combinedMessages = [
          ...sortedNewMessages,
          ...prevCache.messages
        ].filter((message, index, self) => 
          index === self.findIndex(m => m.id === message.id)
        );
        
        // Trim to MAX_CACHE_SIZE if needed
        const messages = combinedMessages.length > MAX_CACHE_SIZE 
          ? combinedMessages.slice(-MAX_CACHE_SIZE) 
          : combinedMessages;
          
        return {
          messages,
          hasMore: data.messages.length >= 100, // If we got 100 messages, there might be more
          oldestMessageId: messages[0]?.id ?? null,
          newestMessageId: messages[messages.length - 1]?.id ?? null
        };
      });
      
      loadingMoreMessagesRef.current = false;
      return true;
      
    } catch (error) {
      console.error('Error loading more messages:', error);
      loadingMoreMessagesRef.current = false;
      return false;
    }
  };
  
  // Load more polls function
  const loadMorePolls = async (): Promise<boolean> => {
    if (!currentHouseholdId || !token || loadingMorePollsRef.current || !pollCache.hasMore) {
      return false;
    }
    
    loadingMorePollsRef.current = true;
    
    try {
      const oldestPollId = pollCache.oldestPollId;
      
      if (!oldestPollId) {
        loadingMorePollsRef.current = false;
        return false;
      }
      
      const response = await fetch(
        `${apiUrl}/households/${currentHouseholdId}/polls?before_id=${oldestPollId}&limit=50&include_expired=true`,
        {
        headers: {
            'Authorization': `Bearer ${token}`
        }
        }
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch more polls: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.polls || !Array.isArray(data.polls) || data.polls.length === 0) {
        setPollCache(prevCache => ({
          ...prevCache,
          hasMore: false
        }));
        loadingMorePollsRef.current = false;
        return false;
      }
      
      // Update cache
      setPollCache(prevCache => {
        // Combine existing and new polls, ensuring no duplicates
        const combinedPolls = [
          ...prevCache.polls,
          ...data.polls
        ].filter((poll, index, self) => 
          index === self.findIndex(p => p.id === poll.id)
        );
        
        return {
          polls: combinedPolls,
          hasMore: data.polls.length >= 50, // If we got 50 polls, there might be more
          oldestPollId: Math.min(...combinedPolls.map(p => p.id))
        };
      });
      
      loadingMorePollsRef.current = false;
      return true;
      
    } catch (error) {
      console.error('Error loading more polls:', error);
      loadingMorePollsRef.current = false;
      return false;
    }
  };

  // Mark messages as read (placeholder for future implementation)
  const markMessagesAsRead = () => {
    // Implement this when you add unread message tracking
    console.log('Marking messages as read');
  };

  // Join a household chat
  const joinHousehold = async (householdId: string) => {
    if (!householdId || householdId.trim() === '') {
      console.error('Invalid household ID');
      setError('Invalid household ID');
        return;
      }
      
    if (!socket || !token) {
      console.error('Cannot join household: Socket or token not available');
      setError('Connection not established. Please refresh the page.');
        return;
      }
      
    // If we're already in this household, skip
    if (currentHouseholdRef.current === householdId) {
      console.log('Already in household', householdId, 'skipping join');
        return;
      }
      
    try {
      // Save the old household ID before updating
      const oldHouseholdId = currentHouseholdRef.current;
      
      // Leave any current household first
      if (oldHouseholdId && oldHouseholdId !== householdId) {
        console.log('Leaving current household before joining new one');
        await leaveHousehold(oldHouseholdId);
      }
      
      console.log('Joining household:', householdId, 'Socket connected:', connected, 'Socket ID:', socket.id);
      
      // Update refs and state immediately
      currentHouseholdRef.current = householdId;
      setCurrentHouseholdId(householdId);
      
      // Check if we already have messages for this household
      const existingMessages = messagesByHousehold[householdId] || [];
      console.log(`Found ${existingMessages.length} existing messages for household ${householdId}`);
      
      // Don't reset message cache when switching to the same household or reconnecting
      // If we have existing messages for this household, use them
      if (existingMessages.length > 0) {
        console.log(`Using ${existingMessages.length} cached messages for household ${householdId}`);
        setMessageCache(prev => ({
          messages: existingMessages,
          hasMore: prev.hasMore,
          oldestMessageId: existingMessages[0]?.id ?? null,
          newestMessageId: existingMessages[existingMessages.length - 1]?.id ?? null
        }));
      }
      // If we're joining a different household with no cached messages, clear out the old messages
      else if (oldHouseholdId !== householdId && existingMessages.length === 0) {
        // Reset message cache for the new household
        setMessageCache({
          messages: [],
          hasMore: false,
          oldestMessageId: null,
          newestMessageId: null
        });
      }
      
      // Check for existing polls (similar to messages)
      const existingPolls = pollsByHousehold[householdId] || [];
      
      // Don't reset poll cache when switching to the same household
      if (oldHouseholdId !== householdId && !existingPolls.length) {
        // Reset poll cache for the new household
        setPollCache({
          polls: [],
          hasMore: false,
          oldestPollId: null
        });
      }
      
      // Store household ID in localStorage
      localStorage.setItem('currentHouseholdId', householdId);
      
      // Request to join household room
      console.log('Emitting join_household event with token and householdId:', householdId);
      socket.emit('join_household', { 
        token,
        household_id: householdId 
      });
    } catch (err) {
      console.error('Error in joinHousehold:', err);
      setError('Failed to join household chat: ' + (err instanceof Error ? err.message : String(err)));
    }
  };
  
  // Leave a household chat
  const leaveHousehold = async (householdId: string, preserveData = false) => {
    if (!householdId || householdId.trim() === '') {
      console.error('Invalid household ID');
      return;
    }
    
    // Skip if not in the given household
    if (currentHouseholdRef.current !== householdId) {
      console.log('Not in household', householdId, 'skipping leave');
      return;
    }
    
    if (!socket) {
      console.log('Socket not connected, skipping leave');
      return;
    }
    
    try {
      console.log('Leaving household', householdId, 'with socket ID:', socket.id, 
        preserveData ? '(preserving data for remount)' : '(clearing data)');
      
      // Emit leave event to the server
      socket.emit('leave_household', { household_id: householdId });
      
      if (preserveData) {
        // When preserving data (during quick remounts):
        // Keep the household reference in localStorage but mark that we're disconnected
        console.log('Preserving household reference and message data during remount:', householdId);
        localStorage.setItem('preservedHouseholdId', householdId);
        localStorage.setItem('preserveMessagesCount', String(messageCache.messages.length));
      } else {
        // Only clear the household reference when not preserving data
        console.log('Clearing household reference:', householdId);
      currentHouseholdRef.current = null;
        setCurrentHouseholdId(null);
        
        // DON'T CLEAR CACHE ON NAVIGATION - we now use localStorage for persistence
        // Instead, we just log that we're leaving but keep the data
        console.log('Leaving household but preserving message and poll cache for future sessions');
        
        // We no longer clear the caches here to ensure data persists across navigation
        // Messages and polls will be filtered by household ID when displayed
      }
      
      return await new Promise<void>((resolve) => {
        resolve();
      });
    } catch (err) {
      console.error('Error in leaveHousehold:', err);
      return Promise.reject(err);
    }
  };

  // Send a new message
  const sendMessage = (content: string, isAnnouncement = false, imageUrl?: string) => {
    if (!socket || !connected) {
      console.error('Cannot send message: Socket disconnected');
      return;
    }
    
    if (!currentHouseholdId) {
      console.error('Cannot send message: No household ID');
      return;
    }
    
    // Clear typing indicator when sending a message
    stopTyping();
    
    try {
      // Generate a temporary ID for optimistic updates  
      const tempId = -Math.floor(Math.random() * 1000000000);
      const now = new Date().toISOString();
      
      // Create the message object
      const newMessage: Message = {
        id: tempId,
        content: content,
        sender_id: user?.id || 0,
        sender_email: user?.email || 'Guest',
        is_announcement: isAnnouncement,
        created_at: now,
        household_id: currentHouseholdId,
        image_url: imageUrl // Add the image URL if provided
      };
      
      // Add to local message cache immediately for optimistic UI
      setMessageCache(prev => {
        // Add message to the end of the list (newest)
        const updatedMessages = [...prev.messages, newMessage];
        // Ensure we don't exceed the maximum cache size
        const messagesForCache = updatedMessages.slice(-MAX_CACHE_SIZE);
        
        // Update latest message ID
        const newestId = messagesForCache.length > 0 
          ? Math.max(...messagesForCache.map(m => m.id))
          : prev.newestMessageId;
        
        // Update MessageCache state
        return {
          ...prev,
          messages: messagesForCache,
          newestMessageId: newestId,
        };
      });
      
      // Update household-specific messages too if we're tracking those
      if (currentHouseholdId) {
        setMessagesByHousehold(prev => {
          const householdMessages = prev[currentHouseholdId] || [];
          const updatedMessages = [...householdMessages, newMessage];
          
          return {
            ...prev,
            [currentHouseholdId]: updatedMessages.slice(-MAX_CACHE_SIZE)
          };
        });
      }
      
      // Create the message payload
      const messageData = {
        content: content,
        is_announcement: isAnnouncement,
        household_id: currentHouseholdId,
        image_url: imageUrl // Include image URL in payload
      };
      
      // Send the message through the socket
      socket.emit('send_message', messageData, (ack: any) => {
        if (ack && ack.error) {
          console.error('Failed to send message:', ack.error);
          setError(`Failed to send message: ${ack.error}`);
        } else {
          console.log('Message sent successfully, server ack:', ack);
        }
      });
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message');
    }
  };

  // Edit a message
  const editMessage = (messageId: number, content: string) => {
    if (!socket || !token || !content.trim()) return;

    socket.emit('edit_message', {
      token,
      message_id: messageId,
      content,
    });
  };

  // Delete a message
  const deleteMessage = (messageId: number) => {
    if (!socket || !token) return;

    socket.emit('delete_message', {
      token,
      message_id: messageId,
    });
  };

  // Typing indicators
  const startTyping = () => {
    if (!socket || !token || !currentHouseholdId) return;

    socket.emit('typing_start', {
      token,
      household_id: currentHouseholdId,
    });
  };

  const stopTyping = () => {
    if (!socket || !token || !currentHouseholdId) return;
    
    // Ensure token is a string
    const tokenToSend = typeof token === 'string' ? token : String(token);
    
    console.log('Stopping typing with token and household:', tokenToSend, currentHouseholdId);
    
    socket.emit('typing_stop', {
      token: tokenToSend,
      household_id: currentHouseholdId,
    });
  };

  // Poll creation
  const createPoll = (question: string, options: string[], expiryDate: string) => {
    if (!token || !currentHouseholdRef.current) {
      console.error('Cannot create poll: missing token or household');
      setError('Cannot create poll: You must be in a household chat');
      return;
    }
    
    const householdId = currentHouseholdRef.current;
    
    const pollData = {
      question,
      options,
      expires_at: expiryDate
    };
    
    console.log('Creating poll:', pollData);
    console.log('API URL:', `${apiUrl}/households/${householdId}/polls`);
    console.log('Using token:', token.substring(0, 15) + '...');
    console.log('Household ID:', householdId);
    
    // Create a temporary poll for optimistic UI update
    const tempId = -(Date.now()); // Use negative ID to avoid collisions with server IDs
    const tempOptions: Record<string, number> = {};
    options.forEach(opt => { tempOptions[opt] = 0; });
    
    const tempPoll: Poll = {
      id: tempId,
      question,
      options: tempOptions,
      expires_at: expiryDate,
      created_by: user?.name || user?.email || 'You',
      created_at: new Date().toISOString(),
      household_id: householdId
    };
    
    // Add the temp poll to the cache immediately for better UX
    handleNewPoll(tempPoll);
    
    // Log existing polls for debugging
    console.log('Current polls before API call:', pollCache.polls.length);
    if (pollsByHousehold[householdId]) {
      console.log('Current household polls:', pollsByHousehold[householdId].length);
    }
    
    fetch(`${apiUrl}/households/${householdId}/polls`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      },
      body: JSON.stringify(pollData),
      credentials: 'include'
    })
    .then(response => {
      console.log('Poll creation status:', response.status);
      return response.text().then(text => {
        try {
          // Try to parse as JSON
          const data = text ? JSON.parse(text) : {};
          console.log('Poll response data:', data);
          
          if (!response.ok) {
            throw new Error(`Failed to create poll: ${data.error || response.statusText}`);
          }
          
          return data;
        } catch (err) {
          // If not valid JSON, log the raw response
          console.log('Raw response:', text);
          if (!response.ok) {
            throw new Error(`Failed to create poll: ${response.statusText}`);
          }
        }
      });
    })
    .then(data => {
      console.log('Poll created successfully:', data);
      // The real poll will be added via the socket event
    })
    .catch(err => {
      console.error('Error creating poll:', err);
      setError('Failed to create poll: ' + err.message);
      
      // Remove the temporary poll on error
      setPollCache(prev => ({
        ...prev,
        polls: prev.polls.filter(p => p.id !== tempId)
      }));
      
      // Also remove from household-specific cache
      if (householdId) {
        setPollsByHousehold(prev => {
          const householdPolls = prev[householdId] || [];
          return {
            ...prev,
            [householdId]: householdPolls.filter(p => p.id !== tempId)
          };
        });
      }
    });
  };

  // Add helper function to load polls from localStorage
  const loadPollsFromLocalStorage = (): PollCache | null => {
    try {
      const savedCache = localStorage.getItem(STORAGE_KEYS.POLLS);
      if (savedCache) {
        return JSON.parse(savedCache);
      }
    } catch (e) {
      console.error('Failed to load polls from localStorage:', e);
    }
    return null;
  };

  // Vote on a poll
  const votePoll = (pollId: number, option: string) => {
    if (!token) {
      console.error('Cannot vote on poll: missing token');
      return;
    }

    // Skip user check for temporary polls (negative IDs)
    const isTemporaryPoll = pollId < 0;
    
    // If this is not a temporary poll, verify the user is authenticated
    if (!isTemporaryPoll && !user) {
      console.error('Cannot vote on server poll: user not authenticated');
      return;
    }

    const currentHouseholdId = currentHouseholdRef.current;
    
    // Optimistic UI update - update the poll in our local cache immediately
    const updatePollLocallyWithVote = () => {
      // Get user information for the vote
      // For temporary polls, use a placeholder if user is not available
      const userId = user ? user.id : 'local-user';
      const userEmail = user ? user.email : 'local-user@example.com';
      
      console.log(`Adding vote from user ${userId} (${userEmail}) for poll ${pollId}, option: ${option}`);
      
      // Update the general poll cache
      setPollCache(prev => {
        const updatedPolls = prev.polls.map(poll => {
          // Compare as strings to handle both number and string IDs
          const pollIdStr = String(poll.id);
          const targetIdStr = String(pollId);
          if (pollIdStr === targetIdStr) {
            // Create a new options object with the vote added
            const updatedOptions = { ...poll.options };
            updatedOptions[option] = (updatedOptions[option] || 0) + 1;
            
            // Create or update voters record
            const updatedVoters = { ...(poll.voters || {}) };
            updatedVoters[userId] = option;
            
            const updatedPoll = {
              ...poll,
              options: updatedOptions,
              user_vote: option, // Add user's vote to the poll to track voting state
              voters: updatedVoters, // Update voters record
              total_votes: (poll.total_votes || 0) + 1
            };
            
            // Log the updated poll for debugging
            console.log('Updated poll locally:', {
              poll_id: poll.id,
              user_vote: option,
              voters_count: Object.keys(updatedVoters).length,
              user_in_voters: Object.keys(updatedVoters).includes(String(userId))
            });
            
            return updatedPoll;
          }
          return poll;
        });
        
        return {
          ...prev,
          polls: updatedPolls
        };
      });
      
      // Also update the household-specific cache if we have a household ID
      if (currentHouseholdId) {
        setPollsByHousehold(prev => {
          const householdPolls = prev[currentHouseholdId] || [];
          const updatedHouseholdPolls = householdPolls.map(poll => {
            // Compare as strings to handle both number and string IDs
            const pollIdStr = String(poll.id);
            const targetIdStr = String(pollId);
            if (pollIdStr === targetIdStr) {
              // Create a new options object with the vote added
              const updatedOptions = { ...poll.options };
              updatedOptions[option] = (updatedOptions[option] || 0) + 1;
              
              // Create or update voters record
              const updatedVoters = { ...(poll.voters || {}) };
              updatedVoters[userId] = option;
              
              return {
                ...poll,
                options: updatedOptions,
                user_vote: option, // Add user's vote to the poll to track voting state
                voters: updatedVoters, // Update voters record
                total_votes: (poll.total_votes || 0) + 1
              };
            }
            return poll;
          });
          
          // Save to localStorage for this household specifically
          try {
            localStorage.setItem(`${STORAGE_KEYS.HOUSEHOLD_POLLS_PREFIX}${currentHouseholdId}`, 
              JSON.stringify(updatedHouseholdPolls));
            console.log(`Saved updated polls for household ${currentHouseholdId} to localStorage`);
          } catch (e) {
            console.error(`Failed to save polls for household ${currentHouseholdId}:`, e);
          }
          
          return {
            ...prev,
            [currentHouseholdId]: updatedHouseholdPolls
          };
        });
      }
      
      // Save updated polls to localStorage immediately
      try {
        const updatedCache = loadPollsFromLocalStorage() || pollCache;
        const updatedPolls = updatedCache.polls.map(poll => {
          // Compare as strings to handle both number and string IDs
          const pollIdStr = String(poll.id);
          const targetIdStr = String(pollId);
          if (pollIdStr === targetIdStr) {
            // Create a new options object with the vote added
            const updatedOptions = { ...poll.options };
            updatedOptions[option] = (updatedOptions[option] || 0) + 1;
            
            // Create or update voters record
            const updatedVoters = { ...(poll.voters || {}) };
            updatedVoters[userId] = option;
            
            return {
              ...poll,
              options: updatedOptions,
              user_vote: option,
              voters: updatedVoters,
              total_votes: (poll.total_votes || 0) + 1
            };
          }
          return poll;
        });
        
        localStorage.setItem(STORAGE_KEYS.POLLS, JSON.stringify({
          ...updatedCache,
          polls: updatedPolls
        }));
        
        console.log('Saved updated poll vote to localStorage');
      } catch (e) {
        console.error('Failed to save poll vote to localStorage:', e);
      }
    };
    
    // If this is a temporary poll (negative ID), just update locally
    if (pollId < 0) {
      console.log(`Voting on temporary poll ${pollId} - applying optimistic update only`);
      updatePollLocallyWithVote();
      return;
    }
    
    // At this point, we know it's a real poll and user exists (checked above)
    // Apply optimistic update immediately for better UX
    updatePollLocallyWithVote();
    
    // Then send the vote to the server
    console.log(`Submitting vote for poll ${pollId}, option: ${option}`);

    fetch(`${apiUrl}/polls/${pollId}/vote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        option: option, // Match the backend endpoint's expected parameter name
      }),
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`Failed to vote: ${response.status} ${response.statusText}`);
      }
      return response.json();
    })
    .then(data => {
      console.log('Vote submitted successfully:', data);
      // The server will send a poll_vote event that will update all clients
    })
    .catch((err) => {
      console.error('Vote submission error:', err);
      setError('Failed to submit vote: ' + err.message);
      
      // Revert the optimistic update on error to avoid misleading the user
      if (currentHouseholdId) {
        // Refresh polls from localStorage to restore previous state
        const storedPolls = loadPollsFromLocalStorage();
        if (storedPolls) {
          setPollCache(storedPolls);
          
          // Also restore household-specific polls
          if (currentHouseholdId) {
            const householdPolls = storedPolls.polls.filter(
              p => p.household_id === currentHouseholdId
            );
            setPollsByHousehold(prev => ({
              ...prev,
              [currentHouseholdId]: householdPolls
            }));
          }
        }
      }
    });
  };

  // Sync the main message cache with household-specific message caches
  useEffect(() => {
    if (messageCache.messages.length > 0) {
      try {
        // First save the main cache
        localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(messageCache));
        console.log('Saved', messageCache.messages.length, 'messages to main localStorage cache');

        // Now make sure each message is properly saved to its household cache
        const householdMessages: Record<string, Message[]> = {};
        
        // Group messages by household_id
        messageCache.messages.forEach(message => {
          if (message.household_id) {
            if (!householdMessages[message.household_id]) {
              householdMessages[message.household_id] = [];
            }
            householdMessages[message.household_id].push(message);
          }
        });
        
        // Save each household's messages separately
        Object.entries(householdMessages).forEach(([householdId, messages]) => {
          try {
            const key = `${STORAGE_KEYS.HOUSEHOLD_MESSAGES_PREFIX}${householdId}`;
            
            // Merge with any existing messages for this household
            const existingJson = localStorage.getItem(key);
            let existingMessages: Message[] = [];
            
            if (existingJson) {
              try {
                const parsed = JSON.parse(existingJson);
                if (Array.isArray(parsed)) {
                  existingMessages = parsed;
                }
              } catch (e) {
                console.error(`Error parsing existing messages for household ${householdId}:`, e);
              }
            }
            
            // Merge messages, avoiding duplicates
            const messageMap = new Map<number, Message>();
            
            // Add existing messages first
            existingMessages.forEach(msg => messageMap.set(msg.id, msg));
            
            // Then add new messages (which will override any duplicates)
            messages.forEach(msg => messageMap.set(msg.id, msg));
            
            // Convert to array and sort
            const combinedMessages = Array.from(messageMap.values()).sort((a, b) => 
              new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            );
            
            // Save the combined messages
            localStorage.setItem(key, JSON.stringify(combinedMessages));
            console.log(`Synced ${combinedMessages.length} messages for household ${householdId}`);
          } catch (e) {
            console.error(`Error saving messages for household ${householdId}:`, e);
          }
        });
      } catch (e) {
        console.error('Failed to save message cache to localStorage:', e);
      }
    }
  }, [messageCache]);

  // Sync the main poll cache with household-specific poll caches
  useEffect(() => {
    if (pollCache.polls.length > 0) {
      try {
        // First save the main cache
        localStorage.setItem(STORAGE_KEYS.POLLS, JSON.stringify(pollCache));
        console.log('Saved', pollCache.polls.length, 'polls to main localStorage cache');
        
        // Now make sure each poll is properly saved to its household cache
        const householdPolls: Record<string, Poll[]> = {};
        
        // Group polls by household_id
        pollCache.polls.forEach(poll => {
          if (poll.household_id) {
            if (!householdPolls[poll.household_id]) {
              householdPolls[poll.household_id] = [];
            }
            householdPolls[poll.household_id].push(poll);
          }
        });
        
        // Save each household's polls separately
        Object.entries(householdPolls).forEach(([householdId, polls]) => {
          try {
            const key = `${STORAGE_KEYS.HOUSEHOLD_POLLS_PREFIX}${householdId}`;
            
            // Merge with any existing polls for this household
            const existingJson = localStorage.getItem(key);
            let existingPolls: Poll[] = [];
            
            if (existingJson) {
              try {
                const parsed = JSON.parse(existingJson);
                if (Array.isArray(parsed)) {
                  existingPolls = parsed;
                }
              } catch (e) {
                console.error(`Error parsing existing polls for household ${householdId}:`, e);
              }
            }
            
            // Merge polls, avoiding duplicates
            const pollMap = new Map<number, Poll>();
            
            // Add existing polls first
            existingPolls.forEach(poll => pollMap.set(poll.id, poll));
            
            // Then add new polls (which will override any duplicates)
            polls.forEach(poll => pollMap.set(poll.id, poll));
            
            // Convert to array
            const combinedPolls = Array.from(pollMap.values());
            
            // Save the combined polls
            localStorage.setItem(key, JSON.stringify(combinedPolls));
            console.log(`Synced ${combinedPolls.length} polls for household ${householdId}`);
          } catch (e) {
            console.error(`Error saving polls for household ${householdId}:`, e);
          }
        });
      } catch (e) {
        console.error('Failed to save poll cache to localStorage:', e);
      }
    }
  }, [pollCache]);

  // Set up socket event listeners for polls
  useEffect(() => {
    const socket = socketRef.current;
    
    if (!socket) return;
    console.log('Setting up socket event listeners...');

    // Define our event handlers
    const messageHandler = (data: any) => {
      console.log('Received message event:', data);
      
      try {
        // Validate message format
        if (!data || !data.id || !data.content) {
          console.warn('Invalid message data received:', data);
          return;
        }
        
        const newMessage: Message = {
          id: data.id,
          content: data.content,
          sender_id: data.sender_id || 0,
          sender_email: data.sender_email || 'Unknown',
          is_announcement: data.is_announcement || false,
          created_at: data.created_at || new Date().toISOString(),
          household_id: data.household_id || currentHouseholdRef.current,
          image_url: data.image_url // Add support for image messages
        };
        
        console.log('Processing new message:', newMessage);
        handleNewMessage(newMessage);
      } catch (err) {
        console.error('Error handling message event:', err);
      }
    };
    
    const typingHandler = (data: any) => {
      console.log('Typing event received:', data);
      handleTypingEvent(data);
    };
    
    const newPollHandler = (data: any) => {
      console.log('New poll event received:', data);
      handleNewPoll(data);
    };
    
    const pollVoteHandler = (data: any) => {
      console.log('Poll vote event received:', data);
      handlePollUpdate(data);
    };
    
    // Register all our event handlers
    socket.on('message', messageHandler);
    socket.on('typing', typingHandler);
    socket.on('new_poll', newPollHandler);
    socket.on('poll_vote', pollVoteHandler);
    
    // Clean up event handlers on unmount
    return () => {
      console.log('Cleaning up socket event listeners...');
      
      if (socket) {
        socket.off('message', messageHandler);
        socket.off('typing', typingHandler);
        socket.off('new_poll', newPollHandler);
        socket.off('poll_vote', pollVoteHandler);
      }
    };
  }, [handleNewMessage, handleTypingEvent, handleNewPoll, handlePollUpdate]);

  // Add a new effect to rebuild user_vote property and migrate local votes when user data is available
  useEffect(() => {
    // Only run this if we have user data
    if (user) {
      console.log('Rebuilding user votes from voters data based on user ID:', user.id);
      
      // Update the general poll cache to set user_vote based on voters
      setPollCache(prev => {
        const updatedPolls = prev.polls.map(poll => {
          let shouldUpdate = false;
          let userOption = null;
          
          // Check if this user's ID is already in the voters record
          if (poll.voters && Object.keys(poll.voters).includes(String(user.id))) {
            userOption = poll.voters[user.id];
            shouldUpdate = !poll.user_vote; // Only update if user_vote isn't set
            console.log(`Found vote for user ${user.id} in poll ${poll.id}: ${userOption}`);
          }
          
          // Check for local-user votes to migrate to the real user
          if (poll.voters && Object.keys(poll.voters).includes('local-user')) {
            userOption = poll.voters['local-user'];
            shouldUpdate = true; // Always update to migrate local-user vote
            console.log(`Migrating local-user vote in poll ${poll.id} to user ${user.id}: ${userOption}`);
          }
          
          if (shouldUpdate && userOption) {
            // Create updated voters record
            const updatedVoters = { ...(poll.voters || {}) };

            // Add the real user's vote
            updatedVoters[user.id] = userOption;
            
            // Remove local-user entry if it exists
            if ('local-user' in updatedVoters) {
              delete updatedVoters['local-user'];
            }
            
            // Return updated poll with user_vote set and voters updated
            return {
              ...poll,
              user_vote: userOption,
              voters: updatedVoters
            };
          }
          
          return poll;
        });
        
        // Save to localStorage
        try {
          localStorage.setItem(STORAGE_KEYS.POLLS, JSON.stringify({
            ...prev,
            polls: updatedPolls
          }));
        } catch (e) {
          console.error('Failed to save updated polls to localStorage:', e);
        }
        
        return {
          ...prev,
          polls: updatedPolls
        };
      });
      
      // Also update household-specific poll caches
      setPollsByHousehold(prev => {
        const updatedHouseholds = {...prev};
        
        // Process each household's polls
        Object.entries(prev).forEach(([householdId, householdPolls]) => {
          updatedHouseholds[householdId] = householdPolls.map(poll => {
            let shouldUpdate = false;
            let userOption = null;
            
            // Check if this user's ID is already in the voters record
            if (poll.voters && Object.keys(poll.voters).includes(String(user.id))) {
              userOption = poll.voters[user.id];
              shouldUpdate = !poll.user_vote; // Only update if user_vote isn't set
            }
            
            // Check for local-user votes to migrate to the real user
            if (poll.voters && Object.keys(poll.voters).includes('local-user')) {
              userOption = poll.voters['local-user'];
              shouldUpdate = true; // Always update to migrate local-user vote
              console.log(`[Household] Migrating local-user vote in poll ${poll.id} to user ${user.id}: ${userOption}`);
            }
            
            if (shouldUpdate && userOption) {
              // Create updated voters record
              const updatedVoters = { ...(poll.voters || {}) };
              
              // Add the real user's vote
              updatedVoters[user.id] = userOption;
              
              // Remove local-user entry if it exists
              if ('local-user' in updatedVoters) {
                delete updatedVoters['local-user'];
              }
              
              // Return updated poll with user_vote set and voters updated
              return {
                ...poll,
                user_vote: userOption,
                voters: updatedVoters
              };
            }
            
            return poll;
          });
          
          // Save to localStorage for this household
          try {
            localStorage.setItem(`${STORAGE_KEYS.HOUSEHOLD_POLLS_PREFIX}${householdId}`, 
              JSON.stringify(updatedHouseholds[householdId]));
          } catch (e) {
            console.error(`Failed to save polls for household ${householdId}:`, e);
          }
        });
        
        return updatedHouseholds;
      });
    }
  }, [user]); // Run this effect when user data becomes available

  const value = {
    socket,
    // Use current household's messages and polls if available
    messages: currentHouseholdId && messagesByHousehold[currentHouseholdId] 
      ? messagesByHousehold[currentHouseholdId] 
      : messageCache.messages,
    polls: currentHouseholdId && pollsByHousehold[currentHouseholdId]
      ? pollsByHousehold[currentHouseholdId]
      : pollCache.polls,
    typingUsers,
    connected,
    joinHousehold,
    leaveHousehold,
    sendMessage,
    editMessage,
    deleteMessage,
    startTyping,
    stopTyping,
    createPoll,
    votePoll,
    currentHouseholdId,
    error,
    loading,
    loadMoreMessages,
    loadMorePolls,
    hasMoreMessages: messageCache.hasMore,
    hasMorePolls: pollCache.hasMore,
    markMessagesAsRead,
    // Debug info
    debug: {
      messageCount: messageCache.messages.length,
      messagesByHouseholdCount: Object.fromEntries(
        Object.entries(messagesByHousehold).map(([id, msgs]) => [id, msgs.length])
      ),
      pollCount: pollCache.polls.length,
      pollsByHouseholdCount: Object.fromEntries(
        Object.entries(pollsByHousehold).map(([id, polls]) => [id, polls.length])
      ),
      apiUrl,
      socketConnected: connectedRef.current,
      socketId: socketRef.current?.id || null
    }
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};