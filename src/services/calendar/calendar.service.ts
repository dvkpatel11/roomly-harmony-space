import { CalendarService, DateRange } from "@/types/services";
import {
  CalendarEvent,
  CreateEventRequest,
  CreateEventResponse,
  UpdateEventRequest,
} from "../../types/calendar";
import { BaseService } from "../base.service";

export class ProdCalendarService extends BaseService implements CalendarService {
  private _events: CalendarEvent[] = [];

  get events(): CalendarEvent[] {
    return this._events;
  }

  async createEvent(householdId: string, request: CreateEventRequest): Promise<CreateEventResponse> {
    return this.handleRequest<CreateEventResponse>(
      () =>
        fetch(`${this.apiUrl}/households/${householdId}/events`, {
          method: "POST",
          headers: this.getHeaders(),
          body: JSON.stringify(request),
        }),
      "Event created successfully"
    );
  }

  async getEvents(householdId: string, dateRange?: DateRange): Promise<CalendarEvent[]> {
    const queryParams = new URLSearchParams();
    if (dateRange) {
      if (dateRange.start) queryParams.append("start_date", dateRange.start);
      if (dateRange.end) queryParams.append("end_date", dateRange.end);
    }

    const response = await this.handleRequest<CalendarEvent[]>(() =>
      fetch(`${this.apiUrl}/households/${householdId}/events?${queryParams}`, {
        headers: this.getHeaders(),
      })
    );

    this._events = response;
    return response;
  }

  async getUserEvents(): Promise<CalendarEvent[]> {
    const response = await this.handleRequest<CalendarEvent[]>(() =>
      fetch(`${this.apiUrl}/users/me/events`, {
        headers: this.getHeaders(),
      })
    );

    this._events = response;
    return response;
  }

  async updateEvent(eventId: string, updates: UpdateEventRequest): Promise<void> {
    await this.handleRequest(
      () =>
        fetch(`${this.apiUrl}/events/${eventId}`, {
          method: "PATCH",
          headers: this.getHeaders(),
          body: JSON.stringify(updates),
        }),
      "Event updated successfully"
    );

    // Update local event if it exists
    const eventIndex = this._events.findIndex((e) => e.id === eventId);
    if (eventIndex !== -1) {
      this._events[eventIndex] = { ...this._events[eventIndex], ...updates };
    }
  }

  async deleteEvent(eventId: string): Promise<void> {
    await this.handleRequest(
      () =>
        fetch(`${this.apiUrl}/events/${eventId}`, {
          method: "DELETE",
          headers: this.getHeaders(),
        }),
      "Event deleted successfully"
    );

    // Remove event from local state
    this._events = this._events.filter((e) => e.id !== eventId);
  }
}
