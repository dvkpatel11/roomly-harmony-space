import { WebSocketEvent } from "@/types/chat";
import { CreatePollRequest, CreatePollResponse, Poll, PollResponse, VoteRequest, VoteResponse } from "@/types/poll";
import { PollService } from "@/types/services";
import { BaseService } from "../base.service";

export class ProdPollService extends BaseService implements PollService {
  private _polls: Poll[] = [];
  private eventHandlers: Map<string, ((event: WebSocketEvent) => void)[]> = new Map();

  constructor() {
    super(true); // This service is household-specific
  }

  get polls(): Poll[] {
    return this._polls;
  }

  clearCache(): void {
    this._polls = [];
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

  async getPolls(
    householdId: string,
    params?: {
      status?: "active" | "expired" | "all";
      page?: number;
      per_page?: number;
    }
  ): Promise<PollResponse[]> {
    const queryParams = new URLSearchParams();
    if (params) {
      if (params.status) queryParams.append("status", params.status);
      if (params.page) queryParams.append("page", params.page.toString());
      if (params.per_page) queryParams.append("per_page", params.per_page.toString());
    }

    const response = await this.handleRequest<{ polls: PollResponse[]; total: number }>(
      () =>
        fetch(`${this.apiUrl}/households/${householdId}/polls?${queryParams}`, {
          headers: this.getHeaders(),
        }),
      "Polls fetched successfully"
    );

    this._polls = response.polls;
    return response.polls;
  }

  async getPoll(pollId: string): Promise<PollResponse> {
    return this.handleRequest<PollResponse>(
      () =>
        fetch(`${this.apiUrl}/polls/${pollId}`, {
          headers: this.getHeaders(),
        }),
      "Poll fetched successfully"
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

  async deletePoll(pollId: string): Promise<void> {
    await this.handleRequest(
      () =>
        fetch(`${this.apiUrl}/polls/${pollId}`, {
          method: "DELETE",
          headers: this.getHeaders(),
        }),
      "Poll deleted successfully"
    );
  }

  // WebSocket event handlers
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

  // Helper method to handle WebSocket events
  private handleWebSocketEvent(event: WebSocketEvent): void {
    const handlers = this.eventHandlers.get(event.type) || [];
    handlers.forEach((handler) => handler(event));

    // Update local state based on event type
    switch (event.type) {
      case "new_poll":
        this._polls = [event.poll, ...this._polls];
        break;
      case "poll_update":
        this._polls = this._polls.map((poll) =>
          poll.id === event.poll_id ? { ...poll, options: event.options } : poll
        );
        break;
      case "poll_deleted":
        this._polls = this._polls.filter((poll) => poll.id !== event.poll_id);
        break;
    }
  }
}
