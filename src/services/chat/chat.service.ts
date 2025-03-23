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

  onNewMessage(callback: (message: NewMessageEvent) => void): () => void {
    const handler = (event: WebSocketEvent) => {
      if (event.type === "new_message") {
        callback(event as NewMessageEvent);
      }
    };
    this.on("new_message", handler);
    return () => this.off("new_message", handler);
  }

  onUserJoined(callback: (event: UserJoinedEvent) => void): () => void {
    const handler = (event: WebSocketEvent) => {
      if (event.type === "user_joined") {
        callback(event as UserJoinedEvent);
      }
    };
    this.on("user_joined", handler);
    return () => this.off("user_joined", handler);
  }

  onUserOffline(callback: (event: UserOfflineEvent) => void): () => void {
    const handler = (event: WebSocketEvent) => {
      if (event.type === "user_offline") {
        callback(event as UserOfflineEvent);
      }
    };
    this.on("user_offline", handler);
    return () => this.off("user_offline", handler);
  }

  onError(callback: (event: ErrorEvent) => void): () => void {
    const handler = (event: WebSocketEvent) => {
      if (event.type === "error") {
        callback(event as unknown as ErrorEvent);
      }
    };
    this.on("error", handler);
    return () => this.off("error", handler);
  }
}
