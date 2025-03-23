export interface Message {
  id: string;
  content: string;
  sender: string;
  is_announcement: boolean;
  created_at: string;
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

export interface WebSocketEvent {
  type: string;
  [key: string]: any;
}

export interface NewMessageEvent extends WebSocketEvent {
  type: "new_message";
  id: string;
  content: string;
  sender_id: string;
  sender_email: string;
  is_announcement: boolean;
  created_at: string;
}

export interface JoinedEvent extends WebSocketEvent {
  type: "joined";
  household_id: string;
  user: {
    id: string;
    name: string;
    avatar?: string;
  };
}

export interface UserJoinedEvent extends WebSocketEvent {
  type: "user_joined";
  user_id: string;
  email: string;
}

export interface UserOfflineEvent extends WebSocketEvent {
  type: "user_offline";
  user_id: string;
}

export interface ErrorEvent extends WebSocketEvent {
  type: "error";
  message: string;
}
