import { CreatePollRequest, CreatePollResponse, PollResponse, VoteRequest, VoteResponse } from "@/types/poll";
import { ChatService } from "@/types/services";
import {
  ChatResponse,
  Message,
  NewMessageEvent,
  UserJoinedEvent,
  UserOfflineEvent,
  WebSocketEvent,
} from "../../types/chat";
import { BaseService } from "../base.service";

export class ProdChatService extends BaseService implements ChatService {
  onNewMessage(callback: (message: NewMessageEvent) => void): () => void {
    throw new Error("Method not implemented.");
  }
  onUserJoined(callback: (event: UserJoinedEvent) => void): () => void {
    throw new Error("Method not implemented.");
  }
  onUserOffline(callback: (event: UserOfflineEvent) => void): () => void {
    throw new Error("Method not implemented.");
  }
  onError(callback: (event: ErrorEvent) => void): () => void {
    throw new Error("Method not implemented.");
  }
  private _messages: Message[] = [];
  private socket: WebSocket | null = null;
  private eventHandlers: Map<string, ((event: WebSocketEvent) => void)[]> = new Map();
  get messages(): Message[] {
    return this._messages;
  }

  async getMessages(householdId: string, params?: { limit?: number; before?: string }): Promise<ChatResponse> {
    const queryParams = new URLSearchParams();
    if (params) {
      if (params.limit) queryParams.append("limit", params.limit.toString());
      if (params.before) queryParams.append("before", params.before);
    }

    const response = await this.handleRequest<ChatResponse>(() =>
      fetch(`${this.apiUrl}/households/${householdId}/messages?${queryParams}`, {
        headers: this.getHeaders(),
      })
    );

    this._messages = [...response.messages];
    return response;
  }

  async createPoll(householdId: string, request: CreatePollRequest): Promise<CreatePollResponse> {
    return this.handleRequest<CreatePollResponse>(
      () =>
        fetch(`${this.apiUrl}/households/${householdId}/polls`, {
          method: "POST",
          headers: this.getHeaders(),
          body: JSON.stringify(request),
        }),
      "Poll created successfully"
    );
  }

  async getPoll(pollId: string): Promise<PollResponse> {
    return this.handleRequest<PollResponse>(() =>
      fetch(`${this.apiUrl}/polls/${pollId}`, {
        headers: this.getHeaders(),
      })
    );
  }

  async vote(pollId: string, request: VoteRequest): Promise<VoteResponse> {
    return this.handleRequest<VoteResponse>(
      () =>
        fetch(`${this.apiUrl}/polls/${pollId}/vote`, {
          method: "POST",
          headers: this.getHeaders(),
          body: JSON.stringify(request),
        }),
      "Vote recorded successfully"
    );
  }

  connect(token: string): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      return;
    }

    this.socket = new WebSocket(`${this.apiUrl.replace("http", "ws")}/ws`);

    this.socket.onopen = () => {
      if (this.socket?.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify({ type: "authenticate", token }));
      }
    };

    this.socket.onmessage = (event) => {
      const data = JSON.parse(event.data) as WebSocketEvent;
      const handlers = this.eventHandlers.get(data.type) || [];
      handlers.forEach((handler) => handler(data));
    };

    this.socket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    this.socket.onclose = () => {
      setTimeout(() => this.connect(token), 5000); // Reconnect after 5 seconds
    };
  }

  disconnect(): void {
    this.socket?.close();
    this.socket = null;
  }

  joinHousehold(householdId: string): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ type: "join_household", household_id: householdId }));
    }
  }

  leaveHousehold(householdId: string): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ type: "leave_household", household_id: householdId }));
    }
  }

  sendMessage(householdId: string, content: string, isAnnouncement: boolean = false): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(
        JSON.stringify({
          type: "send_message",
          household_id: householdId,
          content,
          is_announcement: isAnnouncement,
        })
      );
    }
  }

  editMessage(messageId: string, content: string): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(
        JSON.stringify({
          type: "edit_message",
          message_id: messageId,
          content,
        })
      );
    }
  }

  deleteMessage(messageId: string): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(
        JSON.stringify({
          type: "delete_message",
          message_id: messageId,
        })
      );
    }
  }

  startTyping(householdId: string): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(
        JSON.stringify({
          type: "typing_start",
          household_id: householdId,
        })
      );
    }
  }

  stopTyping(householdId: string): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(
        JSON.stringify({
          type: "typing_stop",
          household_id: householdId,
        })
      );
    }
  }

  on(event: string, handler: (event: WebSocketEvent) => void): void {
    const handlers = this.eventHandlers.get(event) || [];
    this.eventHandlers.set(event, [...handlers, handler]);
  }

  off(event: string, handler: (event: WebSocketEvent) => void): void {
    const handlers = this.eventHandlers.get(event) || [];
    this.eventHandlers.set(
      event,
      handlers.filter((h) => h !== handler)
    );
  }
}
