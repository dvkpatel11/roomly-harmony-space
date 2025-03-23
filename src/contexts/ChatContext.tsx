import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
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
}

export interface Poll {
  id: number;
  question: string;
  options: Record<string, number>;
  expires_at: string;
  created_by: string;
}

export interface TypingUser {
  user_id: number;
  user_email: string;
  user_name: string;
}

interface ChatContextType {
  socket: Socket | null;
  messages: Message[];
  polls: Poll[];
  typingUsers: TypingUser[];
  connected: boolean;
  joinHousehold: (householdId: string) => void;
  leaveHousehold: (householdId: string) => void;
  sendMessage: (content: string, isAnnouncement?: boolean) => void;
  editMessage: (messageId: number, content: string) => void;
  deleteMessage: (messageId: number) => void;
  startTyping: () => void;
  stopTyping: () => void;
  createPoll: (question: string, options: string[], expiryDate: string) => void;
  votePoll: (pollId: number, option: string) => void;
  currentHouseholdId: string | null;
  error: string | null;
  loading: boolean;
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

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const { token: authToken, user } = useAuth(); // From AuthContext
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [polls, setPolls] = useState<Poll[]>([]);
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
  
  // Try to get token from localStorage if auth context doesn't have it
  const token = authToken || localStorage.getItem('access_token');

  // Get API URL from Vite environment variables
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
  const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:5001';
  
