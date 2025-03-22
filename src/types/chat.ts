export interface Message {
  id: string;
  content: string;
  is_announcement: boolean;
  created_at: string;
  user: {
    id: string;
    name: string;
    avatar?: string;
  };
}

export interface SendMessageRequest {
  content: string;
  is_announcement?: boolean;
}

export interface ChatResponse {
  messages: Message[];
  total: number;
  has_more: boolean;
}

export interface WebSocketEvent {
  type: string;
  [key: string]: any;
}

export interface NewMessageEvent extends WebSocketEvent {
  type: "new_message";
  message: Message;
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
