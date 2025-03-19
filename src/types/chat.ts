
export interface Message {
  id: string;
  content: string;
  sender_id: string;
  sender_email: string;
  household_id: string;
  created_at: string;
  is_announcement: boolean;
}

export interface SendMessageRequest {
  content: string;
  is_announcement?: boolean;
}

export interface ChatResponse {
  messages: Message[];
  total: number;
  page: number;
  per_page: number;
}

// WebSocket Events
export interface ChatEvent {
  type: string;
  data: any;
}

export interface JoinEvent {
  token: string;
  household_id: string;
}

export interface JoinedEvent {
  message: string;
}

export interface SendMessageEvent {
  token: string;
  household_id: string;
  content: string;
  is_announcement?: boolean;
}

export interface NewMessageEvent {
  id: string;
  content: string;
  sender_id: string;
  sender_email: string;
  is_announcement: boolean;
  created_at: string;
}

export interface UserJoinedEvent {
  user_id: string;
  email: string;
}

export interface UserOfflineEvent {
  user_id: string;
}

export interface ErrorEvent {
  message: string;
}

export interface ChatService {
  getMessages(
    householdId: string,
    params?: {
      limit?: number;
      before?: string;
    }
  ): Promise<ChatResponse>;

  // WebSocket methods
  connect(): Promise<void>;
  disconnect(): void;
  joinHousehold(householdId: string): Promise<void>;
  leaveHousehold(householdId: string): Promise<void>;
  sendMessage(householdId: string, message: SendMessageRequest): Promise<void>;

  // Event listeners
  onNewMessage(callback: (message: NewMessageEvent) => void): () => void;
  onUserJoined(callback: (event: UserJoinedEvent) => void): () => void;
  onUserOffline(callback: (event: UserOfflineEvent) => void): () => void;
  onError(callback: (event: ErrorEvent) => void): () => void;    
}