  // Initialize socket connection
  useEffect(() => {
    if (!token) {
      console.error('No authentication token available. Cannot connect to socket.');
      return;
    }
    
    setLoading(true);
    
    // Only initialize socket if we don't already have one
    if (!socket) {
      console.log('Initializing socket connection to:', apiUrl);
      console.log('Token available (first 10 chars):', token.substring(0, 10) + '...');
      
      try {
        // Create socket connection with auth
        const newSocket = io(apiUrl, {
          autoConnect: true,
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          timeout: 20000, // Increase timeout to 20 seconds
          query: { token }
        });
        
        // Store socket in state and ref for more reliable access
        setSocket(newSocket);
        socketRef.current = newSocket;
        
        // Set up socket event handlers
        newSocket.on('connect', () => {
          console.log('Socket connected, authenticating with token');
          // Send token for authentication
          if (newSocket && token) {
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
            console.log('Received new message from server:', message);
            handleNewMessage(message);
          });
          
          newSocket.on('new_poll', (poll) => {
            console.log('New poll received:', poll);
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
            setMessages(prevMessages => 
              prevMessages.map(msg => 
                msg.id === data.id 
                  ? { ...msg, content: data.content, edited_at: data.edited_at } 
                  : msg
              )
            );
          });
          
          newSocket.on('message_deleted', (data) => {
            console.log('Message deleted:', data);
            setMessages(prevMessages => 
              prevMessages.filter(msg => msg.id !== data.id)
            );
          });
          
          // Add error handler
          newSocket.on('error', (error) => {
            console.error('Socket error:', error);
            setError(`Socket error: ${error.message || 'Unknown error'}`);
          });
          
          newSocket.on('poll_deleted', (data) => {
            console.log('Poll deleted:', data);
            setPolls(prevPolls => prevPolls.filter(poll => poll.id !== data.poll_id));
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
            
            newSocket.disconnect();
          }
          
          // Reset all state
          setSocket(null);
          socketRef.current = null;
          setConnected(false);
          connectedRef.current = false;
          setCurrentHouseholdId(null);
          currentHouseholdRef.current = null;
          joinAttemptInProgressRef.current = false;
          
          setMessages([]);
          setPolls([]);
          setTypingUsers([]);
        };
      } catch (error) {
        console.error('Error initializing socket:', error);
        setError('Failed to initialize socket connection. Please refresh the page.');
        setLoading(false);
      }
    }
  }, [token, apiUrl]);
  
  // Event handlers
  const handleNewMessage = (message: Message) => {
    console.log('Processing new message in handleNewMessage:', message);
    setMessages(prevMessages => {
      // Check if message already exists to prevent duplicates
      const exists = prevMessages.some(m => m.id === message.id);
      if (exists) {
        console.log('Message already exists, skipping:', message.id);
        return prevMessages;
      }
      console.log('Adding new message to state:', message);
      return [...prevMessages, message];
    });
  };
  
  const handleNewPoll = (poll: Poll) => {
    setPolls((prevPolls) => [...prevPolls, poll]);
  };
  
  const handlePollUpdate = (data: { poll_id: number; options: Record<string, number> }) => {
    setPolls(prevPolls =>
      prevPolls.map((poll) => (poll.id === data.poll_id ? { ...poll, options: data.options } : poll))
    );
  };
  
  const handleTypingEvent = (user: TypingUser) => {
    console.log('User typing:', user);
    setTypingUsers((prev) => [...prev.filter((u) => u.user_id !== user.user_id), user]);
  };

  // Join a household chat
  const joinHousehold = async (householdId: string) => {
    // Guard against multiple simultaneous join attempts
    if (joinAttemptInProgressRef.current) {
      console.log(`Join attempt already in progress for household ${householdId}, skipping`);
      return;
    }
    
    // Skip if socket not connected or missing
    if (!socket || !connectedRef.current) {
      console.error('Cannot join household: socket not connected');
      setError('Connection to chat server lost. Please refresh the page.');
      return;
    }
    
    // Check if already in the same household
    if (currentHouseholdRef.current === householdId) {
      console.log(`Already in household ${householdId}, skipping join`);
      // Even if we skip joining, make sure we load messages
      loadMessagesForHousehold(householdId);
      return;
    }
    
    // If in a different household, leave it first
    if (currentHouseholdRef.current && currentHouseholdRef.current !== householdId) {
      await leaveHousehold(currentHouseholdRef.current);
    }
    
    // Mark join attempt as in progress to prevent duplicate calls
    joinAttemptInProgressRef.current = true;
    
    try {
      setLoading(true);
      console.log(`Joining household ${householdId} with socket ID: ${socket.id}`);
      
      // Use a Promise to handle the join event
      const joinPromise = new Promise<void>((resolve, reject) => {
        socket.emit('join_household', { 
          token,
          household_id: householdId 
        }, (response: any) => {
          if (response && response.error) {
            console.error('Error joining household:', response.error);
            reject(new Error(`Failed to join chat: ${response.error}`));
          } else {
            console.log('Successfully joined household:', response || 'No response data');
            setCurrentHouseholdId(householdId);
            currentHouseholdRef.current = householdId;
            resolve();
          }
        });
        
        // Set a timeout in case the server never responds
        setTimeout(() => {
          reject(new Error('Join household timeout - no response from server'));
        }, 10000);
      });
      
      // Wait for join to complete
      await joinPromise;
      
      // Load messages after successful join
      await loadMessagesForHousehold(householdId);
      
    } catch (err) {
      console.error('Error in joinHousehold:', err);
      setError('Failed to join household chat: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
      joinAttemptInProgressRef.current = false;
    }
  };
  
  // Helper function to load messages for a household
  const loadMessagesForHousehold = async (householdId: string) => {
    try {
      const accessToken = token;
      
      if (!accessToken) {
        throw new Error('No access token available');
      }
      
      const response = await fetch(`${apiUrl}/households/${householdId}/messages`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch messages: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`Loaded ${data.messages?.length || 0} messages for household ${householdId}`);
      
      // Make sure we're setting the messages from the response properly
      if (data.messages && Array.isArray(data.messages)) {
        setMessages(data.messages);
      } else {
        console.error('Unexpected message data format:', data);
        setMessages([]);
      }
      
      // Also fetch polls for this household
      // ... existing poll fetching code ...
      
    } catch (error) {
      console.error('Failed to load messages:', error);
      // Don't set error state here to avoid disrupting the UI if just history fails
    }
  };
  
  // Leave a household chat
  const leaveHousehold = async (householdId: string) => {
    try {
      // Skip if socket not connected
      if (!socket) {
        console.error('Cannot leave household: socket missing');
        return;
      }
      
      if (!connectedRef.current) {
        console.error('Cannot leave household: socket not connected', socket.id);
        return;
      }
      
      // Skip if not in the household
      if (currentHouseholdRef.current !== householdId) {
        console.log(`Not in household ${householdId}, skipping leave`);
        return;
      }
      
      console.log(`Leaving household ${householdId} with socket ID: ${socket.id}`);
      
      // Emit leave event
      socket.emit('leave_household', { 
        token,
        household_id: householdId 
      }, (response: any) => {
        if (response && response.error) {
          console.error('Error leaving household:', response.error);
        } else {
          console.log('Successfully left household:', response || 'No response data');
        }
      });
      
      // Reset household tracking state
      setCurrentHouseholdId(null);
      currentHouseholdRef.current = null;
      
      // Clear messages specific to this household
      setMessages([]);
      setPolls([]);
      setTypingUsers([]);
    } catch (error) {
      console.error('Error in leaveHousehold:', error);
    }
  };

  // Send a new message
  const sendMessage = (content: string, isAnnouncement = false) => {
    // Validate requirements
    const socketExists = !!socket;
    const tokenExists = !!token;
    const householdExists = !!currentHouseholdRef.current;
    const contentValid = !!content && content.trim() !== '';
    
    if (!socketExists || !tokenExists || !householdExists || !contentValid) {
      console.error('Cannot send message: missing requirements', { 
        socketExists, 
        tokenExists, 
        householdExists, 
        contentValid 
      });
      return;
    }
    
    try {
      const messageData = {
        token,
        household_id: currentHouseholdRef.current,
        content,
        is_announcement: isAnnouncement
      };
      
      console.log('Attempting to send message:', messageData);
      
      socket.emit('message', messageData, (response: any) => {
        if (response && response.error) {
          console.error('Error sending message:', response.error);
        } else {
          console.log('Message sent successfully');
        }
      });
    } catch (error) {
      console.error('Error in sendMessage:', error);
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
      return;
    }
    
    const pollData = {
      question,
      options,
      expires_at: expiryDate
    };
    
    console.log('Creating poll:', pollData);
    console.log('API URL:', `${apiUrl}/households/${currentHouseholdRef.current}/polls`);
    console.log('Using token:', token.substring(0, 15) + '...');
    
    fetch(`${apiUrl}/households/${currentHouseholdRef.current}/polls`, {
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
      // The poll will be added via the socket event
    })
    .catch(err => {
      console.error('Error creating poll:', err);
      setError('Failed to create poll: ' + err.message);
    });
  };

  // Vote on a poll
  const votePoll = (pollId: number, option: string) => {
    if (!token) return;

    fetch(`${apiUrl}/polls/${pollId}/vote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        selected_option: option,
      }),
    }).catch((err) => {
      setError('Failed to submit vote: ' + err.message);
      console.error('Vote submission error:', err);
    });
  };

  const value = {
    socket,
    messages,
    polls,
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
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};