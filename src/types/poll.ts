import { WebSocketEvent } from "./chat";

export interface Poll {
  id: string;
  question: string;
  options: Record<string, number>;
  expires_at: string | null;
  created_at: string;
  household_id: string;
  created_by: string;
  user_vote?: string;
  total_votes: number;
  voters: Record<string, string>;
  is_expired: boolean;
}

export interface CreatePollRequest {
  question: string;
  options: string[];
  expires_at?: string;
}

export interface CreatePollResponse {
  message: string;
  poll_id: string;
}

export interface VoteRequest {
  option: string;
}

export interface VoteResponse {
  message: string;
  poll_id: string;
  option: string;
}

export interface PollResponse extends Poll {}

// WebSocket Events
export interface NewPollEvent extends WebSocketEvent {
  type: "new_poll";
  poll: Poll;
}

export interface PollUpdateEvent extends WebSocketEvent {
  type: "poll_update";
  poll_id: string;
  options: Record<string, number>;
  voter: string;
}

export interface PollDeletedEvent extends WebSocketEvent {
  type: "poll_deleted";
  poll_id: string;
}
