export interface CalendarEvent {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  recurrence_rule?: string;
  privacy: "public" | "private";
  created_by: string;
  is_recurring: boolean;
  household_id: string;
}

export interface CreateEventRequest {
  title: string;
  start_time: string;
  end_time?: string;
  recurrence_rule?: string;
  privacy?: "public" | "private";
}

export interface CreateEventResponse {
  message: string;
  event_id: string;
}

export interface UpdateEventRequest {
  title?: string;
  start_time?: string;
  end_time?: string;
  privacy?: "public" | "private";
}
